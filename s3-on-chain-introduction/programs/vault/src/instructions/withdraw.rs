use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Token, TokenAccount, Transfer };

use crate::{ errors::VaultError, state::{ User, Vault } };

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [Vault::PREFIX_SEED, vault.authority.as_ref(), vault.name.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [User::PREFIX_SEED, vault.key().as_ref(), authority.key().as_ref()],
        bump = user.bump,
    )]
    pub user: Account<'info, User>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = user_token_account.owner == authority.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_token_account.owner == vault.key()
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let user = &mut ctx.accounts.user;

    // Ensure user has enough balance to withdraw
    require!(
        user.net_deposit >= user.net_withdraw.checked_add(amount).unwrap(),
        VaultError::InsufficientFunds
    );

    let seeds = &[Vault::PREFIX_SEED, vault.name.as_bytes(), &[vault.bump]];
    let signer_seeds = &[&seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: vault.to_account_info(),
        },
        signer_seeds
    );
    token::transfer(cpi_ctx, amount)?;

    // Update vault state
    vault.net_withdraws = vault.net_withdraws.checked_add(amount as u128).unwrap();

    // Update user state
    user.net_withdraw = user.net_withdraw.checked_add(amount).unwrap();

    // Update timestamp
    let clock = Clock::get()?;
    user.ts = clock.unix_timestamp;

    Ok(())
}
