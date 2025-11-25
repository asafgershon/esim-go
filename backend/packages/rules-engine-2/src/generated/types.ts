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


export type Bundle_PricingBreakdownArgs = {
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


export type BundlesByCountry_BundlesArgs = {
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


export type BundlesByGroup_BundlesArgs = {
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


export type BundlesByRegion_BundlesArgs = {
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


export type CatalogBundle_PricingBreakdownArgs = {
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
  provider: Provider;
};

export type CreateCheckoutSessionInput = {
  countryId?: InputMaybe<Scalars['String']['input']>;
  group?: InputMaybe<Scalars['String']['input']>;
  numOfDays: Scalars['Int']['input'];
  regionId?: InputMaybe<Scalars['String']['input']>;
  numOfEsims?: InputMaybe<Scalars['Int']['input']>;
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


export type CustomerBundle_PricingBreakdownArgs = {
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
  reorderPricingRules: Array<PricingRule>;
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


export type Mutation_ActivateEsimArgs = {
  esimId: Scalars['ID']['input'];
};


export type Mutation_AssignPackageToUserArgs = {
  planId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type Mutation_AssignUserToTenantArgs = {
  role?: InputMaybe<Scalars['String']['input']>;
  tenantSlug: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type Mutation_CancelEsimArgs = {
  esimId: Scalars['ID']['input'];
};


export type Mutation_ClonePricingRuleArgs = {
  id: Scalars['ID']['input'];
  newName: Scalars['String']['input'];
};


export type Mutation_CreateCheckoutArgs = {
  countryId: Scalars['String']['input'];
  numOfDays: Scalars['Int']['input'];
};


export type Mutation_CreateCheckoutSessionArgs = {
  input: CreateCheckoutSessionInput;
};


export type Mutation_CreatePricingRuleArgs = {
  input: CreatePricingRuleInput;
};


export type Mutation_CreateTenantArgs = {
  input: CreateTenantInput;
};


export type Mutation_CreateTripArgs = {
  input: CreateTripInput;
};


export type Mutation_DeletePricingRuleArgs = {
  id: Scalars['ID']['input'];
};


export type Mutation_DeleteTenantArgs = {
  slug: Scalars['ID']['input'];
};


export type Mutation_DeleteTripArgs = {
  id: Scalars['ID']['input'];
};


export type Mutation_DeleteUserArgs = {
  userId: Scalars['ID']['input'];
};


export type Mutation_InviteAdminUserArgs = {
  input: InviteAdminUserInput;
};


export type Mutation_ProcessCheckoutPaymentArgs = {
  input: ProcessCheckoutPaymentInput;
};


export type Mutation_ProcessPaymentCallbackArgs = {
  transactionId: Scalars['String']['input'];
};


export type Mutation_PurchaseEsimArgs = {
  input: PurchaseEsimInput;
  planId: Scalars['ID']['input'];
};


export type Mutation_RemoveUserFromTenantArgs = {
  tenantSlug: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type Mutation_ReorderPricingRulesArgs = {
  updates: Array<PricingRulePriorityUpdate>;
};


export type Mutation_RestoreEsimArgs = {
  esimId: Scalars['ID']['input'];
};


export type Mutation_SendPhoneOtpArgs = {
  phoneNumber: Scalars['String']['input'];
};


export type Mutation_SignInArgs = {
  input: SignInInput;
};


export type Mutation_SignInWithAppleArgs = {
  input: SocialSignInInput;
};


export type Mutation_SignInWithGoogleArgs = {
  input: SocialSignInInput;
};


export type Mutation_SignUpArgs = {
  input: SignUpInput;
};


export type Mutation_SuspendEsimArgs = {
  esimId: Scalars['ID']['input'];
};


export type Mutation_ToggleHighDemandCountryArgs = {
  countryId: Scalars['String']['input'];
};


export type Mutation_TogglePricingRuleArgs = {
  id: Scalars['ID']['input'];
};


export type Mutation_TriggerCatalogSyncArgs = {
  params: TriggerSyncParams;
};


export type Mutation_TriggerCheckoutPaymentArgs = {
  nameForBilling?: InputMaybe<Scalars['String']['input']>;
  redirectUrl: Scalars['String']['input'];
  sessionId: Scalars['String']['input'];
};


export type Mutation_UpdateCheckoutAuthArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  sessionId: Scalars['String']['input'];
};


export type Mutation_UpdateCheckoutAuthNameArgs = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  sessionId: Scalars['String']['input'];
};


export type Mutation_UpdateCheckoutDeliveryArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  sessionId: Scalars['String']['input'];
};


export type Mutation_UpdateCheckoutStepArgs = {
  input: UpdateCheckoutStepInput;
};


export type Mutation_UpdateEsimReferenceArgs = {
  esimId: Scalars['ID']['input'];
  reference: Scalars['String']['input'];
};


export type Mutation_UpdatePricingConfigurationArgs = {
  input: UpdatePricingConfigurationInput;
};


export type Mutation_UpdatePricingRuleArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePricingRuleInput;
};


export type Mutation_UpdatePricingRulePrioritiesArgs = {
  updates: Array<PricingRulePriorityUpdate>;
};


export type Mutation_UpdateProfileArgs = {
  input: UpdateProfileInput;
};


export type Mutation_UpdateTenantArgs = {
  input: UpdateTenantInput;
  slug: Scalars['ID']['input'];
};


export type Mutation_UpdateTripArgs = {
  input: UpdateTripInput;
};


export type Mutation_UpdateUserRoleArgs = {
  role: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type Mutation_ValidateOrderArgs = {
  input: ValidateOrderInput;
};


export type Mutation_VerifyOtpArgs = {
  otp: Scalars['String']['input'];
  sessionId: Scalars['String']['input'];
};


export type Mutation_VerifyPhoneOtpArgs = {
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
  pricingRule?: Maybe<PricingRule>;
  pricingRules: Array<PricingRule>;
  pricingStrategies: Array<PricingStrategy>;
  pricingStrategy?: Maybe<PricingStrategy>;
  tenant?: Maybe<Tenant>;
  tenants: Array<Tenant>;
  trips: Array<Trip>;
  users: Array<User>;
};


export type Query_AllTenantsArgs = {
  filter?: InputMaybe<TenantFilter>;
  pagination?: InputMaybe<PaginationInput>;
};


export type Query_BundleArgs = {
  id: Scalars['String']['input'];
};


export type Query_BundlesArgs = {
  filter?: InputMaybe<BundleFilter>;
  pagination?: InputMaybe<PaginationInput>;
};


export type Query_BundlesByCountryArgs = {
  countryId?: InputMaybe<Scalars['String']['input']>;
};


export type Query_BundlesByGroupArgs = {
  groupId?: InputMaybe<Scalars['String']['input']>;
};


export type Query_BundlesByRegionArgs = {
  regionId?: InputMaybe<Scalars['String']['input']>;
};


export type Query_BundlesForCountryArgs = {
  countryCode: Scalars['String']['input'];
};


export type Query_BundlesForGroupArgs = {
  group: Scalars['String']['input'];
};


export type Query_BundlesForRegionArgs = {
  region: Scalars['String']['input'];
};


export type Query_CalculatePriceArgs = {
  input: CalculatePriceInput;
};


export type Query_CalculatePricesArgs = {
  inputs: Array<CalculatePriceInput>;
};


export type Query_CatalogBundlesArgs = {
  criteria?: InputMaybe<SearchCatalogCriteria>;
};


export type Query_CatalogSyncHistoryArgs = {
  params?: InputMaybe<SyncHistoryParams>;
};


export type Query_EsimDetailsArgs = {
  id: Scalars['ID']['input'];
};


export type Query_GetAdminEsimDetailsArgs = {
  iccid: Scalars['String']['input'];
};


export type Query_GetCheckoutSessionArgs = {
  token: Scalars['String']['input'];
};


export type Query_GetCustomerEsiMsArgs = {
  userId: Scalars['ID']['input'];
};


export type Query_GetUserOrdersArgs = {
  userId: Scalars['ID']['input'];
};


export type Query_MyOrdersArgs = {
  filter?: InputMaybe<OrderFilter>;
};


export type Query_OrderDetailsArgs = {
  id: Scalars['ID']['input'];
};


export type Query_PricingBlockArgs = {
  id: Scalars['ID']['input'];
};


export type Query_PricingBlocksArgs = {
  filter?: InputMaybe<PricingBlockFilter>;
};


export type Query_PricingRuleArgs = {
  id: Scalars['ID']['input'];
};


export type Query_PricingRulesArgs = {
  filter?: InputMaybe<PricingRuleFilter>;
};


export type Query_PricingStrategiesArgs = {
  filter?: InputMaybe<StrategyFilter>;
};


export type Query_PricingStrategyArgs = {
  id: Scalars['ID']['input'];
};


export type Query_TenantArgs = {
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


export type Subscription_CalculatePricesBatchStreamArgs = {
  inputs: Array<CalculatePriceInput>;
  requestedDays?: InputMaybe<Scalars['Int']['input']>;
};


export type Subscription_CheckoutArgs = {
  id: Scalars['ID']['input'];
};


export type Subscription_CheckoutSessionUpdatedArgs = {
  token: Scalars['String']['input'];
};


export type Subscription_EsimStatusUpdatedArgs = {
  esimId: Scalars['ID']['input'];
};


export type Subscription_PricingCalculationStepsArgs = {
  input: CalculatePriceInput;
};


export type Subscription_PricingPipelineProgressArgs = {
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
