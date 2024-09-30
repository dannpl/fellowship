use solana_program::{ pubkey::Pubkey, account_info::AccountInfo, rent::Rent, system_program };
use solana_program_test::*;
use solana_sdk::{ account::Account, signature::{ Keypair, Signer }, transaction::Transaction };

use crate::entrypoint::process_instruction;
use crate::instructions::{ initialize, deposit, withdraw };

#[tokio::test]
async fn test_initialize() {
    let program_id = Pubkey::new_unique();
    let (mut banks_client, payer, recent_blockhash) = ProgramTest::new(
        "s4_native_program_introduction",
        program_id,
        processor!(process_instruction)
    ).start().await;

    let deposit_account = Keypair::new();
    let rent = Rent::default();
    let space = 8;
    let lamports = rent.minimum_balance(space);

    let mut transaction = Transaction::new_with_payer(
        &[
            system_instruction::create_account(
                &payer.pubkey(),
                &deposit_account.pubkey(),
                lamports,
                space as u64,
                &program_id
            ),
        ],
        Some(&payer.pubkey())
    );
    transaction.sign(&[&payer, &deposit_account], recent_blockhash);
    banks_client.process_transaction(transaction).await.unwrap();

    let accounts = vec![
        AccountInfo::new(
            &deposit_account.pubkey(),
            false,
            true,
            &mut lamports,
            &mut [0u8; 8],
            &program_id,
            false,
            rent.minimum_balance(space)
        ),
        AccountInfo::new(
            &payer.pubkey(),
            true,
            false,
            &mut 0,
            &mut [],
            &system_program::id(),
            false,
            0
        ),
        AccountInfo::new(
            &system_program::id(),
            false,
            false,
            &mut 0,
            &mut [],
            &system_program::id(),
            false,
            0
        )
    ];

    initialize(&program_id, &accounts).unwrap();

    let deposit_account = banks_client
        .get_account(deposit_account.pubkey()).await
        .unwrap()
        .unwrap();
    assert_eq!(deposit_account.data.len(), 8);
    assert_eq!(u64::from_le_bytes(deposit_account.data[..8].try_into().unwrap()), 0);
}

#[tokio::test]
async fn test_deposit() {
    let program_id = Pubkey::new_unique();
    let (mut banks_client, payer, recent_blockhash) = ProgramTest::new(
        "s4_native_program_introduction",
        program_id,
        processor!(process_instruction)
    ).start().await;

    let deposit_account = Keypair::new();
    let rent = Rent::default();
    let space = 8;
    let lamports = rent.minimum_balance(space);

    let mut transaction = Transaction::new_with_payer(
        &[
            system_instruction::create_account(
                &payer.pubkey(),
                &deposit_account.pubkey(),
                lamports,
                space as u64,
                &program_id
            ),
        ],
        Some(&payer.pubkey())
    );
    transaction.sign(&[&payer, &deposit_account], recent_blockhash);
    banks_client.process_transaction(transaction).await.unwrap();

    let deposit_amount = 1_000_000; // 1 SOL in lamports
    let accounts = vec![
        AccountInfo::new(
            &payer.pubkey(),
            true,
            false,
            &mut 0,
            &mut [],
            &system_program::id(),
            false,
            0
        ),
        AccountInfo::new(
            &deposit_account.pubkey(),
            false,
            true,
            &mut lamports,
            &mut [0u8; 8],
            &program_id,
            false,
            rent.minimum_balance(space)
        ),
        AccountInfo::new(
            &system_program::id(),
            false,
            false,
            &mut 0,
            &mut [],
            &system_program::id(),
            false,
            0
        )
    ];

    deposit(&program_id, &accounts, deposit_amount).unwrap();

    let deposit_account = banks_client
        .get_account(deposit_account.pubkey()).await
        .unwrap()
        .unwrap();
    assert_eq!(u64::from_le_bytes(deposit_account.data[..8].try_into().unwrap()), deposit_amount);
}

#[tokio::test]
async fn test_withdraw() {
    let program_id = Pubkey::new_unique();
    let (mut banks_client, payer, recent_blockhash) = ProgramTest::new(
        "s4_native_program_introduction",
        program_id,
        processor!(process_instruction)
    ).start().await;

    let deposit_account = Keypair::new();
    let rent = Rent::default();
    let space = 8;
    let lamports = rent.minimum_balance(space);

    let mut transaction = Transaction::new_with_payer(
        &[
            system_instruction::create_account(
                &payer.pubkey(),
                &deposit_account.pubkey(),
                lamports,
                space as u64,
                &program_id
            ),
        ],
        Some(&payer.pubkey())
    );
    transaction.sign(&[&payer, &deposit_account], recent_blockhash);
    banks_client.process_transaction(transaction).await.unwrap();

    let initial_deposit = 10_000_000; // 10 SOL in lamports
    let mut deposit_account_lamports = lamports + initial_deposit;
    let accounts = vec![
        AccountInfo::new(
            &payer.pubkey(),
            true,
            false,
            &mut 0,
            &mut [],
            &system_program::id(),
            false,
            0
        ),
        AccountInfo::new(
            &deposit_account.pubkey(),
            false,
            true,
            &mut deposit_account_lamports,
            &mut [0u8; 8],
            &program_id,
            false,
            rent.minimum_balance(space)
        ),
        AccountInfo::new(
            &system_program::id(),
            false,
            false,
            &mut 0,
            &mut [],
            &system_program::id(),
            false,
            0
        )
    ];

    deposit(&program_id, &accounts, initial_deposit).unwrap();

    let recipient = Keypair::new();
    let mut recipient_lamports = 0;
    let accounts = vec![
        AccountInfo::new(
            &deposit_account.pubkey(),
            false,
            true,
            &mut deposit_account_lamports,
            &mut initial_deposit.to_le_bytes(),
            &program_id,
            false,
            rent.minimum_balance(space)
        ),
        AccountInfo::new(
            &recipient.pubkey(),
            false,
            true,
            &mut recipient_lamports,
            &mut [],
            &system_program::id(),
            false,
            0
        ),
        AccountInfo::new(
            &system_program::id(),
            false,
            false,
            &mut 0,
            &mut [],
            &system_program::id(),
            false,
            0
        )
    ];

    withdraw(&program_id, &accounts).unwrap();

    let deposit_account = banks_client
        .get_account(deposit_account.pubkey()).await
        .unwrap()
        .unwrap();
    let recipient_account = banks_client.get_account(recipient.pubkey()).await.unwrap().unwrap();

    assert_eq!(
        u64::from_le_bytes(deposit_account.data[..8].try_into().unwrap()),
        (initial_deposit * 9) / 10
    );
    assert_eq!(recipient_account.lamports, initial_deposit / 10);
}

#[tokio::test]
async fn test_withdraw_insufficient_funds() {
    let program_id = Pubkey::new_unique();
    let (mut banks_client, payer, recent_blockhash) = ProgramTest::new(
        "s4_native_program_introduction",
        program_id,
        processor!(process_instruction)
    ).start().await;

    let deposit_account = Keypair::new();
    let rent = Rent::default();
    let space = 8;
    let lamports = rent.minimum_balance(space);

    let mut transaction = Transaction::new_with_payer(
        &[
            system_instruction::create_account(
                &payer.pubkey(),
                &deposit_account.pubkey(),
                lamports,
                space as u64,
                &program_id
            ),
        ],
        Some(&payer.pubkey())
    );
    transaction.sign(&[&payer, &deposit_account], recent_blockhash);
    banks_client.process_transaction(transaction).await.unwrap();

    let recipient = Keypair::new();
    let mut recipient_lamports = 0;
    let accounts = vec![
        AccountInfo::new(
            &deposit_account.pubkey(),
            false,
            true,
            &mut lamports,
            &mut (0u64).to_le_bytes(),
            &program_id,
            false,
            rent.minimum_balance(space)
        ),
        AccountInfo::new(
            &recipient.pubkey(),
            false,
            true,
            &mut recipient_lamports,
            &mut [],
            &system_program::id(),
            false,
            0
        ),
        AccountInfo::new(
            &system_program::id(),
            false,
            false,
            &mut 0,
            &mut [],
            &system_program::id(),
            false,
            0
        )
    ];

    let result = withdraw(&program_id, &accounts);
    assert!(result.is_err());
}
