use anchor_lang::prelude::*;

#[account]
pub struct User {
    pub bump: u8,
    pub authority: Pubkey,
    pub ts: i64,
    pub vault: Pubkey,
    pub net_deposit: u64,
    pub net_withdraw: u64,
}

impl User {
    pub const PREFIX_SEED: &'static [u8] = b"user";

    pub const SPACE: usize = 8 + std::mem::size_of::<Self>();
}
