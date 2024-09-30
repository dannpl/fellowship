import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { encodeURL, findReference, validateTransfer } from "@solana/pay";
import BigNumber from "bignumber.js";

const storeWalletAddress = "HjJQdfTHgC3EBX3471w4st8BXbBmtbaMyCAXNgcUb7dq";

const storeWallet = new PublicKey(storeWalletAddress);
const storeName = "Solana Shirts";
const transactionMemo = "T-shirt purchase";
const shirtPrice = new BigNumber(0.1); // 0.1 SOL per shirt

const pendingOrders = new Map<
  string,
  { recipient: PublicKey; totalAmount: BigNumber; memo: string }
>();

export async function POST(request: Request) {
  try {
    const { shirtQuantity } = await request.json();
    const orderTotal = shirtPrice.multipliedBy(shirtQuantity);
    const orderReference = new Keypair().publicKey;
    const orderDescription = `Purchase of ${shirtQuantity} shirt(s) for ${orderTotal} SOL`;
    const paymentUrl = await createPaymentUrl(
      storeWallet,
      orderTotal,
      orderReference,
      storeName,
      orderDescription,
      transactionMemo
    );
    const orderKey = orderReference.toBase58();
    pendingOrders.set(orderKey, {
      recipient: storeWallet,
      totalAmount: orderTotal,
      memo: transactionMemo,
    });
    return Response.json({ paymentUrl, orderKey });
  } catch (error) {
    console.error("Order creation error:", error);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderKey = searchParams.get("orderKey");
  if (!orderKey) {
    return Response.json({ error: "Order key not provided" }, { status: 400 });
  }

  try {
    const orderReference = new PublicKey(orderKey);
    const isVerified = await verifyPayment(orderReference);
    return Response.json({ status: isVerified ? "paid" : "pending" });
  } catch (error) {
    console.error("Payment verification error:", error);
    return Response.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}

async function createPaymentUrl(
  recipient: PublicKey,
  amount: BigNumber,
  reference: PublicKey,
  label: string,
  message: string,
  memo: string
): Promise<URL> {
  return encodeURL({
    recipient,
    amount,
    reference,
    label,
    message,
    memo,
  });
}

async function verifyPayment(orderReference: PublicKey): Promise<boolean> {
  const orderDetails = pendingOrders.get(orderReference.toBase58());
  if (!orderDetails) {
    throw new Error("Order not found");
  }
  const { recipient, totalAmount, memo } = orderDetails;

  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  const transaction = await findReference(connection, orderReference);
  console.log("Transaction signature:", transaction.signature);

  const isValid = await validateTransfer(
    connection,
    transaction.signature,
    {
      recipient,
      amount: totalAmount,
      splToken: undefined,
      reference: orderReference,
    },
    { commitment: "confirmed" }
  );

  if (isValid) {
    pendingOrders.delete(orderReference.toBase58());
  }

  return !!isValid.transaction;
}
