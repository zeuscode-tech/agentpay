import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@solana/wallet-adapter/styles.css";
import "./globals.css";

import { WalletProviders } from "./providers";

export const metadata: Metadata = {
  title: "AgentPay — Pay-per-request AI tools",
  description:
    "Access AI tools with x402 micropayments settled on Solana. No subscriptions or API keys.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProviders>{children}</WalletProviders>
      </body>
    </html>
  );
}
