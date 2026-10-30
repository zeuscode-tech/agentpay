import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";

const localDirectory = resolve(import.meta.dirname, "../../../.local");
const walletDirectory = resolve(localDirectory, "wallets");
const tokenConfigPath = resolve(localDirectory, "devnet-test-token.json");
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const defaultAtomicAmount = 1_000_000n;

const destinationAddress = process.env.DEVNET_WALLET_ADDRESS;
if (!destinationAddress) {
  throw new Error(
    "DEVNET_WALLET_ADDRESS is required and must be a public Solana address",
  );
}

const atomicAmount = BigInt(
  process.env.DEVNET_TOKEN_AMOUNT ?? defaultAtomicAmount,
);
if (atomicAmount <= 0n) {
  throw new Error("DEVNET_TOKEN_AMOUNT must be a positive integer");
}

const destination = new PublicKey(destinationAddress);
const tokenConfig = JSON.parse(await readFile(tokenConfigPath, "utf8")) as {
  mint: string;
  decimals: number;
};
const mint = new PublicKey(tokenConfig.mint);
const authorityBytes = JSON.parse(
  await readFile(resolve(walletDirectory, "receiver-devnet.keypair.json"), "utf8"),
) as number[];
const authority = Keypair.fromSecretKey(new Uint8Array(authorityBytes));

const tokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  authority,
  mint,
  destination,
);
const signature = await mintTo(
  connection,
  authority,
  mint,
  tokenAccount.address,
  authority,
  atomicAmount,
);

const displayAmount = Number(atomicAmount) / 10 ** tokenConfig.decimals;

console.log(`Demo wallet: ${destination.toBase58()}`);
console.log(`Token mint: ${mint.toBase58()}`);
console.log(`Token account: ${tokenAccount.address.toBase58()}`);
console.log(`Funded amount: ${displayAmount}`);
console.log(`Transaction: ${signature}`);
console.log(
  `Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
);
