import { describe, expect, it } from "vitest";

import { DEFAULT_FACILITATOR_URL } from "@agentpay/config";

import { loadPaymentConfig } from "../src/env.js";

const receiverAddress = "9sxsg3eVDMHfdpVM61t6TP7weTUXEw2uS5dk9BRp8vmm";
const testMint = "BK6GfqBvHyjn6shwpouQEoGDb4wf1Y9Q14vnandytBaG";

describe("payment environment", () => {
  it("loads a valid receiver and the default facilitator", () => {
    expect(
      loadPaymentConfig({
        SOLANA_PAY_TO: receiverAddress,
      }),
    ).toEqual({
      facilitatorUrl: DEFAULT_FACILITATOR_URL,
      payTo: receiverAddress,
    });
  });

  it("rejects a missing receiver", () => {
    expect(() => loadPaymentConfig({})).toThrow(
      "Invalid AgentPay API environment",
    );
  });

  it("loads an explicit SPL token and atomic amount", () => {
    expect(
      loadPaymentConfig({
        SOLANA_PAY_TO: receiverAddress,
        PAYMENT_ASSET: testMint,
        PAYMENT_AMOUNT: "1000",
      }),
    ).toEqual({
      facilitatorUrl: DEFAULT_FACILITATOR_URL,
      payTo: receiverAddress,
      asset: testMint,
      amount: "1000",
    });
  });

  it("rejects a partially configured custom payment asset", () => {
    expect(() =>
      loadPaymentConfig({
        SOLANA_PAY_TO: receiverAddress,
        PAYMENT_ASSET: testMint,
      }),
    ).toThrow("PAYMENT_ASSET and PAYMENT_AMOUNT must be set together");
  });
});
