"use client";
import { createQR } from "@solana/pay";
import Head from "next/head";
import Image from "next/image";
import { useCallback, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function TShirtShop() {
  const [qrCode, setQrCode] = useState<string>();
  const [orderKey, setOrderKey] = useState<string>();
  const [quantity, setQuantity] = useState<number>(1);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const router = useRouter();

  const pricePerShirt = 0.1; // 0.1 SOL per shirt

  useEffect(() => {
    setTotalAmount(quantity * pricePerShirt);
  }, [quantity]);

  const handleCreateOrder = async () => {
    try {
      const res = await axios.post(
        "/api/pay",
        { shirtQuantity: quantity },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const { paymentUrl, orderKey } = res.data;
      const qr = createQR(paymentUrl);
      const qrBlob = await qr.getRawData("png");
      if (!qrBlob) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === "string") {
          setQrCode(event.target.result);
        }
      };
      reader.readAsDataURL(qrBlob);
      setOrderKey(orderKey);
      handleVerify(orderKey);
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  const handleVerify = useCallback(
    async (key: string) => {
      if (!key) {
        alert("Please create an order first");
        return;
      }

      setIsVerifying(true);
      let isPaid = false;
      let localRetryCount = retryCount;
      const maxRetries = 25;

      while (!isPaid && localRetryCount < maxRetries) {
        console.log("Verifying payment...");
        try {
          const res = await axios.get(`/api/pay?orderKey=${key}`);
          const { status } = res.data;
          if (status === "paid") {
            router.push("/success");
            isPaid = true;
          }

          await delay(Math.min(1000 * Math.pow(2, localRetryCount), 1000 * 15));
        } catch (error) {
          console.error("Error verifying payment:", error);
        }
        localRetryCount++;
        setRetryCount(localRetryCount);
      }

      if (!isPaid) {
        alert("Failed to verify payment after multiple attempts.");
      }

      setIsVerifying(false);
    },
    [router, retryCount]
  );

  return (
    <>
      <Head>
        <title>Solana Shirts</title>
        <meta name="description" content="Buy awesome t-shirts with Solana" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex min-h-screen flex-col justify-center items-center bg-gray-100">
        <h1 className="text-3xl font-bold mb-4 text-blue-600">Solana Shirts</h1>
        {!qrCode && (
          <div className="mb-4 flex items-center">
            <label htmlFor="quantity" className="mr-2 text-lg">
              Quantity:
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              min={1}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="p-2 border border-gray-300 rounded-md text-black"
            />
          </div>
        )}
        {qrCode && (
          <>
            <p className="text-sm text-gray-500 items-center justify-center flex flex-col">
              <Image
                src={qrCode}
                className="rounded-lg"
                alt="QR Code"
                width={300}
                height={300}
                priority
              />
              Scan the QR code to make a payment
            </p>
          </>
        )}
        <p className="text-lg text-gray-700 mb-4">
          Total Amount: {totalAmount.toFixed(2)} SOL
        </p>
        {!orderKey && (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleCreateOrder}
          >
            Create Order
          </button>
        )}
        {retryCount >= 3 && (
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
            onClick={() => handleVerify(orderKey!)}
          >
            Verify Payment
          </button>
        )}
      </main>
    </>
  );
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
