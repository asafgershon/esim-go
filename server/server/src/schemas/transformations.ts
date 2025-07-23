import { z } from "zod";
import type {
  ESIMGoDataPlan
} from "../datasources/esim-go/types";
import type { DataPlan } from "../types";
import { convertCentsToDollars, convertBytesToMB } from '../repositories/catalog/bundle-transform.schema';

// Input validation schemas
const ESIMGoDataPlanSchema = z.object({
  name: z.string(),
  description: z.string(),
  baseCountry: z.object({
    name: z.string(),
    region: z.string(), 
    iso: z.string(),
  }).optional(),
  countries: z.array(z.object({
    name: z.string(),
    region: z.string(),
    iso: z.string(),
  })),
  duration: z.number(),
  price: z.number(),
  unlimited: z.boolean().default(false), // eSIM Go API uses 'unlimited' field
  bundleGroup: z.string().optional(),
  dataAmount: z.number(),
  speed: z.union([z.string(), z.array(z.union([z.literal('2G'), z.literal('3G'), z.literal('4G'), z.literal('5G')])).nullish().default([])]).transform((speed) => {
    if (Array.isArray(speed)) {
      return speed.join(', ');
    }
    return speed;
  }),
  availableQuantity: z.number().optional(),
  roamingCountries: z.array(z.object({
    name: z.string(),
    region: z.string(),
    iso: z.string(),
  })).default([]),
  billingType: z.string(),
});

const ESIMGoBundleSchema = z.object({
  name: z.string(),
  state: z.enum(['PROCESSING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED']),
  usedData: z.number().default(0),
  remainingData: z.number().nullable().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const ESIMGoOrderSchema = z.object({
  reference: z.string(),
  status: z.enum(['PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']),
  quantity: z.number(),
  totalPrice: z.number(),
  createdAt: z.string(),
});

const ESIMGoESIMSchema = z.object({
  iccid: z.string(),
  customerRef: z.string().optional(),
  qrCode: z.string().optional(),
  status: z.enum(['PROCESSING', 'ASSIGNED', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED']),
  assignedDate: z.string().optional(),
  lastAction: z.string().optional(),
  actionDate: z.string().optional(),
  bundles: z.array(ESIMGoBundleSchema).default([]),
});

// Helper function to convert bytes to MB
const bytesToMB = (bytes: number | null): number => {
  return bytes !== null ? bytes / (1024 * 1024) : 0;
};

/**
 * Validated mapping function for eSIM Go data plan to GraphQL DataPlan type
 */
export function mapDataPlan(plan: ESIMGoDataPlan, dbPlan?: DataPlan): DataPlan {
  // Validate input data with Zod
  const validatedPlan = ESIMGoDataPlanSchema.parse(plan);
  
  return {
    id: dbPlan?.id || validatedPlan.name,
    name: validatedPlan.name,
    description: validatedPlan.description,
    region: validatedPlan.baseCountry?.region || '',
    countries: validatedPlan.countries,
    // Add baseCountry to the mapped data so resolvers can access it
    baseCountry: validatedPlan.baseCountry,
    duration: validatedPlan.duration,
    price: validatedPlan.price,
    currency: "USD",
    isUnlimited: validatedPlan.unlimited,
    bundleGroup: validatedPlan.bundleGroup,
    features: [
      validatedPlan.unlimited ? "Unlimited Data" : `${validatedPlan.dataAmount || 0} MB`,
      `${validatedPlan.duration} Days`,
      validatedPlan.speed || "High Speed",
      "24/7 Support",
      "Instant Activation",
    ],
    availableQuantity: validatedPlan.availableQuantity || null,
    // Store raw dataAmount for field resolver to access
    _rawDataAmount: validatedPlan.dataAmount || 0,
  };
}

/**
 * Map database catalog bundle to GraphQL DataPlan type
 * This handles the new database format after catalog sync
 */
export function mapDatabaseBundleToDataPlan(dbBundle: any): DataPlan {
  return {
    id: dbBundle.id || dbBundle.esim_go_name,
    name: dbBundle.esim_go_name || 'Unknown Bundle',
    description: dbBundle.description || '',
    region: (dbBundle.regions && Array.isArray(dbBundle.regions) && dbBundle.regions[0]) || 'Unknown',
    countries: (dbBundle.countries || []).map((countryName: string) => ({
      name: countryName,
      region: 'Unknown', // We don't have region info for individual countries in DB
      iso: countryName // Using country name as ISO for now
    })),
    duration: dbBundle.duration || 0,
    price: convertCentsToDollars(dbBundle.price_cents),
    currency: dbBundle.currency || "USD",
    isUnlimited: dbBundle.unlimited || false,
    bundleGroup: dbBundle.bundle_group,
    features: [
      dbBundle.unlimited ? "Unlimited Data" : `${convertBytesToMB(dbBundle.data_amount) || 0} MB`,
      `${dbBundle.duration || 0} Days`,
      "High Speed",
      "24/7 Support", 
      "Instant Activation",
    ],
    availableQuantity: null,
    // Store raw dataAmount for field resolver to access
    _rawDataAmount: convertBytesToMB(dbBundle.data_amount) || 0,
  };
}

/**
 * Validated mapping function for eSIM Go order to GraphQL Order type
 */
export function mapOrder(order: any, dbOrder: any, dataPlan: any): any {
  // Validate input data with Zod
  const validatedOrder = ESIMGoOrderSchema.parse(order);
  const validatedPlan = ESIMGoDataPlanSchema.parse(dataPlan);
  
  return {
    id: dbOrder.id,
    reference: validatedOrder.reference,
    status: validatedOrder.status,
    dataPlan: mapDataPlan(validatedPlan),
    quantity: validatedOrder.quantity,
    totalPrice: validatedOrder.totalPrice,
    esims: [], // Populated separately
    createdAt: validatedOrder.createdAt,
    updatedAt: dbOrder.updated_at,
  };
}

/**
 * Validated mapping function for eSIM Go eSIM to GraphQL ESIM type
 */
export function mapESIM(esim: any, dbESIM: any, order: any, plan: any): any {
  // Validate input data with Zod
  const validatedESIM = ESIMGoESIMSchema.parse(esim);
  
  return {
    id: dbESIM.id,
    order,
    plan: mapDataPlan(plan),
    iccid: validatedESIM.iccid,
    customerRef: validatedESIM.customerRef || null,
    qrCode: validatedESIM.qrCode || null,
    status: validatedESIM.status,
    assignedDate: validatedESIM.assignedDate || null,
    lastAction: validatedESIM.lastAction || null,
    actionDate: validatedESIM.actionDate || null,
    bundles: validatedESIM.bundles.map(mapBundle),
    usage: {
      totalUsed: 0, // Will be calculated separately
      totalRemaining: null,
      activeBundles: [],
    },
    createdAt: dbESIM.created_at,
    updatedAt: dbESIM.updated_at,
  };
}

/**
 * Validated mapping function for eSIM Go bundle to GraphQL ESIMBundle type
 */
export function mapBundle(bundle: any): any {
  // Validate input data with Zod
  const validatedBundle = ESIMGoBundleSchema.parse(bundle);
  
  return {
    id: validatedBundle.name,
    name: validatedBundle.name,
    state: validatedBundle.state,
    dataUsed: bytesToMB(validatedBundle.usedData),
    dataRemaining: validatedBundle.remainingData !== null 
      ? bytesToMB(validatedBundle.remainingData || 0) 
      : null,
    startDate: validatedBundle.startDate || null,
    endDate: validatedBundle.endDate || null,
  };
} 