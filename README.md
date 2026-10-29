# AgentPay

AgentPay is a pay-per-request AI tools platform for developers and autonomous agents, powered by x402 and Solana.

The hackathon MVP focuses on one complete flow: a client requests a text
summarization resource, receives an HTTP `402 Payment Required` challenge,
settles a token payment on Solana Devnet, and receives the protected result only
after successful payment verification.

## Status

Early development for Solana Hackathon 2026 by Encode Club.

## Planned MVP

- x402 V2 protected AI summarization API
- Solana Devnet USDC payments
- Payment-aware TypeScript agent client
- Payment receipt and Solana Explorer link
- Minimal web interface and request history
- Failure handling for invalid, expired, and replayed payments

## Technology

- TypeScript
- Next.js
- Express
- x402 V2
- Solana Devnet
- USDC

## Development

Requirements:

- Node.js 22.13 or newer
- pnpm 11

Install dependencies and verify the workspace:

```bash
pnpm install
pnpm typecheck
pnpm test
```

Start the API:

```bash
pnpm dev:api
```

The health endpoint is available at `http://127.0.0.1:4021/health`. The paid
summarizer is exposed as `POST http://127.0.0.1:4021/v1/tools/summarize`.

Start the web app in another terminal:

```bash
pnpm dev:web
```

Open `http://127.0.0.1:3000`, connect a Solana Devnet wallet, paste text, and
approve the exact x402 payment. The browser client uses the wallet's Solana Kit
signer and rejects payment requirements with an unexpected network, token,
amount, or receiver. For the custom-token fallback, the connected wallet must
first be funded with that test token.

### Current x402 smoke test

Create disposable Devnet-only payer and receiver wallets:

```bash
pnpm wallets:setup
```

Copy the printed receiver address to `SOLANA_PAY_TO` in a local `.env` file,
then start the API and request the protected resource without a payment:

```bash
pnpm dev:api
curl -i http://127.0.0.1:4021/v1/protected/status
```

The request must return HTTP `402` with a `PAYMENT-REQUIRED` header containing
an x402 V2 `exact` payment requirement for `0.001 USDC` on Solana Devnet. The
protected resource is not returned until the facilitator verifies and settles a
valid payment.

Disposable wallet files are stored under `.local/wallets` and are ignored by
Git. Never use these development wallets on Mainnet.

After funding both wallets with Devnet SOL, create their official Devnet USDC
associated token accounts:

```bash
pnpm tokens:setup
```

After funding the printed payer address with Devnet USDC, keep the API running
and execute one payment-aware request from another terminal:

```bash
pnpm agent:pay
```

The client accepts only x402 V2 `exact` requirements for Solana Devnet, the
official Devnet USDC mint, the configured receiver, and a maximum of `0.01
USDC` per request.

The API validates summarizer input before issuing a payment challenge. This
prevents malformed requests from being charged. In the default
`AI_SUMMARIZER_MODE=local` mode it uses a deterministic extractive NLP model, so
the complete payment flow works without an external AI key. Set
`AI_SUMMARIZER_MODE=gateway` and provide `AI_GATEWAY_API_KEY` to use the model
named by `AI_GATEWAY_MODEL` through Vercel AI Gateway instead. Never commit that
key.

### Devnet faucet fallback

Circle's faucet may deny access based on its security or regional policy. For
local end-to-end testing only, create a disposable SPL token and fund the payer:

```bash
pnpm token:mint-dev
```

Copy the printed mint into `PAYMENT_ASSET` and set `PAYMENT_AMOUNT=1000` in the
local `.env`. The API and client then use that exact mint and amount while
keeping strict network, recipient, asset, and amount checks. This token has no
real value and is not a substitute for USDC; the production target remains
official USDC.

## Security

Never commit wallet private keys, seed phrases, API keys, or populated `.env` files. Development uses disposable Devnet-only wallets.

## License

MIT
