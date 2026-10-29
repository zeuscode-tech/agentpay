import { access, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createMint,
  getAccount,
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
const decimals = 6;
const targetPayerBalance = 1_000_000_000n;

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadKeypair(name: string): Promise<Keypair> {
  const bytes = JSON.parse(
    await readFile(resolve(walletDirectory, `${name}.keypair.json`), "utf8"),
  );
  return Keypair.fromSecretKey(new Uint8Array(bytes));
}

const receiver = await loadKeypair("receiver-devnet");
const payer = await loadKeypair("payer-devnet");

let mint: PublicKey;
if (await fileExists(tokenConfigPath)) {
  const tokenConfig = JSON.parse(await readFile(tokenConfigPath, "utf8"));
  mint = new PublicKey(tokenConfig.mint);
} else {
  mint = await createMint(
    connection,
    receiver,
    receiver.publicKey,
    null,
    decimals,
  );
  await writeFile(
    tokenConfigPath,
    `${JSON.stringify({ mint: mint.toBase58(), decimals }, null, 2)}\n`,
    { mode: 0o600 },
  );
}

const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  receiver,
  mint,
  receiver.publicKey,
);
const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  payer,
  mint,
  payer.publicKey,
);
const payerAccount = await getAccount(connection, payerTokenAccount.address);

if (payerAccount.amount < targetPayerBalance) {
  await mintTo(
    connection,
    receiver,
    mint,
    payerTokenAccount.address,
    receiver,
    targetPayerBalance - payerAccount.amount,
  );
}

const fundedPayerAccount = await getAccount(connection, payerTokenAccount.address);

console.log(`Test token mint: ${mint.toBase58()}`);
console.log(`Decimals: ${decimals}`);
console.log(`Receiver token account: ${receiverTokenAccount.address.toBase58()}`);
console.log(`Payer token account: ${payerTokenAccount.address.toBase58()}`);
console.log(`Payer atomic balance: ${fundedPayerAccount.amount}`);
