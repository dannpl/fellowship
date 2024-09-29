#!/bin/sh

execute() {
    echo "Executing: $@"
    $@
    if [ $? -ne 0 ]; then
        echo "Error: Command failed - $@"
        exit 1
    fi
}

# Build the project
execute cargo build --release

# Create Wallets
execute ./target/release/scw generate -f keypair.json
echo "Contents of keypair.json:"
cat keypair.json

execute ./target/release/scw generate -f recipient_keypair.json
echo "Contents of recipient_keypair.json:"
cat recipient_keypair.json

# Extract public keys
MY_WALLET_PUBKEY=$(jq -r '.public_key' keypair.json)
RECIPIENT_WALLET_PUBKEY=$(jq -r '.public_key' recipient_keypair.json)

# Debug: Display the extracted public keys
echo "My Wallet Public Key: $MY_WALLET_PUBKEY"
echo "Recipient Wallet Public Key: $RECIPIENT_WALLET_PUBKEY"

# Fund Wallet
execute ./target/release/scw fund -w $MY_WALLET_PUBKEY -a 2

# Check Balance
execute ./target/release/scw balance -w $MY_WALLET_PUBKEY
execute ./target/release/scw balance -w $RECIPIENT_WALLET_PUBKEY

# Transfer SOL
execute ./target/release/scw send -f keypair.json -t $RECIPIENT_WALLET_PUBKEY -a 0.1

# Check Balance Again
execute ./target/release/scw balance -w $MY_WALLET_PUBKEY
execute ./target/release/scw balance -w $RECIPIENT_WALLET_PUBKEY

# List Wallets
execute ./target/release/scw list -f keypair.json
execute ./target/release/scw list -f recipient_keypair.json

