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

## Security

Never commit wallet private keys, seed phrases, API keys, or populated `.env` files. Development uses disposable Devnet-only wallets.

## License

MIT
