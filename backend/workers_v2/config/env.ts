import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

export const config = {
  db: {
    supabaseUrl: process.env.SUPABASE_URL ?? "",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  },
  esimgo: {
    apiKey: process.env.ESIM_GO_API_KEY ?? "",
    baseUrl: process.env.ESIM_GO_BASE_URL ?? "https://api.esim-go.com/v2.5",
    retryAttempts: Number(process.env.ESIM_GO_RETRY_ATTEMPTS ?? 3),
  },
  maya: {
    apiKey: process.env.MAYA_API_KEY ?? "",
    apiSecret: process.env.MAYA_API_SECRET ?? "",
    baseUrl: "https://api.maya.net/connectivity/v1/account/products",
  },
};
