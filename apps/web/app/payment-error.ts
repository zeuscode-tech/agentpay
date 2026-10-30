export type PaymentErrorCopy = {
  title: string;
  message: string;
};

export function getPaymentErrorCopy(error: unknown): PaymentErrorCopy {
  const rawMessage =
    error instanceof Error ? error.message : "The paid request failed.";
  const message = rawMessage.toLocaleLowerCase();

  if (
    message.includes("user rejected") ||
    message.includes("rejected the request") ||
    message.includes("cancelled") ||
    message.includes("canceled")
  ) {
    return {
      title: "Payment cancelled",
      message:
        "The wallet did not sign the payment. No protected result was requested, so you can try again when ready.",
    };
  }

  if (
    message.includes("insufficient funds") ||
    message.includes("insufficient lamports") ||
    message.includes("attempt to debit")
  ) {
    return {
      title: "Wallet needs Devnet funds",
      message:
        "Fund this wallet with Devnet SOL and the AgentPay test token, then retry the request.",
    };
  }

  if (
    message.includes("token account") ||
    message.includes("token balance") ||
    message.includes("account not found")
  ) {
    return {
      title: "Demo token not found",
      message:
        "This wallet needs the AgentPay test token before it can pay for a request.",
    };
  }

  if (message.includes("payment receipt")) {
    return {
      title: "Payment receipt missing",
      message:
        "The API did not return a verifiable receipt. Check your wallet activity before retrying to avoid a duplicate payment.",
    };
  }

  if (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("timed out")
  ) {
    return {
      title: "Network interrupted",
      message:
        "The request did not finish. Check your wallet activity before retrying in case the payment already settled.",
    };
  }

  return {
    title: "Request not completed",
    message: rawMessage,
  };
}
