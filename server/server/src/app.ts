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
} from "./datasources/esim-go";
import { resolvers } from "./resolvers";
import { getRedis, handleESIMGoWebhook, PricingService } from "./services";
import {
  CheckoutSessionRepository,
  OrderRepository,
  ESIMRepository,
  UserRepository,
} from "./repositories";
import { cleanEnv, port, str } from "envalid";
import { logger } from "./lib/logger";

const typeDefs = `
${authDirectiveTypeDefs}
${readFileSync(join(__dirname, "../schema.graphql"), "utf-8")}
`;

const env = cleanEnv(process.env, {
  PORT: port({ default: 4000 }),
  CORS_ORIGINS: str({ default: "http://localhost:3000" }),
});

async function startServer() {
  try {
    // Create the schema
    const executableSchema = makeExecutableSchema({ typeDefs, resolvers });
    const schemaWithDirectives = authDirectiveTransformer(executableSchema);

    // Redis is now configured at Apollo Server level for caching
    const redis = await getRedis();
    
    // Initialize repositories
    const checkoutSessionRepository = new CheckoutSessionRepository();
    const orderRepository = new OrderRepository();
    const esimRepository = new ESIMRepository();
    const userRepository = new UserRepository();
    
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
              // pubsub: getPubSub(redis), // Add when needed
              pricing: PricingService,
            },
            repositories: {
              checkoutSessions: checkoutSessionRepository,
              orders: orderRepository,
              esims: esimRepository,
              users: userRepository,
            },
            dataSources: {
              catalogue: new CatalogueDataSource({ cache: redis }),
              orders: new OrdersDataSource({ cache: redis }),
              esims: new ESIMsDataSource({ cache: redis }),
              countries: new CountriesDataSource({ cache: redis }),
              regions: RegionsDataSource,
              inventory: new InventoryDataSource({ cache: redis }),
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
                  console.warn(
                    `Slow GraphQL request: ${duration}ms for operation ${requestContext.request.operationName}`
                  );
                }
              },
            };
          },
        },
      ],
      // Add global query timeout
      formatError: (formattedError, error) => {
        // Log errors for debugging
        logger.error("GraphQL Error:", {
          message: formattedError.message,
          code: formattedError.extensions?.code,
          path: formattedError.path,
        });
        return formattedError;
      },
    });

    await server.start();

    // Set up our Express middleware to handle CORS, body parsing
    logger.debug("Setting up CORS middleware", {
      origin: env.CORS_ORIGINS.split(","),
    });
    console.log("Setting up CORS middleware", {
      origin: env.CORS_ORIGINS.split(","),
    });

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
        console.error(`Request timeout for ${req.method} ${req.path}`);
        if (!res.headersSent) {
          res.status(408).json({
            error: "Request timeout",
            message: "The request took too long to process",
          });
        }
      });

      res.setTimeout(60000, () => {
        console.error(`Response timeout for ${req.method} ${req.path}`);
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
        console.error("Webhook error:", error);
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
              // pubsub: getPubSub(redis), // Add when needed
              pricing: PricingService,
            },
            repositories: {
              checkoutSessions: checkoutSessionRepository,
              orders: orderRepository,
              esims: esimRepository,
              users: userRepository,
            },
            dataSources: {
              catalogue: new CatalogueDataSource({ cache: redis }),
              orders: new OrdersDataSource({ cache: redis }),
              esims: new ESIMsDataSource({ cache: redis }),
              countries: new CountriesDataSource({ cache: redis }),
              regions: RegionsDataSource,
              inventory: new InventoryDataSource({ cache: redis }),
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
    httpServer.listen(PORT, () => {
      console.log(
        `🚀 eSIM Go Server is now running on http://localhost:${PORT}/graphql`
      );
      console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error("Failed to start eSIM Go server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Received SIGINT. Shutting down gracefully...");
  process.exit(0);
});

startServer().catch((error) => {
  console.error("Failed to start eSIM Go server:", error);
  process.exit(1);
});

// Add memory monitoring and crash prevention
let memoryWarningLogged = false;

setInterval(() => {
  const usage = process.memoryUsage();
  const memoryMB = usage.rss / 1024 / 1024;

  // Log memory usage every 5 minutes
  if (Date.now() % (5 * 60 * 1000) < 30000) {
    console.log(
      `Memory usage: ${memoryMB.toFixed(2)}MB RSS, ${(
        usage.heapUsed /
        1024 /
        1024
      ).toFixed(2)}MB Heap`
    );
  }

  // Warn if memory usage is high (>500MB)
  if (memoryMB > 500 && !memoryWarningLogged) {
    console.warn(
      `HIGH MEMORY USAGE: ${memoryMB.toFixed(2)}MB - potential memory leak`
    );
    memoryWarningLogged = true;
  }

  // Reset warning flag if memory drops
  if (memoryMB < 300) {
    memoryWarningLogged = false;
  }
}, 30000); // Check every 30 seconds

// Handle uncaught exceptions gracefully
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Don't crash immediately, try to handle gracefully
  setTimeout(() => {
    console.error("Exiting due to uncaught exception");
    process.exit(1);
  }, 1000);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't crash for unhandled rejections, just log them
});
