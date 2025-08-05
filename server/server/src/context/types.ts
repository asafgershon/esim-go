import type { User } from "../types";
import type { Redis } from "ioredis";
import type { RedisPubSub } from "graphql-redis-subscriptions";
import type { SupabaseAuthContext } from "./supabase-auth";
import type {
  CatalogueDataSourceV2,
  OrdersDataSource,
  ESIMsDataSource,
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
import type { ESimGoClient } from "@hiilo/client";
import type { AirHaloClient } from "@airhalo/client";
import type DataLoader from "dataloader";
import type { PricingKey, PricingResult } from "../dataloaders/pricing-dataloader";

export type Context = {
  auth: SupabaseAuthContext;
  services: {
    db: SupabaseClient;
    redis: Redis;
    syncs: CatalogSyncServiceV2;
    esimGoClient: ESimGoClient;
    airHaloClient?: AirHaloClient;
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
    regions: RegionsDataSource;
    inventory: InventoryDataSource;
    pricing: PricingDataSource;
  };
  dataLoaders: {
    pricing: DataLoader<PricingKey, PricingResult>;
  };
  // Legacy for backward compatibility during migration
  token?: string;
  req?: any;
};
