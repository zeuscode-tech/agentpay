import { z } from "zod";

import { DEFAULT_FACILITATOR_URL } from "@agentpay/config";

const solanaAddressPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const apiEnvironmentSchema = z
  .object({
    FACILITATOR_URL: z.url().default(DEFAULT_FACILITATOR_URL),
    SOLANA_PAY_TO: z
      .string()
      .regex(solanaAddressPattern, "SOLANA_PAY_TO must be a Solana address"),
    PAYMENT_ASSET: z
      .string()
      .regex(solanaAddressPattern, "PAYMENT_ASSET must be a Solana mint address")
      .optional(),
    PAYMENT_AMOUNT: z
      .string()
      .regex(/^[1-9]\d*$/, "PAYMENT_AMOUNT must be a positive atomic amount")
      .optional(),
  })
  .superRefine((environment, context) => {
    if (
      Boolean(environment.PAYMENT_ASSET) !==
      Boolean(environment.PAYMENT_AMOUNT)
    ) {
      context.addIssue({
        code: "custom",
        message: "PAYMENT_ASSET and PAYMENT_AMOUNT must be set together",
        path: ["PAYMENT_ASSET"],
      });
    }
  });

export function loadPaymentConfig(environment: NodeJS.ProcessEnv) {
  const parsed = apiEnvironmentSchema.safeParse(environment);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map(issue => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid AgentPay API environment: ${details}`);
  }

  return {
    facilitatorUrl: parsed.data.FACILITATOR_URL,
    payTo: parsed.data.SOLANA_PAY_TO,
    ...(parsed.data.PAYMENT_ASSET && parsed.data.PAYMENT_AMOUNT
      ? {
          asset: parsed.data.PAYMENT_ASSET,
          amount: parsed.data.PAYMENT_AMOUNT,
        }
      : {}),
  };
}
