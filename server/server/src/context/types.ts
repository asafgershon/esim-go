import type { User } from "../types";
import type { Redis } from "ioredis";
import type { RedisPubSub } from "graphql-redis-subscriptions";
import type { SupabaseAuthContext } from "./supabase-auth";
import type {
  CatalogueDataSourceV2,
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
  BundleRepository,
} from "../repositories";
import { TripRepository } from "../repositories/trip.repository";
import { SyncJobRepository } from "../repositories/catalog/sync-job.repository";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogSyncServiceV2 } from "../services";
import type { ESimGoClient } from "@esim-go/client";

export type Context = {
  auth: SupabaseAuthContext;
  services: {
    db: SupabaseClient;
    redis: Redis;
    syncs: CatalogSyncServiceV2;
    esimGoClient: ESimGoClient;
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
    bundles: BundleRepository;
    pricingRules: PricingRulesRepository;
  };
  dataSources: {
    catalogue: CatalogueDataSourceV2;
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
