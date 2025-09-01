/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  ISOCountryCode: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export enum ActionType {
  AddMarkup = 'ADD_MARKUP',
  ApplyDiscountPercentage = 'APPLY_DISCOUNT_PERCENTAGE',
  ApplyFixedDiscount = 'APPLY_FIXED_DISCOUNT',
  SetDiscountPerUnusedDay = 'SET_DISCOUNT_PER_UNUSED_DAY',
  SetMinimumPrice = 'SET_MINIMUM_PRICE',
  SetMinimumProfit = 'SET_MINIMUM_PROFIT',
  SetProcessingRate = 'SET_PROCESSING_RATE'
}

export type ActivateEsimResponse = {
  __typename?: 'ActivateESIMResponse';
  error?: Maybe<Scalars['String']['output']>;
  esim?: Maybe<Esim>;
  success: Scalars['Boolean']['output'];
};

export type AdminEsim = {
  __typename?: 'AdminESIM';
  actionDate?: Maybe<Scalars['String']['output']>;
  activationCode?: Maybe<Scalars['String']['output']>;
  apiStatus?: Maybe<Scalars['String']['output']>;
  assignedDate?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  customerRef?: Maybe<Scalars['String']['output']>;
  esim_bundles?: Maybe<Array<Maybe<Scalars['JSON']['output']>>>;
  iccid: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastAction?: Maybe<Scalars['String']['output']>;
  matchingId?: Maybe<Scalars['String']['output']>;
  order?: Maybe<AdminEsimOrder>;
  orderId: Scalars['String']['output'];
  qrCodeUrl?: Maybe<Scalars['String']['output']>;
  smdpAddress?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
  usage?: Maybe<EsimUsage>;
  user?: Maybe<AdminEsimUser>;
  userId: Scalars['String']['output'];
};

export type AdminEsimDetails = {
  __typename?: 'AdminESIMDetails';
  actionDate?: Maybe<Scalars['String']['output']>;
  activationCode?: Maybe<Scalars['String']['output']>;
  apiDetails?: Maybe<Scalars['JSON']['output']>;
  assignedDate?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  customerRef?: Maybe<Scalars['String']['output']>;
  iccid: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastAction?: Maybe<Scalars['String']['output']>;
  matchingId?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Order>;
  orderId: Scalars['String']['output'];
  qrCodeUrl?: Maybe<Scalars['String']['output']>;
  smdpAddress?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
  usage?: Maybe<EsimUsage>;
  userId: Scalars['String']['output'];
};

export type AdminEsimOrder = {
  __typename?: 'AdminESIMOrder';
  bundleName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  reference: Scalars['String']['output'];
};

export type AdminEsimUser = {
  __typename?: 'AdminESIMUser';
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
};

export type AirHaloApn = {
  __typename?: 'AirHaloAPN';
  ios?: Maybe<AirHaloApnios>;
  name?: Maybe<Scalars['String']['output']>;
  password?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type AirHaloApnios = {
  __typename?: 'AirHaloAPNIOS';
  name?: Maybe<Scalars['String']['output']>;
  password?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type AirHaloCompatibleDevice = {
  __typename?: 'AirHaloCompatibleDevice';
  esimSupport: Scalars['Boolean']['output'];
  manufacturer: Scalars['String']['output'];
  model: Scalars['String']['output'];
};

export type AirHaloCompatibleDevicesResponse = {
  __typename?: 'AirHaloCompatibleDevicesResponse';
  data: Array<AirHaloCompatibleDevice>;
};

export type AirHaloCountry = {
  __typename?: 'AirHaloCountry';
  id: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type AirHaloCoverage = {
  __typename?: 'AirHaloCoverage';
  networks: Array<AirHaloNetwork>;
};

export type AirHaloImage = {
  __typename?: 'AirHaloImage';
  height?: Maybe<Scalars['Int']['output']>;
  url: Scalars['String']['output'];
  width?: Maybe<Scalars['Int']['output']>;
};

export type AirHaloLinks = {
  __typename?: 'AirHaloLinks';
  first?: Maybe<Scalars['String']['output']>;
  last?: Maybe<Scalars['String']['output']>;
  next?: Maybe<Scalars['String']['output']>;
  prev?: Maybe<Scalars['String']['output']>;
};

export type AirHaloMeta = {
  __typename?: 'AirHaloMeta';
  currentPage?: Maybe<Scalars['Int']['output']>;
  from?: Maybe<Scalars['Int']['output']>;
  lastPage?: Maybe<Scalars['Int']['output']>;
  path?: Maybe<Scalars['String']['output']>;
  perPage?: Maybe<Scalars['Int']['output']>;
  to?: Maybe<Scalars['Int']['output']>;
  total?: Maybe<Scalars['Int']['output']>;
};

export type AirHaloNetwork = {
  __typename?: 'AirHaloNetwork';
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type AirHaloOperator = {
  __typename?: 'AirHaloOperator';
  apn?: Maybe<AirHaloApn>;
  countries: Array<AirHaloCountry>;
  coverages: Array<AirHaloCoverage>;
  id: Scalars['String']['output'];
  packages: Array<AirHaloPackage>;
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type AirHaloPackage = {
  __typename?: 'AirHaloPackage';
  amount: Scalars['Float']['output'];
  data: Scalars['String']['output'];
  day: Scalars['Int']['output'];
  fairUsagePolicy?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  isFairUsagePolicy?: Maybe<Scalars['Boolean']['output']>;
  isUnlimited: Scalars['Boolean']['output'];
  manualInstallation: Scalars['String']['output'];
  netPrice: AirHaloPrice;
  price: AirHaloPrice;
  prices: AirHaloPrices;
  qrInstallation: Scalars['String']['output'];
  shortInfo?: Maybe<Scalars['String']['output']>;
  text?: Maybe<Scalars['Int']['output']>;
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
  voice?: Maybe<Scalars['Int']['output']>;
};

export type AirHaloPackageData = {
  __typename?: 'AirHaloPackageData';
  id: Scalars['String']['output'];
  image?: Maybe<AirHaloImage>;
  operators: Array<AirHaloOperator>;
  slug: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type AirHaloPackageFilter = {
  countries?: InputMaybe<Array<Scalars['String']['input']>>;
  includeTopup?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<AirHaloPackageType>;
};

export enum AirHaloPackageType {
  Global = 'GLOBAL',
  Local = 'LOCAL',
  Regional = 'REGIONAL'
}

export type AirHaloPackagesResponse = {
  __typename?: 'AirHaloPackagesResponse';
  data: Array<AirHaloPackageData>;
  links?: Maybe<AirHaloLinks>;
  meta?: Maybe<AirHaloMeta>;
};

export type AirHaloPrice = {
  __typename?: 'AirHaloPrice';
  currency: Scalars['String']['output'];
  value: Scalars['Float']['output'];
};

export type AirHaloPrices = {
  __typename?: 'AirHaloPrices';
  netPrice: AirHaloPrice;
  recommendedRetailPrice: AirHaloPrice;
};

export type AppliedRule = {
  __typename?: 'AppliedRule';
  category: RuleCategory;
  id: Scalars['ID']['output'];
  impact: Scalars['Float']['output'];
  name: Scalars['String']['output'];
};

export type AssignPackageResponse = {
  __typename?: 'AssignPackageResponse';
  assignment?: Maybe<PackageAssignment>;
  error?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export enum AssignmentStatus {
  Activated = 'ACTIVATED',
  Assigned = 'ASSIGNED',
  Cancelled = 'CANCELLED',
  Expired = 'EXPIRED',
  Pending = 'PENDING'
}

export type Bundle = {
  basePrice: Scalars['Float']['output'];
  countries: Array<Scalars['String']['output']>;
  currency: Scalars['String']['output'];
  dataAmountMB?: Maybe<Scalars['Int']['output']>;
  dataAmountReadable: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  groups: Array<Scalars['String']['output']>;
  isUnlimited: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  pricingBreakdown?: Maybe<PricingBreakdown>;
  region?: Maybe<Scalars['String']['output']>;
  speed: Array<Scalars['String']['output']>;
  validityInDays: Scalars['Int']['output'];
};


export type BundlePricingBreakdownArgs = {
  paymentMethod?: InputMaybe<PaymentMethod>;
};

export type BundleConnection = {
  __typename?: 'BundleConnection';
  nodes: Array<Bundle>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type BundleDataAggregation = {
  __typename?: 'BundleDataAggregation';
  byDataAmount: Array<DataAmountGroup>;
  byDuration: Array<DurationGroup>;
  byGroup: Array<GroupDataStats>;
  lastUpdated: Scalars['String']['output'];
  total: Scalars['Int']['output'];
  unlimited: Scalars['Int']['output'];
};

export type BundleFilter = {
  countries?: InputMaybe<Array<Scalars['String']['input']>>;
  groups?: InputMaybe<Array<Scalars['String']['input']>>;
  isUnlimited?: InputMaybe<Scalars['Boolean']['input']>;
  priceRange?: InputMaybe<FloatRange>;
  region?: InputMaybe<Scalars['String']['input']>;
  validityInDays?: InputMaybe<IntRange>;
};

export type BundleFilterOptions = {
  __typename?: 'BundleFilterOptions';
  /** Available countries */
  countries: Array<FilterOption>;
  /** Available groups */
  groups: Array<FilterOption>;
  /** Available regions */
  regions: Array<FilterOption>;
};

export enum BundleState {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Expired = 'EXPIRED',
  Inactive = 'INACTIVE',
  Processing = 'PROCESSING',
  Suspended = 'SUSPENDED'
}

export type BundleStats = {
  __typename?: 'BundleStats';
  /** Total number of active bundles in the system */
  totalBundles: Scalars['Int']['output'];
  /** Number of countries covered */
  totalCountries: Scalars['Int']['output'];
  /** Number of unique bundle groups */
  totalGroups: Scalars['Int']['output'];
  /** Number of regions covered */
  totalRegions: Scalars['Int']['output'];
};

export type BundlesByCountry = {
  __typename?: 'BundlesByCountry';
  bundleCount: Scalars['Int']['output'];
  bundles: Array<Bundle>;
  country: Country;
  pricingRange?: Maybe<PricingRange>;
};


export type BundlesByCountryBundlesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type BundlesByGroup = {
  __typename?: 'BundlesByGroup';
  bundleCount: Scalars['Int']['output'];
  bundles: Array<Bundle>;
  group: Scalars['String']['output'];
  pricingRange?: Maybe<PricingRange>;
};


export type BundlesByGroupBundlesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type BundlesByRegion = {
  __typename?: 'BundlesByRegion';
  bundleCount: Scalars['Int']['output'];
  bundles: Array<Bundle>;
  pricingRange?: Maybe<PricingRange>;
  region: Scalars['String']['output'];
};


export type BundlesByRegionBundlesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type BundlesForCountry = {
  __typename?: 'BundlesForCountry';
  /** Total number of bundles */
  bundleCount: Scalars['Int']['output'];
  /** All bundles available for this country */
  bundles: Array<Bundle>;
  /** Country information */
  country: Country;
  /** Groups available in this country */
  groups: Array<Scalars['String']['output']>;
  /** Whether unlimited bundles are available */
  hasUnlimited: Scalars['Boolean']['output'];
  /** Price range */
  pricingRange: PriceRange;
  /** Regions that include this country */
  regions: Array<Scalars['String']['output']>;
};

export type BundlesForGroup = {
  __typename?: 'BundlesForGroup';
  /** Total number of bundles */
  bundleCount: Scalars['Int']['output'];
  /** All bundles in this group */
  bundles: Array<Bundle>;
  /** Countries covered by this group */
  countries: Array<Scalars['String']['output']>;
  /** Group name */
  group: Scalars['String']['output'];
  /** Whether unlimited bundles are available */
  hasUnlimited: Scalars['Boolean']['output'];
  /** Price range */
  pricingRange: PriceRange;
  /** Regions covered by this group */
  regions: Array<Scalars['String']['output']>;
};

export type BundlesForRegion = {
  __typename?: 'BundlesForRegion';
  /** Total number of bundles */
  bundleCount: Scalars['Int']['output'];
  /** All bundles available for this region */
  bundles: Array<Bundle>;
  /** Countries in this region */
  countries: Array<Scalars['String']['output']>;
  /** Groups available in this region */
  groups: Array<Scalars['String']['output']>;
  /** Whether unlimited bundles are available */
  hasUnlimited: Scalars['Boolean']['output'];
  /** Price range */
  pricingRange: PriceRange;
  /** Region name */
  region: Scalars['String']['output'];
};

/** Result of a cache operation */
export type CacheOperationResult = {
  __typename?: 'CacheOperationResult';
  /** Number of cache entries affected (optional) */
  clearedCount?: Maybe<Scalars['Int']['output']>;
  /** Human-readable message about the operation */
  message: Scalars['String']['output'];
  /** Whether the operation was successful */
  success: Scalars['Boolean']['output'];
};

export type CalculatePriceInput = {
  countryId?: InputMaybe<Scalars['String']['input']>;
  groups?: InputMaybe<Array<Scalars['String']['input']>>;
  includeDebugInfo?: InputMaybe<Scalars['Boolean']['input']>;
  numOfDays: Scalars['Int']['input'];
  paymentMethod?: InputMaybe<PaymentMethod>;
  promo?: InputMaybe<Scalars['String']['input']>;
  regionId?: InputMaybe<Scalars['String']['input']>;
  strategyId?: InputMaybe<Scalars['String']['input']>;
};

export type CatalogBundle = Bundle & {
  __typename?: 'CatalogBundle';
  basePrice: Scalars['Float']['output'];
  countries: Array<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  currency: Scalars['String']['output'];
  dataAmountMB?: Maybe<Scalars['Int']['output']>;
  dataAmountReadable: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  esimGoName: Scalars['ID']['output'];
  groups: Array<Scalars['String']['output']>;
  isUnlimited: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  pricingBreakdown?: Maybe<PricingBreakdown>;
  region?: Maybe<Scalars['String']['output']>;
  speed: Array<Scalars['String']['output']>;
  syncedAt: Scalars['DateTime']['output'];
  updatedAt: Scalars['DateTime']['output'];
  validityInDays: Scalars['Int']['output'];
};


export type CatalogBundlePricingBreakdownArgs = {
  paymentMethod?: InputMaybe<PaymentMethod>;
};

export type CatalogBundleConnection = {
  __typename?: 'CatalogBundleConnection';
  bundles: Array<CatalogBundle>;
  totalCount: Scalars['Int']['output'];
};

export type CatalogCountryBundles = {
  __typename?: 'CatalogCountryBundles';
  bundleCount: Scalars['Int']['output'];
  bundles: Array<CatalogBundle>;
  country: Scalars['String']['output'];
};

export type CatalogSyncHistoryConnection = {
  __typename?: 'CatalogSyncHistoryConnection';
  jobs: Array<CatalogSyncJob>;
  totalCount: Scalars['Int']['output'];
};

export type CatalogSyncJob = {
  __typename?: 'CatalogSyncJob';
  bundlesAdded?: Maybe<Scalars['Int']['output']>;
  bundlesProcessed?: Maybe<Scalars['Int']['output']>;
  bundlesUpdated?: Maybe<Scalars['Int']['output']>;
  completedAt?: Maybe<Scalars['String']['output']>;
  countryId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  duration?: Maybe<Scalars['Int']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  group?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  jobType: Scalars['String']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  priority: Scalars['String']['output'];
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  type: SyncJobType;
  updatedAt: Scalars['String']['output'];
};

export type CatalogSyncProgressUpdate = {
  __typename?: 'CatalogSyncProgressUpdate';
  bundleGroup?: Maybe<Scalars['String']['output']>;
  bundlesAdded: Scalars['Int']['output'];
  bundlesProcessed: Scalars['Int']['output'];
  bundlesUpdated: Scalars['Int']['output'];
  countryId?: Maybe<Scalars['String']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  jobId: Scalars['ID']['output'];
  jobType: SyncJobType;
  message?: Maybe<Scalars['String']['output']>;
  progress: Scalars['Float']['output'];
  startedAt: Scalars['String']['output'];
  status: SyncJobStatus;
  totalBundles?: Maybe<Scalars['Int']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type Checkout = {
  __typename?: 'Checkout';
  auth?: Maybe<CheckoutAuth>;
  bundle?: Maybe<CheckoutBundle>;
  delivery?: Maybe<CheckoutDelivery>;
  id: Scalars['ID']['output'];
  payment?: Maybe<CheckoutPayment>;
};

export type CheckoutAuth = CheckoutAuthInterface & {
  __typename?: 'CheckoutAuth';
  completed: Scalars['Boolean']['output'];
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  method?: Maybe<Scalars['String']['output']>;
  otpSent?: Maybe<Scalars['Boolean']['output']>;
  otpVerified?: Maybe<Scalars['Boolean']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type CheckoutAuthInterface = {
  completed: Scalars['Boolean']['output'];
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  method?: Maybe<Scalars['String']['output']>;
  otpSent?: Maybe<Scalars['Boolean']['output']>;
  otpVerified?: Maybe<Scalars['Boolean']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type CheckoutAuthWithOtp = CheckoutAuthInterface & {
  __typename?: 'CheckoutAuthWithOTP';
  authToken: Scalars['String']['output'];
  completed: Scalars['Boolean']['output'];
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  method?: Maybe<Scalars['String']['output']>;
  otpSent?: Maybe<Scalars['Boolean']['output']>;
  otpVerified?: Maybe<Scalars['Boolean']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  refreshToken: Scalars['String']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

export type CheckoutBundle = {
  __typename?: 'CheckoutBundle';
  completed: Scalars['Boolean']['output'];
  country?: Maybe<Country>;
  currency: Scalars['String']['output'];
  dataAmount: Scalars['String']['output'];
  discounts: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  numOfDays: Scalars['Int']['output'];
  price: Scalars['Float']['output'];
  pricePerDay: Scalars['Float']['output'];
  speed: Array<Scalars['String']['output']>;
  validated?: Maybe<Scalars['Boolean']['output']>;
};

export type CheckoutDelivery = {
  __typename?: 'CheckoutDelivery';
  completed: Scalars['Boolean']['output'];
  email?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
};

export type CheckoutPayment = {
  __typename?: 'CheckoutPayment';
  completed: Scalars['Boolean']['output'];
  email?: Maybe<Scalars['String']['output']>;
  intent?: Maybe<PaymentIntent>;
  nameForBilling?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  redirectUrl?: Maybe<Scalars['String']['output']>;
  transaction?: Maybe<Transaction>;
};

export type CheckoutSession = {
  __typename?: 'CheckoutSession';
  createdAt: Scalars['DateTime']['output'];
  expiresAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isComplete: Scalars['Boolean']['output'];
  isValidated: Scalars['Boolean']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  orderId?: Maybe<Scalars['ID']['output']>;
  paymentIntentId?: Maybe<Scalars['String']['output']>;
  paymentStatus?: Maybe<Scalars['String']['output']>;
  paymentUrl?: Maybe<Scalars['String']['output']>;
  planSnapshot?: Maybe<Scalars['JSON']['output']>;
  pricing?: Maybe<Scalars['JSON']['output']>;
  steps?: Maybe<Scalars['JSON']['output']>;
  timeRemaining?: Maybe<Scalars['Int']['output']>;
  token: Scalars['String']['output'];
};

export type CheckoutSessionUpdate = {
  __typename?: 'CheckoutSessionUpdate';
  session: CheckoutSession;
  timestamp: Scalars['DateTime']['output'];
  updateType: CheckoutUpdateType;
};

export enum CheckoutStepType {
  Authentication = 'AUTHENTICATION',
  Delivery = 'DELIVERY',
  Payment = 'PAYMENT'
}

export enum CheckoutUpdateType {
  Initial = 'INITIAL',
  OrderCreated = 'ORDER_CREATED',
  PaymentCompleted = 'PAYMENT_COMPLETED',
  PaymentProcessing = 'PAYMENT_PROCESSING',
  SessionExpired = 'SESSION_EXPIRED',
  StepCompleted = 'STEP_COMPLETED'
}

export enum ConditionOperator {
  Between = 'BETWEEN',
  Equals = 'EQUALS',
  Exists = 'EXISTS',
  GreaterThan = 'GREATER_THAN',
  In = 'IN',
  LessThan = 'LESS_THAN',
  NotEquals = 'NOT_EQUALS',
  NotExists = 'NOT_EXISTS',
  NotIn = 'NOT_IN'
}

export type ConflictingJobInfo = {
  __typename?: 'ConflictingJobInfo';
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  jobType: Scalars['String']['output'];
  startedAt?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
};

export type Country = {
  __typename?: 'Country';
  flag?: Maybe<Scalars['String']['output']>;
  isHighDemand?: Maybe<Scalars['Boolean']['output']>;
  iso: Scalars['ISOCountryCode']['output'];
  name: Scalars['String']['output'];
  nameHebrew?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
};

export type CountryBundle = {
  __typename?: 'CountryBundle';
  appliedRules?: Maybe<Array<AppliedRule>>;
  country: Country;
  currency: Scalars['String']['output'];
  data?: Maybe<Scalars['Float']['output']>;
  duration: Scalars['Int']['output'];
  group?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isUnlimited: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  price?: Maybe<Scalars['Float']['output']>;
  pricingBreakdown?: Maybe<PricingBreakdown>;
};

export type CreateCheckoutSessionInput = {
  countryId?: InputMaybe<Scalars['String']['input']>;
  group?: InputMaybe<Scalars['String']['input']>;
  numOfDays: Scalars['Int']['input'];
  regionId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateCheckoutSessionResponse = {
  __typename?: 'CreateCheckoutSessionResponse';
  error?: Maybe<Scalars['String']['output']>;
  session?: Maybe<CheckoutSession>;
  success: Scalars['Boolean']['output'];
};

export type CreatePricingRuleInput = {
  actions: Array<RuleActionInput>;
  category: RuleCategory;
  conditions: Array<RuleConditionInput>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  priority: Scalars['Int']['input'];
  validFrom?: InputMaybe<Scalars['String']['input']>;
  validUntil?: InputMaybe<Scalars['String']['input']>;
};

export type CreateTenantInput = {
  imgUrl: Scalars['String']['input'];
  name: Scalars['String']['input'];
  slug: Scalars['ID']['input'];
  tenantType?: InputMaybe<TenantType>;
};

export type CreateTripInput = {
  bundleName: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type CreateTripResponse = {
  __typename?: 'CreateTripResponse';
  error?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  trip?: Maybe<Trip>;
};

export type CustomerBundle = Bundle & {
  __typename?: 'CustomerBundle';
  basePrice: Scalars['Float']['output'];
  countries: Array<Scalars['String']['output']>;
  currency: Scalars['String']['output'];
  dataAmountMB?: Maybe<Scalars['Int']['output']>;
  dataAmountReadable: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  groups: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isUnlimited: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  pricingBreakdown?: Maybe<PricingBreakdown>;
  region?: Maybe<Scalars['String']['output']>;
  speed: Array<Scalars['String']['output']>;
  validityInDays: Scalars['Int']['output'];
};


export type CustomerBundlePricingBreakdownArgs = {
  paymentMethod?: InputMaybe<PaymentMethod>;
};

export type CustomerDiscount = {
  __typename?: 'CustomerDiscount';
  amount: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  percentage?: Maybe<Scalars['Float']['output']>;
  reason: Scalars['String']['output'];
};

export type DataAmountGroup = {
  __typename?: 'DataAmountGroup';
  count: Scalars['Int']['output'];
  dataAmount: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
};

export type DataType = {
  __typename?: 'DataType';
  isUnlimited: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  maxDataMB?: Maybe<Scalars['Int']['output']>;
  minDataMB?: Maybe<Scalars['Int']['output']>;
  value: Scalars['String']['output'];
};

export type DeleteTripResponse = {
  __typename?: 'DeleteTripResponse';
  error?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type DeleteUserResponse = {
  __typename?: 'DeleteUserResponse';
  error?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type DiscountApplication = {
  __typename?: 'DiscountApplication';
  amount: Scalars['Float']['output'];
  description?: Maybe<Scalars['String']['output']>;
  percentage?: Maybe<Scalars['Float']['output']>;
  ruleName: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type DurationGroup = {
  __typename?: 'DurationGroup';
  category: Scalars['String']['output'];
  count: Scalars['Int']['output'];
  duration: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
};

export type DurationRange = {
  __typename?: 'DurationRange';
  label: Scalars['String']['output'];
  maxDays: Scalars['Int']['output'];
  minDays: Scalars['Int']['output'];
  value: Scalars['String']['output'];
};

export type Esim = {
  __typename?: 'ESIM';
  actionDate?: Maybe<Scalars['String']['output']>;
  assignedDate?: Maybe<Scalars['String']['output']>;
  bundleId: Scalars['String']['output'];
  bundleName: Scalars['String']['output'];
  bundles: Array<EsimBundle>;
  createdAt: Scalars['String']['output'];
  customerRef?: Maybe<Scalars['String']['output']>;
  iccid: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  installationLinks?: Maybe<InstallationLinks>;
  lastAction?: Maybe<Scalars['String']['output']>;
  matchingId?: Maybe<Scalars['String']['output']>;
  order: Order;
  qrCode?: Maybe<Scalars['String']['output']>;
  smdpAddress?: Maybe<Scalars['String']['output']>;
  status: EsimStatus;
  updatedAt: Scalars['String']['output'];
  usage: EsimUsage;
};

export type EsimActionResponse = {
  __typename?: 'ESIMActionResponse';
  error?: Maybe<Scalars['String']['output']>;
  esim?: Maybe<Esim>;
  success: Scalars['Boolean']['output'];
};

export type EsimBundle = {
  __typename?: 'ESIMBundle';
  dataRemaining?: Maybe<Scalars['Float']['output']>;
  dataUsed: Scalars['Float']['output'];
  endDate?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  startDate?: Maybe<Scalars['String']['output']>;
  state: BundleState;
};

export enum EsimStatus {
  Active = 'ACTIVE',
  Assigned = 'ASSIGNED',
  Cancelled = 'CANCELLED',
  Expired = 'EXPIRED',
  Processing = 'PROCESSING',
  Suspended = 'SUSPENDED'
}

export type EsimStatusUpdate = {
  __typename?: 'ESIMStatusUpdate';
  dataRemaining?: Maybe<Scalars['Float']['output']>;
  dataUsed?: Maybe<Scalars['Float']['output']>;
  esimId: Scalars['ID']['output'];
  status: EsimStatus;
  updatedAt: Scalars['String']['output'];
};

export type EsimUsage = {
  __typename?: 'ESIMUsage';
  activeBundles: Array<EsimBundle>;
  totalRemaining?: Maybe<Scalars['Float']['output']>;
  totalUsed: Scalars['Float']['output'];
};

export type FilterOption = {
  __typename?: 'FilterOption';
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type FloatRange = {
  max?: InputMaybe<Scalars['Float']['input']>;
  min?: InputMaybe<Scalars['Float']['input']>;
};

export type GetCheckoutSessionResponse = {
  __typename?: 'GetCheckoutSessionResponse';
  error?: Maybe<Scalars['String']['output']>;
  session?: Maybe<CheckoutSession>;
  success: Scalars['Boolean']['output'];
};

export type GroupDataStats = {
  __typename?: 'GroupDataStats';
  averageDataAmount: Scalars['Float']['output'];
  group: Scalars['String']['output'];
  limited: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  unlimited: Scalars['Int']['output'];
};

export type InstallationLinks = {
  __typename?: 'InstallationLinks';
  /** LPA scheme for Android/Windows direct activation */
  lpaScheme: Scalars['String']['output'];
  /** Manual entry components for all devices */
  manual: ManualInstallation;
  /** QR code data string (LPA format) for fallback */
  qrCodeData: Scalars['String']['output'];
  /** iOS 17.4+ direct activation link (no QR scanning needed) */
  universalLink: Scalars['String']['output'];
};

export type IntRange = {
  max?: InputMaybe<Scalars['Int']['input']>;
  min?: InputMaybe<Scalars['Int']['input']>;
};

export type InviteAdminUserInput = {
  email: Scalars['String']['input'];
  redirectUrl?: InputMaybe<Scalars['String']['input']>;
  role: Scalars['String']['input'];
};

export type InviteAdminUserResponse = {
  __typename?: 'InviteAdminUserResponse';
  error?: Maybe<Scalars['String']['output']>;
  invitedEmail?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type ManualInstallation = {
  __typename?: 'ManualInstallation';
  /** Activation code */
  activationCode: Scalars['String']['output'];
  /** Optional confirmation code */
  confirmationCode?: Maybe<Scalars['String']['output']>;
  /** SM-DP+ server address */
  smDpAddress: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  activateESIM?: Maybe<ActivateEsimResponse>;
  assignPackageToUser?: Maybe<AssignPackageResponse>;
  assignUserToTenant: TenantOperationResponse;
  cancelESIM?: Maybe<EsimActionResponse>;
  /** Perform cache cleanup - remove expired entries (Admin only) */
  cleanupPricingCache?: Maybe<CacheOperationResult>;
  /** Clear pricing cache for a specific bundle (Admin only) */
  clearBundlePricingCache?: Maybe<CacheOperationResult>;
  /** Clear pricing cache for a specific country (Admin only) */
  clearCountryPricingCache?: Maybe<CacheOperationResult>;
  /** Clear all pricing cache (Admin only) */
  clearPricingCache?: Maybe<CacheOperationResult>;
  clonePricingRule: PricingRule;
  createCheckout?: Maybe<Scalars['String']['output']>;
  createCheckoutSession: CreateCheckoutSessionResponse;
  createPricingRule: PricingRule;
  createTenant: Tenant;
  createTrip?: Maybe<CreateTripResponse>;
  deletePricingRule: Scalars['Boolean']['output'];
  deleteTenant: TenantOperationResponse;
  deleteTrip?: Maybe<DeleteTripResponse>;
  deleteUser?: Maybe<DeleteUserResponse>;
  /** Smart cache invalidation based on rule changes (Admin only) */
  inviteAdminUser?: Maybe<InviteAdminUserResponse>;
  processCheckoutPayment: ProcessCheckoutPaymentResponse;
  processPaymentCallback: Scalars['String']['output'];
  purchaseESIM?: Maybe<PurchaseEsimResponse>;
  removeUserFromTenant: TenantOperationResponse;
  reorderPricingRules: Array<PricingRule>;
  /** Reset pricing performance metrics (Admin only) */
  resetPricingMetrics?: Maybe<CacheOperationResult>;
  restoreESIM?: Maybe<EsimActionResponse>;
  sendPhoneOTP?: Maybe<SendOtpResponse>;
  signIn?: Maybe<SignInResponse>;
  signInWithApple?: Maybe<SignInResponse>;
  signInWithGoogle?: Maybe<SignInResponse>;
  signUp?: Maybe<SignUpResponse>;
  suspendESIM?: Maybe<EsimActionResponse>;
  toggleHighDemandCountry?: Maybe<ToggleHighDemandResponse>;
  togglePricingRule: PricingRule;
  triggerCatalogSync?: Maybe<TriggerSyncResponse>;
  triggerCheckoutPayment: CheckoutPayment;
  updateCheckoutAuth: CheckoutAuth;
  updateCheckoutAuthName: CheckoutAuth;
  updateCheckoutDelivery: CheckoutDelivery;
  updateCheckoutStep: UpdateCheckoutStepResponse;
  updateESIMReference?: Maybe<EsimActionResponse>;
  updatePricingConfiguration?: Maybe<UpdatePricingConfigurationResponse>;
  updatePricingRule: PricingRule;
  updatePricingRulePriorities: Array<PricingRule>;
  updateProfile?: Maybe<UpdateProfileResponse>;
  updateTenant: Tenant;
  updateTrip?: Maybe<UpdateTripResponse>;
  updateUserRole?: Maybe<User>;
  validateOrder: ValidateOrderResponse;
  verifyOTP: CheckoutAuthWithOtp;
  verifyPhoneOTP?: Maybe<SignInResponse>;
};


export type MutationActivateEsimArgs = {
  esimId: Scalars['ID']['input'];
};


export type MutationAssignPackageToUserArgs = {
  planId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationAssignUserToTenantArgs = {
  role?: InputMaybe<Scalars['String']['input']>;
  tenantSlug: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationCancelEsimArgs = {
  esimId: Scalars['ID']['input'];
};


export type MutationClearBundlePricingCacheArgs = {
  bundleId: Scalars['String']['input'];
};


export type MutationClearCountryPricingCacheArgs = {
  countryId: Scalars['String']['input'];
};


export type MutationClonePricingRuleArgs = {
  id: Scalars['ID']['input'];
  newName: Scalars['String']['input'];
};


export type MutationCreateCheckoutArgs = {
  countryId: Scalars['String']['input'];
  numOfDays: Scalars['Int']['input'];
};


export type MutationCreateCheckoutSessionArgs = {
  input: CreateCheckoutSessionInput;
};


export type MutationCreatePricingRuleArgs = {
  input: CreatePricingRuleInput;
};


export type MutationCreateTenantArgs = {
  input: CreateTenantInput;
};


export type MutationCreateTripArgs = {
  input: CreateTripInput;
};


export type MutationDeletePricingRuleArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTenantArgs = {
  slug: Scalars['ID']['input'];
};


export type MutationDeleteTripArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationInvalidateCacheByRuleChangeArgs = {
  affectedEntities: Array<Scalars['String']['input']>;
  ruleType: Scalars['String']['input'];
};


export type MutationInviteAdminUserArgs = {
  input: InviteAdminUserInput;
};


export type MutationProcessCheckoutPaymentArgs = {
  input: ProcessCheckoutPaymentInput;
};


export type MutationProcessPaymentCallbackArgs = {
  transactionId: Scalars['String']['input'];
};


export type MutationPurchaseEsimArgs = {
  input: PurchaseEsimInput;
  planId: Scalars['ID']['input'];
};


export type MutationRemoveUserFromTenantArgs = {
  tenantSlug: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationReorderPricingRulesArgs = {
  updates: Array<PricingRulePriorityUpdate>;
};


export type MutationRestoreEsimArgs = {
  esimId: Scalars['ID']['input'];
};


export type MutationSendPhoneOtpArgs = {
  phoneNumber: Scalars['String']['input'];
};


export type MutationSignInArgs = {
  input: SignInInput;
};


export type MutationSignInWithAppleArgs = {
  input: SocialSignInInput;
};


export type MutationSignInWithGoogleArgs = {
  input: SocialSignInInput;
};


export type MutationSignUpArgs = {
  input: SignUpInput;
};


export type MutationSuspendEsimArgs = {
  esimId: Scalars['ID']['input'];
};


export type MutationToggleHighDemandCountryArgs = {
  countryId: Scalars['String']['input'];
};


export type MutationTogglePricingRuleArgs = {
  id: Scalars['ID']['input'];
};


export type MutationTriggerCatalogSyncArgs = {
  params: TriggerSyncParams;
};


export type MutationTriggerCheckoutPaymentArgs = {
  nameForBilling?: InputMaybe<Scalars['String']['input']>;
  redirectUrl: Scalars['String']['input'];
  sessionId: Scalars['String']['input'];
};


export type MutationUpdateCheckoutAuthArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  sessionId: Scalars['String']['input'];
};


export type MutationUpdateCheckoutAuthNameArgs = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  sessionId: Scalars['String']['input'];
};


export type MutationUpdateCheckoutDeliveryArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  sessionId: Scalars['String']['input'];
};


export type MutationUpdateCheckoutStepArgs = {
  input: UpdateCheckoutStepInput;
};


export type MutationUpdateEsimReferenceArgs = {
  esimId: Scalars['ID']['input'];
  reference: Scalars['String']['input'];
};


export type MutationUpdatePricingConfigurationArgs = {
  input: UpdatePricingConfigurationInput;
};


export type MutationUpdatePricingRuleArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePricingRuleInput;
};


export type MutationUpdatePricingRulePrioritiesArgs = {
  updates: Array<PricingRulePriorityUpdate>;
};


export type MutationUpdateProfileArgs = {
  input: UpdateProfileInput;
};


export type MutationUpdateTenantArgs = {
  input: UpdateTenantInput;
  slug: Scalars['ID']['input'];
};


export type MutationUpdateTripArgs = {
  input: UpdateTripInput;
};


export type MutationUpdateUserRoleArgs = {
  role: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationValidateOrderArgs = {
  input: ValidateOrderInput;
};


export type MutationVerifyOtpArgs = {
  otp: Scalars['String']['input'];
  sessionId: Scalars['String']['input'];
};


export type MutationVerifyPhoneOtpArgs = {
  input: VerifyOtpInput;
};

export type Order = {
  __typename?: 'Order';
  bundleId?: Maybe<Scalars['String']['output']>;
  bundleName?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  esims: Array<Esim>;
  id: Scalars['ID']['output'];
  quantity: Scalars['Int']['output'];
  reference: Scalars['String']['output'];
  status: OrderStatus;
  totalPrice: Scalars['Float']['output'];
  updatedAt: Scalars['String']['output'];
  user?: Maybe<User>;
};

export type OrderFilter = {
  fromDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<OrderStatus>;
  toDate?: InputMaybe<Scalars['String']['input']>;
};

export enum OrderStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Processing = 'PROCESSING',
  Refunded = 'REFUNDED'
}

export type PackageAssignment = {
  __typename?: 'PackageAssignment';
  assignedAt: Scalars['String']['output'];
  assignedBy: User;
  bundleId: Scalars['String']['output'];
  bundleName: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  status: AssignmentStatus;
  updatedAt: Scalars['String']['output'];
  user: User;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  currentPage: Scalars['Int']['output'];
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  pages: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type PaymentIntent = {
  __typename?: 'PaymentIntent';
  applePayJavaScriptUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  url: Scalars['String']['output'];
};

export enum PaymentMethod {
  Amex = 'AMEX',
  Bit = 'BIT',
  Diners = 'DINERS',
  ForeignCard = 'FOREIGN_CARD',
  IsraeliCard = 'ISRAELI_CARD'
}

export type PaymentMethodInfo = {
  __typename?: 'PaymentMethodInfo';
  description: Scalars['String']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  processingRate: Scalars['Float']['output'];
  value: PaymentMethod;
};

export type PriceRange = {
  __typename?: 'PriceRange';
  /** Average price (optional) */
  avg?: Maybe<Scalars['Float']['output']>;
  /** Currency code */
  currency: Scalars['String']['output'];
  /** Maximum price */
  max: Scalars['Float']['output'];
  /** Minimum price */
  min: Scalars['Float']['output'];
};

export type PricingBlock = {
  __typename?: 'PricingBlock';
  action: Scalars['JSON']['output'];
  category: Scalars['String']['output'];
  conditions: Scalars['JSON']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Scalars['ID']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isEditable: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  priority: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  validFrom?: Maybe<Scalars['DateTime']['output']>;
  validUntil?: Maybe<Scalars['DateTime']['output']>;
};

export type PricingBlockFilter = {
  category?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isEditable?: InputMaybe<Scalars['Boolean']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};

export type PricingBreakdown = {
  __typename?: 'PricingBreakdown';
  appliedRules?: Maybe<Array<AppliedRule>>;
  bundle: CountryBundle;
  calculationTimeMs?: Maybe<Scalars['Float']['output']>;
  cost: Scalars['Float']['output'];
  country: Country;
  currency: Scalars['String']['output'];
  customerDiscounts?: Maybe<Array<CustomerDiscount>>;
  debugInfo?: Maybe<Scalars['JSON']['output']>;
  discountPerDay: Scalars['Float']['output'];
  discountRate: Scalars['Float']['output'];
  discountValue: Scalars['Float']['output'];
  discounts?: Maybe<Array<DiscountApplication>>;
  duration: Scalars['Int']['output'];
  finalPrice: Scalars['Float']['output'];
  finalRevenue: Scalars['Float']['output'];
  markup: Scalars['Float']['output'];
  netProfit: Scalars['Float']['output'];
  priceAfterDiscount: Scalars['Float']['output'];
  pricingSteps?: Maybe<Array<PricingStep>>;
  processingCost: Scalars['Float']['output'];
  processingRate: Scalars['Float']['output'];
  revenueAfterProcessing: Scalars['Float']['output'];
  rulesEvaluated?: Maybe<Scalars['Int']['output']>;
  savingsAmount?: Maybe<Scalars['Float']['output']>;
  savingsPercentage?: Maybe<Scalars['Float']['output']>;
  selectedReason?: Maybe<Scalars['String']['output']>;
  totalCost: Scalars['Float']['output'];
  totalCostBeforeProcessing?: Maybe<Scalars['Float']['output']>;
  unusedDays?: Maybe<Scalars['Int']['output']>;
};

/** Statistics about the pricing cache */
export type PricingCacheStats = {
  __typename?: 'PricingCacheStats';
  /** Average key size in KB */
  avgKeySizeKB: Scalars['Float']['output'];
  /** Estimated total cache size in MB */
  estimatedSizeMB: Scalars['Float']['output'];
  /** Number of expired keys */
  expiredKeys: Scalars['Int']['output'];
  /** Timestamp when stats were collected */
  timestamp: Scalars['String']['output'];
  /** Total number of cache keys */
  totalKeys: Scalars['Int']['output'];
  /** Number of valid (non-expired) keys */
  validKeys: Scalars['Int']['output'];
};

export type PricingConfiguration = {
  __typename?: 'PricingConfiguration';
  bundleGroup?: Maybe<Scalars['String']['output']>;
  countryId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  createdBy: Scalars['String']['output'];
  description: Scalars['String']['output'];
  discountPerDay?: Maybe<Scalars['Float']['output']>;
  discountRate: Scalars['Float']['output'];
  duration?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  markupAmount?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  regionId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type PricingFilters = {
  __typename?: 'PricingFilters';
  dataTypes: Array<DataType>;
  durations: Array<DurationRange>;
  groups: Array<Scalars['String']['output']>;
};

/** Performance metrics for pricing calculations */
export type PricingPerformanceMetrics = {
  __typename?: 'PricingPerformanceMetrics';
  /** Error rate (0-1) */
  errorRate: Scalars['Float']['output'];
  /** Recent average batch size */
  recentAvgBatchSize: Scalars['Float']['output'];
  /** Recent average duration per batch (ms) */
  recentAvgDuration: Scalars['Float']['output'];
  /** Recent cache hit rate (0-1) */
  recentCacheHitRate: Scalars['Float']['output'];
  /** Timestamp when metrics were collected */
  timestamp: Scalars['String']['output'];
  /** Total number of pricing calculations performed */
  totalCalculations: Scalars['Int']['output'];
};

export type PricingPipelineStepUpdate = {
  __typename?: 'PricingPipelineStepUpdate';
  appliedRules?: Maybe<Array<Scalars['String']['output']>>;
  correlationId: Scalars['String']['output'];
  debug?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  state?: Maybe<Scalars['JSON']['output']>;
  timestamp: Scalars['String']['output'];
};

export type PricingRange = {
  __typename?: 'PricingRange';
  max: Scalars['Float']['output'];
  min: Scalars['Float']['output'];
};

export type PricingRule = {
  __typename?: 'PricingRule';
  actions: Array<RuleAction>;
  category: RuleCategory;
  conditions: Array<RuleCondition>;
  createdAt: Scalars['String']['output'];
  createdBy: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isEditable: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  priority: Scalars['Int']['output'];
  updatedAt: Scalars['String']['output'];
  validFrom?: Maybe<Scalars['String']['output']>;
  validUntil?: Maybe<Scalars['String']['output']>;
};

export type PricingRuleCalculation = {
  __typename?: 'PricingRuleCalculation';
  appliedRules: Array<AppliedRule>;
  baseCost: Scalars['Float']['output'];
  discounts: Array<DiscountApplication>;
  finalPrice: Scalars['Float']['output'];
  finalRevenue: Scalars['Float']['output'];
  markup: Scalars['Float']['output'];
  maxDiscountPercentage: Scalars['Float']['output'];
  maxRecommendedPrice: Scalars['Float']['output'];
  priceAfterDiscount: Scalars['Float']['output'];
  processingFee: Scalars['Float']['output'];
  processingRate: Scalars['Float']['output'];
  profit: Scalars['Float']['output'];
  revenueAfterProcessing: Scalars['Float']['output'];
  selectedBundle: CountryBundle;
  subtotal: Scalars['Float']['output'];
  totalDiscount: Scalars['Float']['output'];
};

export type PricingRuleFilter = {
  category?: InputMaybe<RuleCategory>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isEditable?: InputMaybe<Scalars['Boolean']['input']>;
  validFrom?: InputMaybe<Scalars['String']['input']>;
  validUntil?: InputMaybe<Scalars['String']['input']>;
};

export type PricingRulePriorityUpdate = {
  id: Scalars['ID']['input'];
  priority: Scalars['Int']['input'];
};

export type PricingStep = {
  __typename?: 'PricingStep';
  impact: Scalars['Float']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  priceAfter: Scalars['Float']['output'];
  priceBefore: Scalars['Float']['output'];
  ruleId?: Maybe<Scalars['ID']['output']>;
  timestamp?: Maybe<Scalars['Float']['output']>;
};

export type PricingStepUpdate = {
  __typename?: 'PricingStepUpdate';
  completedSteps: Scalars['Int']['output'];
  correlationId: Scalars['String']['output'];
  error?: Maybe<Scalars['String']['output']>;
  finalBreakdown?: Maybe<PricingBreakdown>;
  isComplete: Scalars['Boolean']['output'];
  step?: Maybe<PricingStep>;
  totalSteps: Scalars['Int']['output'];
};

export type PricingStrategy = {
  __typename?: 'PricingStrategy';
  activationCount?: Maybe<Scalars['Int']['output']>;
  archivedAt?: Maybe<Scalars['String']['output']>;
  blocks: Array<StrategyBlock>;
  code: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  createdBy: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isDefault: Scalars['Boolean']['output'];
  lastActivatedAt?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  parentStrategyId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
  validatedAt?: Maybe<Scalars['String']['output']>;
  validationErrors?: Maybe<Scalars['JSON']['output']>;
  version: Scalars['Int']['output'];
};

export type ProcessCheckoutPaymentInput = {
  token: Scalars['String']['input'];
};

export type ProcessCheckoutPaymentResponse = {
  __typename?: 'ProcessCheckoutPaymentResponse';
  error?: Maybe<Scalars['String']['output']>;
  orderId?: Maybe<Scalars['ID']['output']>;
  paymentIntentId?: Maybe<Scalars['String']['output']>;
  session?: Maybe<CheckoutSession>;
  success: Scalars['Boolean']['output'];
  webhookProcessing?: Maybe<Scalars['Boolean']['output']>;
};

export type ProcessingFeeConfiguration = {
  __typename?: 'ProcessingFeeConfiguration';
  appleGooglePayFee: Scalars['Float']['output'];
  bankWithdrawalFee: Scalars['Float']['output'];
  bitPaymentRate: Scalars['Float']['output'];
  cancellationFee: Scalars['Float']['output'];
  chargebackFee: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['String']['output'];
  effectiveFrom: Scalars['DateTime']['output'];
  effectiveTo?: Maybe<Scalars['DateTime']['output']>;
  fixedFeeForeign: Scalars['Float']['output'];
  fixedFeeNIS: Scalars['Float']['output'];
  foreignCardsRate: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  invoiceServiceFee: Scalars['Float']['output'];
  isActive: Scalars['Boolean']['output'];
  israeliCardsRate: Scalars['Float']['output'];
  monthlyFixedCost: Scalars['Float']['output'];
  monthlyMinimumFee: Scalars['Float']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  premiumAmexRate: Scalars['Float']['output'];
  premiumDinersRate: Scalars['Float']['output'];
  setupCost: Scalars['Float']['output'];
  threeDSecureFee: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ProcessingFeeConfigurationInput = {
  appleGooglePayFee: Scalars['Float']['input'];
  bankWithdrawalFee: Scalars['Float']['input'];
  bitPaymentRate: Scalars['Float']['input'];
  cancellationFee: Scalars['Float']['input'];
  chargebackFee: Scalars['Float']['input'];
  effectiveFrom: Scalars['DateTime']['input'];
  effectiveTo?: InputMaybe<Scalars['DateTime']['input']>;
  fixedFeeForeign: Scalars['Float']['input'];
  fixedFeeNIS: Scalars['Float']['input'];
  foreignCardsRate: Scalars['Float']['input'];
  invoiceServiceFee: Scalars['Float']['input'];
  israeliCardsRate: Scalars['Float']['input'];
  monthlyFixedCost: Scalars['Float']['input'];
  monthlyMinimumFee: Scalars['Float']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  premiumAmexRate: Scalars['Float']['input'];
  premiumDinersRate: Scalars['Float']['input'];
  setupCost: Scalars['Float']['input'];
  threeDSecureFee: Scalars['Float']['input'];
};

export type PurchaseEsimInput = {
  autoActivate?: InputMaybe<Scalars['Boolean']['input']>;
  customerReference?: InputMaybe<Scalars['String']['input']>;
  quantity: Scalars['Int']['input'];
};

export type PurchaseEsimResponse = {
  __typename?: 'PurchaseESIMResponse';
  error?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Order>;
  success: Scalars['Boolean']['output'];
};

export type Query = {
  __typename?: 'Query';
  activePricingRules: Array<PricingRule>;
  airHaloCompatibleDevices: AirHaloCompatibleDevicesResponse;
  airHaloPackages: AirHaloPackagesResponse;
  airHaloPricingData: Array<AirHaloPackage>;
  allTenants: TenantConnection;
  bundle: Bundle;
  bundleFilterOptions: BundleFilterOptions;
  bundleStats: BundleStats;
  bundles: BundleConnection;
  bundlesByCountry: Array<BundlesByCountry>;
  bundlesByGroup: Array<BundlesByGroup>;
  bundlesByRegion: Array<BundlesByRegion>;
  bundlesForCountry?: Maybe<BundlesForCountry>;
  bundlesForGroup?: Maybe<BundlesForGroup>;
  bundlesForRegion?: Maybe<BundlesForRegion>;
  calculatePrice: PricingBreakdown;
  calculatePrices: Array<PricingBreakdown>;
  catalogBundles: CatalogBundleConnection;
  catalogSyncHistory: CatalogSyncHistoryConnection;
  compareAirHaloPackages: Array<AirHaloPackageData>;
  conflictingPricingRules: Array<PricingRule>;
  countries: Array<Country>;
  defaultPricingStrategy?: Maybe<PricingStrategy>;
  esimDetails?: Maybe<Esim>;
  getAdminESIMDetails: AdminEsimDetails;
  getAllESIMs: Array<AdminEsim>;
  getCheckoutSession: GetCheckoutSessionResponse;
  getCustomerESIMs: Array<AdminEsim>;
  getUserOrders: Array<Order>;
  hello: Scalars['String']['output'];
  highDemandCountries: Array<Scalars['String']['output']>;
  me?: Maybe<User>;
  myESIMs: Array<Esim>;
  myOrders: Array<Order>;
  orderDetails?: Maybe<Order>;
  orders: Array<Order>;
  paymentMethods: Array<PaymentMethodInfo>;
  pricingBlock?: Maybe<PricingBlock>;
  pricingBlocks: Array<PricingBlock>;
  /** Get pricing cache statistics (Admin only) */
  pricingCacheStats?: Maybe<PricingCacheStats>;
  pricingFilters: PricingFilters;
  /** Get current pricing performance metrics (Admin only) */
  pricingPerformanceMetrics?: Maybe<PricingPerformanceMetrics>;
  pricingRule?: Maybe<PricingRule>;
  pricingRules: Array<PricingRule>;
  pricingStrategies: Array<PricingStrategy>;
  pricingStrategy?: Maybe<PricingStrategy>;
  simulatePricingRule: PricingBreakdown;
  tenant?: Maybe<Tenant>;
  tenants: Array<Tenant>;
  trips: Array<Trip>;
  users: Array<User>;
};


export type QueryAirHaloPackagesArgs = {
  filter?: InputMaybe<AirHaloPackageFilter>;
};


export type QueryAirHaloPricingDataArgs = {
  packageIds: Array<Scalars['String']['input']>;
};


export type QueryAllTenantsArgs = {
  filter?: InputMaybe<TenantFilter>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryBundleArgs = {
  id: Scalars['String']['input'];
};


export type QueryBundlesArgs = {
  filter?: InputMaybe<BundleFilter>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryBundlesByCountryArgs = {
  countryId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBundlesByGroupArgs = {
  groupId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBundlesByRegionArgs = {
  regionId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBundlesForCountryArgs = {
  countryCode: Scalars['String']['input'];
};


export type QueryBundlesForGroupArgs = {
  group: Scalars['String']['input'];
};


export type QueryBundlesForRegionArgs = {
  region: Scalars['String']['input'];
};


export type QueryCalculatePriceArgs = {
  input: CalculatePriceInput;
};


export type QueryCalculatePricesArgs = {
  inputs: Array<CalculatePriceInput>;
};


export type QueryCatalogBundlesArgs = {
  criteria?: InputMaybe<SearchCatalogCriteria>;
};


export type QueryCatalogSyncHistoryArgs = {
  params?: InputMaybe<SyncHistoryParams>;
};


export type QueryCompareAirHaloPackagesArgs = {
  countryCode: Scalars['String']['input'];
};


export type QueryConflictingPricingRulesArgs = {
  ruleId: Scalars['ID']['input'];
};


export type QueryEsimDetailsArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetAdminEsimDetailsArgs = {
  iccid: Scalars['String']['input'];
};


export type QueryGetCheckoutSessionArgs = {
  token: Scalars['String']['input'];
};


export type QueryGetCustomerEsiMsArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryGetUserOrdersArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryMyOrdersArgs = {
  filter?: InputMaybe<OrderFilter>;
};


export type QueryOrderDetailsArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPricingBlockArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPricingBlocksArgs = {
  filter?: InputMaybe<PricingBlockFilter>;
};


export type QueryPricingRuleArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPricingRulesArgs = {
  filter?: InputMaybe<PricingRuleFilter>;
};


export type QueryPricingStrategiesArgs = {
  filter?: InputMaybe<StrategyFilter>;
};


export type QueryPricingStrategyArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySimulatePricingRuleArgs = {
  rule: CreatePricingRuleInput;
  testContext: TestPricingContext;
};


export type QueryTenantArgs = {
  slug: Scalars['ID']['input'];
};

export type RuleAction = {
  __typename?: 'RuleAction';
  metadata?: Maybe<Scalars['JSON']['output']>;
  type: ActionType;
  value: Scalars['Float']['output'];
};

export type RuleActionInput = {
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  type: ActionType;
  value: Scalars['Float']['input'];
};

export enum RuleCategory {
  BundleAdjustment = 'BUNDLE_ADJUSTMENT',
  Constraint = 'CONSTRAINT',
  Discount = 'DISCOUNT',
  Fee = 'FEE'
}

export type RuleCondition = {
  __typename?: 'RuleCondition';
  field: Scalars['String']['output'];
  operator: ConditionOperator;
  type?: Maybe<Scalars['String']['output']>;
  value: Scalars['JSON']['output'];
};

export type RuleConditionInput = {
  field: Scalars['String']['input'];
  operator: ConditionOperator;
  type?: InputMaybe<Scalars['String']['input']>;
  value: Scalars['JSON']['input'];
};

export type SearchCatalogCriteria = {
  bundleGroups?: InputMaybe<Array<Scalars['String']['input']>>;
  countries?: InputMaybe<Array<Scalars['String']['input']>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  maxDuration?: InputMaybe<Scalars['Int']['input']>;
  minDuration?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  regions?: InputMaybe<Array<Scalars['String']['input']>>;
  search?: InputMaybe<Scalars['String']['input']>;
  unlimited?: InputMaybe<Scalars['Boolean']['input']>;
};

export type SendOtpResponse = {
  __typename?: 'SendOTPResponse';
  error?: Maybe<Scalars['String']['output']>;
  messageId?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type SignInInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type SignInResponse = {
  __typename?: 'SignInResponse';
  error?: Maybe<Scalars['String']['output']>;
  refreshToken?: Maybe<Scalars['String']['output']>;
  sessionToken?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  user?: Maybe<User>;
};

export type SignUpInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type SignUpResponse = {
  __typename?: 'SignUpResponse';
  error?: Maybe<Scalars['String']['output']>;
  refreshToken?: Maybe<Scalars['String']['output']>;
  sessionToken?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  user?: Maybe<User>;
};

export type SocialSignInInput = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  idToken: Scalars['String']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
};

export type StrategyBlock = {
  __typename?: 'StrategyBlock';
  configOverrides?: Maybe<Scalars['JSON']['output']>;
  isEnabled: Scalars['Boolean']['output'];
  pricingBlock: PricingBlock;
  priority: Scalars['Int']['output'];
};

export type StrategyFilter = {
  archived?: InputMaybe<Scalars['Boolean']['input']>;
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  calculatePricesBatchStream: PricingBreakdown;
  catalogSyncProgress: CatalogSyncProgressUpdate;
  checkout: Checkout;
  checkoutSessionUpdated: CheckoutSessionUpdate;
  esimStatusUpdated: EsimStatusUpdate;
  pricingCalculationSteps: PricingStepUpdate;
  pricingPipelineProgress: PricingPipelineStepUpdate;
};


export type SubscriptionCalculatePricesBatchStreamArgs = {
  inputs: Array<CalculatePriceInput>;
  requestedDays?: InputMaybe<Scalars['Int']['input']>;
};


export type SubscriptionCheckoutArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionCheckoutSessionUpdatedArgs = {
  token: Scalars['String']['input'];
};


export type SubscriptionEsimStatusUpdatedArgs = {
  esimId: Scalars['ID']['input'];
};


export type SubscriptionPricingCalculationStepsArgs = {
  input: CalculatePriceInput;
};


export type SubscriptionPricingPipelineProgressArgs = {
  correlationId: Scalars['String']['input'];
};

export type SyncHistoryParams = {
  fromDate?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<SyncJobStatus>;
  toDate?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<SyncJobType>;
};

export enum SyncJobStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING',
  Processing = 'PROCESSING'
}

export enum SyncJobType {
  CountrySync = 'COUNTRY_SYNC',
  FullSync = 'FULL_SYNC',
  GroupSync = 'GROUP_SYNC',
  MetadataSync = 'METADATA_SYNC'
}

export type Tenant = {
  __typename?: 'Tenant';
  createdAt: Scalars['String']['output'];
  imgUrl: Scalars['String']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['ID']['output'];
  tenantType: TenantType;
  updatedAt: Scalars['String']['output'];
  userCount?: Maybe<Scalars['Int']['output']>;
};

export type TenantConnection = {
  __typename?: 'TenantConnection';
  nodes: Array<Tenant>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type TenantFilter = {
  search?: InputMaybe<Scalars['String']['input']>;
  tenantType?: InputMaybe<TenantType>;
};

export type TenantOperationResponse = {
  __typename?: 'TenantOperationResponse';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export enum TenantType {
  Master = 'MASTER',
  Standard = 'STANDARD'
}

export type TestPricingContext = {
  bundleGroup: Scalars['String']['input'];
  bundleId: Scalars['String']['input'];
  bundleName: Scalars['String']['input'];
  cost: Scalars['Float']['input'];
  countryId: Scalars['String']['input'];
  duration: Scalars['Int']['input'];
  isNewUser?: InputMaybe<Scalars['Boolean']['input']>;
  paymentMethod: PaymentMethod;
  regionId: Scalars['String']['input'];
  requestedDuration?: InputMaybe<Scalars['Int']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type ToggleHighDemandResponse = {
  __typename?: 'ToggleHighDemandResponse';
  countryId: Scalars['String']['output'];
  error?: Maybe<Scalars['String']['output']>;
  isHighDemand: Scalars['Boolean']['output'];
  success: Scalars['Boolean']['output'];
};

export type Transaction = {
  __typename?: 'Transaction';
  amount?: Maybe<Scalars['Float']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
};

export type TriggerSyncParams = {
  bundleGroup?: InputMaybe<Scalars['String']['input']>;
  countryId?: InputMaybe<Scalars['String']['input']>;
  force?: InputMaybe<Scalars['Boolean']['input']>;
  priority?: InputMaybe<Scalars['String']['input']>;
  type: SyncJobType;
};

export type TriggerSyncResponse = {
  __typename?: 'TriggerSyncResponse';
  conflictingJob?: Maybe<ConflictingJobInfo>;
  error?: Maybe<Scalars['String']['output']>;
  jobId?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type Trip = {
  __typename?: 'Trip';
  bundleName?: Maybe<Scalars['String']['output']>;
  countries: Array<Country>;
  countryIds: Array<Scalars['ISOCountryCode']['output']>;
  createdAt: Scalars['String']['output'];
  createdBy?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  region: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type UpdateCheckoutStepInput = {
  data: Scalars['JSON']['input'];
  stepType: CheckoutStepType;
  token: Scalars['String']['input'];
};

export type UpdateCheckoutStepResponse = {
  __typename?: 'UpdateCheckoutStepResponse';
  error?: Maybe<Scalars['String']['output']>;
  nextStep?: Maybe<CheckoutStepType>;
  session?: Maybe<CheckoutSession>;
  success: Scalars['Boolean']['output'];
};

export type UpdatePricingConfigurationInput = {
  bundleGroup?: InputMaybe<Scalars['String']['input']>;
  countryId?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  discountPerDay?: InputMaybe<Scalars['Float']['input']>;
  discountRate: Scalars['Float']['input'];
  duration?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  isActive: Scalars['Boolean']['input'];
  markupAmount?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  regionId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePricingConfigurationResponse = {
  __typename?: 'UpdatePricingConfigurationResponse';
  configuration?: Maybe<PricingConfiguration>;
  error?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type UpdatePricingRuleInput = {
  actions?: InputMaybe<Array<RuleActionInput>>;
  category?: InputMaybe<RuleCategory>;
  conditions?: InputMaybe<Array<RuleConditionInput>>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  validFrom?: InputMaybe<Scalars['String']['input']>;
  validUntil?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProfileInput = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProfileResponse = {
  __typename?: 'UpdateProfileResponse';
  error?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  user?: Maybe<User>;
};

export type UpdateTenantInput = {
  imgUrl?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  tenantType?: InputMaybe<TenantType>;
};

export type UpdateTripInput = {
  bundleName: Scalars['String']['input'];
  description: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type UpdateTripResponse = {
  __typename?: 'UpdateTripResponse';
  error?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  trip?: Maybe<Trip>;
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['String']['output'];
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
  orderCount: Scalars['Int']['output'];
  phoneNumber?: Maybe<Scalars['String']['output']>;
  role: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type ValidateOrderInput = {
  bundleName: Scalars['String']['input'];
  customerReference?: InputMaybe<Scalars['String']['input']>;
  quantity: Scalars['Int']['input'];
};

export type ValidateOrderResponse = {
  __typename?: 'ValidateOrderResponse';
  bundleDetails?: Maybe<Scalars['JSON']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  errorCode?: Maybe<Scalars['String']['output']>;
  isValid: Scalars['Boolean']['output'];
  success: Scalars['Boolean']['output'];
  totalPrice?: Maybe<Scalars['Float']['output']>;
};

export type VerifyOtpInput = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  otp: Scalars['String']['input'];
  phoneNumber: Scalars['String']['input'];
};

export type ProcessPaymentCallbackMutationVariables = Exact<{
  transactionId: Scalars['String']['input'];
}>;


export type ProcessPaymentCallbackMutation = { __typename?: 'Mutation', processPaymentCallback: string };

export type UpdateCheckoutAuthMutationVariables = Exact<{
  sessionId: Scalars['String']['input'];
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateCheckoutAuthMutation = { __typename?: 'Mutation', updateCheckoutAuth: { __typename?: 'CheckoutAuth', completed: boolean, userId?: string | null, email?: string | null, phone?: string | null, firstName?: string | null, lastName?: string | null } };

export type VerifyOtpMutationVariables = Exact<{
  sessionId: Scalars['String']['input'];
  otp: Scalars['String']['input'];
}>;


export type VerifyOtpMutation = { __typename?: 'Mutation', verifyOTP: { __typename?: 'CheckoutAuthWithOTP', otpVerified?: boolean | null, authToken: string, refreshToken: string } };

export type UpdateCheckoutAuthNameMutationVariables = Exact<{
  sessionId: Scalars['String']['input'];
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateCheckoutAuthNameMutation = { __typename?: 'Mutation', updateCheckoutAuthName: { __typename?: 'CheckoutAuth', firstName?: string | null, lastName?: string | null } };

export type UpdateCheckoutDeliveryMutationVariables = Exact<{
  sessionId: Scalars['String']['input'];
  email?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateCheckoutDeliveryMutation = { __typename?: 'Mutation', updateCheckoutDelivery: { __typename?: 'CheckoutDelivery', phone?: string | null, completed: boolean, email?: string | null } };

export type TriggerCheckoutPaymentMutationVariables = Exact<{
  sessionId: Scalars['String']['input'];
  nameForBilling?: InputMaybe<Scalars['String']['input']>;
  redirectUrl: Scalars['String']['input'];
}>;


export type TriggerCheckoutPaymentMutation = { __typename?: 'Mutation', triggerCheckoutPayment: { __typename?: 'CheckoutPayment', phone?: string | null, email?: string | null, nameForBilling?: string | null, intent?: { __typename?: 'PaymentIntent', id: string, url: string, applePayJavaScriptUrl?: string | null } | null } };

export type CheckoutSubscriptionVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type CheckoutSubscription = { __typename?: 'Subscription', checkout: { __typename?: 'Checkout', id: string, bundle?: { __typename?: 'CheckoutBundle', completed: boolean, id: string, numOfDays: number, dataAmount: string, price: number, pricePerDay: number, currency: string, speed: Array<string>, discounts: Array<string>, validated?: boolean | null, country?: { __typename?: 'Country', iso: any, name: string } | null } | null, auth?: { __typename?: 'CheckoutAuth', completed: boolean, userId?: string | null, email?: string | null, phone?: string | null, firstName?: string | null, lastName?: string | null, method?: string | null, otpSent?: boolean | null, otpVerified?: boolean | null } | null, delivery?: { __typename?: 'CheckoutDelivery', completed: boolean, email?: string | null, phone?: string | null } | null, payment?: { __typename?: 'CheckoutPayment', completed: boolean, email?: string | null, phone?: string | null, nameForBilling?: string | null, redirectUrl?: string | null, intent?: { __typename?: 'PaymentIntent', id: string, url: string, applePayJavaScriptUrl?: string | null } | null } | null } };

export type CreateCheckoutMutationVariables = Exact<{
  numOfDays: Scalars['Int']['input'];
  countryId: Scalars['String']['input'];
}>;


export type CreateCheckoutMutation = { __typename?: 'Mutation', createCheckout?: string | null };

export type PricingCalculationStepsSubscriptionVariables = Exact<{
  input: CalculatePriceInput;
}>;


export type PricingCalculationStepsSubscription = { __typename?: 'Subscription', pricingCalculationSteps: { __typename?: 'PricingStepUpdate', correlationId: string, isComplete: boolean, totalSteps: number, completedSteps: number, step?: { __typename?: 'PricingStep', order: number, name: string, priceBefore: number, priceAfter: number, impact: number, ruleId?: string | null, metadata?: any | null, timestamp?: number | null } | null, finalBreakdown?: { __typename?: 'PricingBreakdown', finalPrice: number, currency: string, discountValue: number, savingsAmount?: number | null, savingsPercentage?: number | null, customerDiscounts?: Array<{ __typename?: 'CustomerDiscount', name: string, amount: number, percentage?: number | null, reason: string }> | null } | null } };

export type CreateCheckoutSessionMutationVariables = Exact<{
  input: CreateCheckoutSessionInput;
}>;


export type CreateCheckoutSessionMutation = { __typename?: 'Mutation', createCheckoutSession: { __typename?: 'CreateCheckoutSessionResponse', success: boolean, error?: string | null, session?: { __typename?: 'CheckoutSession', id: string, token: string, expiresAt: any, isComplete: boolean, timeRemaining?: number | null, planSnapshot?: any | null, pricing?: any | null, steps?: any | null, paymentStatus?: string | null, metadata?: any | null } | null } };

export type UpdateCheckoutStepMutationVariables = Exact<{
  input: UpdateCheckoutStepInput;
}>;


export type UpdateCheckoutStepMutation = { __typename?: 'Mutation', updateCheckoutStep: { __typename?: 'UpdateCheckoutStepResponse', success: boolean, nextStep?: CheckoutStepType | null, error?: string | null, session?: { __typename?: 'CheckoutSession', id: string, isComplete: boolean, steps?: any | null, timeRemaining?: number | null } | null } };

export type ProcessCheckoutPaymentMutationVariables = Exact<{
  input: ProcessCheckoutPaymentInput;
}>;


export type ProcessCheckoutPaymentMutation = { __typename?: 'Mutation', processCheckoutPayment: { __typename?: 'ProcessCheckoutPaymentResponse', success: boolean, orderId?: string | null, webhookProcessing?: boolean | null, error?: string | null, session?: { __typename?: 'CheckoutSession', isComplete: boolean, paymentStatus?: string | null } | null } };

export type GetCheckoutSessionQueryVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type GetCheckoutSessionQuery = { __typename?: 'Query', getCheckoutSession: { __typename?: 'GetCheckoutSessionResponse', success: boolean, error?: string | null, session?: { __typename?: 'CheckoutSession', id: string, orderId?: string | null, isComplete: boolean, isValidated: boolean, paymentStatus?: string | null, timeRemaining?: number | null, steps?: any | null, metadata?: any | null, planSnapshot?: any | null, pricing?: any | null } | null } };

export type OrderDetailsQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type OrderDetailsQuery = { __typename?: 'Query', orderDetails?: { __typename?: 'Order', id: string, reference: string, status: OrderStatus, totalPrice: number, esims: Array<{ __typename?: 'ESIM', id: string, iccid: string, qrCode?: string | null, status: EsimStatus, smdpAddress?: string | null, matchingId?: string | null, installationLinks?: { __typename?: 'InstallationLinks', universalLink: string, lpaScheme: string, qrCodeData: string, manual: { __typename?: 'ManualInstallation', smDpAddress: string, activationCode: string, confirmationCode?: string | null } } | null }> } | null };

export type GetUserOrdersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUserOrdersQuery = { __typename?: 'Query', myOrders: Array<{ __typename?: 'Order', id: string, reference: string, status: OrderStatus, totalPrice: number, currency: string, createdAt: string, esims: Array<{ __typename?: 'ESIM', id: string, status: EsimStatus }> }> };

export type ValidateOrderMutationVariables = Exact<{
  input: ValidateOrderInput;
}>;


export type ValidateOrderMutation = { __typename?: 'Mutation', validateOrder: { __typename?: 'ValidateOrderResponse', success: boolean, isValid: boolean, bundleDetails?: any | null, totalPrice?: number | null, currency?: string | null, error?: string | null, errorCode?: string | null } };

export type CheckoutSessionUpdatedSubscriptionVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type CheckoutSessionUpdatedSubscription = { __typename?: 'Subscription', checkoutSessionUpdated: { __typename?: 'CheckoutSessionUpdate', updateType: CheckoutUpdateType, timestamp: any, session: { __typename?: 'CheckoutSession', id: string, orderId?: string | null, isComplete: boolean, isValidated: boolean, paymentStatus?: string | null, timeRemaining?: number | null, steps?: any | null, metadata?: any | null, planSnapshot?: any | null, pricing?: any | null } } };

export type SignInMutationVariables = Exact<{
  input: SignInInput;
}>;


export type SignInMutation = { __typename?: 'Mutation', signIn?: { __typename?: 'SignInResponse', success: boolean, error?: string | null, sessionToken?: string | null, refreshToken?: string | null, user?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, phoneNumber?: string | null, createdAt: string, updatedAt: string } | null } | null };

export type SignUpMutationVariables = Exact<{
  input: SignUpInput;
}>;


export type SignUpMutation = { __typename?: 'Mutation', signUp?: { __typename?: 'SignUpResponse', success: boolean, error?: string | null, sessionToken?: string | null, refreshToken?: string | null, user?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, phoneNumber?: string | null, createdAt: string, updatedAt: string } | null } | null };

export type SignInWithAppleMutationVariables = Exact<{
  input: SocialSignInInput;
}>;


export type SignInWithAppleMutation = { __typename?: 'Mutation', signInWithApple?: { __typename?: 'SignInResponse', success: boolean, error?: string | null, sessionToken?: string | null, refreshToken?: string | null, user?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, phoneNumber?: string | null, createdAt: string, updatedAt: string } | null } | null };

export type SignInWithGoogleMutationVariables = Exact<{
  input: SocialSignInInput;
}>;


export type SignInWithGoogleMutation = { __typename?: 'Mutation', signInWithGoogle?: { __typename?: 'SignInResponse', success: boolean, error?: string | null, sessionToken?: string | null, refreshToken?: string | null, user?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, phoneNumber?: string | null, createdAt: string, updatedAt: string } | null } | null };

export type SendPhoneOtpMutationVariables = Exact<{
  phoneNumber: Scalars['String']['input'];
}>;


export type SendPhoneOtpMutation = { __typename?: 'Mutation', sendPhoneOTP?: { __typename?: 'SendOTPResponse', success: boolean, error?: string | null, messageId?: string | null } | null };

export type VerifyPhoneOtpMutationVariables = Exact<{
  input: VerifyOtpInput;
}>;


export type VerifyPhoneOtpMutation = { __typename?: 'Mutation', verifyPhoneOTP?: { __typename?: 'SignInResponse', success: boolean, error?: string | null, sessionToken?: string | null, refreshToken?: string | null, user?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, phoneNumber?: string | null, createdAt: string, updatedAt: string } | null } | null };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, phoneNumber?: string | null, createdAt: string, updatedAt: string } | null };

export type GetCountriesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCountriesQuery = { __typename?: 'Query', countries: Array<{ __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region?: string | null, flag?: string | null }> };

export type GetCountriesWithBundlesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCountriesWithBundlesQuery = { __typename?: 'Query', bundlesByCountry: Array<{ __typename?: 'BundlesByCountry', country: { __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region?: string | null, flag?: string | null } }> };

export type GetTripsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTripsQuery = { __typename?: 'Query', trips: Array<{ __typename?: 'Trip', name: string, description: string, region: string, countryIds: Array<any> }> };

export type CalculatePriceQueryVariables = Exact<{
  input: CalculatePriceInput;
}>;


export type CalculatePriceQuery = { __typename?: 'Query', calculatePrice: { __typename?: 'PricingBreakdown', duration: number, currency: string, totalCost: number, discountValue: number, priceAfterDiscount: number, bundle: { __typename?: 'CountryBundle', id: string, name: string, duration: number, isUnlimited: boolean, data?: number | null, group?: string | null, country: { __typename?: 'Country', iso: any, name: string } }, country: { __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region?: string | null, flag?: string | null } } };

export type CalculatePricesBatchQueryVariables = Exact<{
  inputs: Array<CalculatePriceInput> | CalculatePriceInput;
}>;


export type CalculatePricesBatchQuery = { __typename?: 'Query', calculatePrices: Array<{ __typename?: 'PricingBreakdown', duration: number, currency: string, totalCost: number, discountValue: number, finalPrice: number, priceAfterDiscount: number, bundle: { __typename?: 'CountryBundle', id: string, name: string, duration: number, isUnlimited: boolean, data?: number | null, group?: string | null, country: { __typename?: 'Country', iso: any, name: string } }, country: { __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region?: string | null, flag?: string | null } }> };

export type GetMyEsiMsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyEsiMsQuery = { __typename?: 'Query', myESIMs: Array<{ __typename?: 'ESIM', id: string, iccid: string, qrCode?: string | null, status: EsimStatus, assignedDate?: string | null, lastAction?: string | null, actionDate?: string | null, bundleId: string, bundleName: string, usage: { __typename?: 'ESIMUsage', totalUsed: number, totalRemaining?: number | null, activeBundles: Array<{ __typename?: 'ESIMBundle', name: string, state: BundleState, dataUsed: number, dataRemaining?: number | null, startDate?: string | null, endDate?: string | null }> }, bundles: Array<{ __typename?: 'ESIMBundle', name: string, state: BundleState, dataUsed: number, dataRemaining?: number | null, startDate?: string | null, endDate?: string | null }>, order: { __typename?: 'Order', id: string, reference: string, status: OrderStatus, totalPrice: number, createdAt: string } }> };

export type GetActiveEsimPlanQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActiveEsimPlanQuery = { __typename?: 'Query', myESIMs: Array<{ __typename?: 'ESIM', id: string, iccid: string, qrCode?: string | null, status: EsimStatus, assignedDate?: string | null, bundleId: string, bundleName: string, usage: { __typename?: 'ESIMUsage', totalUsed: number, totalRemaining?: number | null, activeBundles: Array<{ __typename?: 'ESIMBundle', name: string, state: BundleState, dataUsed: number, dataRemaining?: number | null, startDate?: string | null, endDate?: string | null }> }, bundles: Array<{ __typename?: 'ESIMBundle', name: string, state: BundleState, dataUsed: number, dataRemaining?: number | null, startDate?: string | null, endDate?: string | null }> }> };

export type UpdateProfileMutationVariables = Exact<{
  input: UpdateProfileInput;
}>;


export type UpdateProfileMutation = { __typename?: 'Mutation', updateProfile?: { __typename?: 'UpdateProfileResponse', success: boolean, error?: string | null, user?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, phoneNumber?: string | null, createdAt: string, updatedAt: string } | null } | null };

export type PricingDiscountsUpdateSubscriptionVariables = Exact<{
  input: CalculatePriceInput;
}>;


export type PricingDiscountsUpdateSubscription = { __typename?: 'Subscription', pricingCalculationSteps: { __typename?: 'PricingStepUpdate', correlationId: string, isComplete: boolean, totalSteps: number, completedSteps: number, error?: string | null, finalBreakdown?: { __typename?: 'PricingBreakdown', totalCost: number, discountValue: number, priceAfterDiscount: number, currency: string, savingsAmount?: number | null, savingsPercentage?: number | null, customerDiscounts?: Array<{ __typename?: 'CustomerDiscount', name: string, amount: number, percentage?: number | null, reason: string }> | null } | null } };

export type CalculateDestinationPricesQueryVariables = Exact<{
  inputs: Array<CalculatePriceInput> | CalculatePriceInput;
}>;


export type CalculateDestinationPricesQuery = { __typename?: 'Query', calculatePrices: Array<{ __typename?: 'PricingBreakdown', finalPrice: number, currency: string, country: { __typename?: 'Country', iso: any } }> };

export type GetBundleStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBundleStatsQuery = { __typename?: 'Query', bundleStats: { __typename?: 'BundleStats', totalBundles: number, totalCountries: number, totalRegions: number, totalGroups: number } };

export type CalculatePricesBatchStreamSubscriptionVariables = Exact<{
  inputs: Array<CalculatePriceInput> | CalculatePriceInput;
  requestedDays?: InputMaybe<Scalars['Int']['input']>;
}>;


export type CalculatePricesBatchStreamSubscription = { __typename?: 'Subscription', calculatePricesBatchStream: { __typename?: 'PricingBreakdown', finalPrice: number, currency: string, totalCost: number, discountValue: number, duration: number, savingsAmount?: number | null, savingsPercentage?: number | null, bundle: { __typename?: 'CountryBundle', id: string, name: string, duration: number, isUnlimited: boolean, data?: number | null, group?: string | null, country: { __typename?: 'Country', iso: any, name: string } }, country: { __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region?: string | null, flag?: string | null }, pricingSteps?: Array<{ __typename?: 'PricingStep', order: number, name: string, priceBefore: number, priceAfter: number, impact: number, ruleId?: string | null, metadata?: any | null, timestamp?: number | null }> | null, customerDiscounts?: Array<{ __typename?: 'CustomerDiscount', name: string, amount: number, percentage?: number | null, reason: string }> | null } };


export const ProcessPaymentCallbackDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProcessPaymentCallback"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"transactionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processPaymentCallback"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"transactionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"transactionId"}}}]}]}}]} as unknown as DocumentNode<ProcessPaymentCallbackMutation, ProcessPaymentCallbackMutationVariables>;
export const UpdateCheckoutAuthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCheckoutAuth"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"firstName"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lastName"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phone"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCheckoutAuth"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"firstName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"firstName"}}},{"kind":"Argument","name":{"kind":"Name","value":"lastName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lastName"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"phone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phone"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CheckoutAuth"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completed"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCheckoutAuthMutation, UpdateCheckoutAuthMutationVariables>;
export const VerifyOtpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyOTP"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"otp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyOTP"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"otp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"otp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CheckoutAuthWithOTP"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"otpVerified"}},{"kind":"Field","name":{"kind":"Name","value":"authToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}}]}}]}}]}}]} as unknown as DocumentNode<VerifyOtpMutation, VerifyOtpMutationVariables>;
export const UpdateCheckoutAuthNameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCheckoutAuthName"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"firstName"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lastName"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCheckoutAuthName"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"firstName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"firstName"}}},{"kind":"Argument","name":{"kind":"Name","value":"lastName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lastName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CheckoutAuth"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCheckoutAuthNameMutation, UpdateCheckoutAuthNameMutationVariables>;
export const UpdateCheckoutDeliveryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCheckoutDelivery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phone"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCheckoutDelivery"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"phone"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phone"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"completed"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<UpdateCheckoutDeliveryMutation, UpdateCheckoutDeliveryMutationVariables>;
export const TriggerCheckoutPaymentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TriggerCheckoutPayment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nameForBilling"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"redirectUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerCheckoutPayment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"nameForBilling"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nameForBilling"}}},{"kind":"Argument","name":{"kind":"Name","value":"redirectUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"redirectUrl"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"intent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"applePayJavaScriptUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"nameForBilling"}}]}}]}}]} as unknown as DocumentNode<TriggerCheckoutPaymentMutation, TriggerCheckoutPaymentMutationVariables>;
export const CheckoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"Checkout"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"checkout"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"bundle"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completed"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"numOfDays"}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataAmount"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"pricePerDay"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"discounts"}},{"kind":"Field","name":{"kind":"Name","value":"validated"}}]}},{"kind":"Field","name":{"kind":"Name","value":"auth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completed"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"method"}},{"kind":"Field","name":{"kind":"Name","value":"otpSent"}},{"kind":"Field","name":{"kind":"Name","value":"otpVerified"}}]}},{"kind":"Field","name":{"kind":"Name","value":"delivery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completed"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completed"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"nameForBilling"}},{"kind":"Field","name":{"kind":"Name","value":"intent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"applePayJavaScriptUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"redirectUrl"}}]}}]}}]}}]} as unknown as DocumentNode<CheckoutSubscription, CheckoutSubscriptionVariables>;
export const CreateCheckoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCheckout"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"numOfDays"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCheckout"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"numOfDays"},"value":{"kind":"Variable","name":{"kind":"Name","value":"numOfDays"}}},{"kind":"Argument","name":{"kind":"Name","value":"countryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}}}]}]}}]} as unknown as DocumentNode<CreateCheckoutMutation, CreateCheckoutMutationVariables>;
export const PricingCalculationStepsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PricingCalculationSteps"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CalculatePriceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingCalculationSteps"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"correlationId"}},{"kind":"Field","name":{"kind":"Name","value":"isComplete"}},{"kind":"Field","name":{"kind":"Name","value":"totalSteps"}},{"kind":"Field","name":{"kind":"Name","value":"completedSteps"}},{"kind":"Field","name":{"kind":"Name","value":"step"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"priceBefore"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfter"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}},{"kind":"Field","name":{"kind":"Name","value":"ruleId"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"finalBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"finalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"savingsAmount"}},{"kind":"Field","name":{"kind":"Name","value":"savingsPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"customerDiscounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}}]}}]}}]}}]}}]} as unknown as DocumentNode<PricingCalculationStepsSubscription, PricingCalculationStepsSubscriptionVariables>;
export const CreateCheckoutSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCheckoutSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCheckoutSessionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCheckoutSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"session"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"isComplete"}},{"kind":"Field","name":{"kind":"Name","value":"timeRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"planSnapshot"}},{"kind":"Field","name":{"kind":"Name","value":"pricing"}},{"kind":"Field","name":{"kind":"Name","value":"steps"}},{"kind":"Field","name":{"kind":"Name","value":"paymentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}}]}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<CreateCheckoutSessionMutation, CreateCheckoutSessionMutationVariables>;
export const UpdateCheckoutStepDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCheckoutStep"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCheckoutStepInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCheckoutStep"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"session"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isComplete"}},{"kind":"Field","name":{"kind":"Name","value":"steps"}},{"kind":"Field","name":{"kind":"Name","value":"timeRemaining"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextStep"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<UpdateCheckoutStepMutation, UpdateCheckoutStepMutationVariables>;
export const ProcessCheckoutPaymentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProcessCheckoutPayment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProcessCheckoutPaymentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processCheckoutPayment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"session"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isComplete"}},{"kind":"Field","name":{"kind":"Name","value":"paymentStatus"}}]}},{"kind":"Field","name":{"kind":"Name","value":"webhookProcessing"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<ProcessCheckoutPaymentMutation, ProcessCheckoutPaymentMutationVariables>;
export const GetCheckoutSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCheckoutSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCheckoutSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"session"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"isComplete"}},{"kind":"Field","name":{"kind":"Name","value":"isValidated"}},{"kind":"Field","name":{"kind":"Name","value":"paymentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"timeRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"steps"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"planSnapshot"}},{"kind":"Field","name":{"kind":"Name","value":"pricing"}}]}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<GetCheckoutSessionQuery, GetCheckoutSessionQueryVariables>;
export const OrderDetailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OrderDetails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orderDetails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"esims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"iccid"}},{"kind":"Field","name":{"kind":"Name","value":"qrCode"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"smdpAddress"}},{"kind":"Field","name":{"kind":"Name","value":"matchingId"}},{"kind":"Field","name":{"kind":"Name","value":"installationLinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"universalLink"}},{"kind":"Field","name":{"kind":"Name","value":"lpaScheme"}},{"kind":"Field","name":{"kind":"Name","value":"qrCodeData"}},{"kind":"Field","name":{"kind":"Name","value":"manual"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"smDpAddress"}},{"kind":"Field","name":{"kind":"Name","value":"activationCode"}},{"kind":"Field","name":{"kind":"Name","value":"confirmationCode"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<OrderDetailsQuery, OrderDetailsQueryVariables>;
export const GetUserOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserOrders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myOrders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"esims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<GetUserOrdersQuery, GetUserOrdersQueryVariables>;
export const ValidateOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ValidateOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ValidateOrderInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"validateOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"isValid"}},{"kind":"Field","name":{"kind":"Name","value":"bundleDetails"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"errorCode"}}]}}]}}]} as unknown as DocumentNode<ValidateOrderMutation, ValidateOrderMutationVariables>;
export const CheckoutSessionUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"CheckoutSessionUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"checkoutSessionUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"session"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"isComplete"}},{"kind":"Field","name":{"kind":"Name","value":"isValidated"}},{"kind":"Field","name":{"kind":"Name","value":"paymentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"timeRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"steps"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"planSnapshot"}},{"kind":"Field","name":{"kind":"Name","value":"pricing"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updateType"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]}}]} as unknown as DocumentNode<CheckoutSessionUpdatedSubscription, CheckoutSessionUpdatedSubscriptionVariables>;
export const SignInDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SignIn"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SignInInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signIn"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sessionToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}}]}}]}}]} as unknown as DocumentNode<SignInMutation, SignInMutationVariables>;
export const SignUpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SignUp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SignUpInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signUp"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sessionToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}}]}}]}}]} as unknown as DocumentNode<SignUpMutation, SignUpMutationVariables>;
export const SignInWithAppleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SignInWithApple"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SocialSignInInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signInWithApple"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sessionToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}}]}}]}}]} as unknown as DocumentNode<SignInWithAppleMutation, SignInWithAppleMutationVariables>;
export const SignInWithGoogleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SignInWithGoogle"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SocialSignInInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signInWithGoogle"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sessionToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}}]}}]}}]} as unknown as DocumentNode<SignInWithGoogleMutation, SignInWithGoogleMutationVariables>;
export const SendPhoneOtpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendPhoneOTP"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"phoneNumber"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendPhoneOTP"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"phoneNumber"},"value":{"kind":"Variable","name":{"kind":"Name","value":"phoneNumber"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}}]}}]}}]} as unknown as DocumentNode<SendPhoneOtpMutation, SendPhoneOtpMutationVariables>;
export const VerifyPhoneOtpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyPhoneOTP"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VerifyOTPInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyPhoneOTP"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sessionToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}}]}}]}}]} as unknown as DocumentNode<VerifyPhoneOtpMutation, VerifyPhoneOtpMutationVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const GetCountriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCountries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}}]}}]} as unknown as DocumentNode<GetCountriesQuery, GetCountriesQueryVariables>;
export const GetCountriesWithBundlesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCountriesWithBundles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundlesByCountry"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}}]}}]}}]} as unknown as DocumentNode<GetCountriesWithBundlesQuery, GetCountriesWithBundlesQueryVariables>;
export const GetTripsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTrips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"countryIds"}}]}}]}}]} as unknown as DocumentNode<GetTripsQuery, GetTripsQueryVariables>;
export const CalculatePriceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalculatePrice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CalculatePriceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculatePrice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundle"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"group"}}]}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}}]}}]}}]} as unknown as DocumentNode<CalculatePriceQuery, CalculatePriceQueryVariables>;
export const CalculatePricesBatchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalculatePricesBatch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CalculatePriceInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculatePrices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundle"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"group"}}]}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"finalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}}]}}]}}]} as unknown as DocumentNode<CalculatePricesBatchQuery, CalculatePricesBatchQueryVariables>;
export const GetMyEsiMsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyESIMs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myESIMs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"iccid"}},{"kind":"Field","name":{"kind":"Name","value":"qrCode"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"assignedDate"}},{"kind":"Field","name":{"kind":"Name","value":"lastAction"}},{"kind":"Field","name":{"kind":"Name","value":"actionDate"}},{"kind":"Field","name":{"kind":"Name","value":"bundleId"}},{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"usage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalUsed"}},{"kind":"Field","name":{"kind":"Name","value":"totalRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"activeBundles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"dataUsed"}},{"kind":"Field","name":{"kind":"Name","value":"dataRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"bundles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"dataUsed"}},{"kind":"Field","name":{"kind":"Name","value":"dataRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetMyEsiMsQuery, GetMyEsiMsQueryVariables>;
export const GetActiveEsimPlanDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActiveESIMPlan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myESIMs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"iccid"}},{"kind":"Field","name":{"kind":"Name","value":"qrCode"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"assignedDate"}},{"kind":"Field","name":{"kind":"Name","value":"bundleId"}},{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"usage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalUsed"}},{"kind":"Field","name":{"kind":"Name","value":"totalRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"activeBundles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"dataUsed"}},{"kind":"Field","name":{"kind":"Name","value":"dataRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"bundles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"dataUsed"}},{"kind":"Field","name":{"kind":"Name","value":"dataRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}}]}}]}}]}}]} as unknown as DocumentNode<GetActiveEsimPlanQuery, GetActiveEsimPlanQueryVariables>;
export const UpdateProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const PricingDiscountsUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PricingDiscountsUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CalculatePriceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingCalculationSteps"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"correlationId"}},{"kind":"Field","name":{"kind":"Name","value":"isComplete"}},{"kind":"Field","name":{"kind":"Name","value":"totalSteps"}},{"kind":"Field","name":{"kind":"Name","value":"completedSteps"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finalBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"customerDiscounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}}]}},{"kind":"Field","name":{"kind":"Name","value":"savingsAmount"}},{"kind":"Field","name":{"kind":"Name","value":"savingsPercentage"}}]}}]}}]}}]} as unknown as DocumentNode<PricingDiscountsUpdateSubscription, PricingDiscountsUpdateSubscriptionVariables>;
export const CalculateDestinationPricesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalculateDestinationPrices"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CalculatePriceInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculatePrices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"finalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}}]}}]}}]}}]} as unknown as DocumentNode<CalculateDestinationPricesQuery, CalculateDestinationPricesQueryVariables>;
export const GetBundleStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBundleStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalBundles"}},{"kind":"Field","name":{"kind":"Name","value":"totalCountries"}},{"kind":"Field","name":{"kind":"Name","value":"totalRegions"}},{"kind":"Field","name":{"kind":"Name","value":"totalGroups"}}]}}]}}]} as unknown as DocumentNode<GetBundleStatsQuery, GetBundleStatsQueryVariables>;
export const CalculatePricesBatchStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"CalculatePricesBatchStream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CalculatePriceInput"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requestedDays"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculatePricesBatchStream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}}},{"kind":"Argument","name":{"kind":"Name","value":"requestedDays"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requestedDays"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"finalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"bundle"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pricingSteps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"priceBefore"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfter"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}},{"kind":"Field","name":{"kind":"Name","value":"ruleId"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"savingsAmount"}},{"kind":"Field","name":{"kind":"Name","value":"savingsPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"customerDiscounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}}]}}]}}]}}]} as unknown as DocumentNode<CalculatePricesBatchStreamSubscription, CalculatePricesBatchStreamSubscriptionVariables>;