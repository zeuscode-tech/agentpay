import { describe, expect, it } from "vitest";

import {
  buildSvmPaymentRequirements,
  selectSvmTransactionVersion,
} from "../app/transaction-version.js";

describe("SVM transaction version selection", () => {
  it("selects the version supported by both the wallet and x402", () => {
    expect(selectSvmTransactionVersion(new Set([0, 1]))).toBe(0);
  });

  it("falls back to version 0 for wallets such as Phantom", () => {
    expect(selectSvmTransactionVersion(new Set(["legacy", 0]))).toBe(0);
  });

  it("rejects wallets without an x402-compatible transaction version", () => {
    expect(selectSvmTransactionVersion(new Set([1]))).toBeNull();
    expect(selectSvmTransactionVersion(new Set(["legacy"]))).toBeNull();
    expect(selectSvmTransactionVersion(null)).toBeNull();
  });

  it("uses the wallet version only for transaction construction", () => {
    const advertised = {
      scheme: "exact",
      network: "solana:devnet" as const,
      asset: "asset",
      amount: "1000",
      payTo: "receiver",
      maxTimeoutSeconds: 300,
      extra: { transactionVersions: [0, 1], feePayer: "facilitator" },
    };

    const buildRequirements = buildSvmPaymentRequirements(advertised, 0);

    expect(buildRequirements.extra.transactionVersions).toEqual([0]);
    expect(advertised.extra.transactionVersions).toEqual([0, 1]);
  });
});
