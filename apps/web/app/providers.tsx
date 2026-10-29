"use client";

import type { ReactNode } from "react";
import {
  ConnectionProvider,
  WalletModalProvider,
  WalletProvider,
} from "@solana/wallet-adapter";
import { clusterApiUrl } from "@solana/web3.js";

const endpoint = clusterApiUrl("devnet");

export function WalletProviders({ children }: { children: ReactNode }) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider chain="solana:devnet" autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
