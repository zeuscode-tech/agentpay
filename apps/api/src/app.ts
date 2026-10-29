import express, { type Express } from "express";

import { SOLANA_NETWORK } from "@agentpay/config";

export function getHealthStatus() {
  return {
    service: "agentpay-api",
    status: "ok",
    network: SOLANA_NETWORK,
  } as const;
}

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));

  app.get("/health", (_request, response) => {
    response.json(getHealthStatus());
  });

  return app;
}
