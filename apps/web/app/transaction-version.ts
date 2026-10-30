import type { PaymentRequirements } from "@x402/fetch";

export type SvmTransactionVersion = 0;

type WalletTransactionVersion = "legacy" | number;

export function selectSvmTransactionVersion(
  supportedVersions: ReadonlySet<WalletTransactionVersion> | null,
): SvmTransactionVersion | null {
  if (supportedVersions?.has(0)) {
    return 0;
  }

  return null;
}

export function buildSvmPaymentRequirements(
  requirements: PaymentRequirements,
  transactionVersion: SvmTransactionVersion,
): PaymentRequirements {
  return {
    ...requirements,
    extra: {
      ...requirements.extra,
      transactionVersions: [transactionVersion],
    },
  };
}
