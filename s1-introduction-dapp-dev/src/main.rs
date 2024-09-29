use clap::Parser;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    native_token::LAMPORTS_PER_SOL,
    pubkey::Pubkey,
    signature::{ Keypair, Signature },
    signer::Signer,
};
use std::{ error::Error, fs, str::FromStr };

use state::*;

mod state;

const DEFAULT_SETTINGS: &str = r#"{
    "endpoint": "http://127.0.0.1:8899"
}"#;

impl ProgramSettings {
    fn load_settings(file_path: &str) -> Self {
        let contents = match fs::read_to_string(file_path) {
            Ok(contents) => contents,
            Err(_) => {
                let default_settings: ProgramSettings = serde_json
                    ::from_str(DEFAULT_SETTINGS)
                    .expect("Failed to parse default settings");
                default_settings.save_settings(file_path);
                serde_json
                    ::to_string(&default_settings)
                    .expect("Failed to serialize default settings")
            }
        };
        serde_json::from_str(&contents).expect("Failed to parse settings file")
    }

    fn save_settings(&self, file_path: &str) {
        let data: String = serde_json
            ::to_string_pretty(&self)
            .expect("Failed to serialize settings");
        fs::write(file_path, data).expect("Failed to write settings file");
    }
}

impl From<Endpoint> for String {
    fn from(endpoint: Endpoint) -> Self {
        match endpoint {
            Endpoint::Local => "http://127.0.0.1:8899".to_string(),
            Endpoint::Dev => "https://api.devnet.solana.com".to_string(),
            Endpoint::Test => "https://api.testnet.solana.com".to_string(),
        }
    }
}

fn save_keys(keypair: &Keypair, file_path: &str) -> Result<(), Box<dyn Error>> {
    let account = AccountKeys {
        public_key: keypair.pubkey().to_string(),
        private_key: bs58::encode(keypair.to_bytes()).into_string(),
    };
    let json = serde_json::to_string_pretty(&account)?;
    fs::write(file_path, json).map_err(|e| {
        eprintln!("Failed to save keys at '{}': {}", file_path, e);
        e.into()
    })
}

fn read_keys(file_path: &str) -> Result<Keypair, Box<dyn Error>> {
    let data = fs::read_to_string(file_path).map_err(|e| {
        eprintln!("Failed to read keys file '{}': {}", file_path, e);
        e
    })?;
    let account: AccountKeys = serde_json::from_str(&data)?;
    let bytes = bs58::decode(account.private_key).into_vec()?;
    Keypair::from_bytes(&bytes).map_err(|e| {
        eprintln!("Failed to decode keys from '{}': {}", file_path, e);
        e.into()
    })
}

async fn request_funds(
    rpc_client: &RpcClient,
    pubkey: &Pubkey,
    amount_sol: u64
) -> Result<Signature, Box<dyn Error>> {
    let sig = rpc_client.request_airdrop(pubkey, amount_sol * LAMPORTS_PER_SOL)?;
    loop {
        let confirmed = rpc_client.confirm_transaction(&sig)?;
        if confirmed {
            break;
        }
    }
    Ok(sig)
}

fn send_funds(
    rpc_client: &RpcClient,
    sender_keypair: &Keypair,
    receiver_pub_key: &Pubkey,
    amount_sol: f64
) -> Result<Signature, Box<dyn Error>> {
    let amount_lamports = (amount_sol * (LAMPORTS_PER_SOL as f64)) as u64;
    let latest_blockhash = rpc_client.get_latest_blockhash()?;

    let transaction = solana_sdk::transaction::Transaction::new_signed_with_payer(
        &[
            solana_sdk::system_instruction::transfer(
                &sender_keypair.pubkey(),
                receiver_pub_key,
                amount_lamports
            ),
        ],
        Some(&sender_keypair.pubkey()),
        &[sender_keypair],
        latest_blockhash
    );

    rpc_client.send_and_confirm_transaction(&transaction).map_err(|e| e.into())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let cli = Cli::parse();
    let settings = ProgramSettings::load_settings("./settings.json");
    let rpc_client = RpcClient::new(settings.endpoint.clone());

    (match &cli.operation {
        Operations::Generate(cmd) => generate_account(&cli.account_file, cmd),
        Operations::Fetch(cmd) => fetch_address(cmd),
        Operations::Fund(cmd) => fund_account(&rpc_client, cmd).await,
        Operations::Send(cmd) => send_funds_command(&rpc_client, &cli.account_file, cmd).await,
        Operations::Balance(cmd) => check_balance(&rpc_client, cmd).await,
        Operations::UpdateSettings(cmd) => update_settings(cmd),
        Operations::List(cmd) => list_accounts(&cli.account_file, cmd),
    })?;

    Ok(())
}

fn generate_account(default_path: &str, cmd: &GenerateCommand) -> Result<(), Box<dyn Error>> {
    let keypair = Keypair::new();
    let file_path = cmd.file.as_deref().unwrap_or(default_path);
    save_keys(&keypair, file_path)?;
    println!("Account created and saved to: {}", file_path);
    println!("Public key: {}", keypair.pubkey());
    Ok(())
}

fn fetch_address(cmd: &FetchCommand) -> Result<(), Box<dyn Error>> {
    let pubkey = Pubkey::from_str(&cmd.wallet)?;
    println!("Address: {}", pubkey);
    Ok(())
}

async fn fund_account(rpc_client: &RpcClient, cmd: &FundCommand) -> Result<(), Box<dyn Error>> {
    let pubkey = Pubkey::from_str(&cmd.wallet)?;
    let signature = request_funds(rpc_client, &pubkey, cmd.amount).await?;
    println!("Funding successful: Signature {}", signature);
    Ok(())
}

async fn send_funds_command(
    rpc_client: &RpcClient,
    default_account: &str,
    cmd: &SendCommand
) -> Result<(), Box<dyn Error>> {
    let sender_keypair = match &cmd.from {
        Some(path) => read_keys(path)?,
        None => read_keys(default_account)?,
    };
    let receiver_pubkey = Pubkey::from_str(&cmd.to)?;
    let signature = send_funds(rpc_client, &sender_keypair, &receiver_pubkey, cmd.amount)?;
    println!("Transfer successful: Signature {}", signature);
    Ok(())
}

async fn check_balance(rpc_client: &RpcClient, cmd: &BalanceCommand) -> Result<(), Box<dyn Error>> {
    let pubkey = Pubkey::from_str(&cmd.wallet)?;
    let balance = rpc_client.get_balance(&pubkey)?;
    println!("Balance: {} SOL", (balance as f64) / (LAMPORTS_PER_SOL as f64));
    Ok(())
}

fn update_settings(cmd: &UpdateSettingsCommand) -> Result<(), Box<dyn Error>> {
    let mut settings = ProgramSettings::load_settings("./settings.json");
    settings.endpoint = cmd.endpoint.clone().into();
    settings.save_settings("./settings.json");
    println!("Endpoint set to: {}", settings.endpoint);
    Ok(())
}

fn list_accounts(default_path: &str, cmd: &ListCommand) -> Result<(), Box<dyn Error>> {
    let file_path = cmd.file.as_deref().unwrap_or(default_path);
    let data = fs::read_to_string(file_path)?;
    let account: AccountKeys = serde_json::from_str(&data)?;
    println!("Public key: {}", account.public_key);
    Ok(())
}
