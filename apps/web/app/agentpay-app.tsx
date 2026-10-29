"use client";

import { useEffect, useState, type FormEvent } from "react";
import { WalletMultiButton, useWallet } from "@solana/wallet-adapter";

import { DEVNET_USDC_MINT, SOLANA_NETWORK } from "@agentpay/config";

type PaymentReceipt = {
  success: boolean;
  payer?: string;
  transaction: string;
  network: string;
};

type SummaryResponse = {
  tool: "text-summarizer";
  summary: string;
  provider: "local" | "vercel-ai-gateway";
  model: string;
  inputCharacters: number;
  outputCharacters: number;
};

type HistoryItem = {
  transaction: string;
  summary: string;
  createdAt: string;
};

const defaultText =
  "Autonomous agents often need occasional access to specialized APIs, but " +
  "subscriptions and prepaid balances create friction for short-lived tasks. " +
  "AgentPay uses x402 so an agent can receive a payment requirement, settle a " +
  "micropayment on Solana, and retry the request automatically. The protected " +
  "API verifies settlement before returning the requested result. This creates " +
  "a machine-native pay-per-use flow without accounts or long-term contracts.";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_AGENTPAY_API_URL ?? "http://127.0.0.1:4021";
const expectedReceiver = process.env.NEXT_PUBLIC_SOLANA_PAY_TO ?? "";
const expectedAsset =
  process.env.NEXT_PUBLIC_PAYMENT_ASSET ?? DEVNET_USDC_MINT;
const expectedAmount = process.env.NEXT_PUBLIC_PAYMENT_AMOUNT ?? "1000";
const historyKey = "agentpay-summary-history";

function shorten(value: string, start = 5, end = 5) {
  return value.length > start + end
    ? `${value.slice(0, start)}…${value.slice(-end)}`
    : value;
}

function explorerUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function AgentPayApp() {
  const { connected, signer, address } = useWallet();
  const [text, setText] = useState(defaultText);
  const [maxSentences, setMaxSentences] = useState(2);
  const [status, setStatus] = useState<
    "idle" | "paying" | "success" | "error"
  >("idle");
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(historyKey);
      setHistory(stored ? (JSON.parse(stored) as HistoryItem[]) : []);
    } catch {
      setHistory([]);
    }
  }, []);

  const reduction =
    result && result.inputCharacters > 0
      ? Math.round(
          (1 - result.outputCharacters / result.inputCharacters) * 100,
        )
      : 0;

  async function runSummarizer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setReceipt(null);

    if (!connected || !signer) {
      setStatus("error");
      setError("Connect a Solana wallet that can sign transactions first.");
      return;
    }

    if (!expectedReceiver) {
      setStatus("error");
      setError("NEXT_PUBLIC_SOLANA_PAY_TO is not configured.");
      return;
    }

    setStatus("paying");

    try {
      const [x402Fetch, x402Svm] = await Promise.all([
        import("@x402/fetch"),
        import("@x402/svm/exact/client"),
      ]);
      const {
        decodePaymentResponseHeader,
        wrapFetchWithPayment,
        x402Client,
        x402HTTPClient,
      } = x402Fetch;
      const { ExactSvmScheme } = x402Svm;
      const paymentClient = new x402Client()
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
        .register(SOLANA_NETWORK, new ExactSvmScheme(signer));

      const httpClient = new x402HTTPClient(paymentClient);
      const paidFetch = wrapFetchWithPayment(fetch, httpClient);
      const response = await paidFetch(`${apiBaseUrl}/v1/tools/summarize`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, maxSentences }),
      });
      const body = (await response.json()) as SummaryResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? `Request failed with HTTP ${response.status}`);
      }

      const encodedReceipt = response.headers.get("PAYMENT-RESPONSE");
      if (!encodedReceipt) {
        throw new Error("The API response did not include a payment receipt.");
      }

      const paymentReceipt = decodePaymentResponseHeader(
        encodedReceipt,
      ) as PaymentReceipt;
      const nextHistory = [
        {
          transaction: paymentReceipt.transaction,
          summary: body.summary,
          createdAt: new Date().toISOString(),
        },
        ...history,
      ].slice(0, 4);

      setResult(body);
      setReceipt(paymentReceipt);
      setHistory(nextHistory);
      window.localStorage.setItem(historyKey, JSON.stringify(nextHistory));
      setStatus("success");
    } catch (requestError) {
      setStatus("error");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The paid request failed.",
      );
    }
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="AgentPay home">
          <span className="brand-mark">A</span>
          <span>AgentPay</span>
        </a>
        <div className="topbar-actions">
          <span className="network-pill">
            <span className="network-dot" /> Solana Devnet
          </span>
          <WalletMultiButton />
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">AI commerce infrastructure</div>
        <h1>
          AI tools that <span>pay as they go.</span>
        </h1>
        <p>
          One request. One tiny payment. No subscriptions, accounts, or API
          keys — just x402 settlement on Solana.
        </p>
        <div className="flow-strip" aria-label="AgentPay request flow">
          <span><b>01</b> Request</span>
          <i>→</i>
          <span><b>02</b> HTTP 402</span>
          <i>→</i>
          <span><b>03</b> Solana</span>
          <i>→</i>
          <span><b>04</b> AI result</span>
        </div>
      </section>

      <section className="product-grid">
        <aside className="catalog-panel">
          <div className="section-label">Tool catalog</div>
          <button className="tool-card active" type="button">
            <span className="tool-icon">Σ</span>
            <span>
              <strong>Text Summarizer</strong>
              <small>Condense long text</small>
            </span>
            <em>Live</em>
          </button>
          <div className="tool-card muted">
            <span className="tool-icon">↗</span>
            <span>
              <strong>Data Extractor</strong>
              <small>Structured JSON output</small>
            </span>
            <em>Soon</em>
          </div>
          <div className="tool-card muted">
            <span className="tool-icon">⌁</span>
            <span>
              <strong>Agent Research</strong>
              <small>Focused web reports</small>
            </span>
            <em>Soon</em>
          </div>

          <div className="trust-card">
            <span className="shield">◇</span>
            <div>
              <strong>Wallet-safe by design</strong>
              <p>
                The client accepts only the expected network, token, amount,
                and receiver.
              </p>
            </div>
          </div>
        </aside>

        <div className="workspace-panel">
          <div className="workspace-heading">
            <div>
              <div className="section-label">Selected tool</div>
              <h2>Text Summarizer</h2>
              <p>Turn a long passage into a clean, focused summary.</p>
            </div>
            <div className="price-tag">
              <small>Price per run</small>
              <strong>0.001</strong>
              <span>{expectedAsset === DEVNET_USDC_MINT ? "USDC" : "TEST"}</span>
            </div>
          </div>

          <form onSubmit={runSummarizer}>
            <label className="field-label" htmlFor="source-text">
              Source text
              <span>{text.length.toLocaleString()} / 12,000</span>
            </label>
            <textarea
              id="source-text"
              maxLength={12_000}
              minLength={80}
              value={text}
              onChange={event => setText(event.target.value)}
              placeholder="Paste at least 80 characters…"
              required
            />

            <div className="form-footer">
              <fieldset>
                <legend>Summary length</legend>
                {[1, 2, 3].map(value => (
                  <button
                    className={maxSentences === value ? "selected" : ""}
                    key={value}
                    onClick={() => setMaxSentences(value)}
                    type="button"
                  >
                    {value} {value === 1 ? "sentence" : "sentences"}
                  </button>
                ))}
              </fieldset>

              <button
                className="run-button"
                disabled={status === "paying" || text.trim().length < 80}
                type="submit"
              >
                {status === "paying" ? (
                  <><span className="spinner" /> Confirm in wallet…</>
                ) : (
                  <>Run with x402 <span>→</span></>
                )}
              </button>
            </div>
          </form>

          <div className={`result-panel ${status}`} aria-live="polite">
            {status === "idle" && (
              <div className="empty-result">
                <span>✦</span>
                <strong>Your paid result appears here</strong>
                <p>Connect a Devnet wallet, then run the tool.</p>
              </div>
            )}
            {status === "paying" && (
              <div className="empty-result">
                <span className="large-spinner" />
                <strong>Settling on Solana</strong>
                <p>The result unlocks after x402 verifies the payment.</p>
              </div>
            )}
            {status === "error" && (
              <div className="error-result">
                <span>!</span>
                <div><strong>Request not completed</strong><p>{error}</p></div>
              </div>
            )}
            {status === "success" && result && receipt && (
              <div className="success-result">
                <div className="result-meta">
                  <span>Summary ready</span>
                  <span>{reduction}% shorter</span>
                </div>
                <p className="summary-copy">{result.summary}</p>
                <div className="receipt-row">
                  <span>
                    <small>Model</small>
                    {result.model}
                  </span>
                  <span>
                    <small>Wallet</small>
                    {shorten(receipt.payer ?? address ?? "")}
                  </span>
                  <a
                    href={explorerUrl(receipt.transaction)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    View transaction ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {history.length > 0 ? (
        <section className="history-section">
          <div className="section-label">Recent paid requests</div>
          <div className="history-list">
            {history.map(item => (
              <a
                href={explorerUrl(item.transaction)}
                key={item.transaction}
                rel="noreferrer"
                target="_blank"
              >
                <span>✓</span>
                <p>{item.summary}</p>
                <time>{new Date(item.createdAt).toLocaleTimeString()}</time>
                <b>{shorten(item.transaction, 6, 6)} ↗</b>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <footer>
        <span>AgentPay · Solana Hackathon 2026</span>
        <span>Built with x402 on Solana</span>
      </footer>
    </main>
  );
}
