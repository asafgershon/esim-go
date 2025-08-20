import { cleanEnv, str, url } from "envalid";

const isTestEnvironment =
  process.env.NODE_ENV === "test" || process.env.VITEST === "true";

export const env = cleanEnv(process.env, {
  // Main API URL
  EASYCARD_API_URL: url({
    // default: "https://ecng-transactions.azurewebsites.net",
    default: "https://api.e-c.co.il",
  }),

  // Identity server URL for OAuth tokens
  EASYCARD_IDENTITY_URL: url({
    default: "https://identity.e-c.co.il",
  }),

  // Terminal ID for payments
  EASYCARD_TERMINAL_ID: str({}),

  // Webhook signature secret
  EASYCARD_WEBHOOK_SECRET: str({
    default: isTestEnvironment
      ? "test-webhook-secret"
      : "very-secret-webhook-secret",
  }),

  // Environment mode
  EASYCARD_ENVIRONMENT: str({
    choices: ["test", "development", "production"],
    default: "development",
  }),

  EASYCARD_MODE: str({
    choices: ["test", "production", "development"],
    default: "test",
  }),

  // Private API key (for OAuth)
  EASY_CARD_PRIVATE_API_KEY: str({
    default: isTestEnvironment ? "test-private-api-key" : undefined,
  }),
});
