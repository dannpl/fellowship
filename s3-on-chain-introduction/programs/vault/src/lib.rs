use anchor_lang::prelude::*;
use instructions::*;

mod errors;
pub mod instructions;
pub mod state;

declare_id!("AJ711G562a3nm2Dg6kt9YtGWVwpbprcuSi37CKPwhWqL");

#[program]
pub mod vault {
    use super::*;

    pub fn create_vault(ctx: Context<CreateVault>, name: String) -> Result<()> {
        instructions::create_vault(ctx, name)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw(ctx, amount)
    }

    pub fn close(ctx: Context<CloseVault>) -> Result<()> {
        instructions::close_vault(ctx)
    }
}
