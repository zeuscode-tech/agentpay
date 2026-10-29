import { describe, expect, it } from "vitest";

import { SOLANA_NETWORK } from "@agentpay/config";

import { getHealthStatus } from "../src/app.js";

describe("health status", () => {
  it("reports the configured Solana network", async () => {
    expect(getHealthStatus()).toEqual({
      service: "agentpay-api",
      status: "ok",
      network: SOLANA_NETWORK,
    });
  });
});
