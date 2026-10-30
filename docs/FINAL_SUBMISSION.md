# AgentPay — Final submission draft

This draft is ready to adapt to the exact Encode Club submission fields once
they are visible. All claims below reflect the currently implemented project.

## Project name

AgentPay

## Tagline

Pay-per-request AI tools for developers and autonomous agents, powered by x402
and Solana.

## Short description

AgentPay is an AI tool marketplace where each protected API result can be
unlocked with an exact x402 micropayment on Solana. It removes subscriptions,
API keys, and prepaid balances from occasional machine-to-machine API usage.

## Full description

Most AI APIs assume a long-term customer relationship: users create accounts,
manage API keys, subscribe to plans, or maintain prepaid credit balances. This
creates unnecessary friction when a developer or autonomous agent needs only
one specialized operation.

AgentPay demonstrates a machine-native alternative. A client sends an ordinary
HTTP request to a protected AI tool. The API validates the input and responds
with an x402 V2 `402 Payment Required` challenge containing the exact Solana
network, token, amount, and receiver. The browser or payment-aware agent client
checks those fields, signs the payment, and automatically retries the request.
The protected AI result is produced only after the x402 facilitator verifies
and settles the payment.

The MVP provides a text summarizer, a wallet-enabled Next.js interface, a
TypeScript autonomous-agent client, payment receipts, Solana Explorer links,
and local request history. The public API is deployed on Vercel and the payment
flow has been completed end to end on Solana Devnet.

## How Solana is used

Solana is the settlement and receipt layer for every paid request. Its low fees
and fast confirmation make small per-request payments practical. The finalized
transaction signature is included in the x402 payment receipt, allowing a user,
agent, or judge to verify settlement independently on-chain.

AgentPay does not use a simulated success button or a database flag in place of
payment. The protected route remains inaccessible until x402 verifies the
Solana transaction.

## How x402 is used

1. The client requests `POST /v1/tools/summarize`.
2. The API returns HTTP `402` with an x402 V2 exact-payment requirement.
3. The client validates the required network, asset, amount, and receiver.
4. The client signs a Solana Devnet payment.
5. The facilitator verifies and settles the payment.
6. The client retries the original request with the payment payload.
7. The API returns the AI result and `PAYMENT-RESPONSE` receipt.

## Safety and failure handling

- Invalid summarizer input is rejected before a payment challenge is issued.
- The client allowlists the expected network, asset, amount, and receiver.
- The agent client caps its maximum payment per request.
- An unpaid request cannot execute the protected AI tool.
- Wallet rejection, missing funds, missing tokens, absent receipts, and network
  interruptions produce explicit recovery guidance.
- After an uncertain network failure, the UI tells the user to inspect wallet
  activity before retrying to reduce duplicate-payment risk.
- Private keys, seed phrases, wallet files, and populated environment files are
  excluded from the repository and deployment.

## Technology

- TypeScript
- Next.js and React
- Solana wallet adapter
- Express
- x402 V2
- Solana Devnet
- Vercel
- Vercel AI Gateway integration with deterministic local fallback

## Current demo asset

The public hackathon demo currently uses a disposable custom SPL token on
Solana Devnet because the Circle faucet is unavailable in the development
region. The token has no monetary value. The code also supports official Devnet
USDC, and changing the asset requires environment configuration rather than a
code change.

## Verified links

- Live application: <https://agentpay-web-eta.vercel.app>
- API health endpoint: <https://agentpay-api-kappa.vercel.app/health>
- Source code: <https://github.com/zeuscode-tech/agentpay>
- Finalized example payment: <https://explorer.solana.com/tx/2bFzGnFw7WiDNWqhSA89TLYzYx8wq7xK84YTx17NSkW3fRLamPA742kBrJCwMJfyJqxrmwQtVPf9PZb9nzocC5YH?cluster=devnet>

## What was challenging

The largest challenge was building a real payment-gated flow rather than a UI
simulation. The client and server had to agree on the exact Solana network,
asset, atomic amount, receiver, and x402 version. The implementation also had to
protect users from being charged for malformed input and remain useful when an
external AI provider is unavailable after settlement.

Regional faucet access and serverless facilitator latency created additional
constraints. A disposable Devnet token kept the integration testable without
weakening the network, recipient, asset, amount, settlement, or verification
checks. The summarizer has a deterministic local fallback so an already-paid
request still receives a result if the external AI gateway is unavailable.

## Future work

- Add more independently priced AI tools.
- Move the public demo to an official stable Devnet payment asset when faucet
  access is available.
- Add persistent, privacy-aware receipts and usage history.
- Add facilitator-level replay and expiry integration tests.
- Support agent discovery metadata and richer machine-readable tool catalogs.
- Evaluate Mainnet deployment, production observability, and rate limiting.

## Builder

Iskhak Raimberdiev — Bishkek, Kyrgyzstan.
