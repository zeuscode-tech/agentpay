import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createKeyPairSignerFromBytes,
  generateKeyPairSigner,
  writeKeyPairSigner,
} from "@solana/kit";

const walletDirectory = resolve(import.meta.dirname, "../../../.local/wallets");

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadOrCreateSigner(name: string) {
  const path = resolve(walletDirectory, `${name}.keypair.json`);

  if (await fileExists(path)) {
    const bytes = new Uint8Array(JSON.parse(await readFile(path, "utf8")));
    return createKeyPairSignerFromBytes(bytes, true);
  }

  const signer = await generateKeyPairSigner(true);
  await writeKeyPairSigner(signer, path);
  return signer;
}

const receiver = await loadOrCreateSigner("receiver-devnet");
const payer = await loadOrCreateSigner("payer-devnet");

console.log("Disposable Solana Devnet wallets are ready.");
console.log(`Receiver: ${receiver.address}`);
console.log(`Payer:    ${payer.address}`);
console.log(`Private key files: ${walletDirectory}`);
console.log("Never commit or share the keypair files.");
