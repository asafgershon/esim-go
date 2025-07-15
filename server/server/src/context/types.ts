import type { User } from "../types";
import type { Redis } from "ioredis";
import type { RedisPubSub } from "graphql-redis-subscriptions";
import type { SupabaseAuthContext } from "./supabase-auth";
import type {
  CatalogueDataSource,
  OrdersDataSource,
  ESIMsDataSource,
  CountriesDataSource,
  RegionsDataSource,
  InventoryDataSource,
} from "../datasources/esim-go";
import { PricingService } from "../services";
import {
  CheckoutSessionRepository,
  OrderRepository,
  ESIMRepository,
} from "../repositories";

export type Context = {
  auth: SupabaseAuthContext;
  services: {
    // db: typeof db; // TODO: Add database service
    redis: Redis;
    pubsub?: RedisPubSub;
    pricing: typeof PricingService;
  };
  repositories: {
    checkoutSessions: CheckoutSessionRepository;
    orders: OrderRepository;
    esims: ESIMRepository;
  };
  dataSources: {
    catalogue: CatalogueDataSource;
    orders: OrdersDataSource;
    esims: ESIMsDataSource;
    countries: CountriesDataSource;
    regions: RegionsDataSource;
    inventory: InventoryDataSource;
  };
  // Legacy for backward compatibility during migration
  token?: string;
  req?: any;
};
