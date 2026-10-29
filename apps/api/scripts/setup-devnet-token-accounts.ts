import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";

import { DEVNET_USDC_MINT } from "@agentpay/config";

const walletDirectory = resolve(import.meta.dirname, "../../../.local/wallets");
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const mint = new PublicKey(DEVNET_USDC_MINT);

async function loadKeypair(name: string): Promise<Keypair> {
  const bytes = JSON.parse(
    await readFile(resolve(walletDirectory, `${name}.keypair.json`), "utf8"),
  );
  return Keypair.fromSecretKey(new Uint8Array(bytes));
}

for (const name of ["receiver-devnet", "payer-devnet"] as const) {
  const owner = await loadKeypair(name);
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    mint,
    owner.publicKey,
    false,
    "confirmed",
    undefined,
    TOKEN_PROGRAM_ID,
  );

  console.log(`${name} owner: ${owner.publicKey.toBase58()}`);
  console.log(`${name} USDC ATA: ${tokenAccount.address.toBase58()}`);
}
