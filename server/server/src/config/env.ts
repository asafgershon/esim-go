import { cleanEnv, str, port, bool, num } from "envalid";

export const env = cleanEnv(process.env, {
  // Server Configuration
  PORT: port({ default: 4000 }),
  NODE_ENV: str({ choices: ["development", "test", "production"], default: "development" }),
  
  // Supabase Configuration
  SUPABASE_URL: str(),
  SUPABASE_ANON_KEY: str(),
  SUPABASE_SERVICE_ROLE_KEY: str(),
  
  // eSIM Go API Configuration
  ESIM_GO_API_KEY: str(),
  ESIM_GO_BASE_URL: str({ default: "https://api.esim-go.com/v2.5" }),
  ESIM_GO_WEBHOOK_SECRET: str({ default: "" }),
  ESIM_GO_MODE: str({ choices: ["mock", "production"], default: "mock" }),
  
  // Redis Configuration
  REDIS_HOST: str({ default: "localhost" }),
  REDIS_PORT: port({ default: 6379 }),
  REDIS_USER: str({ default: "default" }),
  REDIS_PASSWORD: str({ default: "mypassword" }),
  
  // JWT Configuration
  JWT_SECRET: str({ default: "your-jwt-secret" }),
  CHECKOUT_JWT_SECRET: str({ default: "secret-string" }),
  
  // Email Configuration
  EMAIL_MODE: str({ choices: ["mock", "ses"], default: "mock" }),
  AWS_REGION: str({ default: "us-east-1" }),
  AWS_ACCESS_KEY_ID: str({ default: "" }),
  AWS_SECRET_ACCESS_KEY: str({ default: "" }),
  SES_EMAIL_DOMAIN: str({ default: "hiiloworld.com" }),
  SES_FROM_EMAIL: str({ default: "" }),
  SES_CONFIGURATION_SET: str({ default: "" }),
  
  // EasyCard Payment Configuration
  EASYCARD_API_KEY: str({ default: "" }),
  EASYCARD_IDENTITY_URL: str({ default: "https://identity.e-c.co.il" }),
  EASYCARD_API_KEY: str({ default: "" }),
  EASYCARD_API_URL: str({ default: "https://ecng-transactions.azurewebsites.net" }),
  EASYCARD_MERCHANT_URL: str({ default: "https://ecng-merchant.azurewebsites.net" }),
  EASYCARD_IDENTITY_URL: str({ default: "https://ecng-identity.azurewebsites.net" }),
  EASYCARD_TERMINAL_ID: str({ default: "" }),
  EASYCARD_WEBHOOK_SECRET: str({ default: "" }),
  EASYCARD_MODE: str({ choices: ["test", "production"], default: "test" }),
  EASYCARD_ENVIRONMENT: str({ choices: ["test", "production"], default: "test" }),
  
  // URLs
  DASHBOARD_URL: str({ default: "http://localhost:3000" }),
  
  // Logging
  LOG_LEVEL: str({ 
    choices: ["trace", "debug", "info", "warn", "error", "fatal"], 
    default: "info" 
  }),
});

export type Env = typeof env;