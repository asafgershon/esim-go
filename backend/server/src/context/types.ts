// backend/server/src/context/types.ts

import type { AirHaloClient } from "@hiilo/airalo";
import type { ESimGoClient } from "@hiilo/esim-go";
import type { Database } from "@hiilo/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type DataLoader from "dataloader";
import type { RedisPubSub } from "graphql-redis-subscriptions";
import type {
  PricingKey,
  PricingResult,
} from "../dataloaders/pricing-dataloader";
import type {
  CatalogueDataSourceV2,
  ESIMsDataSource,
  InventoryDataSource,
  OrdersDataSource,
  PricingDataSource,
  RegionsDataSource,
} from "../datasources/esim-go";
import {
  BundleRepository,
  CheckoutSessionRepository,
  ESIMRepository,
  HighDemandCountryRepository,
  OrderRepository,
  TenantRepository,
  UserRepository,
} from "../repositories";
import { SyncJobRepository } from "../repositories/catalog/sync-job.repository";
import { StrategiesRepository } from "../repositories/strategies.repository";
import { TripRepository } from "../repositories/trip.repository";
import type { CatalogSyncServiceV2 } from "../services";
import type { CheckoutSessionService } from "../services/checkout-session.service";
import type { CheckoutSessionServiceV2 } from "../services/checkout/session";
import type { CheckoutWorkflowInstance } from "../services/checkout/workflow";
import type { DeliveryService } from "../services/delivery";
import { paymentService } from "../services/payment";
import type { RedisInstance } from "../services/redis";
import type { SupabaseAuthContext } from "./supabase-auth";
import { CouponRepository } from '../repositories/coupon.repository';


export type Context = {
  auth: SupabaseAuthContext;
  services: {
    db: SupabaseClient<any>;
    redis: RedisInstance;
    pubsub: RedisPubSub; // 👈 הוא כבר כאן
    syncs: CatalogSyncServiceV2;
    esimGoClient: ESimGoClient;
    airHaloClient?: AirHaloClient;
    easycardPayment: typeof paymentService;
    checkoutSessionService?: CheckoutSessionService;
    checkoutSessionServiceV2: CheckoutSessionServiceV2;
    checkoutWorkflow: CheckoutWorkflowInstance;
    deliveryService: DeliveryService;
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
    tenants: TenantRepository;
    strategies: StrategiesRepository;
    coupons: CouponRepository; // 👈 הוספתי את זה
  };
  dataSources: {
    catalogue: CatalogueDataSourceV2;
    orders: OrdersDataSource;
    esims: ESIMsDataSource;
    regions: RegionsDataSource;
    inventory: InventoryDataSource;
    pricing: PricingDataSource;
  };
  dataLoaders?: {
    pricing: DataLoader<PricingKey, PricingResult>;
  };
  token?: string;
  req?: any;
};
