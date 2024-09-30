import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "./types/vault";
import { PublicKey, Keypair } from "@solana/web3.js";
import { createMint, createAccount, mintTo } from "@solana/spl-token";
import { assert } from "chai";

describe("vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vault as Program<Vault>;
  const authority = provider.wallet.publicKey;

  let mint: PublicKey;
  let userTokenAccount: PublicKey;
  let vaultTokenAccount: PublicKey;
  let vault: PublicKey;
  let vaultBump: number;
  let user: PublicKey;
  let userBump: number;

  const vaultName = "test_vault";
  const amount = new anchor.BN(1000000);
  const keypair = Keypair.generate();

  async function airDrop(
    connection: anchor.web3.Connection,
    keypair: Keypair,
    amount: number
  ) {
    const airdropSignature = await connection.requestAirdrop(
      keypair.publicKey,
      amount
    );
    await connection.confirmTransaction(airdropSignature);
  }

  before(async () => {
    await airDrop(provider.connection, keypair, 1000000000);

    // Create mint
    mint = await createMint(provider.connection, keypair, authority, null, 6);

    // Create user token account
    userTokenAccount = await createAccount(
      provider.connection,
      keypair,
      mint,
      authority
    );

    // Mint tokens to user
    await mintTo(
      provider.connection,
      keypair,
      mint,
      userTokenAccount,
      authority,
      1000000000
    );

    // Derive vault PDA
    [vault, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), Buffer.from(vaultName)],
      program.programId
    );

    // Create vault token account
    vaultTokenAccount = await createAccount(
      provider.connection,
      keypair,
      mint,
      vault
    );

    // Derive user PDA
    [user, userBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), vault.toBuffer(), authority.toBuffer()],
      program.programId
    );
  });

  it("Creates a vault", async () => {
    await program.methods
      .createVault(vaultName)
      .accounts({
        authority,
      })
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vault);
    assert.equal(vaultAccount.authority.toBase58(), authority.toBase58());
    assert.equal(vaultAccount.name, vaultName);
    assert.equal(vaultAccount.netDeposits.toString(), "0");
    assert.equal(vaultAccount.netWithdraws.toString(), "0");
  });

  it("Deposits tokens", async () => {
    await program.methods
      .deposit(amount)
      .accounts({
        authority,
        userTokenAccount,
        vaultTokenAccount,
      })
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vault);
    assert.equal(vaultAccount.netDeposits.toString(), amount.toString());

    const userAccount = await program.account.user.fetch(user);
    assert.equal(userAccount.netDeposit.toString(), amount.toString());
  });

  it("Withdraws tokens", async () => {
    await program.methods
      .withdraw(amount)
      .accounts({
        authority,
        userTokenAccount,
        vaultTokenAccount,
      })
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vault);
    assert.equal(vaultAccount.netWithdraws.toString(), amount.toString());

    const userAccount = await program.account.user.fetch(user);
    assert.equal(userAccount.netWithdraw.toString(), amount.toString());
  });

  it("Closes the vault", async () => {
    await program.methods
      .close()
      .accounts({
        authority,
        vaultTokenAccount,
      })
      .rpc();

    // Verify that the vault account no longer exists
    const vaultAccount = await program.account.vault.fetchNullable(vault);
    assert.isNull(vaultAccount);
  });
});
