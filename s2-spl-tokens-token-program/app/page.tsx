"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { toast } from "react-toastify";

import { useCallback, useEffect, useState } from "react";
import { Token } from "./components/Token";

export default function Home() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [solAmount, setSolAmount] = useState(0.5);
  const [receiverPublicKey, setReceiverPublicKey] = useState<string>(
    "82ppCojm3yrEKgdpH8B5AmBJTU1r1uAWXFWhxvPs9UCR"
  );

  const getBalance = useCallback(
    async (walletPublicKey: PublicKey): Promise<number> => {
      const newBalance = await connection.getBalance(walletPublicKey);
      return newBalance / LAMPORTS_PER_SOL;
    },
    [connection]
  );

  useEffect(() => {
    if (!publicKey) return;

    const updateBalance = async () => {
      const newBalance = await getBalance(publicKey);
      setBalance(newBalance);
    };

    const intervalId = setInterval(updateBalance, 5000);
    updateBalance(); // Initial balance update

    return () => clearInterval(intervalId);
  }, [publicKey, getBalance]);

  const handleAirdrop = async () => {
    if (!publicKey) {
      toast.error("Wallet is not connected");
      return;
    }

    try {
      const airdropAmount =
        Math.floor(Math.random() * 5 + 1) * LAMPORTS_PER_SOL;
      const [latestBlockhash, signature] = await Promise.all([
        connection.getLatestBlockhash(),
        connection.requestAirdrop(publicKey, airdropAmount),
      ]);

      const signResult = await connection.confirmTransaction(
        { signature, ...latestBlockhash },
        "confirmed"
      );

      if (signResult.value.err) {
        throw new Error("Transaction failed");
      }

      toast.success("Airdrop was successful!");
      const newBalance = await getBalance(publicKey);
      setBalance(newBalance);
    } catch (err) {
      toast.error("Airdrop failed");
      console.error(`Airdrop failed: ${err}`);
    }
  };

  const handleTransferSol = async () => {
    if (!publicKey) {
      toast.error("Wallet is not connected");
      return;
    }

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(receiverPublicKey),
          lamports: solAmount * LAMPORTS_PER_SOL,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      const signResult = await connection.confirmTransaction(
        signature,
        "confirmed"
      );

      if (signResult.value.err) {
        throw new Error("Transaction failed");
      }

      toast.success("Transaction was successful!");
      const newBalance = await getBalance(publicKey);
      setBalance(newBalance);
    } catch (err) {
      toast.error("Transaction failed");
      console.error(`Transaction failed: ${err}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Solana Wallet
          </h1>
          <WalletMultiButton className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {publicKey ? (
          <div className="space-y-8">
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Wallet Info
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Public Key: {publicKey.toString()}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Balance: {balance} SOL
              </p>
              <button
                onClick={handleAirdrop}
                className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              >
                Get Airdrop
              </button>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Transfer SOL
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="solAmount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Amount (SOL)
                  </label>
                  <input
                    id="solAmount"
                    type="number"
                    className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={solAmount}
                    min={0.0}
                    max={9_000_000_000.0}
                    onChange={(e) => setSolAmount(parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label
                    htmlFor="receiverPublicKey"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Receiver Public Key
                  </label>
                  <input
                    id="receiverPublicKey"
                    type="text"
                    className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={receiverPublicKey}
                    onChange={(e) => setReceiverPublicKey(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleTransferSol}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  Transfer SOL
                </button>
              </div>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Token Operations
              </h2>
              <Token />
            </section>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Please Connect Your Wallet
            </h2>
            <WalletMultiButton className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" />
          </div>
        )}
      </main>
    </div>
  );
}
