# AgentPay — Mid-submission draft

## One-line description

AgentPay is a pay-per-request AI tool marketplace where developers and
autonomous agents unlock individual API results through x402 micropayments on
Solana, without subscriptions or prepaid balances.

## Problem

AI APIs are usually sold through accounts, API keys, subscriptions, and prepaid
credits. That model creates friction when a developer or autonomous agent needs
only one specialized request. AgentPay explores a machine-native alternative:
the API itself returns a payment requirement, the client pays the exact amount,
and the result is unlocked only after the payment is verified.

## Current working MVP

The first tool is an AI text summarizer. The implemented flow is:

1. A browser or TypeScript agent sends text to the protected API.
2. The API validates the input and returns an x402 V2 `402 Payment Required`
   response.
3. The client checks the expected Solana network, token, amount, and receiver.
4. The client signs an exact payment on Solana Devnet.
5. The x402 facilitator verifies and settles the transaction.
6. The paid request is retried automatically.
7. The API returns the summary and a payment receipt with a Solana transaction
   signature.

This is a real payment-gated flow. The protected result is not returned before
the facilitator verifies the payment.

## Evidence

- Live web app: <https://agentpay-web-eta.vercel.app>
- Live API health check: <https://agentpay-api-kappa.vercel.app/health>
- Public source code: <https://github.com/zeuscode-tech/agentpay>
- Finalized Devnet payment: <https://explorer.solana.com/tx/2bFzGnFw7WiDNWqhSA89TLYzYx8wq7xK84YTx17NSkW3fRLamPA742kBrJCwMJfyJqxrmwQtVPf9PZb9nzocC5YH?cluster=devnet>

The verified production request first returned HTTP `402`, then returned HTTP
`200` after settlement. The transaction transferred `0.001` of the configured
six-decimal Devnet test token to the configured receiver and is finalized on
Solana Devnet.

## Technical implementation

- Next.js, React, and TypeScript web interface
- Solana wallet adapter for browser signing
- TypeScript payment-aware agent client
- Express protected API
- x402 V2 exact-payment middleware and facilitator
- Solana Devnet settlement
- Vercel AI Gateway integration with a deterministic local fallback
- Vercel deployments for the web application and API

The client uses an allowlist policy and refuses payment requirements that do not
match the configured Devnet network, asset, atomic amount, and receiver. The API
rejects malformed summarization input before issuing the payment challenge, so
invalid requests are not charged. If the AI gateway is temporarily unavailable,
the deterministic local summarizer prevents an already-paid request from losing
its result.

## Why Solana

Solana provides fast and low-cost settlement that fits small, per-request
payments. The transaction signature is also a portable receipt: both users and
agents can independently inspect the payment on-chain. x402 connects this
settlement directly to the HTTP request/response lifecycle, so no separate
billing account is required.

## Current limitation

The public demo currently uses a disposable custom SPL token on Devnet because
the Circle faucet is unavailable in the development region. The token has no
real value. The payment code also supports the official Devnet USDC mint, and
switching assets is an environment configuration change rather than a code
change. The command-line agent flow has been verified end to end; browser-wallet
testing requires funding the selected Devnet wallet with the same test token.
The public API currently uses the deterministic local summarizer because Vercel
requires billing verification before it will serve Gateway model requests. The
Gateway path is implemented and can be enabled after that account-level step.

## Work remaining before final submission

1. Fund a dedicated browser demo wallet and record the complete wallet flow.
2. Add protocol-level replay and expiry tests; invalid-input and unpaid-request
   boundaries are already covered automatically.
3. Add clearer in-product progress and recovery messages for wallet failures.
4. Run a final cross-browser and mobile-layout verification pass.
5. Record a 2–4 minute English demo video.
6. Complete the final Encode Club submission with verified links.

## Team

Iskhak Raimberdiev — developer, Bishkek, Kyrgyzstan.
