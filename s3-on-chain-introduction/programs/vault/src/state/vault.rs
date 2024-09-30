use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub bump: u8,
    pub authority: Pubkey,
    pub name: String,
    pub ts: i64,
    pub net_deposits: u128,
    pub net_withdraws: u128,
}

impl Vault {
    pub const PREFIX_SEED: &'static [u8] = b"vault";

    pub const SPACE: usize = 8 + std::mem::size_of::<Self>();
}
