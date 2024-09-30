import React, { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { toast } from "react-toastify";
import { TokenOperations } from "../utils/TokenOperations";
import { Button } from "./Button";
import { TokenInfo } from "./TokenInfo";
import { TokenActions } from "./TokenActions";

export const Token: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [mint, setMint] = useState<PublicKey | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string>();

  const tokenOps = new TokenOperations(connection, publicKey, sendTransaction);

  const fetchTokenBalance = useCallback(async () => {
    if (!publicKey || !mint) return;
    const ata = getAssociatedTokenAddressSync(mint, publicKey);
    const balance = await tokenOps.fetchTokenBalance(ata);
    setTokenBalance(balance);
  }, [publicKey, mint, tokenOps]);

  const handleOperation = async (operation: () => Promise<void>) => {
    try {
      await operation();
      await fetchTokenBalance();
    } catch (error) {
      console.error("Operation failed:", error);
      toast.error("Operation failed.");
    }
  };

  const createToken = async () => {
    const newMint = await tokenOps.createToken();
    setMint(newMint);
    toast.success("Token created successfully!");
  };

  const closeTokenAccount = async () => {
    await tokenOps.closeTokenAccount(mint!);
    setMint(null);
    setTokenBalance(undefined);
    toast.success("Token account closed successfully");
  };

  return (
    <div className="flex flex-col gap-2 mt-8">
      <h2 className="text-2xl">Token</h2>

      {mint ? (
        <>
          <TokenInfo
            mint={mint}
            tokenBalance={tokenBalance}
            onFetchBalance={fetchTokenBalance}
          />
          <TokenActions
            mint={mint}
            onMintTokens={() =>
              handleOperation(() => tokenOps.mintTokens(mint))
            }
            onSendTokens={() =>
              handleOperation(() => tokenOps.sendTokens(mint))
            }
            onBurnTokens={() =>
              handleOperation(() => tokenOps.burnTokens(mint))
            }
            onDelegate={() => handleOperation(() => tokenOps.delegate(mint))}
            onRevokeDelegate={() =>
              handleOperation(() => tokenOps.revokeDelegate(mint))
            }
            onCloseAccount={closeTokenAccount}
          />
        </>
      ) : (
        <Button onClick={createToken}>Create Token</Button>
      )}
    </div>
  );
};
