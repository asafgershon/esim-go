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

export type Country = {
  __typename?: 'Country';
  flag?: Maybe<Scalars['String']['output']>;
  iso: Scalars['ISOCountryCode']['output'];
  name: Scalars['String']['output'];
  nameHebrew?: Maybe<Scalars['String']['output']>;
  region: Scalars['String']['output'];
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

export type Mutation = {
  __typename?: 'Mutation';
  activateESIM?: Maybe<ActivateEsimResponse>;
  assignPackageToUser?: Maybe<AssignPackageResponse>;
  cancelESIM?: Maybe<EsimActionResponse>;
  createCheckoutSession: CreateCheckoutSessionResponse;
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
  updateCheckoutStep: UpdateCheckoutStepResponse;
  updateESIMReference?: Maybe<EsimActionResponse>;
  updatePricingConfiguration?: Maybe<UpdatePricingConfigurationResponse>;
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
  priceAfterDiscount: Scalars['Float']['output'];
  processingCost: Scalars['Float']['output'];
  processingRate: Scalars['Float']['output'];
  revenueAfterProcessing: Scalars['Float']['output'];
  totalCost: Scalars['Float']['output'];
};

export type PricingConfiguration = {
  __typename?: 'PricingConfiguration';
  bundleGroup?: Maybe<Scalars['String']['output']>;
  costSplitPercent: Scalars['Float']['output'];
  countryId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  createdBy: Scalars['String']['output'];
  description: Scalars['String']['output'];
  discountRate: Scalars['Float']['output'];
  duration?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  priority: Scalars['Int']['output'];
  processingRate: Scalars['Float']['output'];
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
  calculatePrice: PricingBreakdown;
  countries: Array<Country>;
  dataPlan?: Maybe<DataPlan>;
  dataPlans: DataPlanConnection;
  esimDetails?: Maybe<Esim>;
  getCheckoutSession: GetCheckoutSessionResponse;
  hello: Scalars['String']['output'];
  me?: Maybe<User>;
  myESIMs: Array<Esim>;
  myOrders: Array<Order>;
  orderDetails?: Maybe<Order>;
  orders: Array<Order>;
  pricingConfigurations: Array<PricingConfiguration>;
  trips: Array<Trip>;
  users: Array<User>;
};


export type QueryCalculatePriceArgs = {
  countryId: Scalars['String']['input'];
  numOfDays: Scalars['Int']['input'];
  regionId: Scalars['String']['input'];
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


export type QueryMyOrdersArgs = {
  filter?: InputMaybe<OrderFilter>;
};


export type QueryOrderDetailsArgs = {
  id: Scalars['ID']['input'];
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

export type Trip = {
  __typename?: 'Trip';
  countries: Array<Country>;
  countryIds: Array<Scalars['ISOCountryCode']['output']>;
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
  regionId: Scalars['String']['output'];
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
  costSplitPercent: Scalars['Float']['input'];
  countryId?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  discountRate: Scalars['Float']['input'];
  duration?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  isActive: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  priority: Scalars['Int']['input'];
  processingRate: Scalars['Float']['input'];
  regionId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePricingConfigurationResponse = {
  __typename?: 'UpdatePricingConfigurationResponse';
  configuration?: Maybe<PricingConfiguration>;
  error?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['String']['output'];
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
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


export type GetCheckoutSessionQuery = { __typename?: 'Query', getCheckoutSession: { __typename?: 'GetCheckoutSessionResponse', success: boolean, error?: string | null, session?: { __typename?: 'CheckoutSession', id: string, orderId?: string | null, isComplete: boolean, paymentStatus?: string | null, timeRemaining?: number | null, steps?: any | null, metadata?: any | null, planSnapshot?: any | null, pricing?: any | null } | null } };

export type OrderDetailsQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type OrderDetailsQuery = { __typename?: 'Query', orderDetails?: { __typename?: 'Order', id: string, reference: string, status: OrderStatus, totalPrice: number, esims: Array<{ __typename?: 'ESIM', id: string, iccid: string, qrCode?: string | null, status: EsimStatus }> } | null };

export type GetUserOrdersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUserOrdersQuery = { __typename?: 'Query', myOrders: Array<{ __typename?: 'Order', id: string, reference: string, status: OrderStatus, totalPrice: number, createdAt: string, esims: Array<{ __typename?: 'ESIM', id: string, status: EsimStatus }> }> };

export type ValidateOrderMutationVariables = Exact<{
  input: ValidateOrderInput;
}>;


export type ValidateOrderMutation = { __typename?: 'Mutation', validateOrder: { __typename?: 'ValidateOrderResponse', success: boolean, isValid: boolean, bundleDetails?: any | null, totalPrice?: number | null, currency?: string | null, error?: string | null, errorCode?: string | null } };

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


export type GetCountriesQuery = { __typename?: 'Query', countries: Array<{ __typename?: 'Country', iso: any, name: string, nameHebrew?: string | null, region: string, flag?: string | null }> };

export type GetTripsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTripsQuery = { __typename?: 'Query', trips: Array<{ __typename?: 'Trip', name: string, description: string, regionId: string, countryIds: Array<any> }> };

export type CalculatePriceQueryVariables = Exact<{
  numOfDays: Scalars['Int']['input'];
  regionId: Scalars['String']['input'];
  countryId: Scalars['String']['input'];
}>;


export type CalculatePriceQuery = { __typename?: 'Query', calculatePrice: { __typename?: 'PricingBreakdown', bundleName: string, countryName: string, duration: number, cost: number, costPlus: number, totalCost: number, discountRate: number, discountValue: number, priceAfterDiscount: number, processingRate: number, processingCost: number, revenueAfterProcessing: number, finalRevenue: number, currency: string } };
