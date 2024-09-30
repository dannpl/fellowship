import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction,
  createTransferInstruction,
  createBurnCheckedInstruction,
  createApproveCheckedInstruction,
  createRevokeInstruction,
  createCloseAccountInstruction,
} from "@solana/spl-token";

export class TokenOperations {
  constructor(
    private connection: Connection,
    private publicKey: PublicKey | null,
    private sendTransaction: (
      transaction: Transaction,
      connection: Connection,
      options?: any
    ) => Promise<string>
  ) {}

  async fetchTokenBalance(tokenAccount: PublicKey): Promise<string> {
    const balance = await this.connection.getTokenAccountBalance(tokenAccount);
    return balance.value.amount;
  }

  async createToken(): Promise<PublicKey> {
    if (!this.publicKey) throw new Error("Wallet not connected");

    const mintKeypair = Keypair.generate();
    const lamports = await getMinimumBalanceForRentExemptMint(this.connection);

    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: this.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        9,
        this.publicKey,
        this.publicKey
      )
    );

    await this.sendAndConfirmTransaction(transaction, [mintKeypair]);
    return mintKeypair.publicKey;
  }

  async mintTokens(mint: PublicKey): Promise<void> {
    if (!this.publicKey) throw new Error("Wallet not connected");

    const ata = getAssociatedTokenAddressSync(mint, this.publicKey);
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        this.publicKey,
        ata,
        this.publicKey,
        mint
      ),
      createMintToCheckedInstruction(
        mint,
        ata,
        this.publicKey,
        100_000_000_000,
        9
      )
    );

    await this.sendAndConfirmTransaction(transaction);
  }

  async sendTokens(mint: PublicKey): Promise<void> {
    if (!this.publicKey) throw new Error("Wallet not connected");

    const receiver = new PublicKey(
      "8vU3WgmVnVDa13hXAevKA3Vhe7XtbwHrQja6aVx15KwV"
    );
    const senderATA = getAssociatedTokenAddressSync(mint, this.publicKey);
    const receiverATA = getAssociatedTokenAddressSync(mint, receiver);

    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        this.publicKey,
        receiverATA,
        receiver,
        mint
      ),
      createTransferInstruction(
        senderATA,
        receiverATA,
        this.publicKey,
        1_000_000_000
      )
    );

    await this.sendAndConfirmTransaction(transaction);
  }

  async burnTokens(mint: PublicKey): Promise<void> {
    if (!this.publicKey) throw new Error("Wallet not connected");

    const ata = getAssociatedTokenAddressSync(mint, this.publicKey);
    const transaction = new Transaction().add(
      createBurnCheckedInstruction(ata, mint, this.publicKey, 1_000_000_000, 9)
    );

    await this.sendAndConfirmTransaction(transaction);
  }

  async delegate(mint: PublicKey): Promise<void> {
    if (!this.publicKey) throw new Error("Wallet not connected");

    const ata = getAssociatedTokenAddressSync(mint, this.publicKey);
    const delegate = new PublicKey(
      "8vU3WgmVnVDa13hXAevKA3Vhe7XtbwHrQja6aVx15KwV"
    );

    const transaction = new Transaction().add(
      createApproveCheckedInstruction(
        ata,
        mint,
        delegate,
        this.publicKey,
        1_000_000_000,
        9
      )
    );

    await this.sendAndConfirmTransaction(transaction);
  }

  async revokeDelegate(mint: PublicKey): Promise<void> {
    if (!this.publicKey) throw new Error("Wallet not connected");

    const ata = getAssociatedTokenAddressSync(mint, this.publicKey);
    const transaction = new Transaction().add(
      createRevokeInstruction(ata, this.publicKey)
    );

    await this.sendAndConfirmTransaction(transaction);
  }

  async closeTokenAccount(mint: PublicKey): Promise<void> {
    if (!this.publicKey) throw new Error("Wallet not connected");

    const ata = getAssociatedTokenAddressSync(mint, this.publicKey);
    const transaction = new Transaction();

    const balance = await this.connection.getTokenAccountBalance(ata);
    if (parseFloat(balance.value.amount) > 0) {
      const receiver = new PublicKey(
        "8vU3WgmVnVDa13hXAevKA3Vhe7XtbwHrQja6aVx15KwV"
      );
      const receiverATA = getAssociatedTokenAddressSync(mint, receiver);

      transaction.add(
        createAssociatedTokenAccountInstruction(
          this.publicKey,
          receiverATA,
          receiver,
          mint
        ),
        createTransferInstruction(
          ata,
          receiverATA,
          this.publicKey,
          parseInt(balance.value.amount)
        )
      );
    }

    transaction.add(
      createCloseAccountInstruction(ata, this.publicKey, this.publicKey)
    );

    await this.sendAndConfirmTransaction(transaction);
  }

  private async sendAndConfirmTransaction(
    transaction: Transaction,
    signers: Keypair[] = []
  ): Promise<void> {
    if (!this.publicKey) throw new Error("Wallet not connected");

    transaction.feePayer = this.publicKey;
    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    const signature = await this.sendTransaction(transaction, this.connection, {
      signers,
    });

    await this.connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });
  }
}
