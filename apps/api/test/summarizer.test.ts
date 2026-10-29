import { describe, expect, it } from "vitest";

import {
  createSummarizer,
  summaryRequestSchema,
} from "../src/summarizer.js";

const sourceText =
  "Solana provides fast settlement for internet-native payments. " +
  "The x402 protocol expresses payment requirements using ordinary HTTP. " +
  "AgentPay combines these technologies for pay-per-request AI tools. " +
  "A client receives a 402 response, signs the payment, and retries automatically. " +
  "The API returns a result only after settlement is verified.";

describe("text summarizer", () => {
  it("creates a concise local summary without external credentials", async () => {
    const summarizer = createSummarizer({ AI_SUMMARIZER_MODE: "local" });
    const result = await summarizer.summarize({
      text: sourceText,
      maxSentences: 2,
    });

    expect(result.provider).toBe("local");
    expect(result.summary.length).toBeLessThan(sourceText.length);
    expect(result.summary.match(/[.!?]/g)).toHaveLength(2);
  });

  it("rejects text that is too short before payment", () => {
    expect(summaryRequestSchema.safeParse({ text: "Too short" }).success).toBe(
      false,
    );
  });

  it("requires Gateway credentials in LLM mode", () => {
    expect(() =>
      createSummarizer({ AI_SUMMARIZER_MODE: "gateway" }),
    ).toThrow("requires AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN");
  });

  it("requires an explicit current model in LLM mode", () => {
    expect(() =>
      createSummarizer({
        AI_SUMMARIZER_MODE: "gateway",
        AI_GATEWAY_API_KEY: "test-key-not-used",
      }),
    ).toThrow("requires an AI_GATEWAY_MODEL from the live model catalog");
  });
});
