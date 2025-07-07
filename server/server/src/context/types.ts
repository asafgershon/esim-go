import type { User } from "../types";
// TODO: Import eSIM Go specific repositories when implemented
// import * as usersRepository from "./repositories/users.repository";
// import * as esimRepository from "./repositories/esim.repository";
import type { Redis } from "ioredis";
import type { RedisPubSub } from "graphql-redis-subscriptions";
import type { SupabaseAuthContext } from "./supabase-auth";
import type { AWSSMSService, OTPService } from "../services";

export type Context = {
  auth: SupabaseAuthContext;
  services: {
    // db: typeof db; // TODO: Add database service
    redis?: Redis;
    pubsub?: RedisPubSub;
    sms: AWSSMSService;
    otp: OTPService;
  };
  repositories: {
    // users: typeof usersRepository; // TODO: Add user repository
    // esim: typeof esimRepository; // TODO: Add eSIM repository
  };
  // Legacy for backward compatibility during migration
  token?: string;
  req?: any;
};
