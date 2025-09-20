import dotenv from "dotenv";

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
import { join } from "node:path";
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
import { paymentService } from "./services/payment";
import { checkoutSessionService } from "./services/checkout";
import { checkoutWorkflow } from "./services/checkout/workflow";
import { DeliveryService, SESEmailService } from "./services/delivery";

// Load and merge schemas
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
  PORT: port({ default: 5001 }),
  CORS_ORIGINS: str({ default: "http://localhost:3000" }),
  ESIM_GO_API_KEY: str({ desc: "eSIM Go API key for V2 sync service" }),
  AIRHALO_CLIENT_ID: str({
    default: "",
    desc: "AirHalo API client ID (optional)",
  }),
  AIRHALO_CLIENT_SECRET: str({
    default: "",
    desc: "AirHalo API client secret (optional)",
  }),
  AIRHALO_BASE_URL: str({
    default: "https://api.airalo.com",
    desc: "AirHalo API base URL",
  }),
});

async function startServer() {
  try {
    // Create the schema
    const executableSchema = makeExecutableSchema({ typeDefs, resolvers });
    const schemaWithDirectives = authDirectiveTransformer(executableSchema);

    const redis = await getRedis();
    const pubsub = await getPubSub(redis);

    // Initialize eSIM Go client
    const esimGoClient = new ESimGoClient({
      apiKey: env.ESIM_GO_API_KEY,
      baseUrl: "https://api.esim-go.com/v2.5",
      retryAttempts: 3,
    });

    // Initialize AirHalo client (optional)
    let airHaloClient: AirHaloClient | undefined;
    if (env.AIRHALO_CLIENT_ID && env.AIRHALO_CLIENT_SECRET) {
      console.log("Initializing AirHalo client...");
      airHaloClient = new AirHaloClient({
        clientId: env.AIRHALO_CLIENT_ID,
        clientSecret: env.AIRHALO_CLIENT_SECRET,
        baseUrl: env.AIRHALO_BASE_URL,
        timeout: 30000,
      });
      console.log("✅ AirHalo client initialized successfully");
    } else {
      console.log(
        "⚠️ AirHalo credentials not provided - AirHalo features will be disabled"
      );
    }

    const userRepository = new UserRepository();

    paymentService.init();

    const bundleRepository = new BundleRepository();
    const deliveryService = new DeliveryService(new SESEmailService());
    const orderRepository = new OrderRepository();
    const esimRepository = new ESIMRepository();

    // Initialize Easycard payment service (optional)
    const [checkoutSessionServiceV2, checkoutWorkflowService] =
      await Promise.all([
        checkoutSessionService.init({ redis }),
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
        }),
      ]);

    // Initialize repositories
    const checkoutSessionRepository = new CheckoutSessionRepository();
    const tripRepository = new TripRepository();
    const highDemandCountryRepository = new HighDemandCountryRepository();
    const syncJobRepository = new SyncJobRepository();
    const tenantRepository = new TenantRepository(supabaseAdmin);
    const strategiesRepository = new StrategiesRepository();

    // Create an Express app and HTTP server
    const app = express();
    const httpServer = createServer(app);

    // Create our WebSocket server using the HTTP server we just set up
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: "/graphql",
      autoPong: true,
      clientTracking: true,
    });

    // Save the returned server's info so we can shutdown this server later
    const serverCleanup = useServer(
      {
        schema: schemaWithDirectives,
        context: async (ctx: WSContext) => {
          // Extract token from connection params
          const connectionParams = ctx.connectionParams as
            | Record<string, any>
            | undefined;
          const token = getSupabaseTokenFromConnectionParams(connectionParams);

          // Create Supabase auth context
          const auth = await createSupabaseAuthContext(token);

          // Create context with auth for DataLoader
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
              checkoutSessionService: undefined, // Will be initialized lazily in resolvers
              checkoutSessionServiceV2: checkoutSessionServiceV2,
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
            },
            dataSources: {
              catalogue: new CatalogueDataSourceV2(env.ESIM_GO_API_KEY),
              orders: new OrdersDataSource({ cache: redis }),
              esims: new ESIMsDataSource({ cache: redis }),
              regions: RegionsDataSource,
              inventory: new InventoryDataSource({ cache: redis }),
              pricing: new PricingDataSource({ cache: redis }),
            },
            // Legacy support
            token,
          };

          return {
            ...baseContext,
            dataLoaders: {
              pricing: createPricingDataLoader(baseContext),
            },
          };
        },
      },
      wsServer
    );
    // Set up ApolloServer
    console.log("Creating ApolloServer instance...");
    let server;
    try {
      server = new ApolloServer({
        schema: schemaWithDirectives,
        introspection: true,
        cache: redis,
        plugins: [
          // Proper shutdown for the HTTP server
          ApolloServerPluginDrainHttpServer({ httpServer }),
          // Proper shutdown for the WebSocket server
          {
            async serverWillStart() {
              return {
                async drainServer() {
                  await serverCleanup.dispose();
                },
              };
            },
          },
          // Add request timeout plugin
          {
            async requestDidStart() {
              const startTime = Date.now();
              return {
                async willSendResponse(requestContext) {
                  // Log slow requests for debugging
                  const duration = Date.now() - startTime;
                  if (duration > 5000) {
                    logger.warn("Slow GraphQL request detected", {
                      duration,
                      operationName: requestContext.request.operationName,
                      operationType: "performance-warning",
                    });
                  }
                },
              };
            },
          },
        ],
        // Add global query timeout
        formatError: (formattedError, error: any) => {
          // Log errors for debugging
          logger.error("GraphQL Error:", error as Error, {
            code: formattedError.extensions?.code as string,
            path: formattedError.path,
            extensions: formattedError.extensions,
          });
          return formattedError;
        },
      });
    } catch (error) {
      console.error("Error creating ApolloServer:", error);
      throw error;
    }
    console.log("ApolloServer created successfully");
    console.log("Starting server");

    await server.start();
    console.log("Server started successfully");

    const allowedOrigins = env.CORS_ORIGINS.split(",").map((origin) =>
      origin.trim()
    );
    logger.info("CORS configuration", {
      allowedOrigins,
      rawCorsOrigins: env.CORS_ORIGINS,
      originCount: allowedOrigins.length,
      operationType: "cors-setup",
    });

    // Set up our Express middleware to handle CORS, body parsing
    // Manually handle CORS because the cors package seems to have issues
    app.use((req, res, next) => {
      const origin = req.headers.origin;

      // Check if origin is allowed
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Vary", "Origin");
      }

      // Handle preflight
      if (req.method === "OPTIONS") {
        res.setHeader(
          "Access-Control-Allow-Methods",
          "GET,POST,PUT,DELETE,OPTIONS,HEAD,PATCH"
        );
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type,Authorization,Accept,x-correlation-id"
        );
        res.setHeader("Access-Control-Max-Age", "86400");
        return res.sendStatus(204);
      }

      next();
    });

    app.use(express.json({ limit: "50mb" }));

    // Add debug middleware to log all requests
    app.use((req, res, next) => {
      logger.info("Incoming request", {
        method: req.method,
        path: req.path,
        url: req.url,
        headers: {
          origin: req.headers.origin,
          host: req.headers.host,
          referer: req.headers.referer,
          "content-type": req.headers["content-type"],
          "access-control-request-method":
            req.headers["access-control-request-method"],
          "access-control-request-headers":
            req.headers["access-control-request-headers"],
        },
        operationType: "request-debug",
      });

      // Log response headers after CORS
      const originalSend = res.send;
      res.send = function (data) {
        logger.info("Response headers", {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          headers: res.getHeaders(),
          operationType: "response-debug",
        });
        return originalSend.call(this, data);
      };

      next();
    });

    // Add global request timeout middleware
    app.use((req, res, next) => {
      // Set timeout for all requests (60 seconds)
      req.setTimeout(60000, () => {
        logger.error("Request timeout", undefined, {
          method: req.method,
          path: req.path,
          operationType: "request-timeout",
        });
        if (!res.headersSent) {
          res.status(408).json({
            error: "Request timeout",
            message: "The request took too long to process",
          });
        }
      });

      res.setTimeout(60000, () => {
        logger.error("Response timeout", undefined, {
          method: req.method,
          path: req.path,
          operationType: "response-timeout",
        });
        res.status(408).json({
          error: "Response timeout",
          message: "The response took too long to send",
        });
      });

      next();
    });

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      });
    });

    // eSIM Go webhook endpoint
    app.post("/webhooks/esim-go", async (req, res) => {
      try {
        const signature = req.headers["x-esim-go-signature"] as string;
        const result = await handleESIMGoWebhook(req.body, signature);
        res.json(result);
      } catch (error: any) {
        logger.error("Webhook error", error as Error, {
          operationType: "webhook",
        });
        res.status(400).json({
          success: false,
          message: error.message || "Webhook processing failed",
        });
      }
    });

    app.use(
      "/graphql",
      expressMiddleware(server, {
        context: async ({ req }) => {
          // Extract token from request headers
          const token = getSupabaseToken(req);

          // Create Supabase auth context
          const auth = await createSupabaseAuthContext(token);

          // Create context with auth for DataLoader
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
              checkoutSessionService: undefined, // Will be initialized lazily in resolvers
              checkoutSessionServiceV2: checkoutSessionServiceV2,
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
              checkoutSessionServiceV2: checkoutSessionServiceV2,
              tenants: tenantRepository,
              strategies: strategiesRepository,
            },
            dataSources: {
              catalogue: new CatalogueDataSourceV2(env.ESIM_GO_API_KEY),
              orders: new OrdersDataSource({ cache: redis }),
              esims: new ESIMsDataSource({ cache: redis }),
              regions: RegionsDataSource,
              inventory: new InventoryDataSource({ cache: redis }),
              pricing: new PricingDataSource({ cache: redis }),
            },
            // Legacy support
            req,
            token,
          };

          return {
            ...baseContext,
            dataLoaders: {
              pricing: createPricingDataLoader(baseContext),
            },
          };
        },
      })
    );

    const PORT = process.env.PORT || 4000;

    // Now that our HTTP server is fully set up, we can listen to it
    httpServer.listen(PORT, async () => {
      logger.info("eSIM Go Server is ready", {
        httpEndpoint: `http://0.0.0.0:${PORT}/graphql`,
        wsEndpoint: `ws://0.0.0.0:${PORT}/graphql`,
        port: PORT,
        operationType: "server-startup",
      });
    });
  } catch (error) {
    logger.error("Failed to start eSIM Go server", error as Error, {
      operationType: "server-startup",
    });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully", {
    operationType: "shutdown",
  });
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully", {
    operationType: "shutdown",
  });
  process.exit(0);
});

startServer().catch((error) => {
  logger.error("Failed to start eSIM Go server", error as Error, {
    operationType: "server-startup",
  });
  process.exit(1);
});

// Handle uncaught exceptions gracefully
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", error as Error, {
    operationType: "uncaught-exception",
  });
  // Don't crash immediately, try to handle gracefully
  setTimeout(() => {
    logger.error("Exiting due to uncaught exception", undefined, {
      operationType: "uncaught-exception",
    });
    process.exit(1);
  }, 1000);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection", reason as Error, {
    promise: promise.toString(),
    operationType: "unhandled-rejection",
  });
  // Don't crash for unhandled rejections, just log them
});
