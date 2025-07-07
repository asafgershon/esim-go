import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import cors from "cors";
import express from "express";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";
import { WebSocketServer } from "ws";
import {
  authDirectiveTransformer,
  authDirectiveTypeDefs,
} from "./auth.directive";
import { useServer } from "graphql-ws/use/ws";
import { getSupabaseToken, getSupabaseTokenFromConnectionParams, createSupabaseAuthContext } from "./context/supabase-auth";
import { resolvers } from "./resolvers";
import { awsSMS, otpService } from "./services";
import type { Context as WSContext } from "graphql-ws";

const typeDefs = `
${authDirectiveTypeDefs}
${readFileSync(join(__dirname, "../../../schema.graphql"), "utf-8")}
`;

async function startServer() {
  try {
    // Create the schema
    const executableSchema = makeExecutableSchema({ typeDefs, resolvers });
    const schemaWithDirectives = authDirectiveTransformer(executableSchema);

    // TODO: Initialize Redis and PubSub for eSIM Go
    // const redis = await getRedis();
    // const pubsub = await getPubSub();

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
          const connectionParams = ctx.connectionParams as Record<string, any> | undefined;
          const token = getSupabaseTokenFromConnectionParams(connectionParams);
          
          // Create Supabase auth context
          const auth = await createSupabaseAuthContext(token);

          return {
            auth,
            services: {
              // TODO: Add services for eSIM Go
              // redis, 
              // pubsub
              sms: awsSMS,
              otp: otpService,
            },
            repositories: {
              // TODO: Add eSIM Go repositories
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
      ],
    });

    await server.start();

    // Set up our Express middleware to handle CORS, body parsing
    app.use(
      cors({
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
        origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:4000", "https://esim-fe.loca.lt"],
      })
    );

    app.use(express.json({ limit: "50mb" }));

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
              // TODO: Add eSIM Go services
              sms: awsSMS,
              otp: otpService,
            },
            repositories: {
              // TODO: Add eSIM Go repositories
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
      console.log(`🚀 eSIM Go Server is now running on http://localhost:${PORT}/graphql`);
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
