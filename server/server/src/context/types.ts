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
import { PricingService } from "../services";
import {
  CheckoutSessionRepository,
  OrderRepository,
  ESIMRepository,
  UserRepository,
  HighDemandCountryRepository,
} from "../repositories";
import { TripRepository } from "../repositories/trips/trip.repository";
import type { PricingConfigRepository } from "../repositories/pricing-configs/pricing-config.repository";

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
    users: UserRepository;
    trips: TripRepository;
    pricingConfigs: PricingConfigRepository;
    highDemandCountries: HighDemandCountryRepository;
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
