use clap::{ Parser, Subcommand, ValueEnum };
use serde::{ Deserialize, Serialize };

#[derive(Serialize, Deserialize, Debug)]
pub struct ProgramSettings {
    pub endpoint: String,
}

#[derive(Subcommand)]
pub enum Operations {
    Generate(GenerateCommand),
    Fetch(FetchCommand),
    Fund(FundCommand),
    Send(SendCommand),
    Balance(BalanceCommand),
    List(ListCommand),
    UpdateSettings(UpdateSettingsCommand),
}

#[derive(Serialize, Deserialize)]
pub struct AccountKeys {
    pub public_key: String,
    pub private_key: String,
}

#[derive(Parser)]
#[clap(author, version, about)]
pub struct Cli {
    /// Path to the account keys file
    #[clap(
        short,
        long,
        global = true,
        default_value = "account.json",
        help = "Global path to the account keys file"
    )]
    pub account_file: String,

    #[clap(subcommand)]
    pub operation: Operations,
}

#[derive(Parser)]
pub struct GenerateCommand {
    #[clap(short, long, help = "Optional path to save the keys file")]
    pub file: Option<String>,
}

#[derive(Parser)]
pub struct FetchCommand {
    #[clap(short, long, help = "The public key of the account to fetch.")]
    pub wallet: String,
}

#[derive(Parser)]
pub struct FundCommand {
    #[clap(short, long, help = "The public key of the account to receive funds.")]
    pub wallet: String,
    #[clap(short, long, help = "The amount of SOL to request.")]
    pub amount: u64,
}

#[derive(Parser)]
pub struct SendCommand {
    #[clap(
        short,
        long,
        help = "The public key of the sender account. Defaults to the account file."
    )]
    pub from: Option<String>,
    #[clap(short, long, help = "The public key of the recipient account.")]
    pub to: String,
    #[clap(short, long, help = "The amount of SOL to send.")]
    pub amount: f64,
}

#[derive(Parser)]
pub struct BalanceCommand {
    #[clap(short, long, help = "The public key of the account to check the balance.")]
    pub wallet: String,
}

#[derive(Parser)]
pub struct ListCommand {
    #[clap(short, long, help = "Path to the directory where accounts are saved.")]
    pub file: Option<String>,
}

#[derive(Parser)]
pub struct UpdateSettingsCommand {
    #[clap(short, long, help = "Endpoint to set (local, dev, test)")]
    pub endpoint: Endpoint,
}

#[derive(Parser, ValueEnum, Clone, Debug)]
pub enum Endpoint {
    Local,
    Dev,
    Test,
}
