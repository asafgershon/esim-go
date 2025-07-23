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
  PricingDataSource,
} from "../datasources/esim-go";
import {
  CheckoutSessionRepository,
  OrderRepository,
  ESIMRepository,
  UserRepository,
  HighDemandCountryRepository,
  PricingRulesRepository,
} from "../repositories";
import { TripRepository } from "../repositories/trip.repository";
import { SyncJobRepository } from "../repositories/catalog/sync-job.repository";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Context = {
  auth: SupabaseAuthContext;
  services: {
    db: SupabaseClient;
    redis: Redis;
    pubsub?: RedisPubSub;
  };
  repositories: {
    checkoutSessions: CheckoutSessionRepository;
    orders: OrderRepository;
    esims: ESIMRepository;
    users: UserRepository;
    trips: TripRepository;
    highDemandCountries: HighDemandCountryRepository;
    syncJob: SyncJobRepository;
    pricingRules: PricingRulesRepository;
  };
  dataSources: {
    catalogue: CatalogueDataSource;
    orders: OrdersDataSource;
    esims: ESIMsDataSource;
    countries: CountriesDataSource;
    regions: RegionsDataSource;
    inventory: InventoryDataSource;
    pricing: PricingDataSource;
  };
  // Legacy for backward compatibility during migration
  token?: string;
  req?: any;
};
