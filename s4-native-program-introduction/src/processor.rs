use borsh::{ BorshDeserialize, BorshSerialize };
use solana_program::{ account_info::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey };

use crate::instructions::deposit;
use crate::instructions::withdraw;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum Instruction {
    DepositInstruction(u64),
    WithdrawalInstruction(),
    Initialize,
}

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    let instruction = Instruction::unpack(instruction_data)?;

    match instruction {
        Instruction::Initialize => instructions::initialize(program_id, accounts),
        Instruction::Deposit { amount } => instructions::deposit(program_id, accounts, amount),
        Instruction::Withdraw => instructions::withdraw(program_id, accounts),
    }
}
