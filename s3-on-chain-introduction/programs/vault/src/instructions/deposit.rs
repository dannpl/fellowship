use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Token, TokenAccount, Transfer };

use crate::state::{ Vault, User };

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [Vault::PREFIX_SEED, vault.name.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init_if_needed,
        payer = authority,
        space = User::SPACE,
        seeds = [User::PREFIX_SEED, vault.key().as_ref(), authority.key().as_ref()],
        bump
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

pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let user = &mut ctx.accounts.user;
    let authority = &ctx.accounts.authority;

    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), Transfer {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: authority.to_account_info(),
    });

    token::transfer(cpi_ctx, amount)?;

    vault.net_deposits = vault.net_deposits.checked_add(amount as u128).unwrap();

    // Update or initialize user state
    if user.ts == 0 {
        user.bump = ctx.bumps.user;
        user.authority = authority.key();
        user.vault = vault.key();
    }
    user.net_deposit = user.net_deposit.checked_add(amount).unwrap();

    let clock = Clock::get()?;
    user.ts = clock.unix_timestamp;

    Ok(())
}
