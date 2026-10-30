# AgentPay

AgentPay is a pay-per-request AI tools platform for developers and autonomous
agents, powered by x402 and Solana.

The hackathon MVP focuses on one complete flow: a client requests a text
summarization resource, receives an HTTP `402 Payment Required` challenge,
settles a token payment on Solana Devnet, and receives the protected result only
after successful payment verification.

## Live demo

- Web app: [agentpay-web-eta.vercel.app](https://agentpay-web-eta.vercel.app)
- API health: [agentpay-api-kappa.vercel.app/health](https://agentpay-api-kappa.vercel.app/health)
- Verified Devnet payment: [view on Solana Explorer](https://explorer.solana.com/tx/2bFzGnFw7WiDNWqhSA89TLYzYx8wq7xK84YTx17NSkW3fRLamPA742kBrJCwMJfyJqxrmwQtVPf9PZb9nzocC5YH?cluster=devnet)
- [Mid-submission draft](docs/MID_SUBMISSION.md)
- [3-minute demo script](docs/DEMO_SCRIPT.md)
- [Final submission draft](docs/FINAL_SUBMISSION.md)

The deployed flow was verified end to end on October 29, 2026: the client
received an HTTP `402`, paid `0.001` of the configured Devnet test token, the
facilitator settled the transaction, and the protected API returned HTTP `200`.

## MVP status

- [x] x402 V2 protected AI summarization API
- [x] Real Solana Devnet settlement and payment verification
- [x] Strict client checks for network, asset, amount, and receiver
- [x] Payment-aware TypeScript agent client
- [x] Wallet-enabled web interface
- [x] Payment receipt and Solana Explorer link
- [x] Local request history in the browser
- [x] Vercel AI Gateway integration with deterministic local fallback
- [x] Public Vercel deployment
- [ ] Final demo video and hackathon submission

## How it works

```text
Browser or agent
      |
      | 1. POST /v1/tools/summarize
      v
AgentPay API -- 2. HTTP 402 + exact payment requirements
      ^
      | 3. Signed Solana payment
      | 4. Facilitator verifies and settles on Devnet
      |
      +-- 5. Paid request is retried
      +-- 6. AI summary + PAYMENT-RESPONSE receipt
```

The protected result is generated only after the x402 middleware verifies the
payment. Invalid input is rejected before a payment challenge is issued, and
the client refuses requirements that change the expected Devnet network, token,
amount, or receiver. Automated boundary tests confirm that invalid input never
reaches the payment middleware and an unpaid request never executes the AI tool.

## Technology

- TypeScript
- Next.js
- Express
- x402 V2
- Solana Devnet
- Vercel AI Gateway
- Vercel

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

Create `.env` from `.env.example` and configure at least:

```dotenv
FACILITATOR_URL=https://x402.org/facilitator
SOLANA_PAY_TO=<receiver-wallet-address>
```

By default the API requests `0.001` Devnet USDC. For the custom test-token
fallback, also set `PAYMENT_ASSET` to the mint address and `PAYMENT_AMOUNT=1000`
(atomic units for a six-decimal token).

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
configured asset, amount, and receiver. It also caps each payment at `$0.01`.

The API validates summarizer input before issuing a payment challenge. This
prevents malformed requests from being charged. In the default
`AI_SUMMARIZER_MODE=local` mode it uses a deterministic extractive model, so the
complete payment flow works without an external AI key. Set
`AI_SUMMARIZER_MODE=gateway` and `AI_GATEWAY_MODEL` to use Vercel AI Gateway.
Vercel deployments can authenticate through OIDC; local development may use an
`AI_GATEWAY_API_KEY`. If the gateway is unavailable, the API returns the local
summary instead of losing an already-paid request. Never commit credentials.
The public demo currently runs in `local` mode because Vercel requires billing
verification before enabling Gateway requests; the Gateway integration remains
ready to enable after that account step.

### Devnet faucet fallback

Circle's faucet may deny access based on its security or regional policy. For
local end-to-end testing only, create a disposable SPL token and fund the payer:

```bash
pnpm token:mint-dev
```

Copy the printed mint into `PAYMENT_ASSET` and set `PAYMENT_AMOUNT=1000` in the
local `.env`. The API and client then use that exact mint and amount while
keeping strict network, recipient, asset, and amount checks. This token has no
real value and is not a substitute for USDC. The public hackathon deployment
currently uses this fallback because the Circle faucet is unavailable in the
development region; moving to official Devnet USDC requires only environment
configuration, not a code change.

To fund a browser demo wallet with one unit of this disposable token, provide
only its public Devnet address:

```bash
DEVNET_WALLET_ADDRESS=<public-wallet-address> pnpm wallet:fund-demo
```

The command creates the wallet's associated token account when needed and
prints the finalized transaction link. Never provide a seed phrase or private
key. `DEVNET_TOKEN_AMOUNT` can override the default `1000000` atomic units.

## Production configuration

The repository contains no wallet secrets or populated environment files. The
public deployment expects these settings in Vercel:

- API: `FACILITATOR_URL`, `SOLANA_PAY_TO`, `PAYMENT_ASSET`, `PAYMENT_AMOUNT`,
  `AI_SUMMARIZER_MODE`, and `AI_GATEWAY_MODEL`
- Web: `NEXT_PUBLIC_AGENTPAY_API_URL`, `NEXT_PUBLIC_SOLANA_PAY_TO`,
  `NEXT_PUBLIC_PAYMENT_ASSET`, and `NEXT_PUBLIC_PAYMENT_AMOUNT`

`NEXT_PUBLIC_*` values are intentionally public payment metadata. Private keys,
seed phrases, and payer wallet files must never be added to Vercel or Git.

## Security

Never commit wallet private keys, seed phrases, API keys, or populated `.env`
files. Development uses disposable Devnet-only wallets. The agent client applies
an allowlist policy before signing, and the server validates request bodies
before asking for payment.

## License

MIT
