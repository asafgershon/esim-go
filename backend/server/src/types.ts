import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { Context } from './context/types';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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

export type AppliedRule = {
  __typename?: 'AppliedRule';
  category: RuleCategory;
  id: Scalars['ID']['output'];
  impact: Scalars['Float']['output'];
  name: Scalars['String']['output'];
};

export type ApplyCouponToCheckoutInput = {
  couponCode: Scalars['String']['input'];
  sessionId: Scalars['ID']['input'];
};

export type ApplyCouponToCheckoutPayload = {
  __typename?: 'ApplyCouponToCheckoutPayload';
  checkout?: Maybe<Checkout>;
  error?: Maybe<CouponError>;
  success: Scalars['Boolean']['output'];
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
  discounts?: Maybe<Array<Discount>>;
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
  discounts?: Maybe<Array<Discount>>;
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
  discounts?: Maybe<Array<Discount>>;
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
  discounts?: Maybe<Array<Discount>>;
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
  discounts?: Maybe<Array<Discount>>;
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
  discounts?: Maybe<Array<Discount>>;
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
  discounts?: Maybe<Array<Discount>>;
  /** Groups available in this region */
  groups: Array<Scalars['String']['output']>;
  /** Whether unlimited bundles are available */
  hasUnlimited: Scalars['Boolean']['output'];
  /** Price range */
  pricingRange: PriceRange;
  /** Region name */
  region: Scalars['String']['output'];
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
  countryId?: Maybe<Scalars['String']['output']>;
  currency: Scalars['String']['output'];
  dataAmount: Scalars['String']['output'];
  discounts: Array<Scalars['Float']['output']>;
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
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
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
  provider: Provider;
};

export type CouponError = {
  __typename?: 'CouponError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
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

export type Discount = {
  __typename?: 'Discount';
  amount: Scalars['Float']['output'];
  code: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
};

export type DiscountApplication = {
  __typename?: 'DiscountApplication';
  amount: Scalars['Float']['output'];
  description?: Maybe<Scalars['String']['output']>;
  percentage?: Maybe<Scalars['Float']['output']>;
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
  applyCouponToCheckout: ApplyCouponToCheckoutPayload;
  assignPackageToUser?: Maybe<AssignPackageResponse>;
  assignUserToTenant: TenantOperationResponse;
  cancelESIM?: Maybe<EsimActionResponse>;
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
  inviteAdminUser?: Maybe<InviteAdminUserResponse>;
  processCheckoutPayment: ProcessCheckoutPaymentResponse;
  processPaymentCallback: Scalars['String']['output'];
  purchaseESIM?: Maybe<PurchaseEsimResponse>;
  removeUserFromTenant: TenantOperationResponse;
  restoreESIM?: Maybe<EsimActionResponse>;
  sendPhoneOTP?: Maybe<SendOtpResponse>;
  signIn?: Maybe<SignInResponse>;
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


export type MutationApplyCouponToCheckoutArgs = {
  input: ApplyCouponToCheckoutInput;
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


export type MutationClonePricingRuleArgs = {
  id: Scalars['ID']['input'];
  newName: Scalars['String']['input'];
};


export type MutationCreateCheckoutArgs = {
  countryId: Scalars['String']['input'];
  numOfDays: Scalars['Int']['input'];
  numOfEsims: Scalars['Int']['input'];
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


export type MutationRestoreEsimArgs = {
  esimId: Scalars['ID']['input'];
};


export type MutationSendPhoneOtpArgs = {
  phoneNumber: Scalars['String']['input'];
};


export type MutationSignInArgs = {
  input: SignInInput;
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
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
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
  pricingFilters: PricingFilters;
  pricingStrategies: Array<PricingStrategy>;
  pricingStrategy?: Maybe<PricingStrategy>;
  tenant?: Maybe<Tenant>;
  tenants: Array<Tenant>;
  trips: Array<Trip>;
  users: Array<User>;
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


export type QueryPricingStrategiesArgs = {
  filter?: InputMaybe<StrategyFilter>;
};


export type QueryPricingStrategyArgs = {
  id: Scalars['ID']['input'];
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
  Fee = 'FEE',
  ProviderSelection = 'PROVIDER_SELECTION'
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



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;


/** Mapping of interface types */
export type ResolversInterfaceTypes<_RefType extends Record<string, unknown>> = {
  Bundle: ( CatalogBundle ) | ( CustomerBundle );
  CheckoutAuthInterface: ( CheckoutAuth ) | ( CheckoutAuthWithOtp );
};

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  ActionType: ActionType;
  ActivateESIMResponse: ResolverTypeWrapper<ActivateEsimResponse>;
  AdminESIM: ResolverTypeWrapper<AdminEsim>;
  AdminESIMDetails: ResolverTypeWrapper<AdminEsimDetails>;
  AdminESIMOrder: ResolverTypeWrapper<AdminEsimOrder>;
  AdminESIMUser: ResolverTypeWrapper<AdminEsimUser>;
  AppliedRule: ResolverTypeWrapper<AppliedRule>;
  ApplyCouponToCheckoutInput: ApplyCouponToCheckoutInput;
  ApplyCouponToCheckoutPayload: ResolverTypeWrapper<ApplyCouponToCheckoutPayload>;
  AssignPackageResponse: ResolverTypeWrapper<AssignPackageResponse>;
  AssignmentStatus: AssignmentStatus;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Bundle: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['Bundle']>;
  BundleConnection: ResolverTypeWrapper<Omit<BundleConnection, 'nodes'> & { nodes: Array<ResolversTypes['Bundle']> }>;
  BundleDataAggregation: ResolverTypeWrapper<BundleDataAggregation>;
  BundleFilter: BundleFilter;
  BundleFilterOptions: ResolverTypeWrapper<BundleFilterOptions>;
  BundleState: BundleState;
  BundleStats: ResolverTypeWrapper<BundleStats>;
  BundlesByCountry: ResolverTypeWrapper<Omit<BundlesByCountry, 'bundles'> & { bundles: Array<ResolversTypes['Bundle']> }>;
  BundlesByGroup: ResolverTypeWrapper<Omit<BundlesByGroup, 'bundles'> & { bundles: Array<ResolversTypes['Bundle']> }>;
  BundlesByRegion: ResolverTypeWrapper<Omit<BundlesByRegion, 'bundles'> & { bundles: Array<ResolversTypes['Bundle']> }>;
  BundlesForCountry: ResolverTypeWrapper<Omit<BundlesForCountry, 'bundles'> & { bundles: Array<ResolversTypes['Bundle']> }>;
  BundlesForGroup: ResolverTypeWrapper<Omit<BundlesForGroup, 'bundles'> & { bundles: Array<ResolversTypes['Bundle']> }>;
  BundlesForRegion: ResolverTypeWrapper<Omit<BundlesForRegion, 'bundles'> & { bundles: Array<ResolversTypes['Bundle']> }>;
  CalculatePriceInput: CalculatePriceInput;
  CatalogBundle: ResolverTypeWrapper<CatalogBundle>;
  CatalogBundleConnection: ResolverTypeWrapper<CatalogBundleConnection>;
  CatalogCountryBundles: ResolverTypeWrapper<CatalogCountryBundles>;
  CatalogSyncHistoryConnection: ResolverTypeWrapper<CatalogSyncHistoryConnection>;
  CatalogSyncJob: ResolverTypeWrapper<CatalogSyncJob>;
  CatalogSyncProgressUpdate: ResolverTypeWrapper<CatalogSyncProgressUpdate>;
  Checkout: ResolverTypeWrapper<Checkout>;
  CheckoutAuth: ResolverTypeWrapper<CheckoutAuth>;
  CheckoutAuthInterface: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['CheckoutAuthInterface']>;
  CheckoutAuthWithOTP: ResolverTypeWrapper<CheckoutAuthWithOtp>;
  CheckoutBundle: ResolverTypeWrapper<CheckoutBundle>;
  CheckoutDelivery: ResolverTypeWrapper<CheckoutDelivery>;
  CheckoutPayment: ResolverTypeWrapper<CheckoutPayment>;
  CheckoutSession: ResolverTypeWrapper<CheckoutSession>;
  CheckoutSessionUpdate: ResolverTypeWrapper<CheckoutSessionUpdate>;
  CheckoutStepType: CheckoutStepType;
  CheckoutUpdateType: CheckoutUpdateType;
  ConditionOperator: ConditionOperator;
  ConflictingJobInfo: ResolverTypeWrapper<ConflictingJobInfo>;
  Country: ResolverTypeWrapper<Country>;
  CountryBundle: ResolverTypeWrapper<CountryBundle>;
  CouponError: ResolverTypeWrapper<CouponError>;
  CreateCheckoutSessionInput: CreateCheckoutSessionInput;
  CreateCheckoutSessionResponse: ResolverTypeWrapper<CreateCheckoutSessionResponse>;
  CreatePricingRuleInput: CreatePricingRuleInput;
  CreateTenantInput: CreateTenantInput;
  CreateTripInput: CreateTripInput;
  CreateTripResponse: ResolverTypeWrapper<CreateTripResponse>;
  CustomerBundle: ResolverTypeWrapper<CustomerBundle>;
  CustomerDiscount: ResolverTypeWrapper<CustomerDiscount>;
  DataAmountGroup: ResolverTypeWrapper<DataAmountGroup>;
  DataType: ResolverTypeWrapper<DataType>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  DeleteTripResponse: ResolverTypeWrapper<DeleteTripResponse>;
  DeleteUserResponse: ResolverTypeWrapper<DeleteUserResponse>;
  Discount: ResolverTypeWrapper<Discount>;
  DiscountApplication: ResolverTypeWrapper<DiscountApplication>;
  DurationGroup: ResolverTypeWrapper<DurationGroup>;
  DurationRange: ResolverTypeWrapper<DurationRange>;
  ESIM: ResolverTypeWrapper<Esim>;
  ESIMActionResponse: ResolverTypeWrapper<EsimActionResponse>;
  ESIMBundle: ResolverTypeWrapper<EsimBundle>;
  ESIMStatus: EsimStatus;
  ESIMStatusUpdate: ResolverTypeWrapper<EsimStatusUpdate>;
  ESIMUsage: ResolverTypeWrapper<EsimUsage>;
  FilterOption: ResolverTypeWrapper<FilterOption>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  FloatRange: FloatRange;
  GetCheckoutSessionResponse: ResolverTypeWrapper<GetCheckoutSessionResponse>;
  GroupDataStats: ResolverTypeWrapper<GroupDataStats>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  ISOCountryCode: ResolverTypeWrapper<Scalars['ISOCountryCode']['output']>;
  InstallationLinks: ResolverTypeWrapper<InstallationLinks>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  IntRange: IntRange;
  InviteAdminUserInput: InviteAdminUserInput;
  InviteAdminUserResponse: ResolverTypeWrapper<InviteAdminUserResponse>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  ManualInstallation: ResolverTypeWrapper<ManualInstallation>;
  Mutation: ResolverTypeWrapper<{}>;
  Order: ResolverTypeWrapper<Order>;
  OrderFilter: OrderFilter;
  OrderStatus: OrderStatus;
  PackageAssignment: ResolverTypeWrapper<PackageAssignment>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  PaginationInput: PaginationInput;
  PaymentIntent: ResolverTypeWrapper<PaymentIntent>;
  PaymentMethod: PaymentMethod;
  PaymentMethodInfo: ResolverTypeWrapper<PaymentMethodInfo>;
  PriceRange: ResolverTypeWrapper<PriceRange>;
  PricingBlock: ResolverTypeWrapper<PricingBlock>;
  PricingBlockFilter: PricingBlockFilter;
  PricingBreakdown: ResolverTypeWrapper<PricingBreakdown>;
  PricingConfiguration: ResolverTypeWrapper<PricingConfiguration>;
  PricingFilters: ResolverTypeWrapper<PricingFilters>;
  PricingPipelineStepUpdate: ResolverTypeWrapper<PricingPipelineStepUpdate>;
  PricingRange: ResolverTypeWrapper<PricingRange>;
  PricingRule: ResolverTypeWrapper<PricingRule>;
  PricingRuleFilter: PricingRuleFilter;
  PricingRulePriorityUpdate: PricingRulePriorityUpdate;
  PricingStep: ResolverTypeWrapper<PricingStep>;
  PricingStepUpdate: ResolverTypeWrapper<PricingStepUpdate>;
  PricingStrategy: ResolverTypeWrapper<PricingStrategy>;
  ProcessCheckoutPaymentInput: ProcessCheckoutPaymentInput;
  ProcessCheckoutPaymentResponse: ResolverTypeWrapper<ProcessCheckoutPaymentResponse>;
  ProcessingFeeConfiguration: ResolverTypeWrapper<ProcessingFeeConfiguration>;
  ProcessingFeeConfigurationInput: ProcessingFeeConfigurationInput;
  Provider: Provider;
  PurchaseESIMInput: PurchaseEsimInput;
  PurchaseESIMResponse: ResolverTypeWrapper<PurchaseEsimResponse>;
  Query: ResolverTypeWrapper<{}>;
  RuleAction: ResolverTypeWrapper<RuleAction>;
  RuleActionInput: RuleActionInput;
  RuleCategory: RuleCategory;
  RuleCondition: ResolverTypeWrapper<RuleCondition>;
  RuleConditionInput: RuleConditionInput;
  SearchCatalogCriteria: SearchCatalogCriteria;
  SendOTPResponse: ResolverTypeWrapper<SendOtpResponse>;
  SignInInput: SignInInput;
  SignInResponse: ResolverTypeWrapper<SignInResponse>;
  SignUpInput: SignUpInput;
  SignUpResponse: ResolverTypeWrapper<SignUpResponse>;
  SocialSignInInput: SocialSignInInput;
  StrategyBlock: ResolverTypeWrapper<StrategyBlock>;
  StrategyFilter: StrategyFilter;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  SyncHistoryParams: SyncHistoryParams;
  SyncJobStatus: SyncJobStatus;
  SyncJobType: SyncJobType;
  Tenant: ResolverTypeWrapper<Tenant>;
  TenantConnection: ResolverTypeWrapper<TenantConnection>;
  TenantFilter: TenantFilter;
  TenantOperationResponse: ResolverTypeWrapper<TenantOperationResponse>;
  TenantType: TenantType;
  TestPricingContext: TestPricingContext;
  ToggleHighDemandResponse: ResolverTypeWrapper<ToggleHighDemandResponse>;
  Transaction: ResolverTypeWrapper<Transaction>;
  TriggerSyncParams: TriggerSyncParams;
  TriggerSyncResponse: ResolverTypeWrapper<TriggerSyncResponse>;
  Trip: ResolverTypeWrapper<Trip>;
  UpdateCheckoutStepInput: UpdateCheckoutStepInput;
  UpdateCheckoutStepResponse: ResolverTypeWrapper<UpdateCheckoutStepResponse>;
  UpdatePricingConfigurationInput: UpdatePricingConfigurationInput;
  UpdatePricingConfigurationResponse: ResolverTypeWrapper<UpdatePricingConfigurationResponse>;
  UpdatePricingRuleInput: UpdatePricingRuleInput;
  UpdateProfileInput: UpdateProfileInput;
  UpdateProfileResponse: ResolverTypeWrapper<UpdateProfileResponse>;
  UpdateTenantInput: UpdateTenantInput;
  UpdateTripInput: UpdateTripInput;
  UpdateTripResponse: ResolverTypeWrapper<UpdateTripResponse>;
  User: ResolverTypeWrapper<User>;
  ValidateOrderInput: ValidateOrderInput;
  ValidateOrderResponse: ResolverTypeWrapper<ValidateOrderResponse>;
  VerifyOTPInput: VerifyOtpInput;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  ActivateESIMResponse: ActivateEsimResponse;
  AdminESIM: AdminEsim;
  AdminESIMDetails: AdminEsimDetails;
  AdminESIMOrder: AdminEsimOrder;
  AdminESIMUser: AdminEsimUser;
  AppliedRule: AppliedRule;
  ApplyCouponToCheckoutInput: ApplyCouponToCheckoutInput;
  ApplyCouponToCheckoutPayload: ApplyCouponToCheckoutPayload;
  AssignPackageResponse: AssignPackageResponse;
  Boolean: Scalars['Boolean']['output'];
  Bundle: ResolversInterfaceTypes<ResolversParentTypes>['Bundle'];
  BundleConnection: Omit<BundleConnection, 'nodes'> & { nodes: Array<ResolversParentTypes['Bundle']> };
  BundleDataAggregation: BundleDataAggregation;
  BundleFilter: BundleFilter;
  BundleFilterOptions: BundleFilterOptions;
  BundleStats: BundleStats;
  BundlesByCountry: Omit<BundlesByCountry, 'bundles'> & { bundles: Array<ResolversParentTypes['Bundle']> };
  BundlesByGroup: Omit<BundlesByGroup, 'bundles'> & { bundles: Array<ResolversParentTypes['Bundle']> };
  BundlesByRegion: Omit<BundlesByRegion, 'bundles'> & { bundles: Array<ResolversParentTypes['Bundle']> };
  BundlesForCountry: Omit<BundlesForCountry, 'bundles'> & { bundles: Array<ResolversParentTypes['Bundle']> };
  BundlesForGroup: Omit<BundlesForGroup, 'bundles'> & { bundles: Array<ResolversParentTypes['Bundle']> };
  BundlesForRegion: Omit<BundlesForRegion, 'bundles'> & { bundles: Array<ResolversParentTypes['Bundle']> };
  CalculatePriceInput: CalculatePriceInput;
  CatalogBundle: CatalogBundle;
  CatalogBundleConnection: CatalogBundleConnection;
  CatalogCountryBundles: CatalogCountryBundles;
  CatalogSyncHistoryConnection: CatalogSyncHistoryConnection;
  CatalogSyncJob: CatalogSyncJob;
  CatalogSyncProgressUpdate: CatalogSyncProgressUpdate;
  Checkout: Checkout;
  CheckoutAuth: CheckoutAuth;
  CheckoutAuthInterface: ResolversInterfaceTypes<ResolversParentTypes>['CheckoutAuthInterface'];
  CheckoutAuthWithOTP: CheckoutAuthWithOtp;
  CheckoutBundle: CheckoutBundle;
  CheckoutDelivery: CheckoutDelivery;
  CheckoutPayment: CheckoutPayment;
  CheckoutSession: CheckoutSession;
  CheckoutSessionUpdate: CheckoutSessionUpdate;
  ConflictingJobInfo: ConflictingJobInfo;
  Country: Country;
  CountryBundle: CountryBundle;
  CouponError: CouponError;
  CreateCheckoutSessionInput: CreateCheckoutSessionInput;
  CreateCheckoutSessionResponse: CreateCheckoutSessionResponse;
  CreatePricingRuleInput: CreatePricingRuleInput;
  CreateTenantInput: CreateTenantInput;
  CreateTripInput: CreateTripInput;
  CreateTripResponse: CreateTripResponse;
  CustomerBundle: CustomerBundle;
  CustomerDiscount: CustomerDiscount;
  DataAmountGroup: DataAmountGroup;
  DataType: DataType;
  DateTime: Scalars['DateTime']['output'];
  DeleteTripResponse: DeleteTripResponse;
  DeleteUserResponse: DeleteUserResponse;
  Discount: Discount;
  DiscountApplication: DiscountApplication;
  DurationGroup: DurationGroup;
  DurationRange: DurationRange;
  ESIM: Esim;
  ESIMActionResponse: EsimActionResponse;
  ESIMBundle: EsimBundle;
  ESIMStatusUpdate: EsimStatusUpdate;
  ESIMUsage: EsimUsage;
  FilterOption: FilterOption;
  Float: Scalars['Float']['output'];
  FloatRange: FloatRange;
  GetCheckoutSessionResponse: GetCheckoutSessionResponse;
  GroupDataStats: GroupDataStats;
  ID: Scalars['ID']['output'];
  ISOCountryCode: Scalars['ISOCountryCode']['output'];
  InstallationLinks: InstallationLinks;
  Int: Scalars['Int']['output'];
  IntRange: IntRange;
  InviteAdminUserInput: InviteAdminUserInput;
  InviteAdminUserResponse: InviteAdminUserResponse;
  JSON: Scalars['JSON']['output'];
  ManualInstallation: ManualInstallation;
  Mutation: {};
  Order: Order;
  OrderFilter: OrderFilter;
  PackageAssignment: PackageAssignment;
  PageInfo: PageInfo;
  PaginationInput: PaginationInput;
  PaymentIntent: PaymentIntent;
  PaymentMethodInfo: PaymentMethodInfo;
  PriceRange: PriceRange;
  PricingBlock: PricingBlock;
  PricingBlockFilter: PricingBlockFilter;
  PricingBreakdown: PricingBreakdown;
  PricingConfiguration: PricingConfiguration;
  PricingFilters: PricingFilters;
  PricingPipelineStepUpdate: PricingPipelineStepUpdate;
  PricingRange: PricingRange;
  PricingRule: PricingRule;
  PricingRuleFilter: PricingRuleFilter;
  PricingRulePriorityUpdate: PricingRulePriorityUpdate;
  PricingStep: PricingStep;
  PricingStepUpdate: PricingStepUpdate;
  PricingStrategy: PricingStrategy;
  ProcessCheckoutPaymentInput: ProcessCheckoutPaymentInput;
  ProcessCheckoutPaymentResponse: ProcessCheckoutPaymentResponse;
  ProcessingFeeConfiguration: ProcessingFeeConfiguration;
  ProcessingFeeConfigurationInput: ProcessingFeeConfigurationInput;
  PurchaseESIMInput: PurchaseEsimInput;
  PurchaseESIMResponse: PurchaseEsimResponse;
  Query: {};
  RuleAction: RuleAction;
  RuleActionInput: RuleActionInput;
  RuleCondition: RuleCondition;
  RuleConditionInput: RuleConditionInput;
  SearchCatalogCriteria: SearchCatalogCriteria;
  SendOTPResponse: SendOtpResponse;
  SignInInput: SignInInput;
  SignInResponse: SignInResponse;
  SignUpInput: SignUpInput;
  SignUpResponse: SignUpResponse;
  SocialSignInInput: SocialSignInInput;
  StrategyBlock: StrategyBlock;
  StrategyFilter: StrategyFilter;
  String: Scalars['String']['output'];
  Subscription: {};
  SyncHistoryParams: SyncHistoryParams;
  Tenant: Tenant;
  TenantConnection: TenantConnection;
  TenantFilter: TenantFilter;
  TenantOperationResponse: TenantOperationResponse;
  TestPricingContext: TestPricingContext;
  ToggleHighDemandResponse: ToggleHighDemandResponse;
  Transaction: Transaction;
  TriggerSyncParams: TriggerSyncParams;
  TriggerSyncResponse: TriggerSyncResponse;
  Trip: Trip;
  UpdateCheckoutStepInput: UpdateCheckoutStepInput;
  UpdateCheckoutStepResponse: UpdateCheckoutStepResponse;
  UpdatePricingConfigurationInput: UpdatePricingConfigurationInput;
  UpdatePricingConfigurationResponse: UpdatePricingConfigurationResponse;
  UpdatePricingRuleInput: UpdatePricingRuleInput;
  UpdateProfileInput: UpdateProfileInput;
  UpdateProfileResponse: UpdateProfileResponse;
  UpdateTenantInput: UpdateTenantInput;
  UpdateTripInput: UpdateTripInput;
  UpdateTripResponse: UpdateTripResponse;
  User: User;
  ValidateOrderInput: ValidateOrderInput;
  ValidateOrderResponse: ValidateOrderResponse;
  VerifyOTPInput: VerifyOtpInput;
};

export type ActivateEsimResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ActivateESIMResponse'] = ResolversParentTypes['ActivateESIMResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  esim?: Resolver<Maybe<ResolversTypes['ESIM']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AdminEsimResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AdminESIM'] = ResolversParentTypes['AdminESIM']> = {
  actionDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  activationCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  apiStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  assignedDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  customerRef?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  esim_bundles?: Resolver<Maybe<Array<Maybe<ResolversTypes['JSON']>>>, ParentType, ContextType>;
  iccid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastAction?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  matchingId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  order?: Resolver<Maybe<ResolversTypes['AdminESIMOrder']>, ParentType, ContextType>;
  orderId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  qrCodeUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  smdpAddress?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  usage?: Resolver<Maybe<ResolversTypes['ESIMUsage']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['AdminESIMUser']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AdminEsimDetailsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AdminESIMDetails'] = ResolversParentTypes['AdminESIMDetails']> = {
  actionDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  activationCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  apiDetails?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  assignedDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  customerRef?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  iccid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastAction?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  matchingId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  order?: Resolver<Maybe<ResolversTypes['Order']>, ParentType, ContextType>;
  orderId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  qrCodeUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  smdpAddress?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  usage?: Resolver<Maybe<ResolversTypes['ESIMUsage']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AdminEsimOrderResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AdminESIMOrder'] = ResolversParentTypes['AdminESIMOrder']> = {
  bundleName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  reference?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AdminEsimUserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AdminESIMUser'] = ResolversParentTypes['AdminESIMUser']> = {
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AppliedRuleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AppliedRule'] = ResolversParentTypes['AppliedRule']> = {
  category?: Resolver<ResolversTypes['RuleCategory'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  impact?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ApplyCouponToCheckoutPayloadResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ApplyCouponToCheckoutPayload'] = ResolversParentTypes['ApplyCouponToCheckoutPayload']> = {
  checkout?: Resolver<Maybe<ResolversTypes['Checkout']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['CouponError']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AssignPackageResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AssignPackageResponse'] = ResolversParentTypes['AssignPackageResponse']> = {
  assignment?: Resolver<Maybe<ResolversTypes['PackageAssignment']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BundleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Bundle'] = ResolversParentTypes['Bundle']> = {
  __resolveType: TypeResolveFn<'CatalogBundle' | 'CustomerBundle', ParentType, ContextType>;
  basePrice?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  countries?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  dataAmountMB?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  dataAmountReadable?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  groups?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  isUnlimited?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pricingBreakdown?: Resolver<Maybe<ResolversTypes['PricingBreakdown']>, ParentType, ContextType, Partial<BundlePricingBreakdownArgs>>;
  provider?: Resolver<ResolversTypes['Provider'], ParentType, ContextType>;
  region?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  speed?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  validityInDays?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type BundleConnectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['BundleConnection'] = ResolversParentTypes['BundleConnection']> = {
  nodes?: Resolver<Array<ResolversTypes['Bundle']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BundleDataAggregationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['BundleDataAggregation'] = ResolversParentTypes['BundleDataAggregation']> = {
  byDataAmount?: Resolver<Array<ResolversTypes['DataAmountGroup']>, ParentType, ContextType>;
  byDuration?: Resolver<Array<ResolversTypes['DurationGroup']>, ParentType, ContextType>;
  byGroup?: Resolver<Array<ResolversTypes['GroupDataStats']>, ParentType, ContextType>;
  lastUpdated?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unlimited?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BundleFilterOptionsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['BundleFilterOptions'] = ResolversParentTypes['BundleFilterOptions']> = {
  countries?: Resolver<Array<ResolversTypes['FilterOption']>, ParentType, ContextType>;
  groups?: Resolver<Array<ResolversTypes['FilterOption']>, ParentType, ContextType>;
  regions?: Resolver<Array<ResolversTypes['FilterOption']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BundleStatsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['BundleStats'] = ResolversParentTypes['BundleStats']> = {
  discounts?: Resolver<Maybe<Array<ResolversTypes['Discount']>>, ParentType, ContextType>;
  totalBundles?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCountries?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalGroups?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalRegions?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BundlesByCountryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['BundlesByCountry'] = ResolversParentTypes['BundlesByCountry']> = {
  bundleCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  bundles?: Resolver<Array<ResolversTypes['Bundle']>, ParentType, ContextType, RequireFields<BundlesByCountryBundlesArgs, 'limit'>>;
  country?: Resolver<ResolversTypes['Country'], ParentType, ContextType>;
  discounts?: Resolver<Maybe<Array<ResolversTypes['Discount']>>, ParentType, ContextType>;
  pricingRange?: Resolver<Maybe<ResolversTypes['PricingRange']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BundlesByGroupResolvers<ContextType = Context, ParentType extends ResolversParentTypes['BundlesByGroup'] = ResolversParentTypes['BundlesByGroup']> = {
  bundleCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  bundles?: Resolver<Array<ResolversTypes['Bundle']>, ParentType, ContextType, RequireFields<BundlesByGroupBundlesArgs, 'limit'>>;
  discounts?: Resolver<Maybe<Array<ResolversTypes['Discount']>>, ParentType, ContextType>;
  group?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pricingRange?: Resolver<Maybe<ResolversTypes['PricingRange']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BundlesByRegionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['BundlesByRegion'] = ResolversParentTypes['BundlesByRegion']> = {
  bundleCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  bundles?: Resolver<Array<ResolversTypes['Bundle']>, ParentType, ContextType, RequireFields<BundlesByRegionBundlesArgs, 'limit'>>;
  discounts?: Resolver<Maybe<Array<ResolversTypes['Discount']>>, ParentType, ContextType>;
  pricingRange?: Resolver<Maybe<ResolversTypes['PricingRange']>, ParentType, ContextType>;
  region?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BundlesForCountryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['BundlesForCountry'] = ResolversParentTypes['BundlesForCountry']> = {
  bundleCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  bundles?: Resolver<Array<ResolversTypes['Bundle']>, ParentType, ContextType>;
  country?: Resolver<ResolversTypes['Country'], ParentType, ContextType>;
  discounts?: Resolver<Maybe<Array<ResolversTypes['Discount']>>, ParentType, ContextType>;
  groups?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  hasUnlimited?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  pricingRange?: Resolver<ResolversTypes['PriceRange'], ParentType, ContextType>;
  regions?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BundlesForGroupResolvers<ContextType = Context, ParentType extends ResolversParentTypes['BundlesForGroup'] = ResolversParentTypes['BundlesForGroup']> = {
  bundleCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  bundles?: Resolver<Array<ResolversTypes['Bundle']>, ParentType, ContextType>;
  countries?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  discounts?: Resolver<Maybe<Array<ResolversTypes['Discount']>>, ParentType, ContextType>;
  group?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasUnlimited?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  pricingRange?: Resolver<ResolversTypes['PriceRange'], ParentType, ContextType>;
  regions?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BundlesForRegionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['BundlesForRegion'] = ResolversParentTypes['BundlesForRegion']> = {
  bundleCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  bundles?: Resolver<Array<ResolversTypes['Bundle']>, ParentType, ContextType>;
  countries?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  discounts?: Resolver<Maybe<Array<ResolversTypes['Discount']>>, ParentType, ContextType>;
  groups?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  hasUnlimited?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  pricingRange?: Resolver<ResolversTypes['PriceRange'], ParentType, ContextType>;
  region?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CatalogBundleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CatalogBundle'] = ResolversParentTypes['CatalogBundle']> = {
  basePrice?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  countries?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  dataAmountMB?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  dataAmountReadable?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  esimGoName?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  groups?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  isUnlimited?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pricingBreakdown?: Resolver<Maybe<ResolversTypes['PricingBreakdown']>, ParentType, ContextType, Partial<CatalogBundlePricingBreakdownArgs>>;
  provider?: Resolver<ResolversTypes['Provider'], ParentType, ContextType>;
  region?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  speed?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  syncedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  validityInDays?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CatalogBundleConnectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CatalogBundleConnection'] = ResolversParentTypes['CatalogBundleConnection']> = {
  bundles?: Resolver<Array<ResolversTypes['CatalogBundle']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CatalogCountryBundlesResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CatalogCountryBundles'] = ResolversParentTypes['CatalogCountryBundles']> = {
  bundleCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  bundles?: Resolver<Array<ResolversTypes['CatalogBundle']>, ParentType, ContextType>;
  country?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CatalogSyncHistoryConnectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CatalogSyncHistoryConnection'] = ResolversParentTypes['CatalogSyncHistoryConnection']> = {
  jobs?: Resolver<Array<ResolversTypes['CatalogSyncJob']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CatalogSyncJobResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CatalogSyncJob'] = ResolversParentTypes['CatalogSyncJob']> = {
  bundlesAdded?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  bundlesProcessed?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  bundlesUpdated?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  completedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  countryId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  duration?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  errorMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  group?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  jobType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  metadata?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['SyncJobType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CatalogSyncProgressUpdateResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CatalogSyncProgressUpdate'] = ResolversParentTypes['CatalogSyncProgressUpdate']> = {
  bundleGroup?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bundlesAdded?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  bundlesProcessed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  bundlesUpdated?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  countryId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  errorMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  jobId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  jobType?: Resolver<ResolversTypes['SyncJobType'], ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  progress?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['SyncJobStatus'], ParentType, ContextType>;
  totalBundles?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CheckoutResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Checkout'] = ResolversParentTypes['Checkout']> = {
  auth?: Resolver<Maybe<ResolversTypes['CheckoutAuth']>, ParentType, ContextType>;
  bundle?: Resolver<Maybe<ResolversTypes['CheckoutBundle']>, ParentType, ContextType>;
  delivery?: Resolver<Maybe<ResolversTypes['CheckoutDelivery']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  payment?: Resolver<Maybe<ResolversTypes['CheckoutPayment']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CheckoutAuthResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CheckoutAuth'] = ResolversParentTypes['CheckoutAuth']> = {
  completed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lastName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  method?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  otpSent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  otpVerified?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  userId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CheckoutAuthInterfaceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CheckoutAuthInterface'] = ResolversParentTypes['CheckoutAuthInterface']> = {
  __resolveType: TypeResolveFn<'CheckoutAuth' | 'CheckoutAuthWithOTP', ParentType, ContextType>;
  completed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lastName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  method?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  otpSent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  otpVerified?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  userId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type CheckoutAuthWithOtpResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CheckoutAuthWithOTP'] = ResolversParentTypes['CheckoutAuthWithOTP']> = {
  authToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  completed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lastName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  method?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  otpSent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  otpVerified?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CheckoutBundleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CheckoutBundle'] = ResolversParentTypes['CheckoutBundle']> = {
  completed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  country?: Resolver<Maybe<ResolversTypes['Country']>, ParentType, ContextType>;
  countryId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  dataAmount?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  discounts?: Resolver<Array<ResolversTypes['Float']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  numOfDays?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  pricePerDay?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  speed?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  validated?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CheckoutDeliveryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CheckoutDelivery'] = ResolversParentTypes['CheckoutDelivery']> = {
  completed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lastName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CheckoutPaymentResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CheckoutPayment'] = ResolversParentTypes['CheckoutPayment']> = {
  completed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  intent?: Resolver<Maybe<ResolversTypes['PaymentIntent']>, ParentType, ContextType>;
  nameForBilling?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  redirectUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  transaction?: Resolver<Maybe<ResolversTypes['Transaction']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CheckoutSessionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CheckoutSession'] = ResolversParentTypes['CheckoutSession']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  expiresAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isComplete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isValidated?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  metadata?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  orderId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  paymentIntentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  paymentStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  paymentUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  planSnapshot?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  pricing?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  steps?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  timeRemaining?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CheckoutSessionUpdateResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CheckoutSessionUpdate'] = ResolversParentTypes['CheckoutSessionUpdate']> = {
  session?: Resolver<ResolversTypes['CheckoutSession'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  updateType?: Resolver<ResolversTypes['CheckoutUpdateType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConflictingJobInfoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ConflictingJobInfo'] = ResolversParentTypes['ConflictingJobInfo']> = {
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  jobType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CountryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Country'] = ResolversParentTypes['Country']> = {
  flag?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isHighDemand?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  iso?: Resolver<ResolversTypes['ISOCountryCode'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nameHebrew?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  region?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CountryBundleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CountryBundle'] = ResolversParentTypes['CountryBundle']> = {
  appliedRules?: Resolver<Maybe<Array<ResolversTypes['AppliedRule']>>, ParentType, ContextType>;
  country?: Resolver<ResolversTypes['Country'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  data?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  duration?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  group?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isUnlimited?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  price?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  pricingBreakdown?: Resolver<Maybe<ResolversTypes['PricingBreakdown']>, ParentType, ContextType>;
  provider?: Resolver<ResolversTypes['Provider'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CouponErrorResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CouponError'] = ResolversParentTypes['CouponError']> = {
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CreateCheckoutSessionResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CreateCheckoutSessionResponse'] = ResolversParentTypes['CreateCheckoutSessionResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  session?: Resolver<Maybe<ResolversTypes['CheckoutSession']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CreateTripResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CreateTripResponse'] = ResolversParentTypes['CreateTripResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  trip?: Resolver<Maybe<ResolversTypes['Trip']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CustomerBundleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CustomerBundle'] = ResolversParentTypes['CustomerBundle']> = {
  basePrice?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  countries?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  dataAmountMB?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  dataAmountReadable?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  groups?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isUnlimited?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pricingBreakdown?: Resolver<Maybe<ResolversTypes['PricingBreakdown']>, ParentType, ContextType, Partial<CustomerBundlePricingBreakdownArgs>>;
  provider?: Resolver<ResolversTypes['Provider'], ParentType, ContextType>;
  region?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  speed?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  validityInDays?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CustomerDiscountResolvers<ContextType = Context, ParentType extends ResolversParentTypes['CustomerDiscount'] = ResolversParentTypes['CustomerDiscount']> = {
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  percentage?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  reason?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DataAmountGroupResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DataAmountGroup'] = ResolversParentTypes['DataAmountGroup']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  dataAmount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  percentage?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DataTypeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DataType'] = ResolversParentTypes['DataType']> = {
  isUnlimited?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  maxDataMB?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  minDataMB?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DeleteTripResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DeleteTripResponse'] = ResolversParentTypes['DeleteTripResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DeleteUserResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DeleteUserResponse'] = ResolversParentTypes['DeleteUserResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DiscountResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Discount'] = ResolversParentTypes['Discount']> = {
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DiscountApplicationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DiscountApplication'] = ResolversParentTypes['DiscountApplication']> = {
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  percentage?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DurationGroupResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DurationGroup'] = ResolversParentTypes['DurationGroup']> = {
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  duration?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  percentage?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DurationRangeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DurationRange'] = ResolversParentTypes['DurationRange']> = {
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  maxDays?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  minDays?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EsimResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ESIM'] = ResolversParentTypes['ESIM']> = {
  actionDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  assignedDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bundleId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  bundleName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  bundles?: Resolver<Array<ResolversTypes['ESIMBundle']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  customerRef?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  iccid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  installationLinks?: Resolver<Maybe<ResolversTypes['InstallationLinks']>, ParentType, ContextType>;
  lastAction?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  matchingId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Order'], ParentType, ContextType>;
  qrCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  smdpAddress?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ESIMStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  usage?: Resolver<ResolversTypes['ESIMUsage'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EsimActionResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ESIMActionResponse'] = ResolversParentTypes['ESIMActionResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  esim?: Resolver<Maybe<ResolversTypes['ESIM']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EsimBundleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ESIMBundle'] = ResolversParentTypes['ESIMBundle']> = {
  dataRemaining?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  dataUsed?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  endDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  state?: Resolver<ResolversTypes['BundleState'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EsimStatusUpdateResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ESIMStatusUpdate'] = ResolversParentTypes['ESIMStatusUpdate']> = {
  dataRemaining?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  dataUsed?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  esimId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ESIMStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EsimUsageResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ESIMUsage'] = ResolversParentTypes['ESIMUsage']> = {
  activeBundles?: Resolver<Array<ResolversTypes['ESIMBundle']>, ParentType, ContextType>;
  totalRemaining?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  totalUsed?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FilterOptionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['FilterOption'] = ResolversParentTypes['FilterOption']> = {
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GetCheckoutSessionResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['GetCheckoutSessionResponse'] = ResolversParentTypes['GetCheckoutSessionResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  session?: Resolver<Maybe<ResolversTypes['CheckoutSession']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GroupDataStatsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['GroupDataStats'] = ResolversParentTypes['GroupDataStats']> = {
  averageDataAmount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  group?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  limited?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unlimited?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface IsoCountryCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ISOCountryCode'], any> {
  name: 'ISOCountryCode';
}

export type InstallationLinksResolvers<ContextType = Context, ParentType extends ResolversParentTypes['InstallationLinks'] = ResolversParentTypes['InstallationLinks']> = {
  lpaScheme?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  manual?: Resolver<ResolversTypes['ManualInstallation'], ParentType, ContextType>;
  qrCodeData?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  universalLink?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type InviteAdminUserResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['InviteAdminUserResponse'] = ResolversParentTypes['InviteAdminUserResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  invitedEmail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type ManualInstallationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ManualInstallation'] = ResolversParentTypes['ManualInstallation']> = {
  activationCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  confirmationCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  smDpAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  activateESIM?: Resolver<Maybe<ResolversTypes['ActivateESIMResponse']>, ParentType, ContextType, RequireFields<MutationActivateEsimArgs, 'esimId'>>;
  applyCouponToCheckout?: Resolver<ResolversTypes['ApplyCouponToCheckoutPayload'], ParentType, ContextType, RequireFields<MutationApplyCouponToCheckoutArgs, 'input'>>;
  assignPackageToUser?: Resolver<Maybe<ResolversTypes['AssignPackageResponse']>, ParentType, ContextType, RequireFields<MutationAssignPackageToUserArgs, 'planId' | 'userId'>>;
  assignUserToTenant?: Resolver<ResolversTypes['TenantOperationResponse'], ParentType, ContextType, RequireFields<MutationAssignUserToTenantArgs, 'tenantSlug' | 'userId'>>;
  cancelESIM?: Resolver<Maybe<ResolversTypes['ESIMActionResponse']>, ParentType, ContextType, RequireFields<MutationCancelEsimArgs, 'esimId'>>;
  clonePricingRule?: Resolver<ResolversTypes['PricingRule'], ParentType, ContextType, RequireFields<MutationClonePricingRuleArgs, 'id' | 'newName'>>;
  createCheckout?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationCreateCheckoutArgs, 'countryId' | 'numOfDays' | 'numOfEsims'>>;
  createCheckoutSession?: Resolver<ResolversTypes['CreateCheckoutSessionResponse'], ParentType, ContextType, RequireFields<MutationCreateCheckoutSessionArgs, 'input'>>;
  createPricingRule?: Resolver<ResolversTypes['PricingRule'], ParentType, ContextType, RequireFields<MutationCreatePricingRuleArgs, 'input'>>;
  createTenant?: Resolver<ResolversTypes['Tenant'], ParentType, ContextType, RequireFields<MutationCreateTenantArgs, 'input'>>;
  createTrip?: Resolver<Maybe<ResolversTypes['CreateTripResponse']>, ParentType, ContextType, RequireFields<MutationCreateTripArgs, 'input'>>;
  deletePricingRule?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeletePricingRuleArgs, 'id'>>;
  deleteTenant?: Resolver<ResolversTypes['TenantOperationResponse'], ParentType, ContextType, RequireFields<MutationDeleteTenantArgs, 'slug'>>;
  deleteTrip?: Resolver<Maybe<ResolversTypes['DeleteTripResponse']>, ParentType, ContextType, RequireFields<MutationDeleteTripArgs, 'id'>>;
  deleteUser?: Resolver<Maybe<ResolversTypes['DeleteUserResponse']>, ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'userId'>>;
  inviteAdminUser?: Resolver<Maybe<ResolversTypes['InviteAdminUserResponse']>, ParentType, ContextType, RequireFields<MutationInviteAdminUserArgs, 'input'>>;
  processCheckoutPayment?: Resolver<ResolversTypes['ProcessCheckoutPaymentResponse'], ParentType, ContextType, RequireFields<MutationProcessCheckoutPaymentArgs, 'input'>>;
  processPaymentCallback?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationProcessPaymentCallbackArgs, 'transactionId'>>;
  purchaseESIM?: Resolver<Maybe<ResolversTypes['PurchaseESIMResponse']>, ParentType, ContextType, RequireFields<MutationPurchaseEsimArgs, 'input' | 'planId'>>;
  removeUserFromTenant?: Resolver<ResolversTypes['TenantOperationResponse'], ParentType, ContextType, RequireFields<MutationRemoveUserFromTenantArgs, 'tenantSlug' | 'userId'>>;
  restoreESIM?: Resolver<Maybe<ResolversTypes['ESIMActionResponse']>, ParentType, ContextType, RequireFields<MutationRestoreEsimArgs, 'esimId'>>;
  sendPhoneOTP?: Resolver<Maybe<ResolversTypes['SendOTPResponse']>, ParentType, ContextType, RequireFields<MutationSendPhoneOtpArgs, 'phoneNumber'>>;
  signIn?: Resolver<Maybe<ResolversTypes['SignInResponse']>, ParentType, ContextType, RequireFields<MutationSignInArgs, 'input'>>;
  signInWithGoogle?: Resolver<Maybe<ResolversTypes['SignInResponse']>, ParentType, ContextType, RequireFields<MutationSignInWithGoogleArgs, 'input'>>;
  signUp?: Resolver<Maybe<ResolversTypes['SignUpResponse']>, ParentType, ContextType, RequireFields<MutationSignUpArgs, 'input'>>;
  suspendESIM?: Resolver<Maybe<ResolversTypes['ESIMActionResponse']>, ParentType, ContextType, RequireFields<MutationSuspendEsimArgs, 'esimId'>>;
  toggleHighDemandCountry?: Resolver<Maybe<ResolversTypes['ToggleHighDemandResponse']>, ParentType, ContextType, RequireFields<MutationToggleHighDemandCountryArgs, 'countryId'>>;
  togglePricingRule?: Resolver<ResolversTypes['PricingRule'], ParentType, ContextType, RequireFields<MutationTogglePricingRuleArgs, 'id'>>;
  triggerCatalogSync?: Resolver<Maybe<ResolversTypes['TriggerSyncResponse']>, ParentType, ContextType, RequireFields<MutationTriggerCatalogSyncArgs, 'params'>>;
  triggerCheckoutPayment?: Resolver<ResolversTypes['CheckoutPayment'], ParentType, ContextType, RequireFields<MutationTriggerCheckoutPaymentArgs, 'redirectUrl' | 'sessionId'>>;
  updateCheckoutAuth?: Resolver<ResolversTypes['CheckoutAuth'], ParentType, ContextType, RequireFields<MutationUpdateCheckoutAuthArgs, 'sessionId'>>;
  updateCheckoutAuthName?: Resolver<ResolversTypes['CheckoutAuth'], ParentType, ContextType, RequireFields<MutationUpdateCheckoutAuthNameArgs, 'sessionId'>>;
  updateCheckoutDelivery?: Resolver<ResolversTypes['CheckoutDelivery'], ParentType, ContextType, RequireFields<MutationUpdateCheckoutDeliveryArgs, 'sessionId'>>;
  updateCheckoutStep?: Resolver<ResolversTypes['UpdateCheckoutStepResponse'], ParentType, ContextType, RequireFields<MutationUpdateCheckoutStepArgs, 'input'>>;
  updateESIMReference?: Resolver<Maybe<ResolversTypes['ESIMActionResponse']>, ParentType, ContextType, RequireFields<MutationUpdateEsimReferenceArgs, 'esimId' | 'reference'>>;
  updatePricingConfiguration?: Resolver<Maybe<ResolversTypes['UpdatePricingConfigurationResponse']>, ParentType, ContextType, RequireFields<MutationUpdatePricingConfigurationArgs, 'input'>>;
  updatePricingRule?: Resolver<ResolversTypes['PricingRule'], ParentType, ContextType, RequireFields<MutationUpdatePricingRuleArgs, 'id' | 'input'>>;
  updatePricingRulePriorities?: Resolver<Array<ResolversTypes['PricingRule']>, ParentType, ContextType, RequireFields<MutationUpdatePricingRulePrioritiesArgs, 'updates'>>;
  updateProfile?: Resolver<Maybe<ResolversTypes['UpdateProfileResponse']>, ParentType, ContextType, RequireFields<MutationUpdateProfileArgs, 'input'>>;
  updateTenant?: Resolver<ResolversTypes['Tenant'], ParentType, ContextType, RequireFields<MutationUpdateTenantArgs, 'input' | 'slug'>>;
  updateTrip?: Resolver<Maybe<ResolversTypes['UpdateTripResponse']>, ParentType, ContextType, RequireFields<MutationUpdateTripArgs, 'input'>>;
  updateUserRole?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationUpdateUserRoleArgs, 'role' | 'userId'>>;
  validateOrder?: Resolver<ResolversTypes['ValidateOrderResponse'], ParentType, ContextType, RequireFields<MutationValidateOrderArgs, 'input'>>;
  verifyOTP?: Resolver<ResolversTypes['CheckoutAuthWithOTP'], ParentType, ContextType, RequireFields<MutationVerifyOtpArgs, 'otp' | 'sessionId'>>;
  verifyPhoneOTP?: Resolver<Maybe<ResolversTypes['SignInResponse']>, ParentType, ContextType, RequireFields<MutationVerifyPhoneOtpArgs, 'input'>>;
};

export type OrderResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Order'] = ResolversParentTypes['Order']> = {
  bundleId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bundleName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  esims?: Resolver<Array<ResolversTypes['ESIM']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  reference?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['OrderStatus'], ParentType, ContextType>;
  totalPrice?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PackageAssignmentResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PackageAssignment'] = ResolversParentTypes['PackageAssignment']> = {
  assignedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  assignedBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  bundleId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  bundleName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['AssignmentStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PageInfoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = {
  currentPage?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  offset?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PaymentIntentResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PaymentIntent'] = ResolversParentTypes['PaymentIntent']> = {
  applePayJavaScriptUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PaymentMethodInfoResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PaymentMethodInfo'] = ResolversParentTypes['PaymentMethodInfo']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  processingRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['PaymentMethod'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PriceRangeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PriceRange'] = ResolversParentTypes['PriceRange']> = {
  avg?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  max?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  min?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PricingBlockResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PricingBlock'] = ResolversParentTypes['PricingBlock']> = {
  action?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  conditions?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isEditable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  validFrom?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  validUntil?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PricingBreakdownResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PricingBreakdown'] = ResolversParentTypes['PricingBreakdown']> = {
  appliedRules?: Resolver<Maybe<Array<ResolversTypes['AppliedRule']>>, ParentType, ContextType>;
  bundle?: Resolver<ResolversTypes['CountryBundle'], ParentType, ContextType>;
  calculationTimeMs?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  cost?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  country?: Resolver<ResolversTypes['Country'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  customerDiscounts?: Resolver<Maybe<Array<ResolversTypes['CustomerDiscount']>>, ParentType, ContextType>;
  debugInfo?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  discountPerDay?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  discountRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  discountValue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  discounts?: Resolver<Maybe<Array<ResolversTypes['DiscountApplication']>>, ParentType, ContextType>;
  duration?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  finalPrice?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  finalRevenue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  markup?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  netProfit?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  priceAfterDiscount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  pricingSteps?: Resolver<Maybe<Array<ResolversTypes['PricingStep']>>, ParentType, ContextType>;
  processingCost?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  processingRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  revenueAfterProcessing?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  rulesEvaluated?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  savingsAmount?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  savingsPercentage?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  selectedReason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  totalCost?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  totalCostBeforeProcessing?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  unusedDays?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PricingConfigurationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PricingConfiguration'] = ResolversParentTypes['PricingConfiguration']> = {
  bundleGroup?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  countryId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  discountPerDay?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  discountRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  duration?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  markupAmount?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  regionId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PricingFiltersResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PricingFilters'] = ResolversParentTypes['PricingFilters']> = {
  dataTypes?: Resolver<Array<ResolversTypes['DataType']>, ParentType, ContextType>;
  durations?: Resolver<Array<ResolversTypes['DurationRange']>, ParentType, ContextType>;
  groups?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PricingPipelineStepUpdateResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PricingPipelineStepUpdate'] = ResolversParentTypes['PricingPipelineStepUpdate']> = {
  appliedRules?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  correlationId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  debug?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PricingRangeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PricingRange'] = ResolversParentTypes['PricingRange']> = {
  max?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  min?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PricingRuleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PricingRule'] = ResolversParentTypes['PricingRule']> = {
  actions?: Resolver<Array<ResolversTypes['RuleAction']>, ParentType, ContextType>;
  category?: Resolver<ResolversTypes['RuleCategory'], ParentType, ContextType>;
  conditions?: Resolver<Array<ResolversTypes['RuleCondition']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isEditable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  validFrom?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  validUntil?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PricingStepResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PricingStep'] = ResolversParentTypes['PricingStep']> = {
  impact?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  metadata?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  priceAfter?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  priceBefore?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  ruleId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  timestamp?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PricingStepUpdateResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PricingStepUpdate'] = ResolversParentTypes['PricingStepUpdate']> = {
  completedSteps?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  correlationId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  finalBreakdown?: Resolver<Maybe<ResolversTypes['PricingBreakdown']>, ParentType, ContextType>;
  isComplete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  step?: Resolver<Maybe<ResolversTypes['PricingStep']>, ParentType, ContextType>;
  totalSteps?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PricingStrategyResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PricingStrategy'] = ResolversParentTypes['PricingStrategy']> = {
  activationCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  archivedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  blocks?: Resolver<Array<ResolversTypes['StrategyBlock']>, ParentType, ContextType>;
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isDefault?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastActivatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  parentStrategyId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  validatedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  validationErrors?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProcessCheckoutPaymentResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ProcessCheckoutPaymentResponse'] = ResolversParentTypes['ProcessCheckoutPaymentResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  orderId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  paymentIntentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  session?: Resolver<Maybe<ResolversTypes['CheckoutSession']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  webhookProcessing?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProcessingFeeConfigurationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ProcessingFeeConfiguration'] = ResolversParentTypes['ProcessingFeeConfiguration']> = {
  appleGooglePayFee?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  bankWithdrawalFee?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  bitPaymentRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  cancellationFee?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  chargebackFee?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  effectiveFrom?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  effectiveTo?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  fixedFeeForeign?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  fixedFeeNIS?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  foreignCardsRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  invoiceServiceFee?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  israeliCardsRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  monthlyFixedCost?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  monthlyMinimumFee?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  notes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  premiumAmexRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  premiumDinersRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  setupCost?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  threeDSecureFee?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PurchaseEsimResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PurchaseESIMResponse'] = ResolversParentTypes['PurchaseESIMResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  order?: Resolver<Maybe<ResolversTypes['Order']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  allTenants?: Resolver<ResolversTypes['TenantConnection'], ParentType, ContextType, Partial<QueryAllTenantsArgs>>;
  bundle?: Resolver<ResolversTypes['Bundle'], ParentType, ContextType, RequireFields<QueryBundleArgs, 'id'>>;
  bundleFilterOptions?: Resolver<ResolversTypes['BundleFilterOptions'], ParentType, ContextType>;
  bundleStats?: Resolver<ResolversTypes['BundleStats'], ParentType, ContextType>;
  bundles?: Resolver<ResolversTypes['BundleConnection'], ParentType, ContextType, Partial<QueryBundlesArgs>>;
  bundlesByCountry?: Resolver<Array<ResolversTypes['BundlesByCountry']>, ParentType, ContextType, Partial<QueryBundlesByCountryArgs>>;
  bundlesByGroup?: Resolver<Array<ResolversTypes['BundlesByGroup']>, ParentType, ContextType, Partial<QueryBundlesByGroupArgs>>;
  bundlesByRegion?: Resolver<Array<ResolversTypes['BundlesByRegion']>, ParentType, ContextType, Partial<QueryBundlesByRegionArgs>>;
  bundlesForCountry?: Resolver<Maybe<ResolversTypes['BundlesForCountry']>, ParentType, ContextType, RequireFields<QueryBundlesForCountryArgs, 'countryCode'>>;
  bundlesForGroup?: Resolver<Maybe<ResolversTypes['BundlesForGroup']>, ParentType, ContextType, RequireFields<QueryBundlesForGroupArgs, 'group'>>;
  bundlesForRegion?: Resolver<Maybe<ResolversTypes['BundlesForRegion']>, ParentType, ContextType, RequireFields<QueryBundlesForRegionArgs, 'region'>>;
  calculatePrice?: Resolver<ResolversTypes['PricingBreakdown'], ParentType, ContextType, RequireFields<QueryCalculatePriceArgs, 'input'>>;
  calculatePrices?: Resolver<Array<ResolversTypes['PricingBreakdown']>, ParentType, ContextType, RequireFields<QueryCalculatePricesArgs, 'inputs'>>;
  catalogBundles?: Resolver<ResolversTypes['CatalogBundleConnection'], ParentType, ContextType, Partial<QueryCatalogBundlesArgs>>;
  catalogSyncHistory?: Resolver<ResolversTypes['CatalogSyncHistoryConnection'], ParentType, ContextType, Partial<QueryCatalogSyncHistoryArgs>>;
  countries?: Resolver<Array<ResolversTypes['Country']>, ParentType, ContextType>;
  defaultPricingStrategy?: Resolver<Maybe<ResolversTypes['PricingStrategy']>, ParentType, ContextType>;
  esimDetails?: Resolver<Maybe<ResolversTypes['ESIM']>, ParentType, ContextType, RequireFields<QueryEsimDetailsArgs, 'id'>>;
  getAdminESIMDetails?: Resolver<ResolversTypes['AdminESIMDetails'], ParentType, ContextType, RequireFields<QueryGetAdminEsimDetailsArgs, 'iccid'>>;
  getAllESIMs?: Resolver<Array<ResolversTypes['AdminESIM']>, ParentType, ContextType>;
  getCheckoutSession?: Resolver<ResolversTypes['GetCheckoutSessionResponse'], ParentType, ContextType, RequireFields<QueryGetCheckoutSessionArgs, 'token'>>;
  getCustomerESIMs?: Resolver<Array<ResolversTypes['AdminESIM']>, ParentType, ContextType, RequireFields<QueryGetCustomerEsiMsArgs, 'userId'>>;
  getUserOrders?: Resolver<Array<ResolversTypes['Order']>, ParentType, ContextType, RequireFields<QueryGetUserOrdersArgs, 'userId'>>;
  hello?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  highDemandCountries?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  myESIMs?: Resolver<Array<ResolversTypes['ESIM']>, ParentType, ContextType>;
  myOrders?: Resolver<Array<ResolversTypes['Order']>, ParentType, ContextType, Partial<QueryMyOrdersArgs>>;
  orderDetails?: Resolver<Maybe<ResolversTypes['Order']>, ParentType, ContextType, RequireFields<QueryOrderDetailsArgs, 'id'>>;
  orders?: Resolver<Array<ResolversTypes['Order']>, ParentType, ContextType>;
  paymentMethods?: Resolver<Array<ResolversTypes['PaymentMethodInfo']>, ParentType, ContextType>;
  pricingBlock?: Resolver<Maybe<ResolversTypes['PricingBlock']>, ParentType, ContextType, RequireFields<QueryPricingBlockArgs, 'id'>>;
  pricingBlocks?: Resolver<Array<ResolversTypes['PricingBlock']>, ParentType, ContextType, Partial<QueryPricingBlocksArgs>>;
  pricingFilters?: Resolver<ResolversTypes['PricingFilters'], ParentType, ContextType>;
  pricingStrategies?: Resolver<Array<ResolversTypes['PricingStrategy']>, ParentType, ContextType, Partial<QueryPricingStrategiesArgs>>;
  pricingStrategy?: Resolver<Maybe<ResolversTypes['PricingStrategy']>, ParentType, ContextType, RequireFields<QueryPricingStrategyArgs, 'id'>>;
  tenant?: Resolver<Maybe<ResolversTypes['Tenant']>, ParentType, ContextType, RequireFields<QueryTenantArgs, 'slug'>>;
  tenants?: Resolver<Array<ResolversTypes['Tenant']>, ParentType, ContextType>;
  trips?: Resolver<Array<ResolversTypes['Trip']>, ParentType, ContextType>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
};

export type RuleActionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['RuleAction'] = ResolversParentTypes['RuleAction']> = {
  metadata?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ActionType'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RuleConditionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['RuleCondition'] = ResolversParentTypes['RuleCondition']> = {
  field?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  operator?: Resolver<ResolversTypes['ConditionOperator'], ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  value?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SendOtpResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['SendOTPResponse'] = ResolversParentTypes['SendOTPResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  messageId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SignInResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['SignInResponse'] = ResolversParentTypes['SignInResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  refreshToken?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sessionToken?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SignUpResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['SignUpResponse'] = ResolversParentTypes['SignUpResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  refreshToken?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sessionToken?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type StrategyBlockResolvers<ContextType = Context, ParentType extends ResolversParentTypes['StrategyBlock'] = ResolversParentTypes['StrategyBlock']> = {
  configOverrides?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  isEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  pricingBlock?: Resolver<ResolversTypes['PricingBlock'], ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  calculatePricesBatchStream?: SubscriptionResolver<ResolversTypes['PricingBreakdown'], "calculatePricesBatchStream", ParentType, ContextType, RequireFields<SubscriptionCalculatePricesBatchStreamArgs, 'inputs'>>;
  catalogSyncProgress?: SubscriptionResolver<ResolversTypes['CatalogSyncProgressUpdate'], "catalogSyncProgress", ParentType, ContextType>;
  checkout?: SubscriptionResolver<ResolversTypes['Checkout'], "checkout", ParentType, ContextType, RequireFields<SubscriptionCheckoutArgs, 'id'>>;
  checkoutSessionUpdated?: SubscriptionResolver<ResolversTypes['CheckoutSessionUpdate'], "checkoutSessionUpdated", ParentType, ContextType, RequireFields<SubscriptionCheckoutSessionUpdatedArgs, 'token'>>;
  esimStatusUpdated?: SubscriptionResolver<ResolversTypes['ESIMStatusUpdate'], "esimStatusUpdated", ParentType, ContextType, RequireFields<SubscriptionEsimStatusUpdatedArgs, 'esimId'>>;
  pricingCalculationSteps?: SubscriptionResolver<ResolversTypes['PricingStepUpdate'], "pricingCalculationSteps", ParentType, ContextType, RequireFields<SubscriptionPricingCalculationStepsArgs, 'input'>>;
  pricingPipelineProgress?: SubscriptionResolver<ResolversTypes['PricingPipelineStepUpdate'], "pricingPipelineProgress", ParentType, ContextType, RequireFields<SubscriptionPricingPipelineProgressArgs, 'correlationId'>>;
};

export type TenantResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Tenant'] = ResolversParentTypes['Tenant']> = {
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  imgUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  tenantType?: Resolver<ResolversTypes['TenantType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TenantConnectionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TenantConnection'] = ResolversParentTypes['TenantConnection']> = {
  nodes?: Resolver<Array<ResolversTypes['Tenant']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TenantOperationResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TenantOperationResponse'] = ResolversParentTypes['TenantOperationResponse']> = {
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ToggleHighDemandResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ToggleHighDemandResponse'] = ResolversParentTypes['ToggleHighDemandResponse']> = {
  countryId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isHighDemand?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Transaction'] = ResolversParentTypes['Transaction']> = {
  amount?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  currency?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TriggerSyncResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TriggerSyncResponse'] = ResolversParentTypes['TriggerSyncResponse']> = {
  conflictingJob?: Resolver<Maybe<ResolversTypes['ConflictingJobInfo']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  jobId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  provider?: Resolver<Maybe<ResolversTypes['Provider']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TripResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Trip'] = ResolversParentTypes['Trip']> = {
  bundleName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  countries?: Resolver<Array<ResolversTypes['Country']>, ParentType, ContextType>;
  countryIds?: Resolver<Array<ResolversTypes['ISOCountryCode']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdBy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  region?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UpdateCheckoutStepResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UpdateCheckoutStepResponse'] = ResolversParentTypes['UpdateCheckoutStepResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nextStep?: Resolver<Maybe<ResolversTypes['CheckoutStepType']>, ParentType, ContextType>;
  session?: Resolver<Maybe<ResolversTypes['CheckoutSession']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UpdatePricingConfigurationResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UpdatePricingConfigurationResponse'] = ResolversParentTypes['UpdatePricingConfigurationResponse']> = {
  configuration?: Resolver<Maybe<ResolversTypes['PricingConfiguration']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UpdateProfileResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UpdateProfileResponse'] = ResolversParentTypes['UpdateProfileResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UpdateTripResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UpdateTripResponse'] = ResolversParentTypes['UpdateTripResponse']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  trip?: Resolver<Maybe<ResolversTypes['Trip']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  orderCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  phoneNumber?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  role?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ValidateOrderResponseResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ValidateOrderResponse'] = ResolversParentTypes['ValidateOrderResponse']> = {
  bundleDetails?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  currency?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  errorCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isValid?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  totalPrice?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = Context> = {
  ActivateESIMResponse?: ActivateEsimResponseResolvers<ContextType>;
  AdminESIM?: AdminEsimResolvers<ContextType>;
  AdminESIMDetails?: AdminEsimDetailsResolvers<ContextType>;
  AdminESIMOrder?: AdminEsimOrderResolvers<ContextType>;
  AdminESIMUser?: AdminEsimUserResolvers<ContextType>;
  AppliedRule?: AppliedRuleResolvers<ContextType>;
  ApplyCouponToCheckoutPayload?: ApplyCouponToCheckoutPayloadResolvers<ContextType>;
  AssignPackageResponse?: AssignPackageResponseResolvers<ContextType>;
  Bundle?: BundleResolvers<ContextType>;
  BundleConnection?: BundleConnectionResolvers<ContextType>;
  BundleDataAggregation?: BundleDataAggregationResolvers<ContextType>;
  BundleFilterOptions?: BundleFilterOptionsResolvers<ContextType>;
  BundleStats?: BundleStatsResolvers<ContextType>;
  BundlesByCountry?: BundlesByCountryResolvers<ContextType>;
  BundlesByGroup?: BundlesByGroupResolvers<ContextType>;
  BundlesByRegion?: BundlesByRegionResolvers<ContextType>;
  BundlesForCountry?: BundlesForCountryResolvers<ContextType>;
  BundlesForGroup?: BundlesForGroupResolvers<ContextType>;
  BundlesForRegion?: BundlesForRegionResolvers<ContextType>;
  CatalogBundle?: CatalogBundleResolvers<ContextType>;
  CatalogBundleConnection?: CatalogBundleConnectionResolvers<ContextType>;
  CatalogCountryBundles?: CatalogCountryBundlesResolvers<ContextType>;
  CatalogSyncHistoryConnection?: CatalogSyncHistoryConnectionResolvers<ContextType>;
  CatalogSyncJob?: CatalogSyncJobResolvers<ContextType>;
  CatalogSyncProgressUpdate?: CatalogSyncProgressUpdateResolvers<ContextType>;
  Checkout?: CheckoutResolvers<ContextType>;
  CheckoutAuth?: CheckoutAuthResolvers<ContextType>;
  CheckoutAuthInterface?: CheckoutAuthInterfaceResolvers<ContextType>;
  CheckoutAuthWithOTP?: CheckoutAuthWithOtpResolvers<ContextType>;
  CheckoutBundle?: CheckoutBundleResolvers<ContextType>;
  CheckoutDelivery?: CheckoutDeliveryResolvers<ContextType>;
  CheckoutPayment?: CheckoutPaymentResolvers<ContextType>;
  CheckoutSession?: CheckoutSessionResolvers<ContextType>;
  CheckoutSessionUpdate?: CheckoutSessionUpdateResolvers<ContextType>;
  ConflictingJobInfo?: ConflictingJobInfoResolvers<ContextType>;
  Country?: CountryResolvers<ContextType>;
  CountryBundle?: CountryBundleResolvers<ContextType>;
  CouponError?: CouponErrorResolvers<ContextType>;
  CreateCheckoutSessionResponse?: CreateCheckoutSessionResponseResolvers<ContextType>;
  CreateTripResponse?: CreateTripResponseResolvers<ContextType>;
  CustomerBundle?: CustomerBundleResolvers<ContextType>;
  CustomerDiscount?: CustomerDiscountResolvers<ContextType>;
  DataAmountGroup?: DataAmountGroupResolvers<ContextType>;
  DataType?: DataTypeResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  DeleteTripResponse?: DeleteTripResponseResolvers<ContextType>;
  DeleteUserResponse?: DeleteUserResponseResolvers<ContextType>;
  Discount?: DiscountResolvers<ContextType>;
  DiscountApplication?: DiscountApplicationResolvers<ContextType>;
  DurationGroup?: DurationGroupResolvers<ContextType>;
  DurationRange?: DurationRangeResolvers<ContextType>;
  ESIM?: EsimResolvers<ContextType>;
  ESIMActionResponse?: EsimActionResponseResolvers<ContextType>;
  ESIMBundle?: EsimBundleResolvers<ContextType>;
  ESIMStatusUpdate?: EsimStatusUpdateResolvers<ContextType>;
  ESIMUsage?: EsimUsageResolvers<ContextType>;
  FilterOption?: FilterOptionResolvers<ContextType>;
  GetCheckoutSessionResponse?: GetCheckoutSessionResponseResolvers<ContextType>;
  GroupDataStats?: GroupDataStatsResolvers<ContextType>;
  ISOCountryCode?: GraphQLScalarType;
  InstallationLinks?: InstallationLinksResolvers<ContextType>;
  InviteAdminUserResponse?: InviteAdminUserResponseResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  ManualInstallation?: ManualInstallationResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Order?: OrderResolvers<ContextType>;
  PackageAssignment?: PackageAssignmentResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  PaymentIntent?: PaymentIntentResolvers<ContextType>;
  PaymentMethodInfo?: PaymentMethodInfoResolvers<ContextType>;
  PriceRange?: PriceRangeResolvers<ContextType>;
  PricingBlock?: PricingBlockResolvers<ContextType>;
  PricingBreakdown?: PricingBreakdownResolvers<ContextType>;
  PricingConfiguration?: PricingConfigurationResolvers<ContextType>;
  PricingFilters?: PricingFiltersResolvers<ContextType>;
  PricingPipelineStepUpdate?: PricingPipelineStepUpdateResolvers<ContextType>;
  PricingRange?: PricingRangeResolvers<ContextType>;
  PricingRule?: PricingRuleResolvers<ContextType>;
  PricingStep?: PricingStepResolvers<ContextType>;
  PricingStepUpdate?: PricingStepUpdateResolvers<ContextType>;
  PricingStrategy?: PricingStrategyResolvers<ContextType>;
  ProcessCheckoutPaymentResponse?: ProcessCheckoutPaymentResponseResolvers<ContextType>;
  ProcessingFeeConfiguration?: ProcessingFeeConfigurationResolvers<ContextType>;
  PurchaseESIMResponse?: PurchaseEsimResponseResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RuleAction?: RuleActionResolvers<ContextType>;
  RuleCondition?: RuleConditionResolvers<ContextType>;
  SendOTPResponse?: SendOtpResponseResolvers<ContextType>;
  SignInResponse?: SignInResponseResolvers<ContextType>;
  SignUpResponse?: SignUpResponseResolvers<ContextType>;
  StrategyBlock?: StrategyBlockResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Tenant?: TenantResolvers<ContextType>;
  TenantConnection?: TenantConnectionResolvers<ContextType>;
  TenantOperationResponse?: TenantOperationResponseResolvers<ContextType>;
  ToggleHighDemandResponse?: ToggleHighDemandResponseResolvers<ContextType>;
  Transaction?: TransactionResolvers<ContextType>;
  TriggerSyncResponse?: TriggerSyncResponseResolvers<ContextType>;
  Trip?: TripResolvers<ContextType>;
  UpdateCheckoutStepResponse?: UpdateCheckoutStepResponseResolvers<ContextType>;
  UpdatePricingConfigurationResponse?: UpdatePricingConfigurationResponseResolvers<ContextType>;
  UpdateProfileResponse?: UpdateProfileResponseResolvers<ContextType>;
  UpdateTripResponse?: UpdateTripResponseResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  ValidateOrderResponse?: ValidateOrderResponseResolvers<ContextType>;
};

