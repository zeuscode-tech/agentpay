import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createKeyPairSignerFromBytes } from "@solana/kit";
import {
  decodePaymentResponseHeader,
  wrapFetchWithPayment,
  x402Client,
  x402HTTPClient,
} from "@x402/fetch";
import { ExactSvmScheme } from "@x402/svm/exact/client";

import { DEVNET_USDC_MINT, SOLANA_NETWORK } from "@agentpay/config";

const apiUrl =
  process.env.AGENTPAY_API_URL ??
  "http://127.0.0.1:4021/v1/tools/summarize";
const textToSummarize =
  process.env.AGENTPAY_TEXT ??
  "Autonomous agents often need occasional access to specialized APIs. " +
    "Traditional subscriptions and prepaid balances create friction for these " +
    "short-lived tasks. AgentPay uses the x402 protocol so an agent can receive " +
    "a payment requirement, settle a micropayment on Solana, and retry the " +
    "request automatically. The protected API verifies settlement before it " +
    "returns the requested result. This creates a machine-native pay-per-use " +
    "flow without accounts or long-term subscriptions.";
const expectedReceiver = process.env.SOLANA_PAY_TO;
const expectedAsset = process.env.PAYMENT_ASSET ?? DEVNET_USDC_MINT;
const expectedAmount = process.env.PAYMENT_AMOUNT ?? "1000";
const payerKeypairPath =
  process.env.PAYER_KEYPAIR_PATH ??
  resolve(process.cwd(), "../../.local/wallets/payer-devnet.keypair.json");

if (!expectedReceiver) {
  throw new Error("SOLANA_PAY_TO is required");
}

const payerBytes = new Uint8Array(
  JSON.parse(await readFile(payerKeypairPath, "utf8")),
);
const payer = await createKeyPairSignerFromBytes(payerBytes);

const client = new x402Client()
  .setSpendControls({
    maxAmountPerPayment: "$0.01",
    allowedAssets: [
      {
        network: SOLANA_NETWORK,
        asset: expectedAsset,
        maxAmountPerPayment: expectedAmount,
      },
    ],
  })
  .registerPolicy((_version, requirements) =>
    requirements.filter(
      requirement =>
        requirement.scheme === "exact" &&
        requirement.network === SOLANA_NETWORK &&
        requirement.asset === expectedAsset &&
        requirement.amount === expectedAmount &&
        requirement.payTo === expectedReceiver,
    ),
  )
  .register(SOLANA_NETWORK, new ExactSvmScheme(payer));

const httpClient = new x402HTTPClient(client);
const fetchWithPayment = wrapFetchWithPayment(fetch, httpClient);

console.log(`Payer: ${payer.address}`);
console.log(`Requesting: ${apiUrl}`);

const response = await fetchWithPayment(apiUrl, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ text: textToSummarize, maxSentences: 2 }),
});
const body = await response.json();
const encodedReceipt = response.headers.get("PAYMENT-RESPONSE");
const receipt = encodedReceipt
  ? decodePaymentResponseHeader(encodedReceipt)
  : undefined;

if (!response.ok) {
  const paymentRequired =
    response.status === 402
      ? httpClient.getPaymentRequiredResponse(
          name => response.headers.get(name),
          body,
        )
      : undefined;

  throw new Error(
    `Paid request failed with HTTP ${response.status}: ${JSON.stringify({ body, receipt, paymentRequired })}`,
  );
}

if (!receipt) {
  throw new Error("Successful response did not include PAYMENT-RESPONSE");
}

console.log("Protected response:");
console.log(JSON.stringify(body, null, 2));
console.log("Payment receipt:");
console.log(JSON.stringify(receipt, null, 2));
