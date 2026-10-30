import { describe, expect, it } from "vitest";

import { getPaymentErrorCopy } from "../app/payment-error.js";

describe("payment error copy", () => {
  it("explains a rejected wallet signature without implying a charge", () => {
    expect(getPaymentErrorCopy(new Error("User rejected the request"))).toEqual({
      title: "Payment cancelled",
      message:
        "The wallet did not sign the payment. No protected result was requested, so you can try again when ready.",
    });
  });

  it("directs an unfunded wallet to the required Devnet assets", () => {
    expect(getPaymentErrorCopy(new Error("insufficient funds"))).toMatchObject({
      title: "Wallet needs Devnet funds",
    });
  });

  it("warns against an immediate retry after a network timeout", () => {
    expect(getPaymentErrorCopy(new Error("request timed out"))).toEqual({
      title: "Network interrupted",
      message:
        "The request did not finish. Check your wallet activity before retrying in case the payment already settled.",
    });
  });

  it("preserves an unknown error for diagnosis", () => {
    expect(getPaymentErrorCopy(new Error("Unexpected facilitator response"))).toEqual({
      title: "Request not completed",
      message: "Unexpected facilitator response",
    });
  });
});
