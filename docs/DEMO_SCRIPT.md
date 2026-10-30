# AgentPay — 3-minute demo script

Target length: 2:45–3:15. Record in English at 1080p. Keep the browser zoom at
100–110%, notifications disabled, and the Solana wallet set to Devnet before
recording.

## Before recording

- Open the live app: <https://agentpay-web-eta.vercel.app>
- Open the verified transaction in a second tab:
  <https://explorer.solana.com/tx/2bFzGnFw7WiDNWqhSA89TLYzYx8wq7xK84YTx17NSkW3fRLamPA742kBrJCwMJfyJqxrmwQtVPf9PZb9nzocC5YH?cluster=devnet>
- Confirm the demo wallet is on Solana Devnet and has Devnet SOL plus the
  AgentPay test token.
- Prepare a text of at least 80 characters in the app.
- Close unrelated tabs and hide private wallet information.
- Do one unrecorded rehearsal. Do not pre-approve or fake a payment.

## 0:00–0:25 — Problem and product

### On screen

Show the AgentPay landing page and the request flow at the top.

### Narration

> AI agents often need one specialized API call, but most APIs require an
> account, an API key, a subscription, or a prepaid balance. AgentPay is a
> pay-per-request AI tool marketplace built with x402 and Solana. A developer
> or autonomous agent can pay for exactly one result, without creating a billing
> account.

## 0:25–0:50 — What is implemented

### On screen

Scroll from the tool catalog to Text Summarizer. Point to the `0.001 TEST`
price and the wallet-safety explanation.

### Narration

> The current MVP exposes one protected AI tool: a text summarizer. The browser
> and the TypeScript agent client accept only the configured Solana Devnet,
> token, amount, and receiver. The public demo uses a disposable Devnet SPL
> token because the regional USDC faucet was unavailable. The payment logic also
> supports Devnet USDC through configuration.

## 0:50–1:55 — Live x402 payment flow

### On screen

1. Connect the funded Devnet wallet.
2. Select the two-sentence option.
3. Click **Run with x402**.
4. Show the wallet confirmation without revealing private information.
5. Approve the exact payment.
6. Wait for the summary and receipt.
7. Click **View transaction**.

### Narration

> I send this text to the protected endpoint. The API validates the input first,
> then responds with HTTP 402 and an exact x402 payment requirement. The client
> checks the requirement before asking the wallet to sign. I am approving a
> payment of 0.001 test token on Solana Devnet.
>
> The x402 facilitator verifies and settles the transaction. The client then
> retries the original request automatically. Only after verification does the
> API run the summarizer and return the protected result. The response includes
> a payment receipt, and the transaction can be inspected independently on
> Solana Explorer.

If the browser wallet flow is not ready, do not simulate it. Record the
payment-aware CLI client making the same production request, then show its
receipt and finalized Explorer transaction. State clearly that the payment was
made by the agent client.

## 1:55–2:25 — Technical proof

### On screen

Briefly show the repository README, the x402 request flow, and the passing test
summary. Avoid scrolling through large blocks of code.

### Narration

> AgentPay uses Next.js and a Solana wallet adapter in the browser, an Express
> API protected by x402 V2 middleware, and a payment-aware TypeScript agent
> client. Automated boundary tests prove that invalid input is rejected before
> payment and that an unpaid request never executes the AI tool. The project has
> fifteen passing tests and is deployed publicly on Vercel.

## 2:25–2:50 — Why Solana and x402

### On screen

Return to the flow strip or the finalized transaction.

### Narration

> Solana provides fast, low-cost settlement that fits small per-request
> payments. x402 connects that settlement directly to the HTTP lifecycle. The
> transaction signature becomes a portable receipt for both people and
> autonomous agents, without a separate billing database or subscription.

## 2:50–3:05 — Closing

### On screen

Show the live app URL and GitHub repository.

### Narration

> AgentPay demonstrates a complete machine-native commerce loop: request,
> payment requirement, Solana settlement, verification, and protected AI
> result. The next step is expanding the marketplace with more tools and
> production payment assets. Thank you.

## Editing checklist

- Keep the wallet approval and result visible in one continuous sequence.
- Do not cut between clicking **Run with x402** and receiving the result unless
  a waiting period is clearly labeled.
- Blur unrelated wallet assets and never show a seed phrase or private key.
- Add small captions for `HTTP 402`, `Solana Devnet`, `x402 verified`, and the
  transaction signature.
- Use quiet background audio or no music; narration must remain clear.
- Export as MP4, 1080p, with a final duration between two and four minutes.
