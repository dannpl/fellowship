use borsh::{ BorshDeserialize, BorshSerialize };
use solana_program::instruction::Instruction;
use solana_program::{ account_info::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey };

use crate::instructions;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum VaultInstruction {
    DepositInstruction(u64),
    WithdrawalInstruction(),
    Initialize,
}

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    let instruction = VaultInstruction::try_from_slice(instruction_data)?;

    match instruction {
        VaultInstruction::Initialize => instructions::initialize(program_id, accounts),
        VaultInstruction::DepositInstruction(args) =>
            instructions::deposit(program_id, accounts, args),
        VaultInstruction::WithdrawalInstruction() => instructions::withdraw(program_id, accounts),
    }
}
