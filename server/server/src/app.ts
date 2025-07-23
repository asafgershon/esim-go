import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { makeExecutableSchema } from "@graphql-tools/schema";
import cors from "cors";
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
import {
  createSupabaseAuthContext,
  getSupabaseToken,
  getSupabaseTokenFromConnectionParams,
} from "./context/supabase-auth";
import {
  CatalogueDataSource,
  CountriesDataSource,
  ESIMsDataSource,
  OrdersDataSource,
  RegionsDataSource,
  InventoryDataSource,
  PricingDataSource,
} from "./datasources/esim-go";
import { resolvers } from "./resolvers";
import { getRedis, handleESIMGoWebhook } from "./services";
import { getPubSub } from "./context/pubsub";
// import { CatalogSyncService } from "./services/catalog-sync.service";
import { CatalogSyncServiceV2 } from "./services/catalog-sync-v2.service";
import {
  CheckoutSessionRepository,
  OrderRepository,
  ESIMRepository,
  UserRepository,
  HighDemandCountryRepository,
  SyncJobRepository,
} from "./repositories";
import { TripRepository } from "./repositories/trips/trip.repository";
import { cleanEnv, port, str } from "envalid";
import { logger } from "./lib/logger";

const typeDefs = `
${authDirectiveTypeDefs}
${readFileSync(join(__dirname, "../schema.graphql"), "utf-8")}
`;

const env = cleanEnv(process.env, {
  PORT: port({ default: 4000 }),
  CORS_ORIGINS: str({ default: "http://localhost:3000" }),
  ESIM_GO_API_KEY: str({ desc: "eSIM Go API key for V2 sync service" }),
});

async function startServer() {
  try {
    // Create the schema
    const executableSchema = makeExecutableSchema({ typeDefs, resolvers });
    const schemaWithDirectives = authDirectiveTransformer(executableSchema);

    // Redis is now configured at Apollo Server level for caching
    const redis = await getRedis();
    
    // Initialize PubSub for WebSocket subscriptions
    const pubsub = await getPubSub(redis);

    // Initialize repositories
    const checkoutSessionRepository = new CheckoutSessionRepository();
    const orderRepository = new OrderRepository();
    const esimRepository = new ESIMRepository();
    const userRepository = new UserRepository();
    const tripRepository = new TripRepository();
    const highDemandCountryRepository = new HighDemandCountryRepository();
    const syncJobRepository = new SyncJobRepository();

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

          return {
            auth,
            services: {
              redis,
              pubsub,
            },
            repositories: {
              checkoutSessions: checkoutSessionRepository,
              orders: orderRepository,
              esims: esimRepository,
              users: userRepository,
              trips: tripRepository,
              highDemandCountries: highDemandCountryRepository,
              syncJob: syncJobRepository,
            },
            dataSources: {
              catalogue: new CatalogueDataSource({ cache: redis }),
              orders: new OrdersDataSource({ cache: redis }),
              esims: new ESIMsDataSource({ cache: redis }),
              countries: new CountriesDataSource({ cache: redis }),
              regions: RegionsDataSource,
              inventory: new InventoryDataSource({ cache: redis }),
              pricing: new PricingDataSource({ cache: redis }),
            },
            // Legacy support
            token,
          };
        },
      },
      wsServer
    );

    // Set up ApolloServer
    const server = new ApolloServer({
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
        logger.error("GraphQL Error:", error as Error, { code: formattedError.extensions?.code as string, path: formattedError.path, extensions: formattedError.extensions });
        return formattedError;
      },
    });

    await server.start();

    // Set up our Express middleware to handle CORS, body parsing
    app.use(
      cors({
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
        origin: env.CORS_ORIGINS.split(","),
        credentials: true,
      })
    );

    app.use(express.json({ limit: "50mb" }));

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

          return {
            auth,
            services: {
              redis,
              pubsub,
            },
            repositories: {
              checkoutSessions: checkoutSessionRepository,
              orders: orderRepository,
              esims: esimRepository,
              users: userRepository,
              trips: tripRepository,
              highDemandCountries: highDemandCountryRepository,
              syncJob: syncJobRepository,
            },
            dataSources: {
              catalogue: new CatalogueDataSource({ cache: redis }),
              orders: new OrdersDataSource({ cache: redis }),
              esims: new ESIMsDataSource({ cache: redis }),
              countries: new CountriesDataSource({ cache: redis }),
              regions: RegionsDataSource,
              inventory: new InventoryDataSource({ cache: redis }),
              pricing: new PricingDataSource({ cache: redis }),
            },
            // Legacy support
            req,
            token,
          };
        },
      })
    );

    const PORT = process.env.PORT || 4000;

    // Now that our HTTP server is fully set up, we can listen to it
    httpServer.listen(PORT, async () => {
      logger.info("eSIM Go Server is ready", {
        httpEndpoint: `http://localhost:${PORT}/graphql`,
        wsEndpoint: `ws://localhost:${PORT}/graphql`,
        port: PORT,
        operationType: "server-startup",
      });

      // Start catalog sync service V2
      // Note: The actual sync will be performed by the worker system
      // This just creates jobs in the database for workers to process
      const catalogueDataSource = new CatalogueDataSource({ cache: redis });
      // Commenting out old sync service to prevent conflicts
      // const catalogSyncService = new CatalogSyncService(catalogueDataSource, redis);
      // catalogSyncService.startPeriodicSync();
      
      // Initialize V2 sync service (for creating jobs)
      const catalogSyncServiceV2 = new CatalogSyncServiceV2(env.ESIM_GO_API_KEY);
      logger.info("Catalog Sync Service V2 initialized", {
        component: "CatalogSyncServiceV2",
        operationType: "startup"
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

// Add memory monitoring and crash prevention
let memoryWarningLogged = false;

setInterval(() => {
  const usage = process.memoryUsage();
  const memoryMB = usage.rss / 1024 / 1024;

  // Log memory usage every 5 minutes
  if (Date.now() % (5 * 60 * 1000) < 30000) {
  }

  // Warn if memory usage is high (>500MB)
  if (memoryMB > 500 && !memoryWarningLogged) {
    logger.warn("High memory usage detected", {
      memoryMB: memoryMB.toFixed(2),
      threshold: 500,
      operationType: "memory-warning",
    });
    memoryWarningLogged = true;
  }

  // Reset warning flag if memory drops
  if (memoryMB < 300) {
    memoryWarningLogged = false;
  }
}, 30000); // Check every 30 seconds

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
