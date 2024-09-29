# Solana CLI Tool

This is a command-line interface (CLI) tool for interacting with the Solana blockchain. It provides various operations for managing Solana accounts, checking balances, and transferring funds.

## Features

- Generate new Solana accounts
- Fetch account addresses
- Fund accounts (request airdrops)
- Send funds between accounts
- Check account balances
- List saved accounts
- Update network settings

## Usage

After building the project, you can run the CLI tool using:

### Global Options

- `-a, --account-file <FILE>`: Specify the path to the account keys file (default: "account.json")

### Subcommands

1. Generate a new account:

   ```
   solana-cli-tool generate [--file <FILE>]
   ```

2. Fetch an account address:

   ```
   solana-cli-tool fetch --w <PUBLIC_KEY>
   ```

3. Fund an account (request airdrop):

   ```
   solana-cli-tool fund --w <PUBLIC_KEY> --amount <AMOUNT>
   ```

4. Send funds:

   ```
   solana-cli-tool send --from <SENDER_PUBLIC_KEY> --to <RECIPIENT_PUBLIC_KEY> --amount <AMOUNT>
   ```

5. Check account balance:

   ```
   solana-cli-tool check --w <PUBLIC_KEY>
   ```

6. List saved accounts:

   ```
   solana-cli-tool list [--file <FILE>]
   ```

7. Update network settings:
   ```
   solana-cli-tool update-settings --endpoint <ENDPOINT>
   ```
