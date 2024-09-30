import React, { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "./Button";

interface TokenActionsProps {
  mint: PublicKey;
  onMintTokens: () => void;
  onSendTokens: (recipient: string) => void;
  onBurnTokens: () => void;
  onDelegate: () => void;
  onRevokeDelegate: () => void;
  onCloseAccount: () => void;
}

export const TokenActions: React.FC<TokenActionsProps> = ({
  onMintTokens,
  onSendTokens,
  onBurnTokens,
  onDelegate,
  onRevokeDelegate,
  onCloseAccount,
}) => {
  const [recipient, setRecipient] = useState(
    "82ppCojm3yrEKgdpH8B5AmBJTU1r1uAWXFWhxvPs9UCR"
  );

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button onClick={onMintTokens}>Mint Tokens</Button>
        <Button onClick={onBurnTokens}>Burn Tokens</Button>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="recipient"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Recipient Address
        </label>
        <div className="flex gap-2">
          <input
            id="recipient"
            type="text"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <Button
            onClick={() => onSendTokens(recipient)}
            className="whitespace-nowrap"
          >
            Send Tokens
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button onClick={onDelegate}>Delegate</Button>
        <Button onClick={onRevokeDelegate}>Revoke Delegate</Button>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={onCloseAccount}
          className="w-full p-2 bg-red-600 hover:bg-red-700 text-white"
        >
          Close Token Account
        </Button>
      </div>
    </div>
  );
};
