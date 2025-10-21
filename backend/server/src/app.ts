// backend/server/src/app.ts

import dotenv from "dotenv";
import { join } from "node:path";

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

const mainSchema = readFileSync(join(__dirname, "../schema.graphql"), "utf-8");
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
      "http://localhost:3000,https://www.hiiloworld.com,https://hiiloworld.com",
  }),
  ESIM_GO_API_KEY: str(),
  AIRHALO_CLIENT_ID: str({ default: "" }),
  AIRHALO_CLIENT_SECRET: str({ default: "" }),
  AIRHALO_BASE_URL: str({ default: "https://api.airalo.com" }),
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

    const [checkoutSessionServiceV2, checkoutWorkflowService] =
      await Promise.all([
        checkoutSessionService.init({ redis, bundleRepository }),
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

    const checkoutSessionRepository = new CheckoutSessionRepository();
    const tripRepository = new TripRepository();
    const highDemandCountryRepository = new HighDemandCountryRepository();
    const syncJobRepository = new SyncJobRepository();
    const tenantRepository = new TenantRepository(supabaseAdmin);
    const strategiesRepository = new StrategiesRepository();

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
    const allowedOrigins = env.CORS_ORIGINS.split(",");
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
