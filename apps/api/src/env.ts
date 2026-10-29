import { z } from "zod";

import { DEFAULT_FACILITATOR_URL } from "@agentpay/config";

const solanaAddressPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const apiEnvironmentSchema = z.object({
  FACILITATOR_URL: z.url().default(DEFAULT_FACILITATOR_URL),
  SOLANA_PAY_TO: z
    .string()
    .regex(solanaAddressPattern, "SOLANA_PAY_TO must be a Solana address"),
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
  };
}
