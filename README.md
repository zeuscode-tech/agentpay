# AgentPay

AgentPay is a pay-per-request AI tools platform for developers and autonomous agents, powered by x402 and Solana.

The hackathon MVP focuses on one complete flow: a client requests an AI summarization resource, receives an HTTP `402 Payment Required` challenge, settles a USDC payment on Solana Devnet, and receives the protected result only after successful payment verification.

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

The initial health endpoint is available at `http://127.0.0.1:4021/health`.

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

## Security

Never commit wallet private keys, seed phrases, API keys, or populated `.env` files. Development uses disposable Devnet-only wallets.

## License

MIT
