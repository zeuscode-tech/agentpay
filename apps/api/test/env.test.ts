import { describe, expect, it } from "vitest";

import { DEFAULT_FACILITATOR_URL } from "@agentpay/config";

import { loadPaymentConfig } from "../src/env.js";

const receiverAddress = "9sxsg3eVDMHfdpVM61t6TP7weTUXEw2uS5dk9BRp8vmm";

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
});
