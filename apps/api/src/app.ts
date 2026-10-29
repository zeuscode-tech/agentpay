import express, { type Express } from "express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactSvmScheme } from "@x402/svm/exact/server";

import {
  DEFAULT_PRICE_USD,
  DEVNET_USDC_MINT,
  SOLANA_NETWORK,
} from "@agentpay/config";

export type PaymentConfig = {
  facilitatorUrl: string;
  payTo: string;
  asset?: string;
  amount?: string;
};

export function getHealthStatus() {
  return {
    service: "agentpay-api",
    status: "ok",
    network: SOLANA_NETWORK,
  } as const;
}

export function createApp(paymentConfig?: PaymentConfig): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));

  app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader(
      "Access-Control-Expose-Headers",
      "PAYMENT-REQUIRED, PAYMENT-RESPONSE",
    );
    response.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, PAYMENT-SIGNATURE",
    );

    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }

    next();
  });

  app.get("/health", (_request, response) => {
    response.json(getHealthStatus());
  });

  if (paymentConfig) {
    const paymentAsset = paymentConfig.asset ?? DEVNET_USDC_MINT;
    const paymentPrice =
      paymentConfig.asset && paymentConfig.amount
        ? { asset: paymentConfig.asset, amount: paymentConfig.amount }
        : DEFAULT_PRICE_USD;
    const facilitator = new HTTPFacilitatorClient({
      url: paymentConfig.facilitatorUrl,
    });
    const resourceServer = new x402ResourceServer(facilitator).register(
      SOLANA_NETWORK,
      new ExactSvmScheme(),
    );

    app.use(
      paymentMiddleware(
        {
          "GET /v1/protected/status": {
            accepts: [
              {
                scheme: "exact",
                price: paymentPrice,
                network: SOLANA_NETWORK,
                payTo: paymentConfig.payTo,
              },
            ],
            description: "AgentPay protected service status",
            mimeType: "application/json",
          },
        },
        resourceServer,
      ),
    );

    app.get("/v1/protected/status", (_request, response) => {
      response.json({
        service: "agentpay-api",
        access: "paid",
        protocol: "x402-v2",
        network: SOLANA_NETWORK,
        asset: paymentAsset,
      });
    });
  }

  return app;
}
