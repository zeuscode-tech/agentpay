import type { NextFunction, Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Summarizer } from "../src/summarizer.js";

const { paymentGate } = vi.hoisted(() => ({
  paymentGate: vi.fn(),
}));

vi.mock("@x402/core/server", () => ({
  HTTPFacilitatorClient: class HTTPFacilitatorClient {},
}));

vi.mock("@x402/express", () => ({
  paymentMiddleware: vi.fn(
    () =>
      (_request: Request, response: Response, _next: NextFunction) => {
        paymentGate();
        response
          .status(402)
          .setHeader("PAYMENT-REQUIRED", "test-payment-requirement")
          .json({ error: "payment_required" });
      },
  ),
  x402ResourceServer: class x402ResourceServer {
    register() {
      return this;
    }
  },
}));

vi.mock("@x402/svm/exact/server", () => ({
  ExactSvmScheme: class ExactSvmScheme {},
}));

import { createApp } from "../src/app.js";

const paymentConfig = {
  facilitatorUrl: "https://facilitator.example.test",
  payTo: "9sxsg3eVDMHfdpVM61t6TP7weTUXEw2uS5dk9BRp8vmm",
  asset: "BK6GfqBvHyjn6shwpouQEoGDb4wf1Y9Q14vnandytBaG",
  amount: "1000",
};

const validText =
  "AgentPay protects an AI resource with an exact x402 payment on Solana. " +
  "The server must verify settlement before it returns the protected result.";

async function request(app: ReturnType<typeof createApp>, init: RequestInit) {
  const server = app.listen(0, "127.0.0.1");

  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Test server did not bind to a TCP port");
  }

  try {
    return await fetch(`http://127.0.0.1:${address.port}/v1/tools/summarize`, {
      ...init,
      headers: { "content-type": "application/json", ...init.headers },
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  }
}

describe("payment boundary", () => {
  afterEach(() => {
    paymentGate.mockClear();
  });

  it("rejects invalid input before issuing a payment requirement", async () => {
    const summarize = vi.fn<Summarizer["summarize"]>();
    const response = await request(createApp(paymentConfig, { summarize }), {
      method: "POST",
      body: JSON.stringify({ text: "Too short", maxSentences: 2 }),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get("PAYMENT-REQUIRED")).toBeNull();
    expect(await response.json()).toMatchObject({
      error: "invalid_summary_request",
    });
    expect(paymentGate).not.toHaveBeenCalled();
    expect(summarize).not.toHaveBeenCalled();
  });

  it("does not execute the AI tool for a valid unpaid request", async () => {
    const summarize = vi.fn<Summarizer["summarize"]>();
    const response = await request(createApp(paymentConfig, { summarize }), {
      method: "POST",
      body: JSON.stringify({ text: validText, maxSentences: 2 }),
    });

    expect(response.status).toBe(402);
    expect(response.headers.get("PAYMENT-REQUIRED")).toBe(
      "test-payment-requirement",
    );
    expect(paymentGate).toHaveBeenCalledOnce();
    expect(summarize).not.toHaveBeenCalled();
  });
});
