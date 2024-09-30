use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("The vault is not empty")]
    VaultNotEmpty,

    #[msg("Insufficient funds")]
    InsufficientFunds,

    #[msg("Invalid amount")]
    InvalidAmount,

    #[msg("Overflow")]
    Overflow,

    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Invalid vault name")]
    InvalidVaultName,

    #[msg("Vault already exists")]
    VaultAlreadyExists,

    #[msg("User account not found")]
    UserNotFound,

    #[msg("Vault account not found")]
    VaultNotFound,

    #[msg("Token account mismatch")]
    TokenAccountMismatch,

    #[msg("Deposit limit exceeded")]
    DepositLimitExceeded,

    #[msg("Withdrawal limit exceeded")]
    WithdrawalLimitExceeded,

    #[msg("Operation not allowed")]
    OperationNotAllowed,
}
