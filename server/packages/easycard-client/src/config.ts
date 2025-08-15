import { cleanEnv, str, url } from "envalid";

const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

export const env = cleanEnv(process.env, {
  // API Key for EasyCard API
  EASYCARD_API_KEY: str({ 
    default: isTestEnvironment ? 'test-api-key' : undefined,
  }),
  
  // Main API URL
  EASYCARD_API_URL: url({
    default: "https://ecng-transactions.azurewebsites.net",
  }),
  
  // Identity server URL for OAuth tokens
  EASYCARD_IDENTITY_URL: url({
    default: "https://identity.e-c.co.il",
  }),
  
  // Terminal ID for payments
  EASYCARD_TERMINAL_ID: str({
    default: isTestEnvironment ? 'test-terminal-id' : undefined,
  }),
  
  // Webhook signature secret
  EASYCARD_WEBHOOK_SECRET: str({
    default: isTestEnvironment ? 'test-webhook-secret' : 'very-secret-webhook-secret'
  }),
  
  // Environment mode
  EASYCARD_ENVIRONMENT: str({ 
    choices: ["test", "development", "production"],
    default: isTestEnvironment ? 'test' : 'development',
  }),
  
  // Private API key (for OAuth)
  EASY_CARD_PRIVATE_API_KEY: str({
    default: isTestEnvironment ? 'test-private-api-key' : undefined,
  }),
});
