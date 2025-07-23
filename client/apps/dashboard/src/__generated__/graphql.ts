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

export type AppliedRule = {
  __typename?: 'AppliedRule';
  id: Scalars['ID']['output'];
  impact: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  type: RuleType;
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

export type BundleDataAggregation = {
  __typename?: 'BundleDataAggregation';
  byBundleGroup: Array<BundleGroupDataStats>;
  byDataAmount: Array<DataAmountGroup>;
  byDuration: Array<DurationGroup>;
  lastUpdated: Scalars['String']['output'];
  total: Scalars['Int']['output'];
  unlimited: Scalars['Int']['output'];
};

export type BundleGroupDataStats = {
  __typename?: 'BundleGroupDataStats';
  averageDataAmount: Scalars['Float']['output'];
  bundleGroup: Scalars['String']['output'];
  limited: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  unlimited: Scalars['Int']['output'];
};

export enum BundleState {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Expired = 'EXPIRED',
  Inactive = 'INACTIVE',
  Processing = 'PROCESSING',
  Suspended = 'SUSPENDED'
}

export type BundlesByCountry = {
  __typename?: 'BundlesByCountry';
  bundleCount: Scalars['Int']['output'];
  bundles?: Maybe<Array<CountryBundle>>;
  countryId: Scalars['String']['output'];
  countryName: Scalars['String']['output'];
  pricingRange?: Maybe<PricingRange>;
};

export type BundlesByRegion = {
  __typename?: 'BundlesByRegion';
  bundleCount: Scalars['Int']['output'];
  countryCount: Scalars['Int']['output'];
  regionName: Scalars['String']['output'];
};

export type CalculatePriceInput = {
  countryId: Scalars['String']['input'];
  numOfDays: Scalars['Int']['input'];
  paymentMethod?: InputMaybe<PaymentMethod>;
  regionId: Scalars['String']['input'];
};

export type CatalogBundle = {
  __typename?: 'CatalogBundle';
  bundleGroup: Scalars['String']['output'];
  countries: Array<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  dataAmount: Scalars['Int']['output'];
  description: Scalars['String']['output'];
  duration: Scalars['Int']['output'];
  esimGoName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  priceCents: Scalars['Int']['output'];
  regions: Array<Scalars['String']['output']>;
  syncedAt: Scalars['String']['output'];
  unlimited: Scalars['Boolean']['output'];
  updatedAt: Scalars['String']['output'];
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
  bundleGroup?: Maybe<Scalars['String']['output']>;
  bundlesAdded?: Maybe<Scalars['Int']['output']>;
  bundlesProcessed?: Maybe<Scalars['Int']['output']>;
  bundlesUpdated?: Maybe<Scalars['Int']['output']>;
  completedAt?: Maybe<Scalars['String']['output']>;
  countryId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  duration?: Maybe<Scalars['Int']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
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

export type CheckoutSession = {
  __typename?: 'CheckoutSession';
  createdAt: Scalars['DateTime']['output'];
  expiresAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isComplete: Scalars['Boolean']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  orderId?: Maybe<Scalars['ID']['output']>;
  paymentStatus?: Maybe<Scalars['String']['output']>;
  planSnapshot?: Maybe<Scalars['JSON']['output']>;
  pricing?: Maybe<Scalars['JSON']['output']>;
  steps?: Maybe<Scalars['JSON']['output']>;
  timeRemaining?: Maybe<Scalars['Int']['output']>;
  token: Scalars['String']['output'];
};

export enum CheckoutStepType {
  Authentication = 'AUTHENTICATION',
  Delivery = 'DELIVERY',
  Payment = 'PAYMENT'
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

export enum ConfigurationLevel {
  Bundle = 'BUNDLE',
  Country = 'COUNTRY',
  Global = 'GLOBAL',
  Region = 'REGION'
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
  iso: Scalars['ISOCountryCode']['output'];
  name: Scalars['String']['output'];
  nameHebrew?: Maybe<Scalars['String']['output']>;
  region: Scalars['String']['output'];
};

export type CountryBundle = {
  __typename?: 'CountryBundle';
  appliedRules: Array<AppliedRule>;
  bundleGroup?: Maybe<Scalars['String']['output']>;
  bundleName: Scalars['String']['output'];
  configurationLevel?: Maybe<ConfigurationLevel>;
  cost?: Maybe<Scalars['Float']['output']>;
  costPlus?: Maybe<Scalars['Float']['output']>;
  countryId: Scalars['String']['output'];
  countryName: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  dataAmount: Scalars['String']['output'];
  discountPerDay?: Maybe<Scalars['Float']['output']>;
  discountRate?: Maybe<Scalars['Float']['output']>;
  discountValue?: Maybe<Scalars['Float']['output']>;
  discounts: Array<DiscountApplication>;
  duration: Scalars['Int']['output'];
  finalRevenue?: Maybe<Scalars['Float']['output']>;
  hasCustomDiscount?: Maybe<Scalars['Boolean']['output']>;
  isUnlimited: Scalars['Boolean']['output'];
  netProfit?: Maybe<Scalars['Float']['output']>;
  planId: Scalars['String']['output'];
  priceAfterDiscount?: Maybe<Scalars['Float']['output']>;
  pricePerDay?: Maybe<Scalars['Float']['output']>;
  processingCost?: Maybe<Scalars['Float']['output']>;
  processingRate?: Maybe<Scalars['Float']['output']>;
  totalCost?: Maybe<Scalars['Float']['output']>;
};

export type CreateCheckoutSessionInput = {
  countryId: Scalars['String']['input'];
  numOfDays: Scalars['Int']['input'];
  regionId: Scalars['String']['input'];
};

export type CreateCheckoutSessionResponse = {
  __typename?: 'CreateCheckoutSessionResponse';
  error?: Maybe<Scalars['String']['output']>;
  session?: Maybe<CheckoutSession>;
  success: Scalars['Boolean']['output'];
};

export type CreatePricingRuleInput = {
  actions: Array<RuleActionInput>;
  conditions: Array<RuleConditionInput>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  priority: Scalars['Int']['input'];
  type: RuleType;
  validFrom?: InputMaybe<Scalars['String']['input']>;
  validUntil?: InputMaybe<Scalars['String']['input']>;
};

export type CreateTripInput = {
  countryIds: Array<Scalars['ISOCountryCode']['input']>;
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  regionId: Scalars['String']['input'];
};

export type CreateTripResponse = {
  __typename?: 'CreateTripResponse';
  error?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  trip?: Maybe<Trip>;
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
  lastAction?: Maybe<Scalars['String']['output']>;
  order: Order;
  qrCode?: Maybe<Scalars['String']['output']>;
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

export type GetCheckoutSessionResponse = {
  __typename?: 'GetCheckoutSessionResponse';
  error?: Maybe<Scalars['String']['output']>;
  session?: Maybe<CheckoutSession>;
  success: Scalars['Boolean']['output'];
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

export type Mutation = {
  __typename?: 'Mutation';
  activateESIM?: Maybe<ActivateEsimResponse>;
  assignPackageToUser?: Maybe<AssignPackageResponse>;
  cancelESIM?: Maybe<EsimActionResponse>;
  clonePricingRule: PricingRule;
  createCheckoutSession: CreateCheckoutSessionResponse;
  createPricingRule: PricingRule;
  createTrip?: Maybe<CreateTripResponse>;
  deletePricingRule: Scalars['Boolean']['output'];
  deleteTrip?: Maybe<DeleteTripResponse>;
  deleteUser?: Maybe<DeleteUserResponse>;
  inviteAdminUser?: Maybe<InviteAdminUserResponse>;
  processCheckoutPayment: ProcessCheckoutPaymentResponse;
  purchaseESIM?: Maybe<PurchaseEsimResponse>;
  reorderPricingRules: Array<PricingRule>;
  restoreESIM?: Maybe<EsimActionResponse>;
  sendPhoneOTP?: Maybe<SendOtpResponse>;
  signIn?: Maybe<SignInResponse>;
  signInWithApple?: Maybe<SignInResponse>;
  signInWithGoogle?: Maybe<SignInResponse>;
  signUp?: Maybe<SignUpResponse>;
  suspendESIM?: Maybe<EsimActionResponse>;
  syncCatalog?: Maybe<SyncCatalogResponse>;
  testCatalogSync?: Maybe<SyncCatalogResponse>;
  toggleHighDemandCountry?: Maybe<ToggleHighDemandResponse>;
  togglePricingRule: PricingRule;
  triggerCatalogSync?: Maybe<TriggerSyncResponse>;
  updateCheckoutStep: UpdateCheckoutStepResponse;
  updateESIMReference?: Maybe<EsimActionResponse>;
  updatePricingConfiguration?: Maybe<UpdatePricingConfigurationResponse>;
  updatePricingRule: PricingRule;
  updateTrip?: Maybe<UpdateTripResponse>;
  updateUserRole?: Maybe<User>;
  validateOrder: ValidateOrderResponse;
  verifyPhoneOTP?: Maybe<SignInResponse>;
};


export type MutationActivateEsimArgs = {
  esimId: Scalars['ID']['input'];
};


export type MutationAssignPackageToUserArgs = {
  planId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationCancelEsimArgs = {
  esimId: Scalars['ID']['input'];
};


export type MutationClonePricingRuleArgs = {
  id: Scalars['ID']['input'];
  newName: Scalars['String']['input'];
};


export type MutationCreateCheckoutSessionArgs = {
  input: CreateCheckoutSessionInput;
};


export type MutationCreatePricingRuleArgs = {
  input: CreatePricingRuleInput;
};


export type MutationCreateTripArgs = {
  input: CreateTripInput;
};


export type MutationDeletePricingRuleArgs = {
  id: Scalars['ID']['input'];
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


export type MutationPurchaseEsimArgs = {
  input: PurchaseEsimInput;
  planId: Scalars['ID']['input'];
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


export type MutationSyncCatalogArgs = {
  force?: InputMaybe<Scalars['Boolean']['input']>;
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


export type MutationVerifyPhoneOtpArgs = {
  input: VerifyOtpInput;
};

export type Order = {
  __typename?: 'Order';
  bundleId?: Maybe<Scalars['String']['output']>;
  bundleName?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
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
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  pages: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export enum PaymentMethod {
  Amex = 'AMEX',
  Bit = 'BIT',
  Diners = 'DINERS',
  ForeignCard = 'FOREIGN_CARD',
  IsraeliCard = 'ISRAELI_CARD'
}

export type PricingBreakdown = {
  __typename?: 'PricingBreakdown';
  appliedRules: Array<AppliedRule>;
  bundleName: Scalars['String']['output'];
  cost: Scalars['Float']['output'];
  costPlus: Scalars['Float']['output'];
  countryName: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  discountPerDay: Scalars['Float']['output'];
  discountRate: Scalars['Float']['output'];
  discountValue: Scalars['Float']['output'];
  discounts: Array<DiscountApplication>;
  duration: Scalars['Int']['output'];
  finalRevenue: Scalars['Float']['output'];
  netProfit: Scalars['Float']['output'];
  priceAfterDiscount: Scalars['Float']['output'];
  processingCost: Scalars['Float']['output'];
  processingRate: Scalars['Float']['output'];
  totalCost: Scalars['Float']['output'];
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
  bundleGroups: Array<Scalars['String']['output']>;
  dataTypes: Array<DataType>;
  durations: Array<DurationRange>;
};

export type PricingRange = {
  __typename?: 'PricingRange';
  max: Scalars['Float']['output'];
  min: Scalars['Float']['output'];
};

export type PricingRule = {
  __typename?: 'PricingRule';
  actions: Array<RuleAction>;
  conditions: Array<RuleCondition>;
  createdAt: Scalars['String']['output'];
  createdBy: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isEditable: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  priority: Scalars['Int']['output'];
  type: RuleType;
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
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isEditable?: InputMaybe<Scalars['Boolean']['input']>;
  type?: InputMaybe<RuleType>;
  validFrom?: InputMaybe<Scalars['String']['input']>;
  validUntil?: InputMaybe<Scalars['String']['input']>;
};

export type PricingRulePriorityUpdate = {
  id: Scalars['ID']['input'];
  priority: Scalars['Int']['input'];
};

export type ProcessCheckoutPaymentInput = {
  paymentMethodId: Scalars['String']['input'];
  savePaymentMethod?: InputMaybe<Scalars['Boolean']['input']>;
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
  availableBundleGroups: Array<Scalars['String']['output']>;
  bundleDataAggregation: BundleDataAggregation;
  bundleGroups: Array<Scalars['String']['output']>;
  bundles: Array<CountryBundle>;
  bundlesCountries: Array<BundlesByCountry>;
  bundlesRegions: Array<BundlesByRegion>;
  calculateBatchPricing: Array<PricingRuleCalculation>;
  calculatePrice: PricingBreakdown;
  calculatePriceWithRules: PricingRuleCalculation;
  calculatePrices: Array<PricingBreakdown>;
  catalogBundles: CatalogBundleConnection;
  catalogSyncHistory: CatalogSyncHistoryConnection;
  conflictingPricingRules: Array<PricingRule>;
  countries: Array<Country>;
  currentProcessingFeeConfiguration?: Maybe<ProcessingFeeConfiguration>;
  esimDetails?: Maybe<Esim>;
  getCheckoutSession: GetCheckoutSessionResponse;
  getUserOrders: Array<Order>;
  hello: Scalars['String']['output'];
  highDemandCountries: Array<Scalars['String']['output']>;
  me?: Maybe<User>;
  myESIMs: Array<Esim>;
  myOrders: Array<Order>;
  orderDetails?: Maybe<Order>;
  orders: Array<Order>;
  pricingFilters: PricingFilters;
  pricingRule?: Maybe<PricingRule>;
  pricingRules: Array<PricingRule>;
  processingFeeConfiguration?: Maybe<ProcessingFeeConfiguration>;
  processingFeeConfigurations: Array<ProcessingFeeConfiguration>;
  simulatePricingRule: PricingRuleCalculation;
  trips: Array<Trip>;
  users: Array<User>;
};


export type QueryBundlesArgs = {
  countryId?: InputMaybe<Scalars['String']['input']>;
  regionId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBundlesCountriesArgs = {
  includeBundles?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryCalculateBatchPricingArgs = {
  requests: Array<CalculatePriceInput>;
};


export type QueryCalculatePriceArgs = {
  countryId: Scalars['String']['input'];
  numOfDays: Scalars['Int']['input'];
  paymentMethod?: InputMaybe<PaymentMethod>;
  regionId: Scalars['String']['input'];
};


export type QueryCalculatePriceWithRulesArgs = {
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


export type QueryConflictingPricingRulesArgs = {
  ruleId: Scalars['ID']['input'];
};


export type QueryEsimDetailsArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetCheckoutSessionArgs = {
  token: Scalars['String']['input'];
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


export type QueryPricingRuleArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPricingRulesArgs = {
  filter?: InputMaybe<PricingRuleFilter>;
};


export type QueryProcessingFeeConfigurationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProcessingFeeConfigurationsArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySimulatePricingRuleArgs = {
  rule: CreatePricingRuleInput;
  testContext: TestPricingContext;
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

export enum RuleType {
  BusinessDiscount = 'BUSINESS_DISCOUNT',
  BusinessMinimumProfit = 'BUSINESS_MINIMUM_PROFIT',
  Promotion = 'PROMOTION',
  Segment = 'SEGMENT',
  SystemMarkup = 'SYSTEM_MARKUP',
  SystemMinimumPrice = 'SYSTEM_MINIMUM_PRICE',
  SystemProcessing = 'SYSTEM_PROCESSING'
}

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

export type Subscription = {
  __typename?: 'Subscription';
  catalogSyncProgress: CatalogSyncProgressUpdate;
  esimStatusUpdated: EsimStatusUpdate;
};


export type SubscriptionEsimStatusUpdatedArgs = {
  esimId: Scalars['ID']['input'];
};

export type SyncCatalogResponse = {
  __typename?: 'SyncCatalogResponse';
  error?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  syncDuration?: Maybe<Scalars['Int']['output']>;
  syncedAt?: Maybe<Scalars['String']['output']>;
  syncedBundles?: Maybe<Scalars['Int']['output']>;
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
  countries: Array<Country>;
  countryIds: Array<Scalars['ISOCountryCode']['output']>;
  createdAt: Scalars['String']['output'];
  createdBy?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  regionId: Scalars['String']['output'];
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
  conditions?: InputMaybe<Array<RuleConditionInput>>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  validFrom?: InputMaybe<Scalars['String']['input']>;
  validUntil?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTripInput = {
  countryIds: Array<Scalars['ISOCountryCode']['input']>;
  description: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  regionId: Scalars['String']['input'];
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

export type GetPricingRulesQueryVariables = Exact<{
  filter?: InputMaybe<PricingRuleFilter>;
}>;


export type GetPricingRulesQuery = { __typename?: 'Query', pricingRules: Array<{ __typename?: 'PricingRule', id: string, type: RuleType, name: string, description?: string | null, priority: number, isActive: boolean, isEditable: boolean, validFrom?: string | null, validUntil?: string | null, createdBy: string, createdAt: string, updatedAt: string, conditions: Array<{ __typename?: 'RuleCondition', field: string, operator: ConditionOperator, value: any, type?: string | null }>, actions: Array<{ __typename?: 'RuleAction', type: ActionType, value: number, metadata?: any | null }> }> };

export type CreatePricingRuleMutationVariables = Exact<{
  input: CreatePricingRuleInput;
}>;


export type CreatePricingRuleMutation = { __typename?: 'Mutation', createPricingRule: { __typename?: 'PricingRule', id: string, type: RuleType, name: string, description?: string | null, priority: number, isActive: boolean, isEditable: boolean, validFrom?: string | null, validUntil?: string | null, createdBy: string, createdAt: string, updatedAt: string, conditions: Array<{ __typename?: 'RuleCondition', field: string, operator: ConditionOperator, value: any, type?: string | null }>, actions: Array<{ __typename?: 'RuleAction', type: ActionType, value: number, metadata?: any | null }> } };

export type UpdatePricingRuleMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdatePricingRuleInput;
}>;


export type UpdatePricingRuleMutation = { __typename?: 'Mutation', updatePricingRule: { __typename?: 'PricingRule', id: string, type: RuleType, name: string, description?: string | null, priority: number, isActive: boolean, isEditable: boolean, validFrom?: string | null, validUntil?: string | null, createdBy: string, createdAt: string, updatedAt: string, conditions: Array<{ __typename?: 'RuleCondition', field: string, operator: ConditionOperator, value: any, type?: string | null }>, actions: Array<{ __typename?: 'RuleAction', type: ActionType, value: number, metadata?: any | null }> } };

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


export type ClonePricingRuleMutation = { __typename?: 'Mutation', clonePricingRule: { __typename?: 'PricingRule', id: string, name: string, type: RuleType, description?: string | null, priority: number, isActive: boolean, isEditable: boolean, conditions: Array<{ __typename?: 'RuleCondition', field: string, operator: ConditionOperator, value: any, type?: string | null }>, actions: Array<{ __typename?: 'RuleAction', type: ActionType, value: number, metadata?: any | null }> } };

export type GetTripsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTripsQuery = { __typename?: 'Query', trips: Array<{ __typename?: 'Trip', id: string, name: string, description: string, regionId: string, countryIds: Array<any>, createdAt: string, updatedAt: string, createdBy?: string | null, countries: Array<{ __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region: string, flag?: string | null }> }> };

export type CreateTripMutationVariables = Exact<{
  input: CreateTripInput;
}>;


export type CreateTripMutation = { __typename?: 'Mutation', createTrip?: { __typename?: 'CreateTripResponse', success: boolean, error?: string | null, trip?: { __typename?: 'Trip', id: string, name: string, description: string, regionId: string, countryIds: Array<any>, createdAt: string, updatedAt: string, createdBy?: string | null, countries: Array<{ __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region: string, flag?: string | null }> } | null } | null };

export type UpdateTripMutationVariables = Exact<{
  input: UpdateTripInput;
}>;


export type UpdateTripMutation = { __typename?: 'Mutation', updateTrip?: { __typename?: 'UpdateTripResponse', success: boolean, error?: string | null, trip?: { __typename?: 'Trip', id: string, name: string, description: string, regionId: string, countryIds: Array<any>, createdAt: string, updatedAt: string, createdBy?: string | null, countries: Array<{ __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region: string, flag?: string | null }> } | null } | null };

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


export type GetCatalogBundlesQuery = { __typename?: 'Query', catalogBundles: { __typename?: 'CatalogBundleConnection', totalCount: number, bundles: Array<{ __typename?: 'CatalogBundle', id: string, esimGoName: string, bundleGroup: string, description: string, duration: number, dataAmount: number, unlimited: boolean, priceCents: number, currency: string, countries: Array<string>, regions: Array<string>, syncedAt: string, createdAt: string, updatedAt: string }> } };

export type AssignPackageToUserMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  planId: Scalars['ID']['input'];
}>;


export type AssignPackageToUserMutation = { __typename?: 'Mutation', assignPackageToUser?: { __typename?: 'AssignPackageResponse', success: boolean, error?: string | null, assignment?: { __typename?: 'PackageAssignment', id: string, assignedAt: string, user: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string } } | null } | null };

export type CalculatePricingQueryVariables = Exact<{
  numOfDays: Scalars['Int']['input'];
  regionId: Scalars['String']['input'];
  countryId: Scalars['String']['input'];
  paymentMethod?: InputMaybe<PaymentMethod>;
}>;


export type CalculatePricingQuery = { __typename?: 'Query', calculatePrice: { __typename?: 'PricingBreakdown', bundleName: string, countryName: string, duration: number, cost: number, costPlus: number, totalCost: number, discountRate: number, discountValue: number, priceAfterDiscount: number, processingCost: number, finalRevenue: number, currency: string, discountPerDay: number } };

export type CalculateBatchPricingQueryVariables = Exact<{
  inputs: Array<CalculatePriceInput> | CalculatePriceInput;
}>;


export type CalculateBatchPricingQuery = { __typename?: 'Query', calculatePrices: Array<{ __typename?: 'PricingBreakdown', bundleName: string, countryName: string, duration: number, cost: number, costPlus: number, totalCost: number, discountRate: number, discountValue: number, priceAfterDiscount: number, processingRate: number, processingCost: number, finalRevenue: number, currency: string, discountPerDay: number }> };

export type CalculatePriceWithRulesQueryVariables = Exact<{
  input: CalculatePriceInput;
}>;


export type CalculatePriceWithRulesQuery = { __typename?: 'Query', calculatePriceWithRules: { __typename?: 'PricingRuleCalculation', baseCost: number, markup: number, subtotal: number, totalDiscount: number, priceAfterDiscount: number, processingFee: number, processingRate: number, finalPrice: number, finalRevenue: number, revenueAfterProcessing: number, profit: number, maxRecommendedPrice: number, maxDiscountPercentage: number, discounts: Array<{ __typename?: 'DiscountApplication', ruleName: string, amount: number, type: string }>, appliedRules: Array<{ __typename?: 'AppliedRule', id: string, name: string, type: RuleType, impact: number }> } };

export type CalculateBatchPricingWithRulesQueryVariables = Exact<{
  requests: Array<CalculatePriceInput> | CalculatePriceInput;
}>;


export type CalculateBatchPricingWithRulesQuery = { __typename?: 'Query', calculateBatchPricing: Array<{ __typename?: 'PricingRuleCalculation', baseCost: number, markup: number, subtotal: number, totalDiscount: number, priceAfterDiscount: number, processingFee: number, processingRate: number, finalPrice: number, finalRevenue: number, revenueAfterProcessing: number, profit: number, maxRecommendedPrice: number, maxDiscountPercentage: number, discounts: Array<{ __typename?: 'DiscountApplication', ruleName: string, amount: number, type: string }>, appliedRules: Array<{ __typename?: 'AppliedRule', id: string, name: string, type: RuleType, impact: number }> }> };

export type SimulatePricingRuleQueryVariables = Exact<{
  rule: CreatePricingRuleInput;
  testContext: TestPricingContext;
}>;


export type SimulatePricingRuleQuery = { __typename?: 'Query', simulatePricingRule: { __typename?: 'PricingRuleCalculation', baseCost: number, markup: number, subtotal: number, totalDiscount: number, priceAfterDiscount: number, processingFee: number, processingRate: number, finalPrice: number, finalRevenue: number, revenueAfterProcessing: number, profit: number, maxRecommendedPrice: number, maxDiscountPercentage: number, discounts: Array<{ __typename?: 'DiscountApplication', ruleName: string, amount: number, type: string }>, appliedRules: Array<{ __typename?: 'AppliedRule', id: string, name: string, type: RuleType, impact: number }> } };

export type DeleteUserMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type DeleteUserMutation = { __typename?: 'Mutation', deleteUser?: { __typename?: 'DeleteUserResponse', success: boolean, error?: string | null } | null };

export type GetCountriesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCountriesQuery = { __typename?: 'Query', countries: Array<{ __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region: string, flag?: string | null }> };

export type GetCurrentProcessingFeeConfigurationQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentProcessingFeeConfigurationQuery = { __typename?: 'Query', currentProcessingFeeConfiguration?: { __typename?: 'ProcessingFeeConfiguration', id: string, israeliCardsRate: number, foreignCardsRate: number, premiumDinersRate: number, premiumAmexRate: number, bitPaymentRate: number, fixedFeeNIS: number, fixedFeeForeign: number, monthlyFixedCost: number, bankWithdrawalFee: number, monthlyMinimumFee: number, setupCost: number, threeDSecureFee: number, chargebackFee: number, cancellationFee: number, invoiceServiceFee: number, appleGooglePayFee: number, isActive: boolean, effectiveFrom: any, effectiveTo?: any | null, createdAt: any, updatedAt: any, createdBy: string, notes?: string | null } | null };

export type GetProcessingFeeConfigurationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetProcessingFeeConfigurationsQuery = { __typename?: 'Query', processingFeeConfigurations: Array<{ __typename?: 'ProcessingFeeConfiguration', id: string, israeliCardsRate: number, foreignCardsRate: number, premiumDinersRate: number, premiumAmexRate: number, bitPaymentRate: number, fixedFeeNIS: number, fixedFeeForeign: number, monthlyFixedCost: number, bankWithdrawalFee: number, monthlyMinimumFee: number, setupCost: number, threeDSecureFee: number, chargebackFee: number, cancellationFee: number, invoiceServiceFee: number, appleGooglePayFee: number, isActive: boolean, effectiveFrom: any, effectiveTo?: any | null, createdAt: any, updatedAt: any, createdBy: string, notes?: string | null }> };

export type GetBundlesByCountryQueryVariables = Exact<{
  includeBundles?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetBundlesByCountryQuery = { __typename?: 'Query', bundlesCountries: Array<{ __typename?: 'BundlesByCountry', countryName: string, countryId: string, bundleCount: number, pricingRange?: { __typename?: 'PricingRange', min: number, max: number } | null, bundles?: Array<{ __typename?: 'CountryBundle', bundleName: string, countryName: string, countryId: string, duration: number, cost?: number | null, costPlus?: number | null, totalCost?: number | null, discountRate?: number | null, discountValue?: number | null, priceAfterDiscount?: number | null, processingRate?: number | null, processingCost?: number | null, finalRevenue?: number | null, netProfit?: number | null, currency: string, pricePerDay?: number | null, hasCustomDiscount?: boolean | null, configurationLevel?: ConfigurationLevel | null, discountPerDay?: number | null, planId: string, isUnlimited: boolean, dataAmount: string, bundleGroup?: string | null }> | null }> };

export type GetCountriesWithBundlesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCountriesWithBundlesQuery = { __typename?: 'Query', bundlesCountries: Array<{ __typename?: 'BundlesByCountry', countryName: string, countryId: string, bundleCount: number, pricingRange?: { __typename?: 'PricingRange', min: number, max: number } | null, bundles?: Array<{ __typename?: 'CountryBundle', bundleName: string, countryName: string, countryId: string, duration: number, cost?: number | null, costPlus?: number | null, totalCost?: number | null, discountRate?: number | null, discountValue?: number | null, priceAfterDiscount?: number | null, processingRate?: number | null, processingCost?: number | null, finalRevenue?: number | null, netProfit?: number | null, currency: string, pricePerDay?: number | null, hasCustomDiscount?: boolean | null, configurationLevel?: ConfigurationLevel | null, discountPerDay?: number | null, planId: string, isUnlimited: boolean, dataAmount: string, bundleGroup?: string | null }> | null }> };

export type GetBundlesByRegionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBundlesByRegionQuery = { __typename?: 'Query', bundlesRegions: Array<{ __typename?: 'BundlesByRegion', regionName: string, bundleCount: number, countryCount: number }> };

export type GetRegionBundlesQueryVariables = Exact<{
  regionName: Scalars['String']['input'];
}>;


export type GetRegionBundlesQuery = { __typename?: 'Query', bundles: Array<{ __typename?: 'CountryBundle', bundleName: string, countryName: string, countryId: string, duration: number, cost?: number | null, costPlus?: number | null, totalCost?: number | null, discountRate?: number | null, discountValue?: number | null, priceAfterDiscount?: number | null, processingRate?: number | null, processingCost?: number | null, finalRevenue?: number | null, currency: string, pricePerDay?: number | null, hasCustomDiscount?: boolean | null, bundleGroup?: string | null, isUnlimited: boolean, dataAmount: string, planId: string }> };

export type GetCountryBundlesQueryVariables = Exact<{
  countryId: Scalars['String']['input'];
}>;


export type GetCountryBundlesQuery = { __typename?: 'Query', countryBundles: Array<{ __typename?: 'CountryBundle', bundleName: string, countryName: string, countryId: string, duration: number, cost?: number | null, costPlus?: number | null, totalCost?: number | null, discountRate?: number | null, discountValue?: number | null, priceAfterDiscount?: number | null, processingRate?: number | null, processingCost?: number | null, finalRevenue?: number | null, currency: string, pricePerDay?: number | null, hasCustomDiscount?: boolean | null, planId: string, isUnlimited: boolean, dataAmount: string, bundleGroup?: string | null, appliedRules: Array<{ __typename?: 'AppliedRule', id: string, name: string, type: RuleType, impact: number }>, discounts: Array<{ __typename?: 'DiscountApplication', ruleName: string, amount: number, type: string }> }> };

export type SyncCatalogMutationVariables = Exact<{
  force?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type SyncCatalogMutation = { __typename?: 'Mutation', syncCatalog?: { __typename?: 'SyncCatalogResponse', success: boolean, message?: string | null, error?: string | null, syncedBundles?: number | null, syncDuration?: number | null, syncedAt?: string | null } | null };

export type GetBundleGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBundleGroupsQuery = { __typename?: 'Query', bundleGroups: Array<string> };

export type GetPricingFiltersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPricingFiltersQuery = { __typename?: 'Query', pricingFilters: { __typename?: 'PricingFilters', bundleGroups: Array<string>, durations: Array<{ __typename?: 'DurationRange', label: string, value: string, minDays: number, maxDays: number }>, dataTypes: Array<{ __typename?: 'DataType', label: string, value: string, isUnlimited: boolean }> } };

export type GetHighDemandCountriesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetHighDemandCountriesQuery = { __typename?: 'Query', highDemandCountries: Array<string> };

export type ToggleHighDemandCountryMutationVariables = Exact<{
  countryId: Scalars['String']['input'];
}>;


export type ToggleHighDemandCountryMutation = { __typename?: 'Mutation', toggleHighDemandCountry?: { __typename?: 'ToggleHighDemandResponse', success: boolean, countryId: string, isHighDemand: boolean, error?: string | null } | null };

export type GetBundleDataAggregationQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBundleDataAggregationQuery = { __typename?: 'Query', bundleDataAggregation: { __typename?: 'BundleDataAggregation', total: number, unlimited: number, lastUpdated: string, byDataAmount: Array<{ __typename?: 'DataAmountGroup', dataAmount: number, count: number, percentage: number }>, byDuration: Array<{ __typename?: 'DurationGroup', duration: number, count: number, percentage: number, category: string }>, byBundleGroup: Array<{ __typename?: 'BundleGroupDataStats', bundleGroup: string, total: number, unlimited: number, limited: number, averageDataAmount: number }> } };

export type GetCatalogSyncHistoryQueryVariables = Exact<{
  params?: InputMaybe<SyncHistoryParams>;
}>;


export type GetCatalogSyncHistoryQuery = { __typename?: 'Query', catalogSyncHistory: { __typename?: 'CatalogSyncHistoryConnection', totalCount: number, jobs: Array<{ __typename?: 'CatalogSyncJob', id: string, jobType: string, status: string, priority: string, bundleGroup?: string | null, countryId?: string | null, bundlesProcessed?: number | null, bundlesAdded?: number | null, bundlesUpdated?: number | null, errorMessage?: string | null, metadata?: any | null, createdAt: string, startedAt: string, completedAt?: string | null, updatedAt: string }> } };

export type TriggerCatalogSyncMutationVariables = Exact<{
  params: TriggerSyncParams;
}>;


export type TriggerCatalogSyncMutation = { __typename?: 'Mutation', triggerCatalogSync?: { __typename?: 'TriggerSyncResponse', success: boolean, jobId?: string | null, message?: string | null, error?: string | null, conflictingJob?: { __typename?: 'ConflictingJobInfo', id: string, jobType: string, status: string, createdAt: string, startedAt?: string | null } | null } | null };

export type GetAvailableBundleGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAvailableBundleGroupsQuery = { __typename?: 'Query', availableBundleGroups: Array<string> };


export const CatalogSyncProgressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"CatalogSyncProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogSyncProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobId"}},{"kind":"Field","name":{"kind":"Name","value":"jobType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"bundlesProcessed"}},{"kind":"Field","name":{"kind":"Name","value":"bundlesAdded"}},{"kind":"Field","name":{"kind":"Name","value":"bundlesUpdated"}},{"kind":"Field","name":{"kind":"Name","value":"totalBundles"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CatalogSyncProgressSubscription, CatalogSyncProgressSubscriptionVariables>;
export const GetPricingRulesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPricingRules"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PricingRuleFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingRules"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"conditions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"operator"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}}]}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetPricingRulesQuery, GetPricingRulesQueryVariables>;
export const CreatePricingRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePricingRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePricingRuleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPricingRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"conditions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"operator"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}}]}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreatePricingRuleMutation, CreatePricingRuleMutationVariables>;
export const UpdatePricingRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePricingRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePricingRuleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePricingRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"conditions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"operator"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}}]}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"validFrom"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdatePricingRuleMutation, UpdatePricingRuleMutationVariables>;
export const DeletePricingRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePricingRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePricingRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeletePricingRuleMutation, DeletePricingRuleMutationVariables>;
export const TogglePricingRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TogglePricingRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"togglePricingRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<TogglePricingRuleMutation, TogglePricingRuleMutationVariables>;
export const ClonePricingRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClonePricingRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clonePricingRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"newName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"conditions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"operator"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}}]}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}}]}}]}}]} as unknown as DocumentNode<ClonePricingRuleMutation, ClonePricingRuleMutationVariables>;
export const GetTripsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTrips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"regionId"}},{"kind":"Field","name":{"kind":"Name","value":"countryIds"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}}]}}]}}]} as unknown as DocumentNode<GetTripsQuery, GetTripsQueryVariables>;
export const CreateTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTripInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"trip"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"regionId"}},{"kind":"Field","name":{"kind":"Name","value":"countryIds"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateTripMutation, CreateTripMutationVariables>;
export const UpdateTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTripInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"trip"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"regionId"}},{"kind":"Field","name":{"kind":"Name","value":"countryIds"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateTripMutation, UpdateTripMutationVariables>;
export const DeleteTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<DeleteTripMutation, DeleteTripMutationVariables>;
export const GetUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"orderCount"}}]}}]}}]} as unknown as DocumentNode<GetUsersQuery, GetUsersQueryVariables>;
export const GetOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"bundleId"}},{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]} as unknown as DocumentNode<GetOrdersQuery, GetOrdersQueryVariables>;
export const GetUserOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserOrders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUserOrders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"bundleId"}},{"kind":"Field","name":{"kind":"Name","value":"bundleName"}}]}}]}}]} as unknown as DocumentNode<GetUserOrdersQuery, GetUserOrdersQueryVariables>;
export const UpdateUserRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateUserRoleMutation, UpdateUserRoleMutationVariables>;
export const InviteAdminUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteAdminUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InviteAdminUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteAdminUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"invitedEmail"}}]}}]}}]} as unknown as DocumentNode<InviteAdminUserMutation, InviteAdminUserMutationVariables>;
export const GetCatalogBundlesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCatalogBundles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"criteria"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchCatalogCriteria"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogBundles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"criteria"},"value":{"kind":"Variable","name":{"kind":"Name","value":"criteria"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"esimGoName"}},{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"dataAmount"}},{"kind":"Field","name":{"kind":"Name","value":"unlimited"}},{"kind":"Field","name":{"kind":"Name","value":"priceCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"countries"}},{"kind":"Field","name":{"kind":"Name","value":"regions"}},{"kind":"Field","name":{"kind":"Name","value":"syncedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<GetCatalogBundlesQuery, GetCatalogBundlesQueryVariables>;
export const AssignPackageToUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AssignPackageToUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignPackageToUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"assignment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedAt"}}]}}]}}]}}]} as unknown as DocumentNode<AssignPackageToUserMutation, AssignPackageToUserMutationVariables>;
export const CalculatePricingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalculatePricing"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"numOfDays"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"regionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paymentMethod"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethod"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculatePrice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"numOfDays"},"value":{"kind":"Variable","name":{"kind":"Name","value":"numOfDays"}}},{"kind":"Argument","name":{"kind":"Name","value":"regionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"regionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"countryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}}},{"kind":"Argument","name":{"kind":"Name","value":"paymentMethod"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paymentMethod"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"countryName"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"cost"}},{"kind":"Field","name":{"kind":"Name","value":"costPlus"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"processingCost"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"discountPerDay"}}]}}]}}]} as unknown as DocumentNode<CalculatePricingQuery, CalculatePricingQueryVariables>;
export const CalculateBatchPricingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalculateBatchPricing"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CalculatePriceInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculatePrices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"countryName"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"cost"}},{"kind":"Field","name":{"kind":"Name","value":"costPlus"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"processingRate"}},{"kind":"Field","name":{"kind":"Name","value":"processingCost"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"discountPerDay"}}]}}]}}]} as unknown as DocumentNode<CalculateBatchPricingQuery, CalculateBatchPricingQueryVariables>;
export const CalculatePriceWithRulesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalculatePriceWithRules"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CalculatePriceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculatePriceWithRules"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"baseCost"}},{"kind":"Field","name":{"kind":"Name","value":"markup"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"}},{"kind":"Field","name":{"kind":"Name","value":"discounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ruleName"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"processingFee"}},{"kind":"Field","name":{"kind":"Name","value":"processingRate"}},{"kind":"Field","name":{"kind":"Name","value":"finalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"revenueAfterProcessing"}},{"kind":"Field","name":{"kind":"Name","value":"profit"}},{"kind":"Field","name":{"kind":"Name","value":"maxRecommendedPrice"}},{"kind":"Field","name":{"kind":"Name","value":"maxDiscountPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"appliedRules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}}]}}]}}]}}]} as unknown as DocumentNode<CalculatePriceWithRulesQuery, CalculatePriceWithRulesQueryVariables>;
export const CalculateBatchPricingWithRulesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalculateBatchPricingWithRules"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requests"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CalculatePriceInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculateBatchPricing"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requests"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requests"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"baseCost"}},{"kind":"Field","name":{"kind":"Name","value":"markup"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"}},{"kind":"Field","name":{"kind":"Name","value":"discounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ruleName"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"processingFee"}},{"kind":"Field","name":{"kind":"Name","value":"processingRate"}},{"kind":"Field","name":{"kind":"Name","value":"finalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"revenueAfterProcessing"}},{"kind":"Field","name":{"kind":"Name","value":"profit"}},{"kind":"Field","name":{"kind":"Name","value":"maxRecommendedPrice"}},{"kind":"Field","name":{"kind":"Name","value":"maxDiscountPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"appliedRules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}}]}}]}}]}}]} as unknown as DocumentNode<CalculateBatchPricingWithRulesQuery, CalculateBatchPricingWithRulesQueryVariables>;
export const SimulatePricingRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SimulatePricingRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rule"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePricingRuleInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"testContext"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TestPricingContext"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"simulatePricingRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"rule"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rule"}}},{"kind":"Argument","name":{"kind":"Name","value":"testContext"},"value":{"kind":"Variable","name":{"kind":"Name","value":"testContext"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"baseCost"}},{"kind":"Field","name":{"kind":"Name","value":"markup"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"}},{"kind":"Field","name":{"kind":"Name","value":"discounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ruleName"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"processingFee"}},{"kind":"Field","name":{"kind":"Name","value":"processingRate"}},{"kind":"Field","name":{"kind":"Name","value":"finalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"revenueAfterProcessing"}},{"kind":"Field","name":{"kind":"Name","value":"profit"}},{"kind":"Field","name":{"kind":"Name","value":"maxRecommendedPrice"}},{"kind":"Field","name":{"kind":"Name","value":"maxDiscountPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"appliedRules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}}]}}]}}]}}]} as unknown as DocumentNode<SimulatePricingRuleQuery, SimulatePricingRuleQueryVariables>;
export const DeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<DeleteUserMutation, DeleteUserMutationVariables>;
export const GetCountriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCountries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}}]}}]} as unknown as DocumentNode<GetCountriesQuery, GetCountriesQueryVariables>;
export const GetCurrentProcessingFeeConfigurationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCurrentProcessingFeeConfiguration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentProcessingFeeConfiguration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"israeliCardsRate"}},{"kind":"Field","name":{"kind":"Name","value":"foreignCardsRate"}},{"kind":"Field","name":{"kind":"Name","value":"premiumDinersRate"}},{"kind":"Field","name":{"kind":"Name","value":"premiumAmexRate"}},{"kind":"Field","name":{"kind":"Name","value":"bitPaymentRate"}},{"kind":"Field","name":{"kind":"Name","value":"fixedFeeNIS"}},{"kind":"Field","name":{"kind":"Name","value":"fixedFeeForeign"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyFixedCost"}},{"kind":"Field","name":{"kind":"Name","value":"bankWithdrawalFee"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyMinimumFee"}},{"kind":"Field","name":{"kind":"Name","value":"setupCost"}},{"kind":"Field","name":{"kind":"Name","value":"threeDSecureFee"}},{"kind":"Field","name":{"kind":"Name","value":"chargebackFee"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationFee"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceServiceFee"}},{"kind":"Field","name":{"kind":"Name","value":"appleGooglePayFee"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveTo"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]} as unknown as DocumentNode<GetCurrentProcessingFeeConfigurationQuery, GetCurrentProcessingFeeConfigurationQueryVariables>;
export const GetProcessingFeeConfigurationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProcessingFeeConfigurations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"10"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processingFeeConfigurations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"includeInactive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"israeliCardsRate"}},{"kind":"Field","name":{"kind":"Name","value":"foreignCardsRate"}},{"kind":"Field","name":{"kind":"Name","value":"premiumDinersRate"}},{"kind":"Field","name":{"kind":"Name","value":"premiumAmexRate"}},{"kind":"Field","name":{"kind":"Name","value":"bitPaymentRate"}},{"kind":"Field","name":{"kind":"Name","value":"fixedFeeNIS"}},{"kind":"Field","name":{"kind":"Name","value":"fixedFeeForeign"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyFixedCost"}},{"kind":"Field","name":{"kind":"Name","value":"bankWithdrawalFee"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyMinimumFee"}},{"kind":"Field","name":{"kind":"Name","value":"setupCost"}},{"kind":"Field","name":{"kind":"Name","value":"threeDSecureFee"}},{"kind":"Field","name":{"kind":"Name","value":"chargebackFee"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationFee"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceServiceFee"}},{"kind":"Field","name":{"kind":"Name","value":"appleGooglePayFee"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveTo"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]} as unknown as DocumentNode<GetProcessingFeeConfigurationsQuery, GetProcessingFeeConfigurationsQueryVariables>;
export const GetBundlesByCountryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBundlesByCountry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeBundles"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundlesCountries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeBundles"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeBundles"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"countryName"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"bundleCount"}},{"kind":"Field","name":{"kind":"Name","value":"pricingRange"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"min"}},{"kind":"Field","name":{"kind":"Name","value":"max"}}]}},{"kind":"Field","name":{"kind":"Name","value":"bundles"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeBundles"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"countryName"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"cost"}},{"kind":"Field","name":{"kind":"Name","value":"costPlus"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"processingRate"}},{"kind":"Field","name":{"kind":"Name","value":"processingCost"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"netProfit"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"pricePerDay"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"configurationLevel"}},{"kind":"Field","name":{"kind":"Name","value":"discountPerDay"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"dataAmount"}},{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}}]}}]}}]}}]} as unknown as DocumentNode<GetBundlesByCountryQuery, GetBundlesByCountryQueryVariables>;
export const GetCountriesWithBundlesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCountriesWithBundles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundlesCountries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeBundles"},"value":{"kind":"BooleanValue","value":true}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"countryName"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"bundleCount"}},{"kind":"Field","name":{"kind":"Name","value":"pricingRange"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"min"}},{"kind":"Field","name":{"kind":"Name","value":"max"}}]}},{"kind":"Field","name":{"kind":"Name","value":"bundles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"countryName"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"cost"}},{"kind":"Field","name":{"kind":"Name","value":"costPlus"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"processingRate"}},{"kind":"Field","name":{"kind":"Name","value":"processingCost"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"netProfit"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"pricePerDay"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"configurationLevel"}},{"kind":"Field","name":{"kind":"Name","value":"discountPerDay"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"dataAmount"}},{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}}]}}]}}]}}]} as unknown as DocumentNode<GetCountriesWithBundlesQuery, GetCountriesWithBundlesQueryVariables>;
export const GetBundlesByRegionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBundlesByRegion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundlesRegions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"regionName"}},{"kind":"Field","name":{"kind":"Name","value":"bundleCount"}},{"kind":"Field","name":{"kind":"Name","value":"countryCount"}}]}}]}}]} as unknown as DocumentNode<GetBundlesByRegionQuery, GetBundlesByRegionQueryVariables>;
export const GetRegionBundlesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRegionBundles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"regionName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"regionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"regionName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"countryName"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"cost"}},{"kind":"Field","name":{"kind":"Name","value":"costPlus"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"processingRate"}},{"kind":"Field","name":{"kind":"Name","value":"processingCost"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"pricePerDay"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"dataAmount"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}}]}}]}}]} as unknown as DocumentNode<GetRegionBundlesQuery, GetRegionBundlesQueryVariables>;
export const GetCountryBundlesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCountryBundles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"countryBundles"},"name":{"kind":"Name","value":"bundles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"countryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"countryName"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"cost"}},{"kind":"Field","name":{"kind":"Name","value":"costPlus"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"processingRate"}},{"kind":"Field","name":{"kind":"Name","value":"processingCost"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"pricePerDay"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"planId"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"dataAmount"}},{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}},{"kind":"Field","name":{"kind":"Name","value":"appliedRules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"impact"}}]}},{"kind":"Field","name":{"kind":"Name","value":"discounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ruleName"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]}}]}}]} as unknown as DocumentNode<GetCountryBundlesQuery, GetCountryBundlesQueryVariables>;
export const SyncCatalogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SyncCatalog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"force"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncCatalog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"force"},"value":{"kind":"Variable","name":{"kind":"Name","value":"force"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"syncedBundles"}},{"kind":"Field","name":{"kind":"Name","value":"syncDuration"}},{"kind":"Field","name":{"kind":"Name","value":"syncedAt"}}]}}]}}]} as unknown as DocumentNode<SyncCatalogMutation, SyncCatalogMutationVariables>;
export const GetBundleGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBundleGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleGroups"}}]}}]} as unknown as DocumentNode<GetBundleGroupsQuery, GetBundleGroupsQueryVariables>;
export const GetPricingFiltersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPricingFilters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingFilters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleGroups"}},{"kind":"Field","name":{"kind":"Name","value":"durations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"minDays"}},{"kind":"Field","name":{"kind":"Name","value":"maxDays"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataTypes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}}]}}]}}]}}]} as unknown as DocumentNode<GetPricingFiltersQuery, GetPricingFiltersQueryVariables>;
export const GetHighDemandCountriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetHighDemandCountries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"highDemandCountries"}}]}}]} as unknown as DocumentNode<GetHighDemandCountriesQuery, GetHighDemandCountriesQueryVariables>;
export const ToggleHighDemandCountryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleHighDemandCountry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleHighDemandCountry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"countryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"isHighDemand"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<ToggleHighDemandCountryMutation, ToggleHighDemandCountryMutationVariables>;
export const GetBundleDataAggregationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBundleDataAggregation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleDataAggregation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"unlimited"}},{"kind":"Field","name":{"kind":"Name","value":"byDataAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataAmount"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"byDuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}},{"kind":"Field","name":{"kind":"Name","value":"category"}}]}},{"kind":"Field","name":{"kind":"Name","value":"byBundleGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"unlimited"}},{"kind":"Field","name":{"kind":"Name","value":"limited"}},{"kind":"Field","name":{"kind":"Name","value":"averageDataAmount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdated"}}]}}]}}]} as unknown as DocumentNode<GetBundleDataAggregationQuery, GetBundleDataAggregationQueryVariables>;
export const GetCatalogSyncHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCatalogSyncHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SyncHistoryParams"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogSyncHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"params"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"bundlesProcessed"}},{"kind":"Field","name":{"kind":"Name","value":"bundlesAdded"}},{"kind":"Field","name":{"kind":"Name","value":"bundlesUpdated"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<GetCatalogSyncHistoryQuery, GetCatalogSyncHistoryQueryVariables>;
export const TriggerCatalogSyncDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TriggerCatalogSync"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"params"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TriggerSyncParams"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerCatalogSync"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"params"},"value":{"kind":"Variable","name":{"kind":"Name","value":"params"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"jobId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"conflictingJob"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}}]}}]}}]}}]} as unknown as DocumentNode<TriggerCatalogSyncMutation, TriggerCatalogSyncMutationVariables>;
export const GetAvailableBundleGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAvailableBundleGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableBundleGroups"}}]}}]} as unknown as DocumentNode<GetAvailableBundleGroupsQuery, GetAvailableBundleGroupsQueryVariables>;