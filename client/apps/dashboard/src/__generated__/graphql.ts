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

export type ActivateEsimResponse = {
  __typename?: 'ActivateESIMResponse';
  error?: Maybe<Scalars['String']['output']>;
  esim?: Maybe<Esim>;
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
  avgCost: Scalars['Float']['output'];
  avgCostPlus: Scalars['Float']['output'];
  avgDiscountRate: Scalars['Float']['output'];
  avgFinalRevenue: Scalars['Float']['output'];
  avgNetProfit: Scalars['Float']['output'];
  avgPricePerDay: Scalars['Float']['output'];
  avgProcessingCost: Scalars['Float']['output'];
  avgProcessingRate: Scalars['Float']['output'];
  avgProfitMargin: Scalars['Float']['output'];
  avgTotalCost: Scalars['Float']['output'];
  calculationMethod: Scalars['String']['output'];
  configurationLevel: ConfigurationLevel;
  countryId: Scalars['String']['output'];
  countryName: Scalars['String']['output'];
  hasCustomDiscount: Scalars['Boolean']['output'];
  lastFetched?: Maybe<Scalars['String']['output']>;
  totalBundles: Scalars['Int']['output'];
  totalDiscountValue: Scalars['Float']['output'];
  totalRevenue: Scalars['Float']['output'];
};

export type CalculatePriceInput = {
  countryId: Scalars['String']['input'];
  numOfDays: Scalars['Int']['input'];
  paymentMethod?: InputMaybe<PaymentMethod>;
  regionId: Scalars['String']['input'];
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

export enum ConfigurationLevel {
  Bundle = 'BUNDLE',
  Country = 'COUNTRY',
  Global = 'GLOBAL',
  Region = 'REGION'
}

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
  bundleName: Scalars['String']['output'];
  configurationLevel: ConfigurationLevel;
  cost: Scalars['Float']['output'];
  costPlus: Scalars['Float']['output'];
  countryId: Scalars['String']['output'];
  countryName: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  discountRate: Scalars['Float']['output'];
  discountValue: Scalars['Float']['output'];
  duration: Scalars['Int']['output'];
  finalRevenue: Scalars['Float']['output'];
  hasCustomDiscount: Scalars['Boolean']['output'];
  netProfit: Scalars['Float']['output'];
  priceAfterDiscount: Scalars['Float']['output'];
  pricePerDay: Scalars['Float']['output'];
  processingCost: Scalars['Float']['output'];
  processingRate: Scalars['Float']['output'];
  totalCost: Scalars['Float']['output'];
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

export type CreateMarkupConfigInput = {
  bundleGroup: Scalars['String']['input'];
  durationDays: Scalars['Int']['input'];
  markupAmount: Scalars['Float']['input'];
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

export type DataPlan = {
  __typename?: 'DataPlan';
  availableQuantity?: Maybe<Scalars['Int']['output']>;
  bundleGroup?: Maybe<Scalars['String']['output']>;
  countries: Array<Country>;
  currency: Scalars['String']['output'];
  description: Scalars['String']['output'];
  duration: Scalars['Int']['output'];
  features: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isUnlimited: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  region: Scalars['String']['output'];
};

export type DataPlanConnection = {
  __typename?: 'DataPlanConnection';
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  items: Array<DataPlan>;
  lastFetched?: Maybe<Scalars['String']['output']>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type DataPlanFilter = {
  bundleGroup?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  duration?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  maxPrice?: InputMaybe<Scalars['Float']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  region?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type DeleteMarkupConfigResponse = {
  __typename?: 'DeleteMarkupConfigResponse';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
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

export type Esim = {
  __typename?: 'ESIM';
  actionDate?: Maybe<Scalars['String']['output']>;
  assignedDate?: Maybe<Scalars['String']['output']>;
  bundles: Array<EsimBundle>;
  createdAt: Scalars['String']['output'];
  customerRef?: Maybe<Scalars['String']['output']>;
  iccid: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastAction?: Maybe<Scalars['String']['output']>;
  order: Order;
  plan: DataPlan;
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

export type MarkupConfig = {
  __typename?: 'MarkupConfig';
  bundleGroup: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  durationDays: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  markupAmount: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  activateESIM?: Maybe<ActivateEsimResponse>;
  assignPackageToUser?: Maybe<AssignPackageResponse>;
  cancelESIM?: Maybe<EsimActionResponse>;
  createCheckoutSession: CreateCheckoutSessionResponse;
  createMarkupConfig?: Maybe<MarkupConfig>;
  createProcessingFeeConfiguration?: Maybe<ProcessingFeeConfiguration>;
  createTrip?: Maybe<CreateTripResponse>;
  deactivateProcessingFeeConfiguration?: Maybe<ProcessingFeeConfiguration>;
  deleteMarkupConfig?: Maybe<DeleteMarkupConfigResponse>;
  deleteTrip?: Maybe<DeleteTripResponse>;
  deleteUser?: Maybe<DeleteUserResponse>;
  inviteAdminUser?: Maybe<InviteAdminUserResponse>;
  processCheckoutPayment: ProcessCheckoutPaymentResponse;
  purchaseESIM?: Maybe<PurchaseEsimResponse>;
  restoreESIM?: Maybe<EsimActionResponse>;
  sendPhoneOTP?: Maybe<SendOtpResponse>;
  signIn?: Maybe<SignInResponse>;
  signInWithApple?: Maybe<SignInResponse>;
  signInWithGoogle?: Maybe<SignInResponse>;
  signUp?: Maybe<SignUpResponse>;
  suspendESIM?: Maybe<EsimActionResponse>;
  syncCatalog?: Maybe<SyncCatalogResponse>;
  toggleHighDemandCountry?: Maybe<ToggleHighDemandResponse>;
  updateCheckoutStep: UpdateCheckoutStepResponse;
  updateESIMReference?: Maybe<EsimActionResponse>;
  updateMarkupConfig?: Maybe<MarkupConfig>;
  updatePricingConfiguration?: Maybe<UpdatePricingConfigurationResponse>;
  updateProcessingFeeConfiguration?: Maybe<ProcessingFeeConfiguration>;
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


export type MutationCreateCheckoutSessionArgs = {
  input: CreateCheckoutSessionInput;
};


export type MutationCreateMarkupConfigArgs = {
  input: CreateMarkupConfigInput;
};


export type MutationCreateProcessingFeeConfigurationArgs = {
  input: ProcessingFeeConfigurationInput;
};


export type MutationCreateTripArgs = {
  input: CreateTripInput;
};


export type MutationDeactivateProcessingFeeConfigurationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMarkupConfigArgs = {
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


export type MutationUpdateCheckoutStepArgs = {
  input: UpdateCheckoutStepInput;
};


export type MutationUpdateEsimReferenceArgs = {
  esimId: Scalars['ID']['input'];
  reference: Scalars['String']['input'];
};


export type MutationUpdateMarkupConfigArgs = {
  id: Scalars['ID']['input'];
  input: UpdateMarkupConfigInput;
};


export type MutationUpdatePricingConfigurationArgs = {
  input: UpdatePricingConfigurationInput;
};


export type MutationUpdateProcessingFeeConfigurationArgs = {
  id: Scalars['ID']['input'];
  input: ProcessingFeeConfigurationInput;
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
  createdAt: Scalars['String']['output'];
  dataPlan?: Maybe<DataPlan>;
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
  createdAt: Scalars['String']['output'];
  dataPlan: DataPlan;
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
  bundleName: Scalars['String']['output'];
  cost: Scalars['Float']['output'];
  costPlus: Scalars['Float']['output'];
  countryName: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  discountRate: Scalars['Float']['output'];
  discountValue: Scalars['Float']['output'];
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
  discountRate: Scalars['Float']['output'];
  duration?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  markupAmount?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  regionId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
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
  bundleGroups: Array<Scalars['String']['output']>;
  bundlesByCountry: Array<BundlesByCountry>;
  calculatePrice: PricingBreakdown;
  calculatePrices: Array<PricingBreakdown>;
  countries: Array<Country>;
  countryBundles: Array<CountryBundle>;
  currentProcessingFeeConfiguration?: Maybe<ProcessingFeeConfiguration>;
  dataPlan?: Maybe<DataPlan>;
  dataPlans: DataPlanConnection;
  esimDetails?: Maybe<Esim>;
  getCheckoutSession: GetCheckoutSessionResponse;
  getUserOrders: Array<Order>;
  hello: Scalars['String']['output'];
  highDemandCountries: Array<Scalars['String']['output']>;
  markupConfig: Array<MarkupConfig>;
  me?: Maybe<User>;
  myESIMs: Array<Esim>;
  myOrders: Array<Order>;
  orderDetails?: Maybe<Order>;
  orders: Array<Order>;
  pricingConfigurations: Array<PricingConfiguration>;
  processingFeeConfiguration?: Maybe<ProcessingFeeConfiguration>;
  processingFeeConfigurations: Array<ProcessingFeeConfiguration>;
  trips: Array<Trip>;
  users: Array<User>;
};


export type QueryCalculatePriceArgs = {
  countryId: Scalars['String']['input'];
  numOfDays: Scalars['Int']['input'];
  paymentMethod?: InputMaybe<PaymentMethod>;
  regionId: Scalars['String']['input'];
};


export type QueryCalculatePricesArgs = {
  inputs: Array<CalculatePriceInput>;
};


export type QueryCountryBundlesArgs = {
  countryId: Scalars['String']['input'];
};


export type QueryDataPlanArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDataPlansArgs = {
  filter?: InputMaybe<DataPlanFilter>;
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


export type QueryProcessingFeeConfigurationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProcessingFeeConfigurationsArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
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

export type ToggleHighDemandResponse = {
  __typename?: 'ToggleHighDemandResponse';
  countryId: Scalars['String']['output'];
  error?: Maybe<Scalars['String']['output']>;
  isHighDemand: Scalars['Boolean']['output'];
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

export type UpdateMarkupConfigInput = {
  bundleGroup?: InputMaybe<Scalars['String']['input']>;
  durationDays?: InputMaybe<Scalars['Int']['input']>;
  markupAmount?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdatePricingConfigurationInput = {
  bundleGroup?: InputMaybe<Scalars['String']['input']>;
  countryId?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
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

export type GetMarkupConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMarkupConfigQuery = { __typename?: 'Query', markupConfig: Array<{ __typename?: 'MarkupConfig', id: string, bundleGroup: string, durationDays: number, markupAmount: number, createdAt: any, updatedAt: any }> };

export type CreateMarkupConfigMutationVariables = Exact<{
  input: CreateMarkupConfigInput;
}>;


export type CreateMarkupConfigMutation = { __typename?: 'Mutation', createMarkupConfig?: { __typename?: 'MarkupConfig', id: string, bundleGroup: string, durationDays: number, markupAmount: number, createdAt: any, updatedAt: any } | null };

export type UpdateMarkupConfigMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateMarkupConfigInput;
}>;


export type UpdateMarkupConfigMutation = { __typename?: 'Mutation', updateMarkupConfig?: { __typename?: 'MarkupConfig', id: string, bundleGroup: string, durationDays: number, markupAmount: number, createdAt: any, updatedAt: any } | null };

export type DeleteMarkupConfigMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteMarkupConfigMutation = { __typename?: 'Mutation', deleteMarkupConfig?: { __typename?: 'DeleteMarkupConfigResponse', success: boolean, message?: string | null } | null };

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


export type GetOrdersQuery = { __typename?: 'Query', orders: Array<{ __typename?: 'Order', id: string, reference: string, status: OrderStatus, quantity: number, totalPrice: number, createdAt: string, updatedAt: string, user?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, phoneNumber?: string | null, role: string } | null, dataPlan?: { __typename?: 'DataPlan', id: string, name: string, description: string, region: string, duration: number, price: number, currency: string } | null }> };

export type GetUserOrdersQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetUserOrdersQuery = { __typename?: 'Query', getUserOrders: Array<{ __typename?: 'Order', id: string, reference: string, status: OrderStatus, quantity: number, totalPrice: number, createdAt: string, updatedAt: string, dataPlan?: { __typename?: 'DataPlan', id: string, name: string, description: string, region: string, duration: number, price: number, currency: string } | null }> };

export type UpdateUserRoleMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  role: Scalars['String']['input'];
}>;


export type UpdateUserRoleMutation = { __typename?: 'Mutation', updateUserRole?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, phoneNumber?: string | null, role: string, createdAt: string, updatedAt: string } | null };

export type InviteAdminUserMutationVariables = Exact<{
  input: InviteAdminUserInput;
}>;


export type InviteAdminUserMutation = { __typename?: 'Mutation', inviteAdminUser?: { __typename?: 'InviteAdminUserResponse', success: boolean, error?: string | null, invitedEmail?: string | null } | null };

export type GetDataPlansQueryVariables = Exact<{
  filter?: InputMaybe<DataPlanFilter>;
}>;


export type GetDataPlansQuery = { __typename?: 'Query', dataPlans: { __typename?: 'DataPlanConnection', totalCount: number, hasNextPage: boolean, hasPreviousPage: boolean, lastFetched?: string | null, items: Array<{ __typename?: 'DataPlan', id: string, name: string, description: string, region: string, duration: number, price: number, currency: string, isUnlimited: boolean, bundleGroup?: string | null, features: Array<string>, availableQuantity?: number | null, countries: Array<{ __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region: string, flag?: string | null }> }>, pageInfo: { __typename?: 'PageInfo', limit: number, offset: number, total: number, pages: number, currentPage: number } } };

export type AssignPackageToUserMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  planId: Scalars['ID']['input'];
}>;


export type AssignPackageToUserMutation = { __typename?: 'Mutation', assignPackageToUser?: { __typename?: 'AssignPackageResponse', success: boolean, error?: string | null, assignment?: { __typename?: 'PackageAssignment', id: string, assignedAt: string, user: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string }, dataPlan: { __typename?: 'DataPlan', id: string, name: string, description: string, region: string, duration: number, price: number, currency: string } } | null } | null };

export type CalculatePricingQueryVariables = Exact<{
  numOfDays: Scalars['Int']['input'];
  regionId: Scalars['String']['input'];
  countryId: Scalars['String']['input'];
  paymentMethod?: InputMaybe<PaymentMethod>;
}>;


export type CalculatePricingQuery = { __typename?: 'Query', calculatePrice: { __typename?: 'PricingBreakdown', bundleName: string, countryName: string, duration: number, cost: number, costPlus: number, totalCost: number, discountRate: number, discountValue: number, priceAfterDiscount: number, processingCost: number, finalRevenue: number, currency: string } };

export type CalculateBatchPricingQueryVariables = Exact<{
  inputs: Array<CalculatePriceInput> | CalculatePriceInput;
}>;


export type CalculateBatchPricingQuery = { __typename?: 'Query', calculatePrices: Array<{ __typename?: 'PricingBreakdown', bundleName: string, countryName: string, duration: number, cost: number, costPlus: number, totalCost: number, discountRate: number, discountValue: number, priceAfterDiscount: number, processingCost: number, finalRevenue: number, currency: string }> };

export type DeleteUserMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type DeleteUserMutation = { __typename?: 'Mutation', deleteUser?: { __typename?: 'DeleteUserResponse', success: boolean, error?: string | null } | null };

export type GetCountriesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCountriesQuery = { __typename?: 'Query', countries: Array<{ __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region: string, flag?: string | null }> };

export type GetPricingConfigurationsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPricingConfigurationsQuery = { __typename?: 'Query', pricingConfigurations: Array<{ __typename?: 'PricingConfiguration', id: string, name: string, description: string, countryId?: string | null, regionId?: string | null, duration?: number | null, bundleGroup?: string | null, discountRate: number, markupAmount?: number | null, isActive: boolean, createdBy: string, createdAt: string, updatedAt: string }> };

export type UpdatePricingConfigurationMutationVariables = Exact<{
  input: UpdatePricingConfigurationInput;
}>;


export type UpdatePricingConfigurationMutation = { __typename?: 'Mutation', updatePricingConfiguration?: { __typename?: 'UpdatePricingConfigurationResponse', success: boolean, error?: string | null, configuration?: { __typename?: 'PricingConfiguration', id: string, name: string, description: string, countryId?: string | null, regionId?: string | null, duration?: number | null, bundleGroup?: string | null, discountRate: number, markupAmount?: number | null, isActive: boolean, createdBy: string, createdAt: string, updatedAt: string } | null } | null };

export type GetCurrentProcessingFeeConfigurationQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentProcessingFeeConfigurationQuery = { __typename?: 'Query', currentProcessingFeeConfiguration?: { __typename?: 'ProcessingFeeConfiguration', id: string, israeliCardsRate: number, foreignCardsRate: number, premiumDinersRate: number, premiumAmexRate: number, bitPaymentRate: number, fixedFeeNIS: number, fixedFeeForeign: number, monthlyFixedCost: number, bankWithdrawalFee: number, monthlyMinimumFee: number, setupCost: number, threeDSecureFee: number, chargebackFee: number, cancellationFee: number, invoiceServiceFee: number, appleGooglePayFee: number, isActive: boolean, effectiveFrom: any, effectiveTo?: any | null, createdAt: any, updatedAt: any, createdBy: string, notes?: string | null } | null };

export type GetProcessingFeeConfigurationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetProcessingFeeConfigurationsQuery = { __typename?: 'Query', processingFeeConfigurations: Array<{ __typename?: 'ProcessingFeeConfiguration', id: string, israeliCardsRate: number, foreignCardsRate: number, premiumDinersRate: number, premiumAmexRate: number, bitPaymentRate: number, fixedFeeNIS: number, fixedFeeForeign: number, monthlyFixedCost: number, bankWithdrawalFee: number, monthlyMinimumFee: number, setupCost: number, threeDSecureFee: number, chargebackFee: number, cancellationFee: number, invoiceServiceFee: number, appleGooglePayFee: number, isActive: boolean, effectiveFrom: any, effectiveTo?: any | null, createdAt: any, updatedAt: any, createdBy: string, notes?: string | null }> };

export type CreateProcessingFeeConfigurationMutationVariables = Exact<{
  input: ProcessingFeeConfigurationInput;
}>;


export type CreateProcessingFeeConfigurationMutation = { __typename?: 'Mutation', createProcessingFeeConfiguration?: { __typename?: 'ProcessingFeeConfiguration', id: string, israeliCardsRate: number, foreignCardsRate: number, premiumDinersRate: number, premiumAmexRate: number, bitPaymentRate: number, fixedFeeNIS: number, fixedFeeForeign: number, monthlyFixedCost: number, bankWithdrawalFee: number, monthlyMinimumFee: number, setupCost: number, threeDSecureFee: number, chargebackFee: number, cancellationFee: number, invoiceServiceFee: number, appleGooglePayFee: number, isActive: boolean, effectiveFrom: any, effectiveTo?: any | null, createdAt: any, updatedAt: any, createdBy: string, notes?: string | null } | null };

export type UpdateProcessingFeeConfigurationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ProcessingFeeConfigurationInput;
}>;


export type UpdateProcessingFeeConfigurationMutation = { __typename?: 'Mutation', updateProcessingFeeConfiguration?: { __typename?: 'ProcessingFeeConfiguration', id: string, israeliCardsRate: number, foreignCardsRate: number, premiumDinersRate: number, premiumAmexRate: number, bitPaymentRate: number, fixedFeeNIS: number, fixedFeeForeign: number, monthlyFixedCost: number, bankWithdrawalFee: number, monthlyMinimumFee: number, setupCost: number, threeDSecureFee: number, chargebackFee: number, cancellationFee: number, invoiceServiceFee: number, appleGooglePayFee: number, isActive: boolean, effectiveFrom: any, effectiveTo?: any | null, createdAt: any, updatedAt: any, createdBy: string, notes?: string | null } | null };

export type DeactivateProcessingFeeConfigurationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeactivateProcessingFeeConfigurationMutation = { __typename?: 'Mutation', deactivateProcessingFeeConfiguration?: { __typename?: 'ProcessingFeeConfiguration', id: string, israeliCardsRate: number, foreignCardsRate: number, premiumDinersRate: number, premiumAmexRate: number, bitPaymentRate: number, fixedFeeNIS: number, fixedFeeForeign: number, monthlyFixedCost: number, bankWithdrawalFee: number, monthlyMinimumFee: number, setupCost: number, threeDSecureFee: number, chargebackFee: number, cancellationFee: number, invoiceServiceFee: number, appleGooglePayFee: number, isActive: boolean, effectiveFrom: any, effectiveTo?: any | null, createdAt: any, updatedAt: any, createdBy: string, notes?: string | null } | null };

export type GetBundlesByCountryQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBundlesByCountryQuery = { __typename?: 'Query', bundlesByCountry: Array<{ __typename?: 'BundlesByCountry', countryName: string, countryId: string, totalBundles: number, avgPricePerDay: number, hasCustomDiscount: boolean, avgDiscountRate: number, totalDiscountValue: number, avgCost: number, avgCostPlus: number, avgTotalCost: number, avgProcessingRate: number, avgProcessingCost: number, avgFinalRevenue: number, totalRevenue: number, avgNetProfit: number, avgProfitMargin: number, lastFetched?: string | null }> };

export type GetCountryBundlesQueryVariables = Exact<{
  countryId: Scalars['String']['input'];
}>;


export type GetCountryBundlesQuery = { __typename?: 'Query', countryBundles: Array<{ __typename?: 'CountryBundle', bundleName: string, countryName: string, countryId: string, duration: number, cost: number, costPlus: number, totalCost: number, discountRate: number, discountValue: number, priceAfterDiscount: number, processingCost: number, finalRevenue: number, currency: string, pricePerDay: number, hasCustomDiscount: boolean }> };

export type SyncCatalogMutationVariables = Exact<{
  force?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type SyncCatalogMutation = { __typename?: 'Mutation', syncCatalog?: { __typename?: 'SyncCatalogResponse', success: boolean, message?: string | null, error?: string | null, syncedBundles?: number | null, syncDuration?: number | null, syncedAt?: string | null } | null };

export type GetBundleGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBundleGroupsQuery = { __typename?: 'Query', bundleGroups: Array<string> };

export type GetHighDemandCountriesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetHighDemandCountriesQuery = { __typename?: 'Query', highDemandCountries: Array<string> };

export type ToggleHighDemandCountryMutationVariables = Exact<{
  countryId: Scalars['String']['input'];
}>;


export type ToggleHighDemandCountryMutation = { __typename?: 'Mutation', toggleHighDemandCountry?: { __typename?: 'ToggleHighDemandResponse', success: boolean, countryId: string, isHighDemand: boolean, error?: string | null } | null };


export const GetMarkupConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMarkupConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markupConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}},{"kind":"Field","name":{"kind":"Name","value":"durationDays"}},{"kind":"Field","name":{"kind":"Name","value":"markupAmount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetMarkupConfigQuery, GetMarkupConfigQueryVariables>;
export const CreateMarkupConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateMarkupConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateMarkupConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMarkupConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}},{"kind":"Field","name":{"kind":"Name","value":"durationDays"}},{"kind":"Field","name":{"kind":"Name","value":"markupAmount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateMarkupConfigMutation, CreateMarkupConfigMutationVariables>;
export const UpdateMarkupConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMarkupConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateMarkupConfigInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMarkupConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}},{"kind":"Field","name":{"kind":"Name","value":"durationDays"}},{"kind":"Field","name":{"kind":"Name","value":"markupAmount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateMarkupConfigMutation, UpdateMarkupConfigMutationVariables>;
export const DeleteMarkupConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMarkupConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMarkupConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<DeleteMarkupConfigMutation, DeleteMarkupConfigMutationVariables>;
export const GetTripsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTrips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"regionId"}},{"kind":"Field","name":{"kind":"Name","value":"countryIds"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}}]}}]}}]} as unknown as DocumentNode<GetTripsQuery, GetTripsQueryVariables>;
export const CreateTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTripInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"trip"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"regionId"}},{"kind":"Field","name":{"kind":"Name","value":"countryIds"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateTripMutation, CreateTripMutationVariables>;
export const UpdateTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTripInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"trip"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"regionId"}},{"kind":"Field","name":{"kind":"Name","value":"countryIds"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateTripMutation, UpdateTripMutationVariables>;
export const DeleteTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<DeleteTripMutation, DeleteTripMutationVariables>;
export const GetUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"orderCount"}}]}}]}}]} as unknown as DocumentNode<GetUsersQuery, GetUsersQueryVariables>;
export const GetOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataPlan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]}}]} as unknown as DocumentNode<GetOrdersQuery, GetOrdersQueryVariables>;
export const GetUserOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserOrders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUserOrders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dataPlan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]}}]} as unknown as DocumentNode<GetUserOrdersQuery, GetUserOrdersQueryVariables>;
export const UpdateUserRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateUserRoleMutation, UpdateUserRoleMutationVariables>;
export const InviteAdminUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteAdminUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InviteAdminUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteAdminUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"invitedEmail"}}]}}]}}]} as unknown as DocumentNode<InviteAdminUserMutation, InviteAdminUserMutationVariables>;
export const GetDataPlansDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDataPlans"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DataPlanFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataPlans"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"isUnlimited"}},{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}},{"kind":"Field","name":{"kind":"Name","value":"features"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"pages"}},{"kind":"Field","name":{"kind":"Name","value":"currentPage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lastFetched"}}]}}]}}]} as unknown as DocumentNode<GetDataPlansQuery, GetDataPlansQueryVariables>;
export const AssignPackageToUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AssignPackageToUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"planId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignPackageToUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"planId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"planId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"assignment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataPlan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedAt"}}]}}]}}]}}]} as unknown as DocumentNode<AssignPackageToUserMutation, AssignPackageToUserMutationVariables>;
export const CalculatePricingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalculatePricing"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"numOfDays"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"regionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paymentMethod"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaymentMethod"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculatePrice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"numOfDays"},"value":{"kind":"Variable","name":{"kind":"Name","value":"numOfDays"}}},{"kind":"Argument","name":{"kind":"Name","value":"regionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"regionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"countryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}}},{"kind":"Argument","name":{"kind":"Name","value":"paymentMethod"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paymentMethod"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"countryName"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"cost"}},{"kind":"Field","name":{"kind":"Name","value":"costPlus"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"processingCost"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]} as unknown as DocumentNode<CalculatePricingQuery, CalculatePricingQueryVariables>;
export const CalculateBatchPricingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CalculateBatchPricing"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CalculatePriceInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"calculatePrices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"countryName"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"cost"}},{"kind":"Field","name":{"kind":"Name","value":"costPlus"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"processingCost"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]} as unknown as DocumentNode<CalculateBatchPricingQuery, CalculateBatchPricingQueryVariables>;
export const DeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<DeleteUserMutation, DeleteUserMutationVariables>;
export const GetCountriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCountries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"countries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"iso"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"nameHebrew"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}}]}}]} as unknown as DocumentNode<GetCountriesQuery, GetCountriesQueryVariables>;
export const GetPricingConfigurationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPricingConfigurations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pricingConfigurations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"regionId"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"markupAmount"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetPricingConfigurationsQuery, GetPricingConfigurationsQueryVariables>;
export const UpdatePricingConfigurationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePricingConfiguration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePricingConfigurationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePricingConfiguration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"regionId"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"bundleGroup"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"markupAmount"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdatePricingConfigurationMutation, UpdatePricingConfigurationMutationVariables>;
export const GetCurrentProcessingFeeConfigurationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCurrentProcessingFeeConfiguration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentProcessingFeeConfiguration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"israeliCardsRate"}},{"kind":"Field","name":{"kind":"Name","value":"foreignCardsRate"}},{"kind":"Field","name":{"kind":"Name","value":"premiumDinersRate"}},{"kind":"Field","name":{"kind":"Name","value":"premiumAmexRate"}},{"kind":"Field","name":{"kind":"Name","value":"bitPaymentRate"}},{"kind":"Field","name":{"kind":"Name","value":"fixedFeeNIS"}},{"kind":"Field","name":{"kind":"Name","value":"fixedFeeForeign"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyFixedCost"}},{"kind":"Field","name":{"kind":"Name","value":"bankWithdrawalFee"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyMinimumFee"}},{"kind":"Field","name":{"kind":"Name","value":"setupCost"}},{"kind":"Field","name":{"kind":"Name","value":"threeDSecureFee"}},{"kind":"Field","name":{"kind":"Name","value":"chargebackFee"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationFee"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceServiceFee"}},{"kind":"Field","name":{"kind":"Name","value":"appleGooglePayFee"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveTo"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]} as unknown as DocumentNode<GetCurrentProcessingFeeConfigurationQuery, GetCurrentProcessingFeeConfigurationQueryVariables>;
export const GetProcessingFeeConfigurationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProcessingFeeConfigurations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"10"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processingFeeConfigurations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"includeInactive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"israeliCardsRate"}},{"kind":"Field","name":{"kind":"Name","value":"foreignCardsRate"}},{"kind":"Field","name":{"kind":"Name","value":"premiumDinersRate"}},{"kind":"Field","name":{"kind":"Name","value":"premiumAmexRate"}},{"kind":"Field","name":{"kind":"Name","value":"bitPaymentRate"}},{"kind":"Field","name":{"kind":"Name","value":"fixedFeeNIS"}},{"kind":"Field","name":{"kind":"Name","value":"fixedFeeForeign"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyFixedCost"}},{"kind":"Field","name":{"kind":"Name","value":"bankWithdrawalFee"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyMinimumFee"}},{"kind":"Field","name":{"kind":"Name","value":"setupCost"}},{"kind":"Field","name":{"kind":"Name","value":"threeDSecureFee"}},{"kind":"Field","name":{"kind":"Name","value":"chargebackFee"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationFee"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceServiceFee"}},{"kind":"Field","name":{"kind":"Name","value":"appleGooglePayFee"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveTo"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]} as unknown as DocumentNode<GetProcessingFeeConfigurationsQuery, GetProcessingFeeConfigurationsQueryVariables>;
export const CreateProcessingFeeConfigurationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProcessingFeeConfiguration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProcessingFeeConfigurationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProcessingFeeConfiguration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"israeliCardsRate"}},{"kind":"Field","name":{"kind":"Name","value":"foreignCardsRate"}},{"kind":"Field","name":{"kind":"Name","value":"premiumDinersRate"}},{"kind":"Field","name":{"kind":"Name","value":"premiumAmexRate"}},{"kind":"Field","name":{"kind":"Name","value":"bitPaymentRate"}},{"kind":"Field","name":{"kind":"Name","value":"fixedFeeNIS"}},{"kind":"Field","name":{"kind":"Name","value":"fixedFeeForeign"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyFixedCost"}},{"kind":"Field","name":{"kind":"Name","value":"bankWithdrawalFee"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyMinimumFee"}},{"kind":"Field","name":{"kind":"Name","value":"setupCost"}},{"kind":"Field","name":{"kind":"Name","value":"threeDSecureFee"}},{"kind":"Field","name":{"kind":"Name","value":"chargebackFee"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationFee"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceServiceFee"}},{"kind":"Field","name":{"kind":"Name","value":"appleGooglePayFee"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveTo"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]} as unknown as DocumentNode<CreateProcessingFeeConfigurationMutation, CreateProcessingFeeConfigurationMutationVariables>;
export const UpdateProcessingFeeConfigurationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProcessingFeeConfiguration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProcessingFeeConfigurationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProcessingFeeConfiguration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"israeliCardsRate"}},{"kind":"Field","name":{"kind":"Name","value":"foreignCardsRate"}},{"kind":"Field","name":{"kind":"Name","value":"premiumDinersRate"}},{"kind":"Field","name":{"kind":"Name","value":"premiumAmexRate"}},{"kind":"Field","name":{"kind":"Name","value":"bitPaymentRate"}},{"kind":"Field","name":{"kind":"Name","value":"fixedFeeNIS"}},{"kind":"Field","name":{"kind":"Name","value":"fixedFeeForeign"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyFixedCost"}},{"kind":"Field","name":{"kind":"Name","value":"bankWithdrawalFee"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyMinimumFee"}},{"kind":"Field","name":{"kind":"Name","value":"setupCost"}},{"kind":"Field","name":{"kind":"Name","value":"threeDSecureFee"}},{"kind":"Field","name":{"kind":"Name","value":"chargebackFee"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationFee"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceServiceFee"}},{"kind":"Field","name":{"kind":"Name","value":"appleGooglePayFee"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveTo"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]} as unknown as DocumentNode<UpdateProcessingFeeConfigurationMutation, UpdateProcessingFeeConfigurationMutationVariables>;
export const DeactivateProcessingFeeConfigurationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeactivateProcessingFeeConfiguration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deactivateProcessingFeeConfiguration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"israeliCardsRate"}},{"kind":"Field","name":{"kind":"Name","value":"foreignCardsRate"}},{"kind":"Field","name":{"kind":"Name","value":"premiumDinersRate"}},{"kind":"Field","name":{"kind":"Name","value":"premiumAmexRate"}},{"kind":"Field","name":{"kind":"Name","value":"bitPaymentRate"}},{"kind":"Field","name":{"kind":"Name","value":"fixedFeeNIS"}},{"kind":"Field","name":{"kind":"Name","value":"fixedFeeForeign"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyFixedCost"}},{"kind":"Field","name":{"kind":"Name","value":"bankWithdrawalFee"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyMinimumFee"}},{"kind":"Field","name":{"kind":"Name","value":"setupCost"}},{"kind":"Field","name":{"kind":"Name","value":"threeDSecureFee"}},{"kind":"Field","name":{"kind":"Name","value":"chargebackFee"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationFee"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceServiceFee"}},{"kind":"Field","name":{"kind":"Name","value":"appleGooglePayFee"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveTo"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]} as unknown as DocumentNode<DeactivateProcessingFeeConfigurationMutation, DeactivateProcessingFeeConfigurationMutationVariables>;
export const GetBundlesByCountryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBundlesByCountry"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundlesByCountry"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"countryName"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"totalBundles"}},{"kind":"Field","name":{"kind":"Name","value":"avgPricePerDay"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"avgDiscountRate"}},{"kind":"Field","name":{"kind":"Name","value":"totalDiscountValue"}},{"kind":"Field","name":{"kind":"Name","value":"avgCost"}},{"kind":"Field","name":{"kind":"Name","value":"avgCostPlus"}},{"kind":"Field","name":{"kind":"Name","value":"avgTotalCost"}},{"kind":"Field","name":{"kind":"Name","value":"avgProcessingRate"}},{"kind":"Field","name":{"kind":"Name","value":"avgProcessingCost"}},{"kind":"Field","name":{"kind":"Name","value":"avgFinalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"totalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"avgNetProfit"}},{"kind":"Field","name":{"kind":"Name","value":"avgProfitMargin"}},{"kind":"Field","name":{"kind":"Name","value":"lastFetched"}}]}}]}}]} as unknown as DocumentNode<GetBundlesByCountryQuery, GetBundlesByCountryQueryVariables>;
export const GetCountryBundlesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCountryBundles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"countryBundles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"countryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleName"}},{"kind":"Field","name":{"kind":"Name","value":"countryName"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"cost"}},{"kind":"Field","name":{"kind":"Name","value":"costPlus"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"discountRate"}},{"kind":"Field","name":{"kind":"Name","value":"discountValue"}},{"kind":"Field","name":{"kind":"Name","value":"priceAfterDiscount"}},{"kind":"Field","name":{"kind":"Name","value":"processingCost"}},{"kind":"Field","name":{"kind":"Name","value":"finalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"pricePerDay"}},{"kind":"Field","name":{"kind":"Name","value":"hasCustomDiscount"}}]}}]}}]} as unknown as DocumentNode<GetCountryBundlesQuery, GetCountryBundlesQueryVariables>;
export const SyncCatalogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SyncCatalog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"force"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncCatalog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"force"},"value":{"kind":"Variable","name":{"kind":"Name","value":"force"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"syncedBundles"}},{"kind":"Field","name":{"kind":"Name","value":"syncDuration"}},{"kind":"Field","name":{"kind":"Name","value":"syncedAt"}}]}}]}}]} as unknown as DocumentNode<SyncCatalogMutation, SyncCatalogMutationVariables>;
export const GetBundleGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBundleGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bundleGroups"}}]}}]} as unknown as DocumentNode<GetBundleGroupsQuery, GetBundleGroupsQueryVariables>;
export const GetHighDemandCountriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetHighDemandCountries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"highDemandCountries"}}]}}]} as unknown as DocumentNode<GetHighDemandCountriesQuery, GetHighDemandCountriesQueryVariables>;
export const ToggleHighDemandCountryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleHighDemandCountry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleHighDemandCountry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"countryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"countryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"countryId"}},{"kind":"Field","name":{"kind":"Name","value":"isHighDemand"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<ToggleHighDemandCountryMutation, ToggleHighDemandCountryMutationVariables>;