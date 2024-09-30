use anchor_lang::prelude::*;
use crate::state::Vault;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateVault<'info> {
    #[account(
        init,
        payer = authority,
        space = Vault::SPACE,
        seeds = [Vault::PREFIX_SEED, name.as_bytes()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn create_vault(ctx: Context<CreateVault>, name: String) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;

    vault.bump = ctx.bumps.vault;
    vault.authority = ctx.accounts.authority.key();
    vault.name = name;
    vault.ts = clock.unix_timestamp;
    vault.net_deposits = 0;
    vault.net_withdraws = 0;

    Ok(())
}
