import React from "react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "./Button";

interface TokenInfoProps {
  mint: PublicKey;
  tokenBalance?: string;
  onFetchBalance: () => void;
}

export const TokenInfo: React.FC<TokenInfoProps> = ({
  mint,
  tokenBalance,
  onFetchBalance,
}) => (
  <div className="flex flex-col gap-2">
    <p>Token created</p>
    <p>Mint Account: {mint.toString()}</p>
    {tokenBalance ? (
      <>Token Balance: {parseInt(tokenBalance) / 10 ** 9}</>
    ) : (
      <Button onClick={onFetchBalance}>Fetch Token Balance</Button>
    )}
  </div>
);
