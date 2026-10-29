import { createApp } from "./app.js";
import { loadPaymentConfig } from "./env.js";

const port = Number.parseInt(process.env.PORT ?? "4021", 10);
const app = createApp(loadPaymentConfig(process.env));

app.listen(port, "127.0.0.1", () => {
  console.log(`AgentPay API listening on http://127.0.0.1:${port}`);
});
