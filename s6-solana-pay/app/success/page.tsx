"use client";
import { useRouter } from "next/navigation";

export default function Success() {
  const router = useRouter();
  const orderNumber = Math.floor(Math.random() * 10000) + 1000; // Generates a random 4-digit order number

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-gray-100">
      <h1 className="text-3xl font-bold text-blue-600">Solana Shirts</h1>
      <h2 className="text-xl font-semibold text-gray-800">
        Order Confirmed!
      </h2>
      <p className="text-gray-600 text-center max-w-md">
        Thank you for your purchase. Your order number is #{orderNumber}.
        You will receive an email with shipping details soon.
      </p>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          Your transaction is being processed on the Solana blockchain.
        </p>
      </div>
      <button
        className="mt-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        onClick={() => router.push("/")}
      >
        Back to shop
      </button>
    </div>
  );
}