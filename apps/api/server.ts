import express from "express";

import { createApp } from "./src/app.js";
import { loadPaymentConfig } from "./src/env.js";
import { createSummarizer } from "./src/summarizer.js";

// Keep a direct Express import in the entrypoint so Vercel can identify this
// workspace as a first-class Node backend.
void express;

const app = createApp(
  loadPaymentConfig(process.env),
  createSummarizer(process.env),
);

if (!process.env.VERCEL) {
  const port = Number.parseInt(process.env.PORT ?? "4021", 10);

  app.listen(port, "127.0.0.1", () => {
    console.log(`AgentPay API listening on http://127.0.0.1:${port}`);
  });
}

export default app;
