use solana_program::{
    account_info::{ next_account_info, AccountInfo },
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    rent::Rent,
    sysvar::Sysvar,
};

pub fn initialize(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let deposit_account = next_account_info(accounts_iter)?;
    let payer = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    let rent = Rent::get()?;
    let space = 8; // Space for a u64 to store the total deposited amount
    let lamports = rent.minimum_balance(space);

    msg!("Initializing deposit account");

    invoke(
        &system_instruction::create_account(
            payer.key,
            deposit_account.key,
            lamports,
            space as u64,
            program_id
        ),
        &[payer.clone(), deposit_account.clone(), system_program.clone()]
    )?;

    // Initialize the account data with 0 deposited
    let mut deposit_data = deposit_account.try_borrow_mut_data()?;
    deposit_data[..8].copy_from_slice(&(0u64).to_le_bytes());

    Ok(())
}

pub fn deposit(_program_id: &Pubkey, accounts: &[AccountInfo], amount: u64) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let payer = next_account_info(accounts_iter)?;
    let deposit_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    msg!("Depositing {} SOL", amount);

    invoke(
        &system_instruction::transfer(payer.key, deposit_account.key, amount),
        &[payer.clone(), deposit_account.clone(), system_program.clone()]
    )?;

    let mut deposit_data = deposit_account.try_borrow_mut_data()?;
    let mut total_deposited = u64::from_le_bytes(deposit_data[..8].try_into().unwrap());
    total_deposited += amount;
    deposit_data[..8].copy_from_slice(&total_deposited.to_le_bytes());

    Ok(())
}

pub fn withdraw(_program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let deposit_account = next_account_info(accounts_iter)?;
    let recipient = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    let mut deposit_data = deposit_account.try_borrow_mut_data()?;
    let total_deposited = u64::from_le_bytes(deposit_data[..8].try_into().unwrap());
    let withdrawal_amount = total_deposited / 10; // 10% of the total deposited

    msg!("Withdrawing {} SOL (10% of total deposited)", withdrawal_amount);

    if withdrawal_amount == 0 {
        return Err(ProgramError::InsufficientFunds);
    }

    **deposit_account.try_borrow_mut_lamports()? -= withdrawal_amount;
    **recipient.try_borrow_mut_lamports()? += withdrawal_amount;

    let new_total_deposited = total_deposited - withdrawal_amount;
    deposit_data[..8].copy_from_slice(&new_total_deposited.to_le_bytes());

    Ok(())
}
