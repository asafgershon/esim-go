// backend/server/src/app.ts

import dotenv from "dotenv";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: join(__dirname, "../.env") });

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { AirHaloClient } from "@hiilo/airalo";
import { ESimGoClient } from "@hiilo/esim-go";
import { cleanEnv, port, str } from "envalid";
import express from "express";
import type { Context as WSContext } from "graphql-ws";
import { useServer } from "graphql-ws/use/ws";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import {
  authDirectiveTransformer,
  authDirectiveTypeDefs,
} from "./auth.directive";
import { getPubSub } from "./context/pubsub";
import {
  createSupabaseAuthContext,
  getSupabaseToken,
  getSupabaseTokenFromConnectionParams,
  supabaseAdmin,
} from "./context/supabase-auth";
import { createPricingDataLoader } from "./dataloaders/pricing-dataloader";
import {
  CatalogueDataSourceV2,
  ESIMsDataSource,
  InventoryDataSource,
  OrdersDataSource,
  PricingDataSource,
  RegionsDataSource,
} from "./datasources/esim-go";
import { logger } from "./lib/logger";
import {
  BundleRepository,
  CheckoutSessionRepository,
  CouponRepository,
  ESIMRepository,
  HighDemandCountryRepository,
  OrderRepository,
  SyncJobRepository,
  TenantRepository,
  UserRepository,
} from "./repositories";
import { StrategiesRepository } from "./repositories/strategies.repository";
import { TripRepository } from "./repositories/trip.repository";
import { resolvers } from "./resolvers";
import { getRedis, handleESIMGoWebhook } from "./services";
import { CatalogSyncServiceV2 } from "./services/catalog-sync-v2.service";
import { checkoutSessionService } from "./services/checkout";
import { checkoutWorkflow } from "./services/checkout/workflow";
import { DeliveryService, SESEmailService } from "./services/delivery";
import { paymentService } from "./services/payment";
import { calculateSimplePrice } from "../../packages/rules-engine-2/src/simple-pricer/simple-pricer";
import { createPaymentIntent, type ICreatePaymentParams, getTransactionStatus,type ITransactionStatusResponse } from "../../apis/easycard/src";
const mainSchema = readFileSync(join(__dirname, "../schema.graphql"), "utf-8");
import path from "path";
import fs from "fs";
const rulesEngineSchema = readFileSync(
  join(__dirname, "../../packages/rules-engine-2/schema.graphql"),
  "utf-8"
);
const airHaloSchema = readFileSync(
  join(__dirname, "../schemas/airhalo.graphql"),
  "utf-8"
);
const pricingManagementSchema = readFileSync(
  join(__dirname, "../schemas/pricing-management.graphql"),
  "utf-8"
);

const typeDefs = mergeTypeDefs([
  authDirectiveTypeDefs,
  mainSchema,
  rulesEngineSchema,
  airHaloSchema,
  pricingManagementSchema,
]);

const env = cleanEnv(process.env, {
  PORT: port({ default: 4000 }),
  CORS_ORIGINS: str({
    default:
      "http://localhost:3000,https://www.hiiloworld.com,https://hiiloworld.com,https://demo.hiiloworld.com",
  }),
  ESIM_GO_API_KEY: str(),
  AIRHALO_CLIENT_ID: str({ default: "" }),
  AIRHALO_CLIENT_SECRET: str({ default: "" }),
  AIRHALO_BASE_URL: str({ default: "https://api.airalo.com" }),
  EASY_CARD_PRIVATE_API_KEY: str(),
  EASYCARD_TERMINAL_ID: str(),
  EASY_CARD_REDIRECT_URL: str(),
});

async function startServer() {
  try {
    const executableSchema = makeExecutableSchema({ typeDefs, resolvers });
    const schemaWithDirectives = authDirectiveTransformer(executableSchema);

    const redis = await getRedis();
    const pubsub = await getPubSub(redis);

    const esimGoClient = new ESimGoClient({
      apiKey: env.ESIM_GO_API_KEY,
      baseUrl: "https://api.esim-go.com/v2.5",
      retryAttempts: 3,
    });

    let airHaloClient: AirHaloClient | undefined;
    if (env.AIRHALO_CLIENT_ID && env.AIRHALO_CLIENT_SECRET) {
      airHaloClient = new AirHaloClient({
        clientId: env.AIRHALO_CLIENT_ID,
        clientSecret: env.AIRHALO_CLIENT_SECRET,
        baseUrl: env.AIRHALO_BASE_URL,
        timeout: 30000,
      });
    }

    const userRepository = new UserRepository();
    paymentService.init();

    const bundleRepository = new BundleRepository();
    const couponRepository = new CouponRepository(supabaseAdmin);
    const deliveryService = new DeliveryService(new SESEmailService());
    const orderRepository = new OrderRepository();
    const esimRepository = new ESIMRepository();

    const checkoutSessionRepository = new CheckoutSessionRepository();
    const tripRepository = new TripRepository();
    const highDemandCountryRepository = new HighDemandCountryRepository();
    const syncJobRepository = new SyncJobRepository();
    const tenantRepository = new TenantRepository(supabaseAdmin);
    const strategiesRepository = new StrategiesRepository();

    const [checkoutSessionServiceV2, checkoutWorkflowService] =
      await Promise.all([
        checkoutSessionService.init({ redis, bundleRepository, checkoutSessionRepository }),
        checkoutWorkflow.init({
          pubsub,
          sessionService: checkoutSessionService,
          userRepository,
          esimAPI: esimGoClient,
          paymentAPI: paymentService,
          bundleRepository,
          deliveryService,
          orderRepository,
          esimRepository,
          couponRepository,
        }),
      ]);

    const app = express();
    const httpServer = createServer(app);

    // 🟣 GraphQL WebSocket Server
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: "/graphql",
    });

    const serverCleanup = useServer(
      {
        schema: schemaWithDirectives,
        context: async (ctx: WSContext) => {
          const connectionParams =
            ctx.connectionParams as Record<string, any> | undefined;
          const token = getSupabaseTokenFromConnectionParams(connectionParams);
          const auth = await createSupabaseAuthContext(token);

          const baseContext = {
            auth,
            services: {
              redis,
              pubsub,
              db: supabaseAdmin,
              syncs: new CatalogSyncServiceV2(env.ESIM_GO_API_KEY),
              esimGoClient,
              airHaloClient,
              easycardPayment: paymentService,
              checkoutSessionServiceV2,
              checkoutWorkflow: checkoutWorkflowService,
              deliveryService,
            },
            repositories: {
              checkoutSessions: checkoutSessionRepository,
              orders: orderRepository,
              esims: esimRepository,
              users: userRepository,
              trips: tripRepository,
              highDemandCountries: highDemandCountryRepository,
              syncJob: syncJobRepository,
              bundles: bundleRepository,
              tenants: tenantRepository,
              strategies: strategiesRepository,
              coupons: couponRepository,
            },
            dataSources: {
              catalogue: new CatalogueDataSourceV2(env.ESIM_GO_API_KEY),
              orders: new OrdersDataSource({ cache: redis }),
              esims: new ESIMsDataSource({ cache: redis }),
              regions: RegionsDataSource,
              inventory: new InventoryDataSource({ cache: redis }),
              pricing: new PricingDataSource({ cache: redis }),
            },
            token,
          };

          return {
            ...baseContext,
            dataLoaders: { pricing: createPricingDataLoader(baseContext) },
          };
        },
      },
      wsServer
    );

    // 🟣 Apollo Server
    const server = new ApolloServer({
      schema: schemaWithDirectives,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              },
            };
          },
        },
      ],
    });

    await server.start();

    // 🟢 Express Middleware
    const allowedOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());
    app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
      }
      if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type,Authorization"
        );
        return res.sendStatus(204);
      }
      next();
    });

    app.use(express.json());

    // 🩺 Health Check
    app.get("/health", (_, res) => res.json({ status: "ok" }));

    // 🧾 Webhook: ESIM-GO
    app.post("/webhooks/esim-go", async (req, res) => {
      try {
        const signature = req.headers["x-esim-go-signature"] as string;
        await handleESIMGoWebhook(req.body, signature);
        res.json({ success: true });
      } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
      }
    });

    // 💰 Simple Pricing Endpoint
    app.get("/api/calculate-price", async (req, res) => {
      console.log("[API] SIMPLE PRICER:", req.query);
      const { countryId, numOfDays } = req.query;
      if (typeof countryId !== "string" || typeof numOfDays !== "string") {
        return res
          .status(400)
          .json({ error: "Missing or invalid countryId or numOfDays" });
      }
      const days = parseInt(numOfDays, 10);
      try {
        const simplePriceResult = await calculateSimplePrice(countryId, days);
        res.status(200).json({
          finalPrice: simplePriceResult.finalPrice,
          totalPrice: simplePriceResult.finalPrice,
          hasDiscount: simplePriceResult.calculation.totalDiscount > 0,
          discountAmount: simplePriceResult.calculation.totalDiscount,
          days: simplePriceResult.requestedDays,
          currency: "USD",
        });
      } catch (error) {
        console.error("Simple pricing engine failed:", error);
        res.status(500).json({ error: "Failed to calculate price" });
      }
    });
// 💳 Webhook: EasyCard → שמירה ב-Supabase Storage
app.post("/webhooks/easycard", async (req, res) => {
  try {
    const eventID = req.body?.eventID || `unknown-${Date.now()}`;
    const fileName = `easycard/${eventID}.json`;

    const logData = {
      received_at: new Date().toISOString(),
      headers: req.headers,
      body: req.body,
    };

    const { error } = await supabaseAdmin.storage
      .from("logs")
      .upload(fileName, JSON.stringify(logData, null, 2), {
        contentType: "application/json",
        upsert: false,
      });

    if (error) throw error;

    console.log(`✅ [EasyCard] Webhook saved to Supabase: ${fileName}`);
    res.status(200).send("ok");
  } catch (err) {
    console.error("❌ [EasyCard] Error saving webhook:", err);
    res.status(500).send("error");
  }
});

    app.post("/api/payment/create-intent", async (req, res) => {
    try {
      // 1. ולידציה בסיסית לקלט מהפרונטאנד
      const { amount, items, email } = req.body;
      if (!amount || typeof amount !== 'number' || !items || !Array.isArray(items) || items.length === 0) {
        logger.warn('Invalid create-intent request', { body: req.body });
        return res.status(400).json({ error: "Missing or invalid 'amount' or 'items' in request body" });
      }

      logger.info(`[Easycard] Creating payment intent for ${amount} ILS...`);

      // 2. הכנת הפרמטרים לשליחה לשירות
      // זו הכתובת שאליה הלקוח יחזור אחרי התשלום
      const redirectUrl = `${env.EASY_CARD_REDIRECT_URL}/payment-return`; 
      
      const paymentParams: ICreatePaymentParams = {
          amount: amount,
          items: items, // מעבירים את רשימת הפריטים כפי שהגיעה מהפרונטאנד
          terminalID: env.EASYCARD_TERMINAL_ID, // קורא מה-env
          redirectUrl: redirectUrl,
           email: email || null,
      };
      
      // 3. קריאה ל"ארגז הכלים" (השירות שיצרנו)
      const paymentResponse = await createPaymentIntent(paymentParams);

      // 4. שליחת ה-URL לתשלום בחזרה לפרונטאנד
      logger.info(`[Easycard] Payment URL created successfully.`);
      res.json({
          paymentUrl: paymentResponse.additionalData.url
      });

    } catch (error: any) {
      logger.error('[Easycard] Failed to create payment intent', error);
      res.status(500).json({ 
        message: "Failed to create payment intent.", 
        error: error.message 
      });
    }
  });

  app.post("/api/payment/verify", async (req, res) => {
    try {
      // 1. קבלת ה-transactionID מגוף הבקשה
      const { transactionID } = req.body;
      if (!transactionID || typeof transactionID !== 'string') {
        logger.warn('[Easycard] Invalid verify request', { body: req.body });
        return res.status(400).json({ 
          success: false,
          error: "Missing or invalid 'transactionID' in request body" 
        });
      }

      logger.info(`[Easycard] Verifying payment for transactionID: ${transactionID}...`);

      // 2. קריאה ל"ארגז הכלים" (השירות שיצרנו)
      const statusResponse = await getTransactionStatus(transactionID);

      // 3. בדיקת הסטטוס שהתקבל מ-Easycard
      //    (ודא שהסטטוס "Approved" הוא הסטטוס הנכון להצלחה)
      if (statusResponse.status === "Approved") {
        
        // ✅ הצלחה! התשלום אומת
        logger.info(`[Easycard] SUCCESS: Transaction ${transactionID} is Approved.`);

        // ----------------------------------------------------
        // ⚠️ כאן המקום להפעיל את הלוגיקה העסקית שלך! ⚠️
        //
        // זה הרגע לקרוא ל-API של מאיה לשליחת ה-eSIM
        // ולעדכן את ההזמנה אצלך בדאטהבייס.
        // 
        // לדוגמה (קוד רעיוני):
        // await mayaApiService.sendESIM(statusResponse.orderReference); 
        // await database.orders.update(statusResponse.orderId, { status: "PAID" });
        //
        // ----------------------------------------------------

        // 4. החזרת תשובת הצלחה לפרונטאנד
        res.json({
          success: true,
          message: "Payment verified successfully.",
          status: statusResponse.status
        });

      } else {
        // ❌ כישלון! התשלום לא אומת (נדחה, נכשל, עדיין בהמתנה וכו')
        logger.warn(`[Easycard] FAILED: Transaction ${transactionID} status is: ${statusResponse.status}`, { response: statusResponse });

        // 4. החזרת תשובת כישלון לפרונטאנד
        res.status(400).json({ 
          success: false,
          message: `Payment not approved. Status: ${statusResponse.status}`,
          status: statusResponse.status
        });
      }

    } catch (error: any) {
      logger.error('[Easycard] Failed to verify payment', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to verify payment.", 
        error: error.message 
      });
    }
  });

  /*
app.get("/payment/callback", (req, res) => {
  const transactionId = req.query.transactionID as string;
  const code = req.query.code as string;

  if (!transactionId) {
    return res.redirect("/checkout/failure?reason=missing_transaction_id");
  }

  // שולחים ללקוח redirect מהיר
  if (code === "0") {
    console.log(`[CALLBACK] code=0, immediate success redirect for ${transactionId}`);
    res.redirect(`/checkout/success?transactionId=${transactionId}`);
  } else {
    console.log(`[CALLBACK] code=${code || "none"}, redirecting to pending page`);
    res.redirect(`/checkout?transactionId=${transactionId}&status=pending`);
  }

  // מריצים את האימות ברקע
  checkoutWorkflowService
    .handleRedirectCallback({ easycardTransactionId: transactionId })
    .then((result) => {
      if (result.success) {
        console.log(`[ASYNC CALLBACK] ✅ Order completed for ${transactionId}`);
      } else {
        console.warn(`[ASYNC CALLBACK] ❌ Failed to complete order for ${transactionId}`);
      }
    })
    .catch((error) => {
      console.error(`[ASYNC CALLBACK] 💥 Error processing ${transactionId}:`, error);
    });
});
*/

    // 🟣 GraphQL Endpoint
    app.use(
      "/graphql",
      expressMiddleware(server, {
        context: async ({ req }) => {
          const token = getSupabaseToken(req);
          const auth = await createSupabaseAuthContext(token);

          const baseContext = {
            auth,
            services: {
              redis,
              pubsub,
              syncs: new CatalogSyncServiceV2(env.ESIM_GO_API_KEY),
              esimGoClient,
              airHaloClient,
              easycardPayment: paymentService,
              db: supabaseAdmin,
              checkoutSessionServiceV2,
              checkoutWorkflow: checkoutWorkflowService,
              deliveryService,
            },
            repositories: {
              checkoutSessions: checkoutSessionRepository,
              orders: orderRepository,
              esims: esimRepository,
              users: userRepository,
              trips: tripRepository,
              highDemandCountries: highDemandCountryRepository,
              syncJob: syncJobRepository,
              bundles: bundleRepository,
              tenants: tenantRepository,
              strategies: strategiesRepository,
              coupons: couponRepository,
            },
            dataSources: {
              catalogue: new CatalogueDataSourceV2(env.ESIM_GO_API_KEY),
              orders: new OrdersDataSource({ cache: redis }),
              esims: new ESIMsDataSource({ cache: redis }),
              regions: RegionsDataSource,
              inventory: new InventoryDataSource({ cache: redis }),
              pricing: new PricingDataSource({ cache: redis }),
            },
            req,
            token,
          };

          return {
            ...baseContext,
            dataLoaders: { pricing: createPricingDataLoader(baseContext) },
          };
        },
      })
    );

    const PORT = env.PORT;
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server", error as Error);
    process.exit(1);
  }
}

startServer();
