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
  provider: Provider;
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
  provider: Provider;
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
  provider: Provider;
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
  invalidateCacheByRuleChange?: Maybe<CacheOperationResult>;
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

export enum Provider {
  EsimGo = 'ESIM_GO',
  Maya = 'MAYA'
}

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
  provider?: InputMaybe<Provider>;
  type: SyncJobType;
};

export type TriggerSyncResponse = {
  __typename?: 'TriggerSyncResponse';
  conflictingJob?: Maybe<ConflictingJobInfo>;
  error?: Maybe<Scalars['String']['output']>;
  jobId?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  provider?: Maybe<Provider>;
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

export type CatalogSyncProgressSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type CatalogSyncProgressSubscription = { __typename?: 'Subscription', catalogSyncProgress: { __typename?: 'CatalogSyncProgressUpdate', jobId: string, jobType: SyncJobType, status: SyncJobStatus, bundleGroup?: string | null, countryId?: string | null, bundlesProcessed: number, bundlesAdded: number, bundlesUpdated: number, totalBundles?: number | null, progress: number, message?: string | null, errorMessage?: string | null, startedAt: string, updatedAt: string } };

export type GetAdminEsimDetailsQueryVariables = Exact<{
  iccid: Scalars['String']['input'];
}>;


export type GetAdminEsimDetailsQuery = { __typename?: 'Query', getAdminESIMDetails: { __typename?: 'AdminESIMDetails', id: string, iccid: string, userId: string, orderId: string, status: string, customerRef?: string | null, assignedDate?: string | null, activationCode?: string | null, qrCodeUrl?: string | null, smdpAddress?: string | null, matchingId?: string | null, lastAction?: string | null, actionDate?: string | null, createdAt: string, updatedAt?: string | null, apiDetails?: any | null, usage?: { __typename?: 'ESIMUsage', totalUsed: number, totalRemaining?: number | null, activeBundles: Array<{ __typename?: 'ESIMBundle', id: string, name: string, state: BundleState, dataUsed: number, dataRemaining?: number | null, startDate?: string | null, endDate?: string | null }> } | null, order?: { __typename?: 'Order', id: string, reference: string, status: OrderStatus, bundleName?: string | null, totalPrice: number, createdAt: string } | null } };

export type GetOrderDetailsQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetOrderDetailsQuery = { __typename?: 'Query', orderDetails?: { __typename?: 'Order', id: string, reference: string, status: OrderStatus, quantity: number, totalPrice: number, createdAt: string, updatedAt: string, bundleId?: string | null, bundleName?: string | null, user?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, phoneNumber?: string | null, role: string } | null, esims: Array<{ __typename?: 'ESIM', id: string, iccid: string, status: EsimStatus, qrCode?: string | null, smdpAddress?: string | null, matchingId?: string | null, customerRef?: string | null, assignedDate?: string | null, lastAction?: string | null, actionDate?: string | null, createdAt: string, installationLinks?: { __typename?: 'InstallationLinks', universalLink: string, lpaScheme: string } | null }> } | null };

export type GetCustomerEsiMsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetCustomerEsiMsQuery = { __typename?: 'Query', getCustomerESIMs: Array<{ __typename?: 'AdminESIM', id: string, iccid: string, status: string, apiStatus?: string | null, customerRef?: string | null, assignedDate?: string | null, lastAction?: string | null, actionDate?: string | null, createdAt: string, esim_bundles?: Array<any | null> | null, usage?: { __typename?: 'ESIMUsage', totalUsed: number, totalRemaining?: number | null } | null }> };

export type GetPricingBlocksQueryVariables = Exact<{
  filter?: InputMaybe<PricingBlockFilter>;
}>;


export type GetPricingBlocksQuery = { __typename?: 'Query', pricingBlocks: Array<{ __typename?: 'PricingBlock', id: string, name: string, description?: string | null, category: string, conditions: any, action: any, priority: number, isActive: boolean, isEditable: boolean, validFrom?: any | null, validUntil?: any | null, createdBy?: string | null, createdAt: any, updatedAt: any }> };

export type GetPricingBlockQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetPricingBlockQuery = { __typename?: 'Query', pricingBlock?: { __typename?: 'PricingBlock', id: string, name: string, description?: string | null, category: string, conditions: any, action: any, priority: number, isActive: boolean, isEditable: boolean, validFrom?: any | null, validUntil?: any | null, createdBy?: string | null, createdAt: any, updatedAt: any } | null };

export type GetPricingStrategiesQueryVariables = Exact<{
  filter?: InputMaybe<StrategyFilter>;
}>;


export type GetPricingStrategiesQuery = { __typename?: 'Query', pricingStrategies: Array<{ __typename?: 'PricingStrategy', id: string, name: string, code: string, description?: string | null, version: number, isDefault: boolean, activationCount?: number | null, lastActivatedAt?: string | null, validatedAt?: string | null, validationErrors?: any | null, archivedAt?: string | null, createdAt: string, createdBy: string, updatedAt?: string | null, updatedBy?: string | null, parentStrategyId?: string | null }> };

export type GetPricingStrategyQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetPricingStrategyQuery = { __typename?: 'Query', pricingStrategy?: { __typename?: 'PricingStrategy', id: string, name: string, code: string, description?: string | null, version: number, isDefault: boolean, activationCount?: number | null, lastActivatedAt?: string | null, validatedAt?: string | null, validationErrors?: any | null, archivedAt?: string | null, createdAt: string, createdBy: string, updatedAt?: string | null, updatedBy?: string | null, parentStrategyId?: string | null, blocks: Array<{ __typename?: 'StrategyBlock', priority: number, isEnabled: boolean, configOverrides?: any | null, pricingBlock: { __typename?: 'PricingBlock', id: string, name: string, description?: string | null, category: string, conditions: any, action: any, priority: number, isActive: boolean, isEditable: boolean, validFrom?: any | null, validUntil?: any | null, createdBy?: string | null, createdAt: any, updatedAt: any } }> } | null };

export type GetDefaultPricingStrategyQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDefaultPricingStrategyQuery = { __typename?: 'Query', defaultPricingStrategy?: { __typename?: 'PricingStrategy', id: string, name: string, code: string, description?: string | null, version: number, isDefault: boolean, activationCount?: number | null, lastActivatedAt?: string | null, validatedAt?: string | null, validationErrors?: any | null, archivedAt?: string | null, createdAt: string, createdBy: string, updatedAt?: string | null, updatedBy?: string | null, parentStrategyId?: string | null, blocks: Array<{ __typename?: 'StrategyBlock', priority: number, isEnabled: boolean, configOverrides?: any | null, pricingBlock: { __typename?: 'PricingBlock', id: string, name: string, description?: string | null, category: string, conditions: any, action: any, priority: number, isActive: boolean, isEditable: boolean, validFrom?: any | null, validUntil?: any | null, createdBy?: string | null, createdAt: any, updatedAt: any } }> } | null };

export type GetUserTenantsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUserTenantsQuery = { __typename?: 'Query', tenants: Array<{ __typename?: 'Tenant', slug: string, name: string, imgUrl: string }> };

export type GetAllTenantsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllTenantsQuery = { __typename?: 'Query', allTenants: { __typename?: 'TenantConnection', totalCount: number, nodes: Array<{ __typename?: 'Tenant', slug: string, name: string, imgUrl: string, tenantType: TenantType, userCount?: number | null }> } };

export type CreateTenantMutationVariables = Exact<{
  input: CreateTenantInput;
}>;


export type CreateTenantMutation = { __typename?: 'Mutation', createTenant: { __typename?: 'Tenant', slug: string, name: string, imgUrl: string, tenantType: TenantType } };

export type UpdateTenantMutationVariables = Exact<{
  slug: Scalars['ID']['input'];
  input: UpdateTenantInput;
}>;


export type UpdateTenantMutation = { __typename?: 'Mutation', updateTenant: { __typename?: 'Tenant', slug: string, name: string, imgUrl: string, tenantType: TenantType } };

export type DeleteTenantMutationVariables = Exact<{
  slug: Scalars['ID']['input'];
}>;


export type DeleteTenantMutation = { __typename?: 'Mutation', deleteTenant: { __typename?: 'TenantOperationResponse', success: boolean } };

export type GetPaymentMethodsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPaymentMethodsQuery = { __typename?: 'Query', paymentMethods: Array<{ __typename?: 'PaymentMethodInfo', value: PaymentMethod, label: string, description: string, processingRate: number, icon?: string | null, isActive: boolean }> };

export type GetPricingRulesQueryVariables = Exact<{
  filter?: InputMaybe<PricingRuleFilter>;
}>;


export type GetPricingRulesQuery = { __typename?: 'Query', pricingRules: Array<{ __typename?: 'PricingRule', id: string, category: RuleCategory, name: string, description?: string | null, priority: number, isActive: boolean, isEditable: boolean, validFrom?: string | null, validUntil?: string | null, createdBy: string, createdAt: string, updatedAt: string, conditions: Array<{ __typename?: 'RuleCondition', field: string, operator: ConditionOperator, value: any, type?: string | null }>, actions: Array<{ __typename?: 'RuleAction', type: ActionType, value: number, metadata?: any | null }> }> };

export type CreatePricingRuleMutationVariables = Exact<{
  input: CreatePricingRuleInput;
}>;


export type CreatePricingRuleMutation = { __typename?: 'Mutation', createPricingRule: { __typename?: 'PricingRule', id: string, category: RuleCategory, name: string, description?: string | null, priority: number, isActive: boolean, isEditable: boolean, validFrom?: string | null, validUntil?: string | null, createdBy: string, createdAt: string, updatedAt: string, conditions: Array<{ __typename?: 'RuleCondition', field: string, operator: ConditionOperator, value: any, type?: string | null }>, actions: Array<{ __typename?: 'RuleAction', type: ActionType, value: number, metadata?: any | null }> } };

export type UpdatePricingRuleMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdatePricingRuleInput;
}>;


export type UpdatePricingRuleMutation = { __typename?: 'Mutation', updatePricingRule: { __typename?: 'PricingRule', id: string, category: RuleCategory, name: string, description?: string | null, priority: number, isActive: boolean, isEditable: boolean, validFrom?: string | null, validUntil?: string | null, createdBy: string, createdAt: string, updatedAt: string, conditions: Array<{ __typename?: 'RuleCondition', field: string, operator: ConditionOperator, value: any, type?: string | null }>, actions: Array<{ __typename?: 'RuleAction', type: ActionType, value: number, metadata?: any | null }> } };

export type DeletePricingRuleMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeletePricingRuleMutation = { __typename?: 'Mutation', deletePricingRule: boolean };

export type TogglePricingRuleMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TogglePricingRuleMutation = { __typename?: 'Mutation', togglePricingRule: { __typename?: 'PricingRule', id: string, isActive: boolean } };

export type ClonePricingRuleMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  newName: Scalars['String']['input'];
}>;


export type ClonePricingRuleMutation = { __typename?: 'Mutation', clonePricingRule: { __typename?: 'PricingRule', id: string, name: string, category: RuleCategory, description?: string | null, priority: number, isActive: boolean, isEditable: boolean, conditions: Array<{ __typename?: 'RuleCondition', field: string, operator: ConditionOperator, value: any, type?: string | null }>, actions: Array<{ __typename?: 'RuleAction', type: ActionType, value: number, metadata?: any | null }> } };

export type GetTripsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTripsQuery = { __typename?: 'Query', trips: Array<{ __typename?: 'Trip', id: string, name: string, title?: string | null, description: string, bundleName?: string | null, region: string, createdAt: string, updatedAt: string, createdBy?: string | null, countries: Array<{ __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region?: string | null, flag?: string | null }> }> };

export type CreateTripMutationVariables = Exact<{
  input: CreateTripInput;
}>;


export type CreateTripMutation = { __typename?: 'Mutation', createTrip?: { __typename?: 'CreateTripResponse', success: boolean, error?: string | null, trip?: { __typename?: 'Trip', id: string, name: string, title?: string | null, description: string, bundleName?: string | null, region: string, createdAt: string, updatedAt: string, createdBy?: string | null, countries: Array<{ __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region?: string | null, flag?: string | null }> } | null } | null };

export type UpdateTripMutationVariables = Exact<{
  input: UpdateTripInput;
}>;


export type UpdateTripMutation = { __typename?: 'Mutation', updateTrip?: { __typename?: 'UpdateTripResponse', success: boolean, error?: string | null, trip?: { __typename?: 'Trip', id: string, name: string, title?: string | null, description: string, bundleName?: string | null, region: string, createdAt: string, updatedAt: string, createdBy?: string | null, countries: Array<{ __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region?: string | null, flag?: string | null }> } | null } | null };

export type DeleteTripMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTripMutation = { __typename?: 'Mutation', deleteTrip?: { __typename?: 'DeleteTripResponse', success: boolean, error?: string | null } | null };

export type GetUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUsersQuery = { __typename?: 'Query', users: Array<{ __typename?: 'User', id: string, email: string, firstName: string, lastName: string, phoneNumber?: string | null, role: string, createdAt: string, updatedAt: string, orderCount: number }> };

export type GetOrdersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOrdersQuery = { __typename?: 'Query', orders: Array<{ __typename?: 'Order', id: string, reference: string, status: OrderStatus, quantity: number, totalPrice: number, createdAt: string, updatedAt: string, bundleId?: string | null, bundleName?: string | null, user?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, phoneNumber?: string | null, role: string } | null }> };

export type GetUserOrdersQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetUserOrdersQuery = { __typename?: 'Query', getUserOrders: Array<{ __typename?: 'Order', id: string, reference: string, status: OrderStatus, quantity: number, totalPrice: number, createdAt: string, updatedAt: string, bundleId?: string | null, bundleName?: string | null }> };

export type UpdateUserRoleMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  role: Scalars['String']['input'];
}>;


export type UpdateUserRoleMutation = { __typename?: 'Mutation', updateUserRole?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, phoneNumber?: string | null, role: string, createdAt: string, updatedAt: string } | null };

export type InviteAdminUserMutationVariables = Exact<{
  input: InviteAdminUserInput;
}>;


export type InviteAdminUserMutation = { __typename?: 'Mutation', inviteAdminUser?: { __typename?: 'InviteAdminUserResponse', success: boolean, error?: string | null, invitedEmail?: string | null } | null };

export type GetCatalogBundlesQueryVariables = Exact<{
  criteria?: InputMaybe<SearchCatalogCriteria>;
}>;


export type GetCatalogBundlesQuery = { __typename?: 'Query', catalogBundles: { __typename?: 'CatalogBundleConnection', totalCount: number, bundles: Array<{ __typename?: 'CatalogBundle', esimGoName: string, description?: string | null, region?: string | null, validityInDays: number, basePrice: number, currency: string, isUnlimited: boolean }> } };

export type AssignPackageToUserMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  planId: Scalars['ID']['input'];
}>;


export type AssignPackageToUserMutation = { __typename?: 'Mutation', assignPackageToUser?: { __typename?: 'AssignPackageResponse', success: boolean, error?: string | null, assignment?: { __typename?: 'PackageAssignment', id: string, assignedAt: string, user: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string } } | null } | null };

export type CalculateAdminPriceQueryVariables = Exact<{
  input: CalculatePriceInput;
}>;


export type CalculateAdminPriceQuery = { __typename?: 'Query', calculatePrice: { __typename?: 'PricingBreakdown', duration: number, currency: string, totalCost: number, discountValue: number, priceAfterDiscount: number, cost: number, markup: number, discountRate: number, processingRate: number, processingCost: number, finalRevenue: number, netProfit: number, discountPerDay: number, unusedDays?: number | null, selectedReason?: string | null, totalCostBeforeProcessing?: number | null, bundle: { __typename?: 'CountryBundle', id: string, name: string, duration: number, isUnlimited: boolean, data?: number | null, group?: string | null, country: { __typename?: 'Country', iso: any, name: string }, appliedRules?: Array<{ __typename?: 'AppliedRule', name: string, category: RuleCategory, impact: number }> | null }, country: { __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region?: string | null, flag?: string | null }, appliedRules?: Array<{ __typename?: 'AppliedRule', name: string, category: RuleCategory, impact: number }> | null, discounts?: Array<{ __typename?: 'DiscountApplication', type: string, amount: number }> | null } };

export type CalculateBatchAdminPricingQueryVariables = Exact<{
  inputs: Array<CalculatePriceInput> | CalculatePriceInput;
}>;


export type CalculateBatchAdminPricingQuery = { __typename?: 'Query', calculatePrices: Array<{ __typename?: 'PricingBreakdown', duration: number, currency: string, totalCost: number, discountValue: number, priceAfterDiscount: number, cost: number, markup: number, discountRate: number, processingRate: number, processingCost: number, finalRevenue: number, netProfit: number, discountPerDay: number, unusedDays?: number | null, selectedReason?: string | null, totalCostBeforeProcessing?: number | null, bundle: { __typename?: 'CountryBundle', id: string, name: string, duration: number, isUnlimited: boolean, data?: number | null, group?: string | null, country: { __typename?: 'Country', iso: any, name: string }, appliedRules?: Array<{ __typename?: 'AppliedRule', name: string, category: RuleCategory, impact: number }> | null }, country: { __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region?: string | null, flag?: string | null }, appliedRules?: Array<{ __typename?: 'AppliedRule', name: string, category: RuleCategory, impact: number }> | null, discounts?: Array<{ __typename?: 'DiscountApplication', type: string, amount: number }> | null }> };

export type SimulatePricingQueryVariables = Exact<{
  input: CalculatePriceInput;
}>;


export type SimulatePricingQuery = { __typename?: 'Query', calculatePrice: { __typename?: 'PricingBreakdown', duration: number, currency: string, totalCost: number, discountValue: number, priceAfterDiscount: number, cost: number, markup: number, discountRate: number, processingRate: number, processingCost: number, finalRevenue: number, netProfit: number, discountPerDay: number, unusedDays?: number | null, selectedReason?: string | null, totalCostBeforeProcessing?: number | null, savingsAmount?: number | null, savingsPercentage?: number | null, calculationTimeMs?: number | null, rulesEvaluated?: number | null, bundle: { __typename?: 'CountryBundle', id: string, name: string, duration: number, isUnlimited: boolean, data?: number | null, group?: string | null }, country: { __typename?: 'Country', iso: any, name: string, region?: string | null }, appliedRules?: Array<{ __typename?: 'AppliedRule', name: string, category: RuleCategory, impact: number }> | null, discounts?: Array<{ __typename?: 'DiscountApplication', type: string, amount: number }> | null, pricingSteps?: Array<{ __typename?: 'PricingStep', order: number, name: string, priceBefore: number, priceAfter: number, impact: number, ruleId?: string | null, metadata?: any | null, timestamp?: number | null }> | null, customerDiscounts?: Array<{ __typename?: 'CustomerDiscount', name: string, amount: number, percentage?: number | null, reason: string }> | null } };

export type PricingCalculationStepsSubscriptionVariables = Exact<{
  input: CalculatePriceInput;
}>;


export type PricingCalculationStepsSubscription = { __typename?: 'Subscription', pricingCalculationSteps: { __typename?: 'PricingStepUpdate', correlationId: string, isComplete: boolean, totalSteps: number, completedSteps: number, error?: string | null, step?: { __typename?: 'PricingStep', order: number, name: string, priceBefore: number, priceAfter: number, impact: number, ruleId?: string | null, metadata?: any | null, timestamp?: number | null } | null, finalBreakdown?: { __typename?: 'PricingBreakdown', totalCost: number, discountValue: number, priceAfterDiscount: number, cost: number, markup: number, discountRate: number, processingRate: number, processingCost: number, finalRevenue: number, netProfit: number, discountPerDay: number, unusedDays?: number | null, selectedReason?: string | null, totalCostBeforeProcessing?: number | null, savingsAmount?: number | null, savingsPercentage?: number | null, calculationTimeMs?: number | null, rulesEvaluated?: number | null, appliedRules?: Array<{ __typename?: 'AppliedRule', name: string, category: RuleCategory, impact: number }> | null, pricingSteps?: Array<{ __typename?: 'PricingStep', order: number, name: string, priceBefore: number, priceAfter: number, impact: number, ruleId?: string | null, metadata?: any | null, timestamp?: number | null }> | null, customerDiscounts?: Array<{ __typename?: 'CustomerDiscount', name: string, amount: number, percentage?: number | null, reason: string }> | null } | null } };

export type PricingPipelineProgressSubscriptionVariables = Exact<{
  correlationId: Scalars['String']['input'];
}>;


export type PricingPipelineProgressSubscription = { __typename?: 'Subscription', pricingPipelineProgress: { __typename?: 'PricingPipelineStepUpdate', correlationId: string, name: string, timestamp: string, state?: any | null, appliedRules?: Array<string> | null, debug?: any | null } };

export type DeleteUserMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type DeleteUserMutation = { __typename?: 'Mutation', deleteUser?: { __typename?: 'DeleteUserResponse', success: boolean, error?: string | null } | null };

export type GetCountriesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCountriesQuery = { __typename?: 'Query', countries: Array<{ __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region?: string | null, flag?: string | null }> };

export type GetBundlesByCountryQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBundlesByCountryQuery = { __typename?: 'Query', bundlesByCountry: Array<{ __typename?: 'BundlesByCountry', bundleCount: number, country: { __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region?: string | null, flag?: string | null }, pricingRange?: { __typename?: 'PricingRange', min: number, max: number } | null }> };

export type GetCountriesWithBundlesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCountriesWithBundlesQuery = { __typename?: 'Query', bundlesByCountry: Array<{ __typename?: 'BundlesByCountry', bundleCount: number, country: { __typename?: 'Country', iso: any, name: string }, pricingRange?: { __typename?: 'PricingRange', min: number, max: number } | null, bundles: Array<{ __typename?: 'CatalogBundle', esimGoName: string, name: string, groups: Array<string>, validityInDays: number, dataAmountReadable: string, isUnlimited: boolean, countries: Array<string>, basePrice: number, currency: string } | { __typename?: 'CustomerBundle' }> }> };

export type GetBundlesByRegionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBundlesByRegionQuery = { __typename?: 'Query', bundlesByRegion: Array<{ __typename?: 'BundlesByRegion', region: string, bundleCount: number }> };

export type GetBundlesByGroupQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBundlesByGroupQuery = { __typename?: 'Query', bundlesByGroup: Array<{ __typename?: 'BundlesByGroup', group: string, bundleCount: number }> };

export type GetRegionBundlesQueryVariables = Exact<{
  region: Scalars['String']['input'];
}>;


export type GetRegionBundlesQuery = { __typename?: 'Query', bundlesForRegion?: { __typename?: 'BundlesForRegion', region: string, bundleCount: number, bundles: Array<{ __typename?: 'CatalogBundle', esimGoName: string, name: string, description?: string | null, groups: Array<string>, validityInDays: number, dataAmountMB?: number | null, dataAmountReadable: string, isUnlimited: boolean, countries: Array<string>, region?: string | null, basePrice: number, currency: string } | { __typename?: 'CustomerBundle' }> } | null };

export type GetCountryBundlesQueryVariables = Exact<{
  countryId: Scalars['String']['input'];
}>;


export type GetCountryBundlesQuery = { __typename?: 'Query', bundlesForCountry?: { __typename?: 'BundlesForCountry', bundleCount: number, country: { __typename?: 'Country', iso: any, name: string }, bundles: Array<{ __typename?: 'CatalogBundle', esimGoName: string, name: string, description?: string | null, groups: Array<string>, validityInDays: number, dataAmountMB?: number | null, dataAmountReadable: string, isUnlimited: boolean, countries: Array<string>, region?: string | null, basePrice: number, currency: string, provider: Provider } | { __typename?: 'CustomerBundle' }> } | null };

export type GetBundleGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBundleGroupsQuery = { __typename?: 'Query', pricingFilters: { __typename?: 'PricingFilters', groups: Array<string> } };

export type GetPricingFiltersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPricingFiltersQuery = { __typename?: 'Query', pricingFilters: { __typename?: 'PricingFilters', groups: Array<string>, durations: Array<{ __typename?: 'DurationRange', label: string, value: string, minDays: number, maxDays: number }>, dataTypes: Array<{ __typename?: 'DataType', label: string, value: string, isUnlimited: boolean }> } };

export type GetMarkupConfigDataQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMarkupConfigDataQuery = { __typename?: 'Query', pricingFilters: { __typename?: 'PricingFilters', groups: Array<string>, durations: Array<{ __typename?: 'DurationRange', label: string, value: string, minDays: number, maxDays: number }> } };

export type GetHighDemandCountriesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetHighDemandCountriesQuery = { __typename?: 'Query', highDemandCountries: Array<string> };

export type ToggleHighDemandCountryMutationVariables = Exact<{
  countryId: Scalars['String']['input'];
}>;


export type ToggleHighDemandCountryMutation = { __typename?: 'Mutation', toggleHighDemandCountry?: { __typename?: 'ToggleHighDemandResponse', success: boolean, countryId: string, isHighDemand: boolean, error?: string | null } | null };

export type GetCatalogSyncHistoryQueryVariables = Exact<{
  params?: InputMaybe<SyncHistoryParams>;
}>;


export type GetCatalogSyncHistoryQuery = { __typename?: 'Query', catalogSyncHistory: { __typename?: 'CatalogSyncHistoryConnection', totalCount: number, jobs: Array<{ __typename?: 'CatalogSyncJob', id: string, jobType: string, status: string, priority: string, group?: string | null, countryId?: string | null, bundlesProcessed?: number | null, bundlesAdded?: number | null, bundlesUpdated?: number | null, errorMessage?: string | null, metadata?: any | null, createdAt: string, startedAt: string, completedAt?: string | null, updatedAt: string }> } };

export type TriggerCatalogSyncMutationVariables = Exact<{
  params: TriggerSyncParams;
}>;


export type TriggerCatalogSyncMutation = { __typename?: 'Mutation', triggerCatalogSync?: { __typename?: 'TriggerSyncResponse', success: boolean, jobId?: string | null, message?: string | null, error?: string | null, conflictingJob?: { __typename?: 'ConflictingJobInfo', id: string, jobType: string, status: string, createdAt: string, startedAt?: string | null } | null } | null };

export type GetAirHaloPackagesQueryVariables = Exact<{
  filter?: InputMaybe<AirHaloPackageFilter>;
}>;


export type GetAirHaloPackagesQuery = { __typename?: 'Query', airHaloPackages: { __typename?: 'AirHaloPackagesResponse', data: Array<{ __typename?: 'AirHaloPackageData', id: string, title: string, slug: string, image?: { __typename?: 'AirHaloImage', url: string, width?: number | null, height?: number | null } | null, operators: Array<{ __typename?: 'AirHaloOperator', id: string, title: string, type: string, countries: Array<{ __typename?: 'AirHaloCountry', id: string, title: string, slug: string }>, packages: Array<{ __typename?: 'AirHaloPackage', id: string, type: string, title: string, shortInfo?: string | null, data: string, amount: number, day: number, isUnlimited: boolean, voice?: number | null, text?: number | null, qrInstallation: string, manualInstallation: string, isFairUsagePolicy?: boolean | null, fairUsagePolicy?: string | null, price: { __typename?: 'AirHaloPrice', value: number, currency: string }, netPrice: { __typename?: 'AirHaloPrice', value: number, currency: string }, prices: { __typename?: 'AirHaloPrices', netPrice: { __typename?: 'AirHaloPrice', value: number, currency: string }, recommendedRetailPrice: { __typename?: 'AirHaloPrice', value: number, currency: string } } }>, coverages: Array<{ __typename?: 'AirHaloCoverage', networks: Array<{ __typename?: 'AirHaloNetwork', name: string, type: string }> }>, apn?: { __typename?: 'AirHaloAPN', name?: string | null, username?: string | null, password?: string | null, ios?: { __typename?: 'AirHaloAPNIOS', name?: string | null, username?: string | null, password?: string | null } | null } | null }> }>, links?: { __typename?: 'AirHaloLinks', first?: string | null, last?: string | null, prev?: string | null, next?: string | null } | null, meta?: { __typename?: 'AirHaloMeta', currentPage?: number | null, from?: number | null, lastPage?: number | null, path?: string | null, perPage?: number | null, to?: number | null, total?: number | null } | null } };

export type GetAirHaloCompatibleDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAirHaloCompatibleDevicesQuery = { __typename?: 'Query', airHaloCompatibleDevices: { __typename?: 'AirHaloCompatibleDevicesResponse', data: Array<{ __typename?: 'AirHaloCompatibleDevice', manufacturer: string, model: string, esimSupport: boolean }> } };

export type CompareAirHaloPackagesQueryVariables = Exact<{
  countryCode: Scalars['String']['input'];
}>;


export type CompareAirHaloPackagesQuery = { __typename?: 'Query', compareAirHaloPackages: Array<{ __typename?: 'AirHaloPackageData', id: string, title: string, slug: string, image?: { __typename?: 'AirHaloImage', url: string, width?: number | null, height?: number | null } | null, operators: Array<{ __typename?: 'AirHaloOperator', id: string, title: string, type: string, countries: Array<{ __typename?: 'AirHaloCountry', id: string, title: string, slug: string }>, packages: Array<{ __typename?: 'AirHaloPackage', id: string, type: string, title: string, shortInfo?: string | null, data: string, amount: number, day: number, isUnlimited: boolean, voice?: number | null, text?: number | null, qrInstallation: string, manualInstallation: string, isFairUsagePolicy?: boolean | null, fairUsagePolicy?: string | null, price: { __typename?: 'AirHaloPrice', value: number, currency: string }, netPrice: { __typename?: 'AirHaloPrice', value: number, currency: string }, prices: { __typename?: 'AirHaloPrices', netPrice: { __typename?: 'AirHaloPrice', value: number, currency: string }, recommendedRetailPrice: { __typename?: 'AirHaloPrice', value: number, currency: string } } }>, coverages: Array<{ __typename?: 'AirHaloCoverage', networks: Array<{ __typename?: 'AirHaloNetwork', name: string, type: string }> }> }> }> };

export type GetAirHaloPricingDataQueryVariables = Exact<{
  packageIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type GetAirHaloPricingDataQuery = { __typename?: 'Query', airHaloPricingData: Array<{ __typename?: 'AirHaloPackage', id: string, type: string, title: string, shortInfo?: string | null, data: string, amount: number, day: number, isUnlimited: boolean, voice?: number | null, text?: number | null, qrInstallation: string, manualInstallation: string, isFairUsagePolicy?: boolean | null, fairUsagePolicy?: string | null, price: { __typename?: 'AirHaloPrice', value: number, currency: string }, netPrice: { __typename?: 'AirHaloPrice', value: number, currency: string }, prices: { __typename?: 'AirHaloPrices', netPrice: { __typename?: 'AirHaloPrice', value: number, currency: string }, recommendedRetailPrice: { __typename?: 'AirHaloPrice', value: number, currency: string } } }> };

export type GetBundlesQueryVariables = Exact<{
  filter?: InputMaybe<BundleFilter>;
  pagination?: InputMaybe<PaginationInput>;
}>;


export type GetBundlesQuery = { __typename?: 'Query', bundles: { __typename?: 'BundleConnection', totalCount: number, nodes: Array<{ __typename?: 'CatalogBundle', esimGoName: string, name: string, description?: string | null, groups: Array<string>, validityInDays: number, dataAmountMB?: number | null, dataAmountReadable: string, isUnlimited: boolean, countries: Array<string>, region?: string | null, basePrice: number, currency: string, createdAt: any, updatedAt: any, syncedAt: any } | { __typename?: 'CustomerBundle' }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean } } };

export type GetAllEsiMsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllEsiMsQuery = { __typename?: 'Query', getAllESIMs: Array<{ __typename?: 'AdminESIM', id: string, iccid: string, status: string, apiStatus?: string | null, userId: string, orderId: string, customerRef?: string | null, assignedDate?: string | null, lastAction?: string | null, actionDate?: string | null, createdAt: string, updatedAt?: string | null, user?: { __typename?: 'AdminESIMUser', id: string, email?: string | null, firstName?: string | null, lastName?: string | null } | null, order?: { __typename?: 'AdminESIMOrder', id: string, reference: string, bundleName?: string | null } | null, usage?: { __typename?: 'ESIMUsage', totalUsed: number, totalRemaining?: number | null } | null }> };


export const CatalogSyncProgressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"CatalogSyncProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogSyncProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobId"}},{"kind":"Field","name":{"kind":"Name","value":"jobType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"bundlesProcessed"}},{"kind":"Field","name":{"kind":"Name","value":"bundlesAdded"}},{"kind":"Field","name":{"kind":"Name","value":"bundlesUpdated"}},{"kind":"Field","name":{"kind":"Name","value":"totalBundles"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CatalogSyncProgressSubscription, CatalogSyncProgressSubscriptionVariables>;
export const GetAdminEsimDetailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAdminESIMDetails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"iccid"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAdminESIMDetails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"iccid"},"value":{"kind":"Variable","name":{"kind":"Name","value":"iccid"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"iccid"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"customerRef"}},{"kind":"Field","name":{"kind":"Name","value":"assignedDate"}},{"kind":"Field","name":{"kind":"Name","value":"activationCode"}},{"kind":"Field","name":{"kind":"Name","value":"qrCodeUrl"}},{"kind":"Field","name":{"kind":"Name","value":"smdpAddress"}},{"kind":"Field","name":{"kind":"Name","value":"matchingId"}},{"kind":"Field","name":{"kind":"Name","value":"lastAction"}},{"kind":"Field","name":{"kind":"Name","value":"actionDate"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"apiDetails"}},{"kind":"Field","name":{"kind":"Name","value":"usage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalUsed"}},{"kind":"Field","name":{"kind":"Name","value":"totalRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"activeBundles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"dataUsed"}},{"kind":"Field","name":{"kind":"Name","value":"dataRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetAdminEsimDetailsQuery, GetAdminEsimDetailsQueryVariables>;
export const GetOrderDetailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrderDetails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orderDetails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"bundleId"}},{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"esims"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"iccid"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"qrCode"}},{"kind":"Field","name":{"kind":"Name","value":"smdpAddress"}},{"kind":"Field","name":{"kind":"Name","value":"matchingId"}},{"kind":"Field","name":{"kind":"Name","value":"customerRef"}},{"kind":"Field","name":{"kind":"Name","value":"assignedDate"}},{"kind":"Field","name":{"kind":"Name","value":"lastAction"}},{"kind":"Field","name":{"kind":"Name","value":"actionDate"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"installationLinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"universalLink"}},{"kind":"Field","name":{"kind":"Name","value":"lpaScheme"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetOrderDetailsQuery, GetOrderDetailsQueryVariables>;
export const GetCustomerEsiMsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCustomerESIMs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCustomerESIMs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"iccid"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"apiStatus"}},{"kind":"Field","name":{"kind":"Name","value":"customerRef"}},{"kind":"Field","name":{"kind":"Name","value":"assignedDate"}},{"kind":"Field","name":{"kind":"Name","value":"lastAction"}},{"kind":"Field","name":{"kind":"Name","value":"actionDate"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"usage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalUsed"}},{"kind":"Field","name":{"kind":"Name","value":"totalRemaining"}}]}},{"kind":"Field","name":{"kind":"Name","value":"esim_bundles"}}]}}]}}]} as unknown as DocumentNode<GetCustomerEsiMsQuery, GetCustomerEsiMsQueryVariables>;
export const GetPricingBlocksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPricingBlocks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PricingBlockFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingBlocks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"conditions"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetPricingBlocksQuery, GetPricingBlocksQueryVariables>;
export const GetPricingBlockDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPricingBlock"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingBlock"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"conditions"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetPricingBlockQuery, GetPricingBlockQueryVariables>;
export const GetPricingStrategiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPricingStrategies"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"StrategyFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingStrategies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"activationCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastActivatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"validatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"validationErrors"}},{"kind":"Field","name":{"kind":"Name","value":"archivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"}},{"kind":"Field","name":{"kind":"Name","value":"parentStrategyId"}}]}}]}}]} as unknown as DocumentNode<GetPricingStrategiesQuery, GetPricingStrategiesQueryVariables>;
export const GetPricingStrategyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPricingStrategy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingStrategy"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"activationCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastActivatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"validatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"validationErrors"}},{"kind":"Field","name":{"kind":"Name","value":"archivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"}},{"kind":"Field","name":{"kind":"Name","value":"parentStrategyId"}},{"kind":"Field","name":{"kind":"Name","value":"blocks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"configOverrides"}},{"kind":"Field","name":{"kind":"Name","value":"pricingBlock"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"conditions"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetPricingStrategyQuery, GetPricingStrategyQueryVariables>;
export const GetDefaultPricingStrategyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDefaultPricingStrategy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"defaultPricingStrategy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"activationCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastActivatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"validatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"validationErrors"}},{"kind":"Field","name":{"kind":"Name","value":"archivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedBy"}},{"kind":"Field","name":{"kind":"Name","value":"parentStrategyId"}},{"kind":"Field","name":{"kind":"Name","value":"blocks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"configOverrides"}},{"kind":"Field","name":{"kind":"Name","value":"pricingBlock"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"conditions"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetDefaultPricingStrategyQuery, GetDefaultPricingStrategyQueryVariables>;
export const GetUserTenantsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserTenants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tenants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imgUrl"}}]}}]}}]} as unknown as DocumentNode<GetUserTenantsQuery, GetUserTenantsQueryVariables>;
export const GetAllTenantsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllTenants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allTenants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imgUrl"}},{"kind":"Field","name":{"kind":"Name","value":"tenantType"}},{"kind":"Field","name":{"kind":"Name","value":"userCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<GetAllTenantsQuery, GetAllTenantsQueryVariables>;
export const CreateTenantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTenant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTenantInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTenant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imgUrl"}},{"kind":"Field","name":{"kind":"Name","value":"tenantType"}}]}}]}}]} as unknown as DocumentNode<CreateTenantMutation, CreateTenantMutationVariables>;
export const UpdateTenantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTenant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTenantInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTenant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imgUrl"}},{"kind":"Field","name":{"kind":"Name","value":"tenantType"}}]}}]}}]} as unknown as DocumentNode<UpdateTenantMutation, UpdateTenantMutationVariables>;
export const DeleteTenantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTenant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTenant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<DeleteTenantMutation, DeleteTenantMutationVariables>;
export const GetPaymentMethodsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPaymentMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"paymentMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"processingRate"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<GetPaymentMethodsQuery, GetPaymentMethodsQueryVariables>;
export const GetPricingRulesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPricingRules"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PricingRuleFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingRules"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"conditions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"operator"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}}]}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetPricingRulesQuery, GetPricingRulesQueryVariables>;
export const CreatePricingRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePricingRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePricingRuleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPricingRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"conditions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"operator"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}}]}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreatePricingRuleMutation, CreatePricingRuleMutationVariables>;
export const UpdatePricingRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePricingRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePricingRuleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePricingRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"conditions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"operator"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}}]}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdatePricingRuleMutation, UpdatePricingRuleMutationVariables>;
export const DeletePricingRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePricingRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePricingRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeletePricingRuleMutation, DeletePricingRuleMutationVariables>;
export const TogglePricingRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TogglePricingRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"togglePricingRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<TogglePricingRuleMutation, TogglePricingRuleMutationVariables>;
export const ClonePricingRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClonePricingRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clonePricingRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"newName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"conditions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"operator"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}}]}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}}]}}]}}]} as unknown as DocumentNode<ClonePricingRuleMutation, ClonePricingRuleMutationVariables>;
export const GetTripsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTrips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}}]}}]}}]} as unknown as DocumentNode<GetTripsQuery, GetTripsQueryVariables>;
export const CreateTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTripInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"trip"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}}]}}]}}]}}]} as unknown as DocumentNode<CreateTripMutation, CreateTripMutationVariables>;
export const UpdateTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTripInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"trip"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateTripMutation, UpdateTripMutationVariables>;
export const DeleteTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<DeleteTripMutation, DeleteTripMutationVariables>;
export const GetUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"orderCount"}}]}}]}}]} as unknown as DocumentNode<GetUsersQuery, GetUsersQueryVariables>;
export const GetOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"bundleId"}},{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]} as unknown as DocumentNode<GetOrdersQuery, GetOrdersQueryVariables>;
export const GetUserOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserOrders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUserOrders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"bundleId"}},{"kind":"Field","name":{"kind":"Name","value":"bundleName"}}]}}]}}]} as unknown as DocumentNode<GetUserOrdersQuery, GetUserOrdersQueryVariables>;
export const UpdateUserRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateUserRoleMutation, UpdateUserRoleMutationVariables>;
export const InviteAdminUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteAdminUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InviteAdminUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteAdminUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"invitedEmail"}}]}}]}}]} as unknown as DocumentNode<InviteAdminUserMutation, InviteAdminUserMutationVariables>;
export const GetCatalogBundlesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCatalogBundles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"criteria"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchCatalogCriteria"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogBundles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"criteria"},"value":{"kind":"Variable","name":{"kind":"Name","value":"criteria"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"esimGoName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"validityInDays"}},{"kind":"Field","name":{"kind":"Name","value":"basePrice"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<GetCatalogBundlesQuery, GetCatalogBundlesQueryVariables>;
export const AssignPackageToUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AssignPackageToUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignPackageToUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"assignment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedAt"}}]}}]}}]}}]} as unknown as DocumentNode<AssignPackageToUserMutation, AssignPackageToUserMutationVariables>;
export const CalculateAdminPriceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalculateAdminPrice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CalculatePriceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculatePrice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundle"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"appliedRules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"cost"}},{"kind":"Field","name":{"kind":"Name","value":"markup"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"processingRate"}},{"kind":"Field","name":{"kind":"Name","value":"processingCost"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"netProfit"}},{"kind":"Field","name":{"kind":"Name","value":"discountPerDay"}},{"kind":"Field","name":{"kind":"Name","value":"appliedRules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"discounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unusedDays"}},{"kind":"Field","name":{"kind":"Name","value":"selectedReason"}},{"kind":"Field","name":{"kind":"Name","value":"totalCostBeforeProcessing"}}]}}]}}]} as unknown as DocumentNode<CalculateAdminPriceQuery, CalculateAdminPriceQueryVariables>;
export const CalculateBatchAdminPricingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalculateBatchAdminPricing"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CalculatePriceInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculatePrices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundle"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"appliedRules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"cost"}},{"kind":"Field","name":{"kind":"Name","value":"markup"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"processingRate"}},{"kind":"Field","name":{"kind":"Name","value":"processingCost"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"netProfit"}},{"kind":"Field","name":{"kind":"Name","value":"discountPerDay"}},{"kind":"Field","name":{"kind":"Name","value":"appliedRules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"discounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unusedDays"}},{"kind":"Field","name":{"kind":"Name","value":"selectedReason"}},{"kind":"Field","name":{"kind":"Name","value":"totalCostBeforeProcessing"}}]}}]}}]} as unknown as DocumentNode<CalculateBatchAdminPricingQuery, CalculateBatchAdminPricingQueryVariables>;
export const SimulatePricingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SimulatePricing"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CalculatePriceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculatePrice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundle"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"group"}}]}},{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"region"}}]}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"cost"}},{"kind":"Field","name":{"kind":"Name","value":"markup"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"processingRate"}},{"kind":"Field","name":{"kind":"Name","value":"processingCost"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"netProfit"}},{"kind":"Field","name":{"kind":"Name","value":"discountPerDay"}},{"kind":"Field","name":{"kind":"Name","value":"appliedRules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"discounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unusedDays"}},{"kind":"Field","name":{"kind":"Name","value":"selectedReason"}},{"kind":"Field","name":{"kind":"Name","value":"totalCostBeforeProcessing"}},{"kind":"Field","name":{"kind":"Name","value":"pricingSteps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"priceBefore"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfter"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}},{"kind":"Field","name":{"kind":"Name","value":"ruleId"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"customerDiscounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}}]}},{"kind":"Field","name":{"kind":"Name","value":"savingsAmount"}},{"kind":"Field","name":{"kind":"Name","value":"savingsPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"calculationTimeMs"}},{"kind":"Field","name":{"kind":"Name","value":"rulesEvaluated"}}]}}]}}]} as unknown as DocumentNode<SimulatePricingQuery, SimulatePricingQueryVariables>;
export const PricingCalculationStepsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PricingCalculationSteps"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CalculatePriceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingCalculationSteps"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"correlationId"}},{"kind":"Field","name":{"kind":"Name","value":"step"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"priceBefore"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfter"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}},{"kind":"Field","name":{"kind":"Name","value":"ruleId"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isComplete"}},{"kind":"Field","name":{"kind":"Name","value":"totalSteps"}},{"kind":"Field","name":{"kind":"Name","value":"completedSteps"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"finalBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"cost"}},{"kind":"Field","name":{"kind":"Name","value":"markup"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"processingRate"}},{"kind":"Field","name":{"kind":"Name","value":"processingCost"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"netProfit"}},{"kind":"Field","name":{"kind":"Name","value":"discountPerDay"}},{"kind":"Field","name":{"kind":"Name","value":"appliedRules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unusedDays"}},{"kind":"Field","name":{"kind":"Name","value":"selectedReason"}},{"kind":"Field","name":{"kind":"Name","value":"totalCostBeforeProcessing"}},{"kind":"Field","name":{"kind":"Name","value":"pricingSteps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"priceBefore"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfter"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}},{"kind":"Field","name":{"kind":"Name","value":"ruleId"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"customerDiscounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}}]}},{"kind":"Field","name":{"kind":"Name","value":"savingsAmount"}},{"kind":"Field","name":{"kind":"Name","value":"savingsPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"calculationTimeMs"}},{"kind":"Field","name":{"kind":"Name","value":"rulesEvaluated"}}]}}]}}]}}]} as unknown as DocumentNode<PricingCalculationStepsSubscription, PricingCalculationStepsSubscriptionVariables>;
export const PricingPipelineProgressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PricingPipelineProgress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"correlationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingPipelineProgress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"correlationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"correlationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"correlationId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"appliedRules"}},{"kind":"Field","name":{"kind":"Name","value":"debug"}}]}}]}}]} as unknown as DocumentNode<PricingPipelineProgressSubscription, PricingPipelineProgressSubscriptionVariables>;
export const DeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<DeleteUserMutation, DeleteUserMutationVariables>;
export const GetCountriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCountries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}}]}}]} as unknown as DocumentNode<GetCountriesQuery, GetCountriesQueryVariables>;
export const GetBundlesByCountryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBundlesByCountry"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundlesByCountry"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}},{"kind":"Field","name":{"kind":"Name","value":"bundleCount"}},{"kind":"Field","name":{"kind":"Name","value":"pricingRange"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"min"}},{"kind":"Field","name":{"kind":"Name","value":"max"}}]}}]}}]}}]} as unknown as DocumentNode<GetBundlesByCountryQuery, GetBundlesByCountryQueryVariables>;
export const GetCountriesWithBundlesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCountriesWithBundles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundlesByCountry"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"bundleCount"}},{"kind":"Field","name":{"kind":"Name","value":"pricingRange"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"min"}},{"kind":"Field","name":{"kind":"Name","value":"max"}}]}},{"kind":"Field","name":{"kind":"Name","value":"bundles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogBundle"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"esimGoName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"groups"}},{"kind":"Field","name":{"kind":"Name","value":"validityInDays"}},{"kind":"Field","name":{"kind":"Name","value":"dataAmountReadable"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"countries"}},{"kind":"Field","name":{"kind":"Name","value":"basePrice"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetCountriesWithBundlesQuery, GetCountriesWithBundlesQueryVariables>;
export const GetBundlesByRegionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBundlesByRegion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundlesByRegion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"bundleCount"}}]}}]}}]} as unknown as DocumentNode<GetBundlesByRegionQuery, GetBundlesByRegionQueryVariables>;
export const GetBundlesByGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBundlesByGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundlesByGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"bundleCount"}}]}}]}}]} as unknown as DocumentNode<GetBundlesByGroupQuery, GetBundlesByGroupQueryVariables>;
export const GetRegionBundlesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRegionBundles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"region"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundlesForRegion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"region"},"value":{"kind":"Variable","name":{"kind":"Name","value":"region"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"bundleCount"}},{"kind":"Field","name":{"kind":"Name","value":"bundles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogBundle"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"esimGoName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"groups"}},{"kind":"Field","name":{"kind":"Name","value":"validityInDays"}},{"kind":"Field","name":{"kind":"Name","value":"dataAmountMB"}},{"kind":"Field","name":{"kind":"Name","value":"dataAmountReadable"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"countries"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"basePrice"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetRegionBundlesQuery, GetRegionBundlesQueryVariables>;
export const GetCountryBundlesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCountryBundles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundlesForCountry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"countryCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"country"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"bundleCount"}},{"kind":"Field","name":{"kind":"Name","value":"bundles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogBundle"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"esimGoName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"groups"}},{"kind":"Field","name":{"kind":"Name","value":"validityInDays"}},{"kind":"Field","name":{"kind":"Name","value":"dataAmountMB"}},{"kind":"Field","name":{"kind":"Name","value":"dataAmountReadable"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"countries"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"basePrice"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetCountryBundlesQuery, GetCountryBundlesQueryVariables>;
export const GetBundleGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBundleGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingFilters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"}}]}}]}}]} as unknown as DocumentNode<GetBundleGroupsQuery, GetBundleGroupsQueryVariables>;
export const GetPricingFiltersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPricingFilters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingFilters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"}},{"kind":"Field","name":{"kind":"Name","value":"durations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"minDays"}},{"kind":"Field","name":{"kind":"Name","value":"maxDays"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}}]}}]}}]}}]} as unknown as DocumentNode<GetPricingFiltersQuery, GetPricingFiltersQueryVariables>;
export const GetMarkupConfigDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMarkupConfigData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingFilters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"}},{"kind":"Field","name":{"kind":"Name","value":"durations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"minDays"}},{"kind":"Field","name":{"kind":"Name","value":"maxDays"}}]}}]}}]}}]} as unknown as DocumentNode<GetMarkupConfigDataQuery, GetMarkupConfigDataQueryVariables>;
export const GetHighDemandCountriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetHighDemandCountries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"highDemandCountries"}}]}}]} as unknown as DocumentNode<GetHighDemandCountriesQuery, GetHighDemandCountriesQueryVariables>;
export const ToggleHighDemandCountryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleHighDemandCountry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleHighDemandCountry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"countryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"isHighDemand"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<ToggleHighDemandCountryMutation, ToggleHighDemandCountryMutationVariables>;
export const GetCatalogSyncHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCatalogSyncHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SyncHistoryParams"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogSyncHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"params"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"bundlesProcessed"}},{"kind":"Field","name":{"kind":"Name","value":"bundlesAdded"}},{"kind":"Field","name":{"kind":"Name","value":"bundlesUpdated"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<GetCatalogSyncHistoryQuery, GetCatalogSyncHistoryQueryVariables>;
export const TriggerCatalogSyncDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TriggerCatalogSync"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TriggerSyncParams"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerCatalogSync"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"params"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"jobId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"conflictingJob"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}}]}}]}}]}}]} as unknown as DocumentNode<TriggerCatalogSyncMutation, TriggerCatalogSyncMutationVariables>;
export const GetAirHaloPackagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAirHaloPackages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AirHaloPackageFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"airHaloPackages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}},{"kind":"Field","name":{"kind":"Name","value":"operators"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}},{"kind":"Field","name":{"kind":"Name","value":"packages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"shortInfo"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"voice"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"netPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"prices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"netPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"recommendedRetailPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"qrInstallation"}},{"kind":"Field","name":{"kind":"Name","value":"manualInstallation"}},{"kind":"Field","name":{"kind":"Name","value":"isFairUsagePolicy"}},{"kind":"Field","name":{"kind":"Name","value":"fairUsagePolicy"}}]}},{"kind":"Field","name":{"kind":"Name","value":"coverages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"apn"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"password"}},{"kind":"Field","name":{"kind":"Name","value":"ios"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"password"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"links"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"first"}},{"kind":"Field","name":{"kind":"Name","value":"last"}},{"kind":"Field","name":{"kind":"Name","value":"prev"}},{"kind":"Field","name":{"kind":"Name","value":"next"}}]}},{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"lastPage"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]} as unknown as DocumentNode<GetAirHaloPackagesQuery, GetAirHaloPackagesQueryVariables>;
export const GetAirHaloCompatibleDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAirHaloCompatibleDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"airHaloCompatibleDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"esimSupport"}}]}}]}}]}}]} as unknown as DocumentNode<GetAirHaloCompatibleDevicesQuery, GetAirHaloCompatibleDevicesQueryVariables>;
export const CompareAirHaloPackagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CompareAirHaloPackages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"countryCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"compareAirHaloPackages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"countryCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"countryCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}},{"kind":"Field","name":{"kind":"Name","value":"operators"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}},{"kind":"Field","name":{"kind":"Name","value":"packages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"shortInfo"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"voice"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"netPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"prices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"netPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"recommendedRetailPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"qrInstallation"}},{"kind":"Field","name":{"kind":"Name","value":"manualInstallation"}},{"kind":"Field","name":{"kind":"Name","value":"isFairUsagePolicy"}},{"kind":"Field","name":{"kind":"Name","value":"fairUsagePolicy"}}]}},{"kind":"Field","name":{"kind":"Name","value":"coverages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CompareAirHaloPackagesQuery, CompareAirHaloPackagesQueryVariables>;
export const GetAirHaloPricingDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAirHaloPricingData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"packageIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"airHaloPricingData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"packageIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"packageIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"shortInfo"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"voice"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"netPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"prices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"netPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"recommendedRetailPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"qrInstallation"}},{"kind":"Field","name":{"kind":"Name","value":"manualInstallation"}},{"kind":"Field","name":{"kind":"Name","value":"isFairUsagePolicy"}},{"kind":"Field","name":{"kind":"Name","value":"fairUsagePolicy"}}]}}]}}]} as unknown as DocumentNode<GetAirHaloPricingDataQuery, GetAirHaloPricingDataQueryVariables>;
export const GetBundlesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBundles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BundleFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogBundle"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"esimGoName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"groups"}},{"kind":"Field","name":{"kind":"Name","value":"validityInDays"}},{"kind":"Field","name":{"kind":"Name","value":"dataAmountMB"}},{"kind":"Field","name":{"kind":"Name","value":"dataAmountReadable"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"countries"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"basePrice"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"syncedAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}}]}}]}}]} as unknown as DocumentNode<GetBundlesQuery, GetBundlesQueryVariables>;
export const GetAllEsiMsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllESIMs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllESIMs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"iccid"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"apiStatus"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"customerRef"}},{"kind":"Field","name":{"kind":"Name","value":"assignedDate"}},{"kind":"Field","name":{"kind":"Name","value":"lastAction"}},{"kind":"Field","name":{"kind":"Name","value":"actionDate"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"order"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}},{"kind":"Field","name":{"kind":"Name","value":"bundleName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"usage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalUsed"}},{"kind":"Field","name":{"kind":"Name","value":"totalRemaining"}}]}}]}}]}}]} as unknown as DocumentNode<GetAllEsiMsQuery, GetAllEsiMsQueryVariables>;