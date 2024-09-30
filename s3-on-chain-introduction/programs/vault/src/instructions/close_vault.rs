use anchor_lang::prelude::*;
use anchor_spl::token::{ Token, TokenAccount };
use crate::{ errors::VaultError, state::Vault };

#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(
        mut,
        close = authority,
        seeds = [Vault::PREFIX_SEED, authority.key().as_ref(), vault.name.as_bytes()],
        bump = vault.bump,
        constraint = vault.net_deposits == vault.net_withdraws @ VaultError::VaultNotEmpty
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = vault_token_account.owner == vault.key(),
        constraint = vault_token_account.amount == 0 @ VaultError::VaultNotEmpty
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
    if ctx.accounts.authority.key() != ctx.accounts.vault.authority {
        return Err(VaultError::Unauthorized.into());
    }

    Ok(())
}
