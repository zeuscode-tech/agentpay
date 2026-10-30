import express, { type Express } from "express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactSvmScheme } from "@x402/svm/exact/server";

import {
  DEFAULT_PRICE_USD,
  DEVNET_USDC_MINT,
  SOLANA_NETWORK,
} from "@agentpay/config";

import {
  createSummarizer,
  summaryRequestSchema,
  type Summarizer,
  type SummaryRequest,
} from "./summarizer.js";

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

export function createApp(
  paymentConfig?: PaymentConfig,
  summarizer: Summarizer = createSummarizer(),
): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));

  app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader(
      "Access-Control-Expose-Headers",
      "PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-PAYMENT-RESPONSE",
    );
    response.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, PAYMENT-SIGNATURE, X-PAYMENT, Access-Control-Expose-Headers",
    );
    response.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS",
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

    app.post("/v1/tools/summarize", (request, response, next) => {
      const parsed = summaryRequestSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "invalid_summary_request",
          details: parsed.error.issues.map(issue => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
        return;
      }

      response.locals.summaryRequest = parsed.data;
      next();
    });

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
          "POST /v1/tools/summarize": {
            accepts: [
              {
                scheme: "exact",
                price: paymentPrice,
                network: SOLANA_NETWORK,
                payTo: paymentConfig.payTo,
              },
            ],
            description: "Summarize text after an x402 payment",
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

    app.post("/v1/tools/summarize", async (_request, response) => {
      const summaryRequest = response.locals.summaryRequest as SummaryRequest;
      const result = await summarizer.summarize(summaryRequest);

      response.json({
        tool: "text-summarizer",
        ...result,
        inputCharacters: summaryRequest.text.length,
        outputCharacters: result.summary.length,
      });
    });
  }

  return app;
}
