import type { Metadata } from "next";
import "./globals.css";

import "@solana/wallet-adapter-react-ui/styles.css";
import AppWalletProvider from "./hooks/AppWalletProvider";

import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

export const metadata: Metadata = {
  title: "SPL Token Program",
  description: "SPL Token Program",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppWalletProvider>{children}</AppWalletProvider>
      </body>
      <ToastContainer />
    </html>
  );
}
