/* tslint:disable */
/* eslint-disable */

/**
 * 
 * 
 * default (Default action)
 * 
 * resend (Resend request to customer (do not create new))
 * 
 * reject (Reject request)
 * @export
 */
export const ActionIfRequestDuplicatedEnum = {
    DEFAULT: 'default',
    RESEND: 'resend',
    REJECT: 'reject'
} as const;
export type ActionIfRequestDuplicatedEnum = typeof ActionIfRequestDuplicatedEnum[keyof typeof ActionIfRequestDuplicatedEnum];

/**
 * 
 * @export
 * @interface Address
 */
export interface Address {
    /**
     * 
     * @type {string}
     * @memberof Address
     */
    countryCode?: string | null;
    /**
     * 
     * @type {string}
     * @memberof Address
     */
    city?: string | null;
    /**
     * 
     * @type {string}
     * @memberof Address
     */
    zip?: string | null;
    /**
     * 
     * @type {string}
     * @memberof Address
     */
    street?: string | null;
    /**
     * 
     * @type {string}
     * @memberof Address
     */
    house?: string | null;
    /**
     * 
     * @type {string}
     * @memberof Address
     */
    apartment?: string | null;
}
/**
 * 
 * @export
 * @interface ApplePayData
 */
export interface ApplePayData {
    /**
     * 
     * @type {string}
     * @memberof ApplePayData
     */
    applicationPrimaryAccountNumber?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ApplePayData
     */
    applicationExpirationDate?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ApplePayData
     */
    deviceManufacturerIdentifier?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ApplePayData
     */
    applePayEciIndicator?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ApplePayData
     */
    transactionIdentifier?: string | null;
    /**
     * 
     * @type {number}
     * @memberof ApplePayData
     */
    transactionAmount?: number;
    /**
     * 
     * @type {string}
     * @memberof ApplePayData
     */
    paymentDataType?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ApplePayData
     */
    onlinePaymentCryptogram?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ApplePayData
     */
    emvData?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ApplePayData
     */
    encryptedPINData?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ApplePayData
     */
    applePaySignature?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ApplePayData
     */
    paymentMethodNameAndLastFour?: string | null;
}
/**
 * For billing deal only. For invoice and payment transaction use <see cref="T:Shared.Integration.Models.PaymentDetails.BankTransferDetails"></see>
 * @export
 * @interface BankDetails
 */
export interface BankDetails {
    /**
     * 
     * @type {number}
     * @memberof BankDetails
     */
    bank: number;
    /**
     * 
     * @type {number}
     * @memberof BankDetails
     */
    bankBranch: number;
    /**
     * 
     * @type {string}
     * @memberof BankDetails
     */
    bankAccount: string;
    /**
     * 
     * @type {PaymentTypeEnum}
     * @memberof BankDetails
     */
    paymentType?: PaymentTypeEnum;
    /**
     * 
     * @type {number}
     * @memberof BankDetails
     */
    amount?: number;
}
/**
 * 
 * @export
 * @interface BankTransferDetails
 */
export interface BankTransferDetails {
    /**
     * 
     * @type {string}
     * @memberof BankTransferDetails
     */
    dueDate?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BankTransferDetails
     */
    reference?: string | null;
    /**
     * 
     * @type {number}
     * @memberof BankTransferDetails
     */
    bank: number;
    /**
     * 
     * @type {number}
     * @memberof BankTransferDetails
     */
    bankBranch: number;
    /**
     * 
     * @type {string}
     * @memberof BankTransferDetails
     */
    bankAccount: string;
    /**
     * 
     * @type {PaymentTypeEnum}
     * @memberof BankTransferDetails
     */
    paymentType?: PaymentTypeEnum;
    /**
     * 
     * @type {number}
     * @memberof BankTransferDetails
     */
    amount?: number;
}
/**
 * 
 * @export
 * @interface BillingDealRequest
 */
export interface BillingDealRequest {
    /**
     * EasyCard terminal reference
     * @type {string}
     * @memberof BillingDealRequest
     */
    terminalID?: string | null;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof BillingDealRequest
     */
    currency?: CurrencyEnum;
    /**
     * Stored credit card details token (should be omitted in case if full credit card details used)
     * @type {string}
     * @memberof BillingDealRequest
     */
    creditCardToken?: string | null;
    /**
     * Transaction amount
     * @type {number}
     * @memberof BillingDealRequest
     */
    transactionAmount?: number;
    /**
     * 
     * @type {number}
     * @memberof BillingDealRequest
     */
    vatRate?: number | null;
    /**
     * 
     * @type {number}
     * @memberof BillingDealRequest
     */
    vatTotal?: number | null;
    /**
     * 
     * @type {number}
     * @memberof BillingDealRequest
     */
    netTotal?: number | null;
    /**
     * 
     * @type {BillingSchedule}
     * @memberof BillingDealRequest
     */
    billingSchedule: BillingSchedule;
    /**
     * Create document
     * @type {boolean}
     * @memberof BillingDealRequest
     */
    issueInvoice?: boolean | null;
    /**
     * 
     * @type {InvoiceDetails}
     * @memberof BillingDealRequest
     */
    invoiceDetails?: InvoiceDetails;
    /**
     * 
     * @type {PaymentTypeEnum}
     * @memberof BillingDealRequest
     */
    paymentType?: PaymentTypeEnum;
    /**
     * 
     * @type {BankDetails}
     * @memberof BillingDealRequest
     */
    bankDetails?: BankDetails;
    /**
     * 
     * @type {string}
     * @memberof BillingDealRequest
     */
    origin?: string | null;
    /**
     * for import from file case
     * @type {string}
     * @memberof BillingDealRequest
     */
    readonly rowID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealRequest
     */
    readonly fileID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealRequest
     */
    readonly billingDealFileID?: string | null;
    /**
     * 
     * @type {BillingProcessingStatusEnum}
     * @memberof BillingDealRequest
     */
    inProgress?: BillingProcessingStatusEnum;
    /**
     * 
     * @type {boolean}
     * @memberof BillingDealRequest
     */
    billingRequest?: boolean;
    /**
     * 
     * @type {string}
     * @memberof BillingDealRequest
     */
    paymentRequest?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealRequest
     */
    personalBillingMessage?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealRequest
     */
    legacyCurrentTransactionTimestamp?: string | null;
    /**
     * 
     * @type {DealDetails}
     * @memberof BillingDealRequest
     */
    dealDetails?: DealDetails;
    /**
     * 
     * @type {string}
     * @memberof BillingDealRequest
     */
    comments?: string | null;
}
/**
 * 
 * @export
 * @interface BillingDealResponse
 */
export interface BillingDealResponse {
    /**
     * Primary transaction reference
     * @type {string}
     * @memberof BillingDealResponse
     */
    billingDealID?: string;
    /**
     * Date-time when deal created initially in UTC
     * @type {string}
     * @memberof BillingDealResponse
     */
    billingDealTimestamp?: string | null;
    /**
     * Reference to initial transaction
     * @type {string}
     * @memberof BillingDealResponse
     */
    initialTransactionID?: string | null;
    /**
     * Terminal
     * @type {string}
     * @memberof BillingDealResponse
     */
    terminalID?: string | null;
    /**
     * EasyCard terminal name
     * @type {string}
     * @memberof BillingDealResponse
     */
    terminalName?: string | null;
    /**
     * Merchant
     * @type {string}
     * @memberof BillingDealResponse
     */
    merchantID?: string | null;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof BillingDealResponse
     */
    currency?: CurrencyEnum;
    /**
     * This transaction amount
     * @type {number}
     * @memberof BillingDealResponse
     */
    transactionAmount?: number;
    /**
     * 
     * @type {number}
     * @memberof BillingDealResponse
     */
    amount?: number;
    /**
     * TotalAmount = TransactionAmount * NumberOfPayments
     * @type {number}
     * @memberof BillingDealResponse
     */
    totalAmount?: number;
    /**
     * Current deal (billing)
     * @type {number}
     * @memberof BillingDealResponse
     */
    currentDeal?: number | null;
    /**
     * Date-time when last created initially in UTC
     * @type {string}
     * @memberof BillingDealResponse
     */
    currentTransactionTimestamp?: string | null;
    /**
     * Reference to last deal
     * @type {string}
     * @memberof BillingDealResponse
     */
    currentTransactionID?: string | null;
    /**
     * Date-time when next transaction should be generated
     * @type {string}
     * @memberof BillingDealResponse
     */
    nextScheduledTransaction?: string | null;
    /**
     * 
     * @type {CreditCardDetails}
     * @memberof BillingDealResponse
     */
    creditCardDetails?: CreditCardDetails;
    /**
     * 
     * @type {BankDetails}
     * @memberof BillingDealResponse
     */
    bankDetails?: BankDetails;
    /**
     * Stored credit card details token
     * @type {string}
     * @memberof BillingDealResponse
     */
    creditCardToken?: string | null;
    /**
     * 
     * @type {DealDetails}
     * @memberof BillingDealResponse
     */
    dealDetails?: DealDetails;
    /**
     * 
     * @type {BillingSchedule}
     * @memberof BillingDealResponse
     */
    billingSchedule?: BillingSchedule;
    /**
     * Date-time when transaction status updated
     * @type {string}
     * @memberof BillingDealResponse
     */
    updatedDate?: string | null;
    /**
     * Concurrency key
     * @type {string}
     * @memberof BillingDealResponse
     */
    updateTimestamp?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealResponse
     */
    operationDoneBy?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealResponse
     */
    operationDoneByID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealResponse
     */
    correlationId?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealResponse
     */
    sourceIP?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingDealResponse
     */
    active?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof BillingDealResponse
     */
    cardExpired?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingDealResponse
     */
    tokenNotAvailable?: boolean | null;
    /**
     * 
     * @type {InvoiceDetails}
     * @memberof BillingDealResponse
     */
    invoiceDetails?: InvoiceDetails;
    /**
     * Create document for transaction
     * @type {boolean}
     * @memberof BillingDealResponse
     */
    issueInvoice?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof BillingDealResponse
     */
    invoiceOnly?: boolean;
    /**
     * 
     * @type {number}
     * @memberof BillingDealResponse
     */
    vatRate?: number;
    /**
     * 
     * @type {number}
     * @memberof BillingDealResponse
     */
    vatTotal?: number;
    /**
     * 
     * @type {number}
     * @memberof BillingDealResponse
     */
    netTotal?: number;
    /**
     * 
     * @type {string}
     * @memberof BillingDealResponse
     */
    pausedFrom?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealResponse
     */
    pausedTo?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingDealResponse
     */
    paused?: boolean;
    /**
     * 
     * @type {PaymentTypeEnum}
     * @memberof BillingDealResponse
     */
    paymentType?: PaymentTypeEnum;
    /**
     * 
     * @type {string}
     * @memberof BillingDealResponse
     */
    lastError?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealResponse
     */
    lastErrorCorrelationID?: string | null;
    /**
     * 
     * @type {Array<PaymentDetails>}
     * @memberof BillingDealResponse
     */
    paymentDetails?: Array<PaymentDetails> | null;
    /**
     * 
     * @type {number}
     * @memberof BillingDealResponse
     */
    failedAttemptsCount?: number | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealResponse
     */
    expirationEmailSent?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealResponse
     */
    tokenUpdated?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealResponse
     */
    tokenCreated?: string | null;
    /**
     * 
     * @type {DocumentOriginEnum}
     * @memberof BillingDealResponse
     */
    documentOrigin?: DocumentOriginEnum;
}
/**
 * 
 * @export
 * @interface BillingDealSummary
 */
export interface BillingDealSummary {
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    billingDealID?: string;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    terminalName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    terminalID?: string;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    merchantID?: string;
    /**
     * 
     * @type {number}
     * @memberof BillingDealSummary
     */
    transactionAmount?: number;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof BillingDealSummary
     */
    currency?: CurrencyEnum;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    billingDealTimestamp?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    nextScheduledTransaction?: string | null;
    /**
     * Date-time when last created initially in UTC
     * @type {string}
     * @memberof BillingDealSummary
     */
    currentTransactionTimestamp?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    consumerName?: string | null;
    /**
     * 
     * @type {BillingSchedule}
     * @memberof BillingDealSummary
     */
    billingSchedule?: BillingSchedule;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    cardNumber?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingDealSummary
     */
    cardExpired?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingDealSummary
     */
    active?: boolean;
    /**
     * 
     * @type {number}
     * @memberof BillingDealSummary
     */
    currentDeal?: number | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    pausedFrom?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    pausedTo?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingDealSummary
     */
    paused?: boolean;
    /**
     * 
     * @type {PaymentTypeEnum}
     * @memberof BillingDealSummary
     */
    paymentType?: PaymentTypeEnum;
    /**
     * 
     * @type {DealDetails}
     * @memberof BillingDealSummary
     */
    dealDetails?: DealDetails;
    /**
     * 
     * @type {boolean}
     * @memberof BillingDealSummary
     */
    invoiceOnly?: boolean;
    /**
     * Stored credit card details token
     * @type {string}
     * @memberof BillingDealSummary
     */
    creditCardToken?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    dealDescription?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    consumerExternalReference?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    bankNumber?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    bankBranchNumber?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    bankAccountNumber?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    nationalID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    lastError?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingDealSummary
     */
    lastRejectionMessage?: string | null;
    /**
     * 
     * @type {number}
     * @memberof BillingDealSummary
     */
    lastProcessorResultCode?: number | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingDealSummary
     */
    requestOKNumber?: boolean;
}

/**
 * 
 * 
 * CreditCard
 * 
 * InvoiceOnly
 * 
 * Bank
 * @export
 */
export const BillingDealTypeEnum = {
    CREDIT_CARD: 'CreditCard',
    INVOICE_ONLY: 'InvoiceOnly',
    BANK: 'Bank'
} as const;
export type BillingDealTypeEnum = typeof BillingDealTypeEnum[keyof typeof BillingDealTypeEnum];

/**
 * 
 * @export
 * @interface BillingDealUpdateRequest
 */
export interface BillingDealUpdateRequest {
    /**
     * EasyCard terminal reference
     * @type {string}
     * @memberof BillingDealUpdateRequest
     */
    terminalID?: string | null;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof BillingDealUpdateRequest
     */
    currency?: CurrencyEnum;
    /**
     * Stored credit card details token (should be omitted in case if full credit card details used)
     * @type {string}
     * @memberof BillingDealUpdateRequest
     */
    creditCardToken?: string | null;
    /**
     * Transaction amount
     * @type {number}
     * @memberof BillingDealUpdateRequest
     */
    transactionAmount?: number;
    /**
     * 
     * @type {number}
     * @memberof BillingDealUpdateRequest
     */
    vatRate?: number | null;
    /**
     * 
     * @type {number}
     * @memberof BillingDealUpdateRequest
     */
    vatTotal?: number | null;
    /**
     * 
     * @type {number}
     * @memberof BillingDealUpdateRequest
     */
    netTotal?: number | null;
    /**
     * 
     * @type {BillingSchedule}
     * @memberof BillingDealUpdateRequest
     */
    billingSchedule?: BillingSchedule;
    /**
     * 
     * @type {boolean}
     * @memberof BillingDealUpdateRequest
     */
    issueInvoice?: boolean | null;
    /**
     * 
     * @type {InvoiceDetails}
     * @memberof BillingDealUpdateRequest
     */
    invoiceDetails?: InvoiceDetails;
    /**
     * 
     * @type {PaymentTypeEnum}
     * @memberof BillingDealUpdateRequest
     */
    paymentType?: PaymentTypeEnum;
    /**
     * 
     * @type {BankDetails}
     * @memberof BillingDealUpdateRequest
     */
    bankDetails?: BankDetails;
    /**
     * 
     * @type {DealDetails}
     * @memberof BillingDealUpdateRequest
     */
    dealDetails?: DealDetails;
    /**
     * 
     * @type {string}
     * @memberof BillingDealUpdateRequest
     */
    comments?: string | null;
}
/**
 * 
 * @export
 * @interface BillingDetails
 */
export interface BillingDetails {
    /**
     * EasyCard terminal reference
     * @type {string}
     * @memberof BillingDetails
     */
    terminalID?: string | null;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof BillingDetails
     */
    currency?: CurrencyEnum;
    /**
     * 
     * @type {number}
     * @memberof BillingDetails
     */
    billingRequestAmount?: number | null;
    /**
     * 
     * @type {BillingSchedule}
     * @memberof BillingDetails
     */
    billingSchedule: BillingSchedule;
    /**
     * 
     * @type {string}
     * @memberof BillingDetails
     */
    personalBillingMessage?: string | null;
    /**
     * 
     * @type {PaymentTypeEnum}
     * @memberof BillingDetails
     */
    paymentType?: PaymentTypeEnum;
    /**
     * 
     * @type {BankDetails}
     * @memberof BillingDetails
     */
    bankDetails?: BankDetails;
}

/**
 * 
 * 
 * Pending
 * 
 * Started
 * 
 * InProgress
 * 
 * Finished
 * @export
 */
export const BillingProcessingStatusEnum = {
    PENDING: 'Pending',
    STARTED: 'Started',
    IN_PROGRESS: 'InProgress',
    FINISHED: 'Finished'
} as const;
export type BillingProcessingStatusEnum = typeof BillingProcessingStatusEnum[keyof typeof BillingProcessingStatusEnum];

/**
 * Create a link to Checkout Page with create billing deal and customer details
 * @export
 * @interface BillingRequestCreate
 */
export interface BillingRequestCreate {
    /**
     * EasyCard Terminal
     * @type {string}
     * @memberof BillingRequestCreate
     */
    terminalID?: string | null;
    /**
     * 
     * @type {DealDetails}
     * @memberof BillingRequestCreate
     */
    dealDetails?: DealDetails;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof BillingRequestCreate
     */
    currency?: CurrencyEnum;
    /**
     * Deal amount including VAT. This amount will be displayed on Checkout Page. Consumer can override this amount in case if UserAmount flag specified.
     * @type {number}
     * @memberof BillingRequestCreate
     */
    paymentRequestAmount?: number | null;
    /**
     * Due date of payment link
     * @type {string}
     * @memberof BillingRequestCreate
     */
    dueDate?: string | null;
    /**
     * 
     * @type {TransactionTypeEnum}
     * @memberof BillingRequestCreate
     */
    transactionType?: TransactionTypeEnum;
    /**
     * 
     * @type {InvoiceDetails}
     * @memberof BillingRequestCreate
     */
    invoiceDetails?: InvoiceDetails;
    /**
     * Create document - Invoice, Receipt etc. If omitted, default terminal settings will be used
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    issueInvoice?: boolean | null;
    /**
     * Deal tax rate. Can be omitted if only PaymentRequestAmount specified - in this case VAT rate from terminal settings will be used
     * @type {number}
     * @memberof BillingRequestCreate
     */
    vatRate?: number | null;
    /**
     * Total deal tax amount. VATTotal = NetTotal * VATRate. Can be omitted if only PaymentRequestAmount specified
     * @type {number}
     * @memberof BillingRequestCreate
     */
    vatTotal?: number | null;
    /**
     * 
     * @type {number}
     * @memberof BillingRequestCreate
     */
    netDiscountTotal?: number | null;
    /**
     * 
     * @type {number}
     * @memberof BillingRequestCreate
     */
    discountTotal?: number | null;
    /**
     * Deal amount before tax. PaymentRequestAmount = NetTotal + VATTotal. Can be omitted if only PaymentRequestAmount specified
     * @type {number}
     * @memberof BillingRequestCreate
     */
    netTotal?: number | null;
    /**
     * You can override default email subject When sending payment link via email
     * @type {string}
     * @memberof BillingRequestCreate
     */
    requestSubject?: string | null;
    /**
     * You can override "from" address subject When sending payment link via email
     * @type {string}
     * @memberof BillingRequestCreate
     */
    fromAddress?: string | null;
    /**
     * Url to merchant's web site. Base url should be configured in terminal settings. You can add any details to query string.
     * @type {string}
     * @memberof BillingRequestCreate
     */
    redirectUrl?: string | null;
    /**
     * Consumer can override PaymentRequestAmount
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    userAmount?: boolean;
    /**
     * Consumer must insert PaymentRequestAmount
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    forceUserAmount?: boolean;
    /**
     * 
     * @type {string}
     * @memberof BillingRequestCreate
     */
    cardOwnerNationalID?: string | null;
    /**
     * Any advanced payload which will be stored in EasyCard and then can be obtained using "GetTransaction"
     * @type {any}
     * @memberof BillingRequestCreate
     */
    extension?: any | null;
    /**
     * Default language to display checkout page
     * @type {string}
     * @memberof BillingRequestCreate
     */
    language?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BillingRequestCreate
     */
    origin?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    hidePhone?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    phoneRequired?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    hideEmail?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    emailRequired?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    hideConsumerName?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    consumerNameRequired?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    hideNationalID?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    nationalIDRequired?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    addressRequired?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    hideAddress?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    consumerDataReadonly?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    consumerNationalIDReadonly?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    consumerPhoneReadonly?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    consumerNameReadonly?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    consumerEmailReadonly?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    consumerAddressReadonly?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    saveCreditCardByDefault?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    disableCancelPayment?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    permanent?: boolean;
    /**
     * 
     * @type {BillingDetails}
     * @memberof BillingRequestCreate
     */
    billingDetails?: BillingDetails;
    /**
     * 
     * @type {PaymentRequestTypeEnum}
     * @memberof BillingRequestCreate
     */
    paymentRequestType?: PaymentRequestTypeEnum;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    billingLink?: boolean;
    /**
     * 
     * @type {JDealTypeEnum}
     * @memberof BillingRequestCreate
     */
    jDealType?: JDealTypeEnum;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    allowRegular?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof BillingRequestCreate
     */
    createBilling?: boolean;
}
/**
 * 
 * @export
 * @interface BillingSchedule
 */
export interface BillingSchedule {
    /**
     * 
     * @type {RepeatPeriodTypeEnum}
     * @memberof BillingSchedule
     */
    repeatPeriodType?: RepeatPeriodTypeEnum;
    /**
     * 
     * @type {StartAtTypeEnum}
     * @memberof BillingSchedule
     */
    startAtType?: StartAtTypeEnum;
    /**
     * 
     * @type {string}
     * @memberof BillingSchedule
     */
    startAt?: string | null;
    /**
     * 
     * @type {EndAtTypeEnum}
     * @memberof BillingSchedule
     */
    endAtType?: EndAtTypeEnum;
    /**
     * 
     * @type {string}
     * @memberof BillingSchedule
     */
    endAt?: string | null;
    /**
     * 
     * @type {number}
     * @memberof BillingSchedule
     */
    endAtNumberOfPayments?: number | null;
}

/**
 * 
 * 
 * All
 * 
 * Completed
 * 
 * Inactive
 * 
 * Failed
 * 
 * CardExpired
 * 
 * TriggeredTomorrow
 * 
 * Paused
 * 
 * ExpiredNextMonth
 * 
 * ManualTrigger
 * 
 * InProgress
 * 
 * Passed
 * @export
 */
export const BillingsQuickStatusFilterEnum = {
    ALL: 'All',
    COMPLETED: 'Completed',
    INACTIVE: 'Inactive',
    FAILED: 'Failed',
    CARD_EXPIRED: 'CardExpired',
    TRIGGERED_TOMORROW: 'TriggeredTomorrow',
    PAUSED: 'Paused',
    EXPIRED_NEXT_MONTH: 'ExpiredNextMonth',
    MANUAL_TRIGGER: 'ManualTrigger',
    IN_PROGRESS: 'InProgress',
    PASSED: 'Passed'
} as const;
export type BillingsQuickStatusFilterEnum = typeof BillingsQuickStatusFilterEnum[keyof typeof BillingsQuickStatusFilterEnum];

/**
 * Blocking funds on credit card
 * @export
 * @interface BlockCreditCardRequest
 */
export interface BlockCreditCardRequest {
    /**
     * EasyCard terminal reference
     * @type {string}
     * @memberof BlockCreditCardRequest
     */
    terminalID: string;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof BlockCreditCardRequest
     */
    currency?: CurrencyEnum;
    /**
     * 
     * @type {CardPresenceEnum}
     * @memberof BlockCreditCardRequest
     */
    cardPresence?: CardPresenceEnum;
    /**
     * 
     * @type {CreditCardSecureDetails}
     * @memberof BlockCreditCardRequest
     */
    creditCardSecureDetails?: CreditCardSecureDetails;
    /**
     * Stored credit card details token (should be omitted in case if full credit card details used)
     * @type {string}
     * @memberof BlockCreditCardRequest
     */
    creditCardToken?: string | null;
    /**
     * Transaction amount
     * @type {number}
     * @memberof BlockCreditCardRequest
     */
    transactionAmount: number;
    /**
     * Save credit card from request.
     * Requires Feature CreditCardTokens to be enabled.
     * @type {boolean}
     * @memberof BlockCreditCardRequest
     */
    saveCreditCard?: boolean | null;
    /**
     * 
     * @type {string}
     * @memberof BlockCreditCardRequest
     */
    paymentRequestID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BlockCreditCardRequest
     */
    paymentIntentID?: string | null;
    /**
     * 
     * @type {any}
     * @memberof BlockCreditCardRequest
     */
    extension?: any | null;
    /**
     * 
     * @type {string}
     * @memberof BlockCreditCardRequest
     */
    threeDSServerTransID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof BlockCreditCardRequest
     */
    origin?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof BlockCreditCardRequest
     */
    issueInvoice?: boolean | null;
    /**
     * 
     * @type {InstallmentDetails}
     * @memberof BlockCreditCardRequest
     */
    installmentDetails?: InstallmentDetails;
    /**
     * 
     * @type {DealDetails}
     * @memberof BlockCreditCardRequest
     */
    dealDetails?: DealDetails;
    /**
     * 
     * @type {string}
     * @memberof BlockCreditCardRequest
     */
    comments?: string | null;
}
/**
 * 
 * @export
 * @interface CardExpiration
 */
export interface CardExpiration {
    /**
     * 
     * @type {number}
     * @memberof CardExpiration
     */
    year: number;
    /**
     * 
     * @type {number}
     * @memberof CardExpiration
     */
    month: number;
    /**
     * 
     * @type {boolean}
     * @memberof CardExpiration
     */
    expired?: boolean;
}

/**
 * Is the card physically scanned
 * 
 * cardNotPresent
 * 
 * regular
 * 
 * Internet
 * @export
 */
export const CardPresenceEnum = {
    CARD_NOT_PRESENT: 'cardNotPresent',
    REGULAR: 'regular',
    INTERNET: 'Internet'
} as const;
export type CardPresenceEnum = typeof CardPresenceEnum[keyof typeof CardPresenceEnum];

/**
 * 
 * @export
 * @interface ChargebackRequest
 */
export interface ChargebackRequest {
    /**
     * 
     * @type {string}
     * @memberof ChargebackRequest
     */
    existingPaymentTransactionID: string;
    /**
     * 
     * @type {number}
     * @memberof ChargebackRequest
     */
    refundAmount: number;
}
/**
 * Check if credit card is valid
 * @export
 * @interface CheckCreditCardRequest
 */
export interface CheckCreditCardRequest {
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof CheckCreditCardRequest
     */
    currency?: CurrencyEnum;
    /**
     * 
     * @type {CardPresenceEnum}
     * @memberof CheckCreditCardRequest
     */
    cardPresence?: CardPresenceEnum;
    /**
     * EasyCard terminal reference
     * @type {string}
     * @memberof CheckCreditCardRequest
     */
    terminalID: string;
    /**
     * 
     * @type {CreditCardSecureDetails}
     * @memberof CheckCreditCardRequest
     */
    creditCardSecureDetails?: CreditCardSecureDetails;
    /**
     * Stored credit card details token (should be omitted in case if full credit card details used)
     * @type {string}
     * @memberof CheckCreditCardRequest
     */
    creditCardToken?: string | null;
    /**
     * 
     * @type {DealDetails}
     * @memberof CheckCreditCardRequest
     */
    dealDetails?: DealDetails;
    /**
     * 
     * @type {string}
     * @memberof CheckCreditCardRequest
     */
    comments?: string | null;
}
/**
 * 
 * @export
 * @interface CouponsConfiguration
 */
export interface CouponsConfiguration {
    /**
     * 
     * @type {string}
     * @memberof CouponsConfiguration
     */
    code?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CouponsConfiguration
     */
    expiration?: string | null;
    /**
     * 
     * @type {number}
     * @memberof CouponsConfiguration
     */
    discountAmount?: number | null;
    /**
     * 
     * @type {boolean}
     * @memberof CouponsConfiguration
     */
    canBeUsedWithOtherCoupons?: boolean;
}
/**
 * Create the charge based on credit card or previously stored credit card token
 * @export
 * @interface CreateTransactionRequest
 */
export interface CreateTransactionRequest {
    /**
     * EasyCard terminal reference
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    terminalID: string;
    /**
     * 
     * @type {TransactionTypeEnum}
     * @memberof CreateTransactionRequest
     */
    transactionType?: TransactionTypeEnum;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof CreateTransactionRequest
     */
    currency?: CurrencyEnum;
    /**
     * 
     * @type {PaymentTypeEnum}
     * @memberof CreateTransactionRequest
     */
    paymentTypeEnum?: PaymentTypeEnum;
    /**
     * 
     * @type {CardPresenceEnum}
     * @memberof CreateTransactionRequest
     */
    cardPresence?: CardPresenceEnum;
    /**
     * 
     * @type {CreditCardSecureDetails}
     * @memberof CreateTransactionRequest
     */
    creditCardSecureDetails?: CreditCardSecureDetails;
    /**
     * 
     * @type {BankTransferDetails}
     * @memberof CreateTransactionRequest
     */
    bankTransferDetails?: BankTransferDetails;
    /**
     * Stored credit card details token (should be omitted in case if full credit card details used)
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    creditCardToken?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof CreateTransactionRequest
     */
    legacyToken?: boolean;
    /**
     * Transaction amount. Must always be specified. In case of Installments must match InstallmentDetails.TotalAmount
     * @type {number}
     * @memberof CreateTransactionRequest
     */
    transactionAmount?: number;
    /**
     * 
     * @type {number}
     * @memberof CreateTransactionRequest
     */
    vatRate?: number | null;
    /**
     * 
     * @type {number}
     * @memberof CreateTransactionRequest
     */
    vatTotal?: number | null;
    /**
     * 
     * @type {number}
     * @memberof CreateTransactionRequest
     */
    netTotal?: number | null;
    /**
     * 
     * @type {number}
     * @memberof CreateTransactionRequest
     */
    netDiscountTotal?: number | null;
    /**
     * 
     * @type {number}
     * @memberof CreateTransactionRequest
     */
    discountTotal?: number | null;
    /**
     * 
     * @type {InstallmentDetails}
     * @memberof CreateTransactionRequest
     */
    installmentDetails?: InstallmentDetails;
    /**
     * Original consumer IP
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    consumerIP?: string | null;
    /**
     * Save credit card from request.
     * Requires Feature CreditCardTokens to be enabled.
     * @type {boolean}
     * @memberof CreateTransactionRequest
     */
    saveCreditCard?: boolean | null;
    /**
     * Reference to initial transaction
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    initialJ5TransactionID?: string | null;
    /**
     * Create document
     * @type {boolean}
     * @memberof CreateTransactionRequest
     */
    issueInvoice?: boolean | null;
    /**
     * 
     * @type {InvoiceDetails}
     * @memberof CreateTransactionRequest
     */
    invoiceDetails?: InvoiceDetails;
    /**
     * Create Pinpad Transaction
     * @type {boolean}
     * @memberof CreateTransactionRequest
     */
    pinPad?: boolean | null;
    /**
     * Pinpad device in case of terminal with multiple devices
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    pinPadDeviceID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    paymentRequestID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    paymentIntentID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    okNumber?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    originalUID?: string | null;
    /**
     * Only to be used for pin pad transactions when CreditCardSecureDetails is not available
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    cardOwnerNationalID?: string | null;
    /**
     * Only to be used for pin pad transactions when CreditCardSecureDetails is not available
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    cardOwnerName?: string | null;
    /**
     * SignalR connection id
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    connectionID?: string | null;
    /**
     * 
     * @type {any}
     * @memberof CreateTransactionRequest
     */
    extension?: any | null;
    /**
     * 
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    threeDSServerTransID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    origin?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof CreateTransactionRequest
     */
    userAmount?: boolean;
    /**
     * For GooglePay only
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    googlePaySignature?: string | null;
    /**
     * For GooglePay only
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    googlePayMessageId?: string | null;
    /**
     * For GooglePay only
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    googlePayEciIndicator?: string | null;
    /**
     * 
     * @type {GooglePayData}
     * @memberof CreateTransactionRequest
     */
    googlePayData?: GooglePayData;
    /**
     * 
     * @type {ApplePayData}
     * @memberof CreateTransactionRequest
     */
    applePayData?: ApplePayData;
    /**
     * 
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    email?: string | null;
    /**
     * 
     * @type {BillingDetails}
     * @memberof CreateTransactionRequest
     */
    billingDetails?: BillingDetails;
    /**
     * 
     * @type {boolean}
     * @memberof CreateTransactionRequest
     */
    createBilling?: boolean;
    /**
     * 
     * @type {any}
     * @memberof CreateTransactionRequest
     */
    additionalFields?: any | null;
    /**
     * 
     * @type {Array<CouponsConfiguration>}
     * @memberof CreateTransactionRequest
     */
    couponApplied?: Array<CouponsConfiguration> | null;
    /**
     * 
     * @type {number}
     * @memberof CreateTransactionRequest
     */
    externalCommission?: number | null;
    /**
     * 
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    externalCommissionConsentReference?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    billingDealID?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof CreateTransactionRequest
     */
    approveExternalCommission?: boolean;
    /**
     * 
     * @type {DealDetails}
     * @memberof CreateTransactionRequest
     */
    dealDetails?: DealDetails;
    /**
     * 
     * @type {string}
     * @memberof CreateTransactionRequest
     */
    comments?: string | null;
}
/**
 * Does not store full card number. Used 123456****1234 pattern
 * @export
 * @interface CreditCardDetails
 */
export interface CreditCardDetails {
    /**
     * 
     * @type {string}
     * @memberof CreditCardDetails
     */
    cardNumber: string;
    /**
     * 
     * @type {CardExpiration}
     * @memberof CreditCardDetails
     */
    cardExpiration: CardExpiration;
    /**
     * 
     * @type {string}
     * @memberof CreditCardDetails
     */
    cardVendor?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardDetails
     */
    cardBrand?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardDetails
     */
    solek?: string | null;
    /**
     * 
     * @type {IssuerEnum}
     * @memberof CreditCardDetails
     */
    issuer?: IssuerEnum;
    /**
     * 
     * @type {string}
     * @memberof CreditCardDetails
     */
    cardOwnerName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardDetails
     */
    cardOwnerNationalID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardDetails
     */
    cardReaderInput?: string | null;
}
/**
 * 
 * @export
 * @interface CreditCardSecureDetails
 */
export interface CreditCardSecureDetails {
    /**
     * 
     * @type {string}
     * @memberof CreditCardSecureDetails
     */
    cvv?: string | null;
    /**
     * after code 3 or 4 user can insert this value from credit company
     * @type {string}
     * @memberof CreditCardSecureDetails
     */
    authNum?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardSecureDetails
     */
    cardNumber: string;
    /**
     * 
     * @type {CardExpiration}
     * @memberof CreditCardSecureDetails
     */
    cardExpiration: CardExpiration;
    /**
     * 
     * @type {string}
     * @memberof CreditCardSecureDetails
     */
    cardVendor?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardSecureDetails
     */
    cardBrand?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardSecureDetails
     */
    solek?: string | null;
    /**
     * 
     * @type {IssuerEnum}
     * @memberof CreditCardSecureDetails
     */
    issuer?: IssuerEnum;
    /**
     * 
     * @type {string}
     * @memberof CreditCardSecureDetails
     */
    cardOwnerName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardSecureDetails
     */
    cardOwnerNationalID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardSecureDetails
     */
    cardReaderInput?: string | null;
}
/**
 * 
 * @export
 * @interface CreditCardTokenSummary
 */
export interface CreditCardTokenSummary {
    /**
     * 
     * @type {string}
     * @memberof CreditCardTokenSummary
     */
    creditCardTokenID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardTokenSummary
     */
    terminalID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardTokenSummary
     */
    merchantID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardTokenSummary
     */
    cardNumber?: string | null;
    /**
     * 
     * @type {CardExpiration}
     * @memberof CreditCardTokenSummary
     */
    cardExpiration?: CardExpiration;
    /**
     * 
     * @type {string}
     * @memberof CreditCardTokenSummary
     */
    cardVendor?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardTokenSummary
     */
    created?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardTokenSummary
     */
    cardOwnerName?: string | null;
    /**
     * Consumer ID
     * @type {string}
     * @memberof CreditCardTokenSummary
     */
    consumerID?: string | null;
    /**
     * End-customer Email
     * @type {string}
     * @memberof CreditCardTokenSummary
     */
    consumerEmail?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof CreditCardTokenSummary
     */
    expired?: boolean;
    /**
     * 
     * @type {CardExpiration}
     * @memberof CreditCardTokenSummary
     */
    cardExpirationBeforeExtended?: CardExpiration;
    /**
     * 
     * @type {string}
     * @memberof CreditCardTokenSummary
     */
    extended?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CreditCardTokenSummary
     */
    legacyReference?: string | null;
}

/**
 * 
 * 
 * ILS
 * 
 * USD
 * 
 * EUR
 * @export
 */
export const CurrencyEnum = {
    ILS: 'ILS',
    USD: 'USD',
    EUR: 'EUR'
} as const;
export type CurrencyEnum = typeof CurrencyEnum[keyof typeof CurrencyEnum];

/**
 * Additional deal information. All these data are not required and used only for merchant's business purposes.
 * @export
 * @interface DealDetails
 */
export interface DealDetails {
    /**
     * Deal identifier in merchant's system
     * @type {string}
     * @memberof DealDetails
     */
    dealReference?: string | null;
    /**
     * Deal description. In case of generating payment link, these description will be displayed on Checkout Page
     * @type {string}
     * @memberof DealDetails
     */
    dealDescription?: string | null;
    /**
     * End-customer Email
     * @type {string}
     * @memberof DealDetails
     */
    consumerEmail?: string | null;
    /**
     * End-customer Name
     * @type {string}
     * @memberof DealDetails
     */
    consumerName?: string | null;
    /**
     * End-customer National Id
     * @type {string}
     * @memberof DealDetails
     */
    consumerNationalID?: string | null;
    /**
     * End-customer Phone
     * @type {string}
     * @memberof DealDetails
     */
    consumerPhone?: string | null;
    /**
     * End-customer record UUId in EasyCard system
     * @type {string}
     * @memberof DealDetails
     */
    consumerID?: string | null;
    /**
     * Deal Items
     * ID, Count, Name
     * @type {Array<Item>}
     * @memberof DealDetails
     */
    items?: Array<Item> | null;
    /**
     * 
     * @type {Address}
     * @memberof DealDetails
     */
    consumerAddress?: Address;
    /**
     * External system consumer identifier for example RapidOne customer code
     * @type {string}
     * @memberof DealDetails
     */
    consumerExternalReference?: string | null;
    /**
     * 
     * @type {string}
     * @memberof DealDetails
     */
    consumerWoocommerceID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof DealDetails
     */
    consumerEcwidID?: string | null;
    /**
     * External responsible person
     * @type {string}
     * @memberof DealDetails
     */
    responsiblePerson?: string | null;
    /**
     * External user id
     * @type {string}
     * @memberof DealDetails
     */
    externalUserID?: string | null;
    /**
     * External branch
     * @type {string}
     * @memberof DealDetails
     */
    branch?: string | null;
    /**
     * External department
     * @type {string}
     * @memberof DealDetails
     */
    department?: string | null;
    /**
     * 
     * @type {string}
     * @memberof DealDetails
     */
    consumerMorningID?: string | null;
    /**
     * 
     * @type {number}
     * @memberof DealDetails
     */
    consumerICountID?: number | null;
}

/**
 * Document origin (primarely payment transaction origin)
 * 
 * UI (Document created manually by merchant user using Merchant's UI)
 * 
 * API (Document created via API)
 * 
 * checkout (Document created by consumer using Checkout Page)
 * 
 * billing (Document generated based on billing schedule)
 * 
 * device (Transaction created using pinpad device (or other device))
 * 
 * paymentRequest (Document created by consumer using Checkout Page with a payment link)
 * 
 * bit (Document created by consumer using Bit)
 * 
 * googlePay (Transaction created using Google Pay)
 * 
 * applePay (Transaction created using Apple Pay)
 * 
 * legacy (Transaction created using Legacy)
 * 
 * blender (Document created by consumer using Bit)
 * @export
 */
export const DocumentOriginEnum = {
    UI: 'UI',
    API: 'API',
    CHECKOUT: 'checkout',
    BILLING: 'billing',
    DEVICE: 'device',
    PAYMENT_REQUEST: 'paymentRequest',
    BIT: 'bit',
    GOOGLE_PAY: 'googlePay',
    APPLE_PAY: 'applePay',
    LEGACY: 'legacy',
    BLENDER: 'blender'
} as const;
export type DocumentOriginEnum = typeof DocumentOriginEnum[keyof typeof DocumentOriginEnum];

/**
 * 
 * @export
 * @interface DownloadInvoiceResponse
 */
export interface DownloadInvoiceResponse {
    /**
     * 
     * @type {Array<string>}
     * @memberof DownloadInvoiceResponse
     */
    downloadLinks?: Array<string> | null;
    /**
     * 
     * @type {string}
     * @memberof DownloadInvoiceResponse
     */
    message?: string | null;
    /**
     * 
     * @type {StatusEnum}
     * @memberof DownloadInvoiceResponse
     */
    status?: StatusEnum;
    /**
     * 
     * @type {number}
     * @memberof DownloadInvoiceResponse
     */
    entityID?: number | null;
    /**
     * 
     * @type {string}
     * @memberof DownloadInvoiceResponse
     */
    entityUID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof DownloadInvoiceResponse
     */
    entityReference?: string | null;
    /**
     * 
     * @type {string}
     * @memberof DownloadInvoiceResponse
     */
    correlationId?: string | null;
    /**
     * 
     * @type {string}
     * @memberof DownloadInvoiceResponse
     */
    entityType?: string | null;
    /**
     * 
     * @type {Array<Error>}
     * @memberof DownloadInvoiceResponse
     */
    errors?: Array<Error> | null;
    /**
     * 
     * @type {string}
     * @memberof DownloadInvoiceResponse
     */
    concurrencyToken?: string | null;
    /**
     * 
     * @type {OperationResponse}
     * @memberof DownloadInvoiceResponse
     */
    innerResponse?: OperationResponse;
    /**
     * 
     * @type {any}
     * @memberof DownloadInvoiceResponse
     */
    additionalData?: any | null;
}

/**
 * 
 * 
 * never
 * 
 * specifiedDate
 * 
 * afterNumberOfPayments
 * @export
 */
export const EndAtTypeEnum = {
    NEVER: 'never',
    SPECIFIED_DATE: 'specifiedDate',
    AFTER_NUMBER_OF_PAYMENTS: 'afterNumberOfPayments'
} as const;
export type EndAtTypeEnum = typeof EndAtTypeEnum[keyof typeof EndAtTypeEnum];

/**
 * 
 * @export
 * @interface ExecutedWebhookSummary
 */
export interface ExecutedWebhookSummary {
    /**
     * 
     * @type {string}
     * @memberof ExecutedWebhookSummary
     */
    merchantID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ExecutedWebhookSummary
     */
    terminalID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ExecutedWebhookSummary
     */
    url?: string | null;
    /**
     * 
     * @type {any}
     * @memberof ExecutedWebhookSummary
     */
    payload?: any | null;
    /**
     * 
     * @type {string}
     * @memberof ExecutedWebhookSummary
     */
    correlationId?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ExecutedWebhookSummary
     */
    eventID?: string | null;
}

/**
 * 
 * 
 * NotApplicable
 * 
 * SMS
 * 
 * Checkbox
 * @export
 */
export const ExternalCommissionEnum = {
    NOT_APPLICABLE: 'NotApplicable',
    SMS: 'SMS',
    CHECKBOX: 'Checkbox'
} as const;
export type ExternalCommissionEnum = typeof ExternalCommissionEnum[keyof typeof ExternalCommissionEnum];

/**
 * 
 * @export
 * @interface GooglePayData
 */
export interface GooglePayData {
    /**
     * 
     * @type {string}
     * @memberof GooglePayData
     */
    googlePayryptogram?: string | null;
    /**
     * 
     * @type {string}
     * @memberof GooglePayData
     */
    googlePayMessageId?: string | null;
    /**
     * 
     * @type {string}
     * @memberof GooglePayData
     */
    googlePayEciIndicator?: string | null;
}
/**
 * Installment payments details
 * @export
 * @interface InstallmentDetails
 */
export interface InstallmentDetails {
    /**
     * Number Of Installments
     * @type {number}
     * @memberof InstallmentDetails
     */
    numberOfPayments: number;
    /**
     * Initial installment payment
     * @type {number}
     * @memberof InstallmentDetails
     */
    initialPaymentAmount?: number | null;
    /**
     * TotalAmount = InitialPaymentAmount + (NumberOfInstallments - 1) * InstallmentPaymentAmount
     * @type {number}
     * @memberof InstallmentDetails
     */
    totalAmount?: number | null;
    /**
     * Amount of each additional payments
     * @type {number}
     * @memberof InstallmentDetails
     */
    installmentPaymentAmount?: number | null;
    /**
     * 
     * @type {number}
     * @memberof InstallmentDetails
     */
    minInstallments?: number | null;
    /**
     * 
     * @type {number}
     * @memberof InstallmentDetails
     */
    maxInstallments?: number | null;
    /**
     * 
     * @type {number}
     * @memberof InstallmentDetails
     */
    minCreditInstallments?: number | null;
    /**
     * 
     * @type {number}
     * @memberof InstallmentDetails
     */
    maxCreditInstallments?: number | null;
}

/**
 * 
 * 
 * ManualInvoice (Without transaction and billing)
 * 
 * TransactionInvoice (Transaction but has no billing)
 * 
 * InvoiceOnlyBilling (Billing's invoice. But billing is without transactions (invoice only))
 * 
 * CreditCardBilling (Billing's invoice. Billing payment type is credit card)
 * 
 * BankBilling (Billing's invoice. Billing payment type is bank)
 * @export
 */
export const InvoiceBillingTypeEnum = {
    MANUAL_INVOICE: 'ManualInvoice',
    TRANSACTION_INVOICE: 'TransactionInvoice',
    INVOICE_ONLY_BILLING: 'InvoiceOnlyBilling',
    CREDIT_CARD_BILLING: 'CreditCardBilling',
    BANK_BILLING: 'BankBilling'
} as const;
export type InvoiceBillingTypeEnum = typeof InvoiceBillingTypeEnum[keyof typeof InvoiceBillingTypeEnum];

/**
 * 
 * @export
 * @interface InvoiceDetails
 */
export interface InvoiceDetails {
    /**
     * 
     * @type {InvoiceTypeEnum}
     * @memberof InvoiceDetails
     */
    invoiceType?: InvoiceTypeEnum;
    /**
     * 
     * @type {string}
     * @memberof InvoiceDetails
     */
    invoiceSubject?: string | null;
    /**
     * 
     * @type {Array<string>}
     * @memberof InvoiceDetails
     */
    sendCCTo?: Array<string> | null;
    /**
     * 
     * @type {boolean}
     * @memberof InvoiceDetails
     */
    donation?: boolean;
    /**
     * 
     * @type {string}
     * @memberof InvoiceDetails
     */
    invoiceLanguage?: string | null;
}
/**
 * 
 * @export
 * @interface InvoiceRequest
 */
export interface InvoiceRequest {
    /**
     * 
     * @type {InvoiceDetails}
     * @memberof InvoiceRequest
     */
    invoiceDetails?: InvoiceDetails;
    /**
     * EasyCard terminal reference
     * @type {string}
     * @memberof InvoiceRequest
     */
    terminalID: string;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof InvoiceRequest
     */
    currency?: CurrencyEnum;
    /**
     * 
     * @type {DealDetails}
     * @memberof InvoiceRequest
     */
    dealDetails?: DealDetails;
    /**
     * Invoice amount (should be omitted in case of installment deal)
     * @type {number}
     * @memberof InvoiceRequest
     */
    invoiceAmount?: number;
    /**
     * 
     * @type {number}
     * @memberof InvoiceRequest
     */
    vatRate?: number | null;
    /**
     * 
     * @type {number}
     * @memberof InvoiceRequest
     */
    vatTotal?: number | null;
    /**
     * 
     * @type {number}
     * @memberof InvoiceRequest
     */
    netTotal?: number | null;
    /**
     * 
     * @type {InstallmentDetails}
     * @memberof InvoiceRequest
     */
    installmentDetails?: InstallmentDetails;
    /**
     * 
     * @type {CreditCardDetails}
     * @memberof InvoiceRequest
     */
    creditCardDetails?: CreditCardDetails;
    /**
     * Array of payment details, e.g. CreditCardDetails, ChequeDetails etc.
     * @type {Array<PaymentDetails>}
     * @memberof InvoiceRequest
     */
    paymentDetails?: Array<PaymentDetails> | null;
    /**
     * 
     * @type {TransactionTypeEnum}
     * @memberof InvoiceRequest
     */
    transactionType?: TransactionTypeEnum;
    /**
     * 
     * @type {boolean}
     * @memberof InvoiceRequest
     */
    createPaymentLink?: boolean;
    /**
     * 
     * @type {string}
     * @memberof InvoiceRequest
     */
    billingDealID?: string | null;
}
/**
 * 
 * @export
 * @interface InvoiceResponse
 */
export interface InvoiceResponse {
    /**
     * Primary reference
     * @type {string}
     * @memberof InvoiceResponse
     */
    invoiceID?: string;
    /**
     * Invoice reference in invoicing system
     * @type {string}
     * @memberof InvoiceResponse
     */
    invoiceNumber?: string | null;
    /**
     * Date-time when deal created initially in UTC
     * @type {string}
     * @memberof InvoiceResponse
     */
    invoiceTimestamp?: string | null;
    /**
     * Legal invoice day
     * @type {string}
     * @memberof InvoiceResponse
     */
    invoiceDate?: string | null;
    /**
     * 
     * @type {InvoiceDetails}
     * @memberof InvoiceResponse
     */
    invoiceDetails?: InvoiceDetails;
    /**
     * 
     * @type {InvoiceStatusEnum}
     * @memberof InvoiceResponse
     */
    status?: InvoiceStatusEnum;
    /**
     * EasyCard terminal reference
     * @type {string}
     * @memberof InvoiceResponse
     */
    terminalID: string;
    /**
     * EasyCard terminal name
     * @type {string}
     * @memberof InvoiceResponse
     */
    terminalName?: string | null;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof InvoiceResponse
     */
    currency?: CurrencyEnum;
    /**
     * 
     * @type {DealDetails}
     * @memberof InvoiceResponse
     */
    dealDetails?: DealDetails;
    /**
     * Invoice amount (should be omitted in case of installment deal)
     * @type {number}
     * @memberof InvoiceResponse
     */
    invoiceAmount?: number | null;
    /**
     * 
     * @type {number}
     * @memberof InvoiceResponse
     */
    amount?: number;
    /**
     * 
     * @type {number}
     * @memberof InvoiceResponse
     */
    vatRate?: number;
    /**
     * 
     * @type {number}
     * @memberof InvoiceResponse
     */
    vatTotal?: number;
    /**
     * 
     * @type {number}
     * @memberof InvoiceResponse
     */
    netTotal?: number;
    /**
     * Number Of payments (cannot be more than 999)
     * @type {number}
     * @memberof InvoiceResponse
     */
    numberOfPayments?: number;
    /**
     * Initial installment payment
     * @type {number}
     * @memberof InvoiceResponse
     */
    initialPaymentAmount?: number;
    /**
     * TotalAmount = InitialPaymentAmount + (NumberOfInstallments - 1) * InstallmentPaymentAmount
     * @type {number}
     * @memberof InvoiceResponse
     */
    totalAmount?: number;
    /**
     * Amount of one instalment payment
     * @type {number}
     * @memberof InvoiceResponse
     */
    installmentPaymentAmount?: number;
    /**
     * 
     * @type {string}
     * @memberof InvoiceResponse
     */
    paymentTransactionID?: string | null;
    /**
     * 
     * @type {CreditCardDetails}
     * @memberof InvoiceResponse
     */
    creditCardDetails?: CreditCardDetails;
    /**
     * 
     * @type {Array<any>}
     * @memberof InvoiceResponse
     */
    paymentDetails?: Array<any> | null;
    /**
     * 
     * @type {TransactionTypeEnum}
     * @memberof InvoiceResponse
     */
    transactionType?: TransactionTypeEnum;
    /**
     * 
     * @type {boolean}
     * @memberof InvoiceResponse
     */
    canCancel?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof InvoiceResponse
     */
    canEdit?: boolean;
    /**
     * 
     * @type {string}
     * @memberof InvoiceResponse
     */
    paymentUrl?: string | null;
}

/**
 * 
 * 
 * initial
 * 
 * sending
 * 
 * sent
 * 
 * canceled
 * 
 * cancellationFailed
 * 
 * sendingFailed
 * @export
 */
export const InvoiceStatusEnum = {
    INITIAL: 'initial',
    SENDING: 'sending',
    SENT: 'sent',
    CANCELED: 'canceled',
    CANCELLATION_FAILED: 'cancellationFailed',
    SENDING_FAILED: 'sendingFailed'
} as const;
export type InvoiceStatusEnum = typeof InvoiceStatusEnum[keyof typeof InvoiceStatusEnum];

/**
 * 
 * @export
 * @interface InvoiceSummary
 */
export interface InvoiceSummary {
    /**
     * Primary reference
     * @type {string}
     * @memberof InvoiceSummary
     */
    invoiceID?: string;
    /**
     * 
     * @type {string}
     * @memberof InvoiceSummary
     */
    invoiceNumber?: string | null;
    /**
     * Date-time when deal created initially in UTC
     * @type {string}
     * @memberof InvoiceSummary
     */
    invoiceTimestamp?: string | null;
    /**
     * Legal invoice day
     * @type {string}
     * @memberof InvoiceSummary
     */
    invoiceDate?: string | null;
    /**
     * Terminal
     * @type {string}
     * @memberof InvoiceSummary
     */
    terminalID?: string | null;
    /**
     * 
     * @type {InvoiceTypeEnum}
     * @memberof InvoiceSummary
     */
    invoiceType?: InvoiceTypeEnum;
    /**
     * 
     * @type {InvoiceStatusEnum}
     * @memberof InvoiceSummary
     */
    status?: InvoiceStatusEnum;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof InvoiceSummary
     */
    currency?: CurrencyEnum;
    /**
     * 
     * @type {string}
     * @memberof InvoiceSummary
     */
    cardOwnerName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof InvoiceSummary
     */
    cardOwnerNationalID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof InvoiceSummary
     */
    consumerPhone?: string | null;
    /**
     * 
     * @type {string}
     * @memberof InvoiceSummary
     */
    consumerEmail?: string | null;
    /**
     * 
     * @type {string}
     * @memberof InvoiceSummary
     */
    consumerID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof InvoiceSummary
     */
    paymentTransactionID?: string | null;
    /**
     * 
     * @type {DocumentOriginEnum}
     * @memberof InvoiceSummary
     */
    documentOrigin?: DocumentOriginEnum;
    /**
     * 
     * @type {Array<PaymentDetails>}
     * @memberof InvoiceSummary
     */
    paymentDetails?: Array<PaymentDetails> | null;
    /**
     * 
     * @type {number}
     * @memberof InvoiceSummary
     */
    invoiceAmount?: number | null;
    /**
     * 
     * @type {Array<TotalsByInvoiceType>}
     * @memberof InvoiceSummary
     */
    totalsByInvoiceType?: Array<TotalsByInvoiceType> | null;
    /**
     * 
     * @type {Array<TotalsByDocumentOrigin>}
     * @memberof InvoiceSummary
     */
    totalsByDocumentOrigin?: Array<TotalsByDocumentOrigin> | null;
    /**
     * 
     * @type {Array<TotalsByInvoiceBillingType>}
     * @memberof InvoiceSummary
     */
    totalsByInvoiceBillingType?: Array<TotalsByInvoiceBillingType> | null;
}

/**
 * 
 * 
 * invoice
 * 
 * invoiceWithPaymentInfo
 * 
 * creditNote
 * 
 * paymentInfo
 * 
 * refundInvoice
 * 
 * receiptForDonation
 * @export
 */
export const InvoiceTypeEnum = {
    INVOICE: 'invoice',
    INVOICE_WITH_PAYMENT_INFO: 'invoiceWithPaymentInfo',
    CREDIT_NOTE: 'creditNote',
    PAYMENT_INFO: 'paymentInfo',
    REFUND_INVOICE: 'refundInvoice',
    RECEIPT_FOR_DONATION: 'receiptForDonation'
} as const;
export type InvoiceTypeEnum = typeof InvoiceTypeEnum[keyof typeof InvoiceTypeEnum];


/**
 * 
 * 
 * UNKNOWN
 * 
 * ISRACARD
 * 
 * VISA
 * 
 * DINERS_CLUB
 * 
 * AMEX
 * 
 * JCB
 * 
 * LEUMI_CARD
 * 
 * OTHER
 * 
 * MASTERCARD
 * 
 * PAYPAL
 * 
 * BIT
 * @export
 */
export const IssuerEnum = {
    UNKNOWN: 'UNKNOWN',
    ISRACARD: 'ISRACARD',
    VISA: 'VISA',
    DINERS_CLUB: 'DINERS_CLUB',
    AMEX: 'AMEX',
    JCB: 'JCB',
    LEUMI_CARD: 'LEUMI_CARD',
    OTHER: 'OTHER',
    MASTERCARD: 'MASTERCARD',
    PAYPAL: 'PAYPAL',
    BIT: 'BIT'
} as const;
export type IssuerEnum = typeof IssuerEnum[keyof typeof IssuerEnum];

/**
 * 
 * @export
 * @interface Item
 */
export interface Item {
    /**
     * 
     * @type {string}
     * @memberof Item
     */
    itemID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof Item
     */
    externalReference?: string | null;
    /**
     * 
     * @type {string}
     * @memberof Item
     */
    itemName: string;
    /**
     * 
     * @type {string}
     * @memberof Item
     */
    sku?: string | null;
    /**
     * 
     * @type {number}
     * @memberof Item
     */
    price?: number | null;
    /**
     * 
     * @type {number}
     * @memberof Item
     */
    netPrice?: number | null;
    /**
     * 
     * @type {number}
     * @memberof Item
     */
    quantity?: number | null;
    /**
     * Row amount
     * @type {number}
     * @memberof Item
     */
    amount?: number | null;
    /**
     * VAT Rate
     * @type {number}
     * @memberof Item
     */
    vatRate?: number | null;
    /**
     * VAT amount
     * @type {number}
     * @memberof Item
     */
    vat?: number | null;
    /**
     * Net amount (before VAT)
     * @type {number}
     * @memberof Item
     */
    netAmount?: number | null;
    /**
     * Discount
     * @type {number}
     * @memberof Item
     */
    discount?: number | null;
    /**
     * Discount
     * @type {number}
     * @memberof Item
     */
    netDiscount?: number | null;
    /**
     * 
     * @type {any}
     * @memberof Item
     */
    extension?: any | null;
    /**
     * External ID inside https://woocommerce.com system
     * @type {string}
     * @memberof Item
     */
    woocommerceID?: string | null;
    /**
     * External ID inside https://www.ecwid.com system
     * @type {string}
     * @memberof Item
     */
    ecwidID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof Item
     */
    morningID?: string | null;
    /**
     * 
     * @type {number}
     * @memberof Item
     */
    iCountID?: number | null;
    /**
     * 
     * @type {boolean}
     * @memberof Item
     */
    isExternalCommissionItem?: boolean | null;
}

/**
 * Type of Deal. optional values are; J2 for Check,J4 for Charge, J5 for Block card
 * 
 * J4 (Regular deal)
 * 
 * J2 (Check)
 * 
 * J5 (Block card)
 * @export
 */
export const JDealTypeEnum = {
    J4: 'J4',
    J2: 'J2',
    J5: 'J5'
} as const;
export type JDealTypeEnum = typeof JDealTypeEnum[keyof typeof JDealTypeEnum];

/**
 * 
 * @export
 * @interface ModelError
 */
export interface ModelError {
    /**
     * 
     * @type {string}
     * @memberof ModelError
     */
    code?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ModelError
     */
    description?: string | null;
}
/**
 * 
 * @export
 * @interface OperationResponse
 */
export interface OperationResponse {
    /**
     * 
     * @type {string}
     * @memberof OperationResponse
     */
    message?: string | null;
    /**
     * 
     * @type {StatusEnum}
     * @memberof OperationResponse
     */
    status?: StatusEnum;
    /**
     * 
     * @type {number}
     * @memberof OperationResponse
     */
    entityID?: number | null;
    /**
     * 
     * @type {string}
     * @memberof OperationResponse
     */
    entityUID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof OperationResponse
     */
    entityReference?: string | null;
    /**
     * 
     * @type {string}
     * @memberof OperationResponse
     */
    correlationId?: string | null;
    /**
     * 
     * @type {string}
     * @memberof OperationResponse
     */
    entityType?: string | null;
    /**
     * 
     * @type {Array<Error>}
     * @memberof OperationResponse
     */
    errors?: Array<Error> | null;
    /**
     * 
     * @type {string}
     * @memberof OperationResponse
     */
    concurrencyToken?: string | null;
    /**
     * 
     * @type {OperationResponse}
     * @memberof OperationResponse
     */
    innerResponse?: OperationResponse;
    /**
     * 
     * @type {any}
     * @memberof OperationResponse
     */
    additionalData?: any | null;
}

/**
 * 
 * 
 * pending
 * 
 * completed
 * 
 * failed
 * 
 * canceled
 * 
 * overdue
 * 
 * viewed
 * 
 * permanent
 * @export
 */
export const PayReqQuickStatusFilterTypeEnum = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELED: 'canceled',
    OVERDUE: 'overdue',
    VIEWED: 'viewed',
    PERMANENT: 'permanent'
} as const;
export type PayReqQuickStatusFilterTypeEnum = typeof PayReqQuickStatusFilterTypeEnum[keyof typeof PayReqQuickStatusFilterTypeEnum];

/**
 * 
 * @export
 * @interface PaymentDetails
 */
export interface PaymentDetails {
    /**
     * 
     * @type {PaymentTypeEnum}
     * @memberof PaymentDetails
     */
    paymentType?: PaymentTypeEnum;
    /**
     * 
     * @type {number}
     * @memberof PaymentDetails
     */
    amount?: number;
}
/**
 * Create a link to Checkout Page
 * @export
 * @interface PaymentRequestCreate
 */
export interface PaymentRequestCreate {
    /**
     * EasyCard Terminal
     * @type {string}
     * @memberof PaymentRequestCreate
     */
    terminalID?: string | null;
    /**
     * 
     * @type {DealDetails}
     * @memberof PaymentRequestCreate
     */
    dealDetails?: DealDetails;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof PaymentRequestCreate
     */
    currency?: CurrencyEnum;
    /**
     * Deal amount including VAT. This amount will be displayed on Checkout Page. Consumer can override this amount in case if UserAmount flag specified.
     * @type {number}
     * @memberof PaymentRequestCreate
     */
    paymentRequestAmount?: number | null;
    /**
     * Due date of payment link
     * @type {string}
     * @memberof PaymentRequestCreate
     */
    dueDate?: string | null;
    /**
     * 
     * @type {TransactionTypeEnum}
     * @memberof PaymentRequestCreate
     */
    transactionType?: TransactionTypeEnum;
    /**
     * 
     * @type {InstallmentDetails}
     * @memberof PaymentRequestCreate
     */
    installmentDetails?: InstallmentDetails;
    /**
     * 
     * @type {InvoiceDetails}
     * @memberof PaymentRequestCreate
     */
    invoiceDetails?: InvoiceDetails;
    /**
     * 
     * @type {PinPadDetails}
     * @memberof PaymentRequestCreate
     */
    pinPadDetails?: PinPadDetails;
    /**
     * Create document - Invoice, Receipt etc. If omitted, default terminal settings will be used
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    issueInvoice?: boolean | null;
    /**
     * Enables PinPad button on checkout page
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    allowPinPad?: boolean | null;
    /**
     * Deal tax rate. Can be omitted if only PaymentRequestAmount specified - in this case VAT rate from terminal settings will be used
     * @type {number}
     * @memberof PaymentRequestCreate
     */
    vatRate?: number | null;
    /**
     * Total deal tax amount. VATTotal = NetTotal * VATRate. Can be omitted if only PaymentRequestAmount specified
     * @type {number}
     * @memberof PaymentRequestCreate
     */
    vatTotal?: number | null;
    /**
     * 
     * @type {number}
     * @memberof PaymentRequestCreate
     */
    netDiscountTotal?: number | null;
    /**
     * 
     * @type {number}
     * @memberof PaymentRequestCreate
     */
    discountTotal?: number | null;
    /**
     * Deal amount before tax. PaymentRequestAmount = NetTotal + VATTotal. Can be omitted if only PaymentRequestAmount specified
     * @type {number}
     * @memberof PaymentRequestCreate
     */
    netTotal?: number | null;
    /**
     * You can override default email subject When sending payment link via email
     * @type {string}
     * @memberof PaymentRequestCreate
     */
    requestSubject?: string | null;
    /**
     * You can override "from" address subject When sending payment link via email
     * @type {string}
     * @memberof PaymentRequestCreate
     */
    fromAddress?: string | null;
    /**
     * Generate link to Checkout Page to create refund
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    isRefund?: boolean;
    /**
     * Url to merchant's web site. Base url should be configured in terminal settings. You can add any details to query string.
     * @type {string}
     * @memberof PaymentRequestCreate
     */
    redirectUrl?: string | null;
    /**
     * Consumer can override PaymentRequestAmount
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    userAmount?: boolean;
    /**
     * Consumer must insert PaymentRequestAmount
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    forceUserAmount?: boolean;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestCreate
     */
    cardOwnerNationalID?: string | null;
    /**
     * Any advanced payload which will be stored in EasyCard and then can be obtained using "GetTransaction"
     * @type {any}
     * @memberof PaymentRequestCreate
     */
    extension?: any | null;
    /**
     * Default language to display checkout page
     * @type {string}
     * @memberof PaymentRequestCreate
     */
    language?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestCreate
     */
    origin?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    allowRegular?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    allowInstallments?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    allowCredit?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    allowImmediate?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    hidePhone?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    phoneRequired?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    hideEmail?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    emailRequired?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    hideConsumerName?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    consumerNameRequired?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    hideNationalID?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    nationalIDRequired?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    addressRequired?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    hideAddress?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    showAuthCode?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    consumerDataReadonly?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    consumerNationalIDReadonly?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    consumerPhoneReadonly?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    consumerNameReadonly?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    consumerEmailReadonly?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    consumerAddressReadonly?: boolean | null;
    /**
     * 
     * @type {JDealTypeEnum}
     * @memberof PaymentRequestCreate
     */
    jDealType?: JDealTypeEnum;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    saveCreditCardByDefault?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    disableCancelPayment?: boolean | null;
    /**
     * A unique identifier for the manual created invoice. Used when Payment request is created for an invoice that was created manually.
     * @type {string}
     * @memberof PaymentRequestCreate
     */
    initialInvoiceID?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    permanent?: boolean;
    /**
     * 
     * @type {BillingDetails}
     * @memberof PaymentRequestCreate
     */
    billingDetails?: BillingDetails;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    createBilling?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    allowBlender?: boolean | null;
    /**
     * 
     * @type {any}
     * @memberof PaymentRequestCreate
     */
    additionalFields?: any | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestCreate
     */
    hasAlternativeItems?: boolean;
    /**
     * 
     * @type {Array<CouponsConfiguration>}
     * @memberof PaymentRequestCreate
     */
    couponsConfiguration?: Array<CouponsConfiguration> | null;
    /**
     * 
     * @type {ActionIfRequestDuplicatedEnum}
     * @memberof PaymentRequestCreate
     */
    actionIfRequestDuplicated?: ActionIfRequestDuplicatedEnum;
    /**
     * 
     * @type {ExternalCommissionEnum}
     * @memberof PaymentRequestCreate
     */
    hasExternalCommission?: ExternalCommissionEnum;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestCreate
     */
    billingDealID?: string | null;
}
/**
 * 
 * @export
 * @interface PaymentRequestHistorySummary
 */
export interface PaymentRequestHistorySummary {
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestHistorySummary
     */
    paymentRequestHistoryID?: string;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestHistorySummary
     */
    operationDate?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestHistorySummary
     */
    operationDoneBy?: string | null;
    /**
     * 
     * @type {PaymentRequestOperationCodesEnum}
     * @memberof PaymentRequestHistorySummary
     */
    operationCode?: PaymentRequestOperationCodesEnum;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestHistorySummary
     */
    operationMessage?: string | null;
}

/**
 * 
 * 
 * PaymentRequestCreated
 * 
 * PaymentRequestUpdated
 * 
 * PaymentRequestSent
 * 
 * PaymentRequestCanceled
 * 
 * PaymentRequestViewed
 * 
 * PaymentRequestRejected
 * 
 * PaymentRequestPaymentFailed
 * 
 * PaymentRequestPayed
 * 
 * PaymentRequestResent
 * @export
 */
export const PaymentRequestOperationCodesEnum = {
    PAYMENT_REQUEST_CREATED: 'PaymentRequestCreated',
    PAYMENT_REQUEST_UPDATED: 'PaymentRequestUpdated',
    PAYMENT_REQUEST_SENT: 'PaymentRequestSent',
    PAYMENT_REQUEST_CANCELED: 'PaymentRequestCanceled',
    PAYMENT_REQUEST_VIEWED: 'PaymentRequestViewed',
    PAYMENT_REQUEST_REJECTED: 'PaymentRequestRejected',
    PAYMENT_REQUEST_PAYMENT_FAILED: 'PaymentRequestPaymentFailed',
    PAYMENT_REQUEST_PAYED: 'PaymentRequestPayed',
    PAYMENT_REQUEST_RESENT: 'PaymentRequestResent'
} as const;
export type PaymentRequestOperationCodesEnum = typeof PaymentRequestOperationCodesEnum[keyof typeof PaymentRequestOperationCodesEnum];

/**
 * 
 * @export
 * @interface PaymentRequestResponse
 */
export interface PaymentRequestResponse {
    /**
     * Terminal
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    terminalID?: string | null;
    /**
     * EasyCard terminal name
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    terminalName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    consumerID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    paymentTransactionID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    paymentRequestUrl?: string | null;
    /**
     * 
     * @type {Array<PaymentRequestHistorySummary>}
     * @memberof PaymentRequestResponse
     */
    history?: Array<PaymentRequestHistorySummary> | null;
    /**
     * 
     * @type {PaymentRequestUserPaidDetails}
     * @memberof PaymentRequestResponse
     */
    userPaidDetails?: PaymentRequestUserPaidDetails;
    /**
     * 
     * @type {number}
     * @memberof PaymentRequestResponse
     */
    amount?: number;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    origin?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    whatsAppUrl?: string | null;
    /**
     * 
     * @type {any}
     * @memberof PaymentRequestResponse
     */
    additionalFields?: any | null;
    /**
     * 
     * @type {Array<CouponsConfiguration>}
     * @memberof PaymentRequestResponse
     */
    couponsConfiguration?: Array<CouponsConfiguration> | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    allowPinPad?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    allowBlender?: boolean | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    dealDescription?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    allowInstallments?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    allowRegular?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    allowCredit?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    allowImmediate?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    consumerDataReadonly?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    consumerAddressReadonly?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    consumerEmailReadonly?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    consumerNameReadonly?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    consumerNationalIDReadonly?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    consumerPhoneReadonly?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    hideEmail?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    hideNationalID?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    hidePhone?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    hideAddress?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    issueInvoice?: boolean;
    /**
     * 
     * @type {InvoiceDetails}
     * @memberof PaymentRequestResponse
     */
    invoiceDetails?: InvoiceDetails;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    nationalIDRequired?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    phoneRequired?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    addressRequired?: boolean | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    correlationId?: string | null;
    /**
     * Primary reference
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    paymentRequestID?: string;
    /**
     * Date-time when deal created initially in UTC
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    paymentRequestTimestamp?: string | null;
    /**
     * Due date
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    dueDate?: string | null;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof PaymentRequestResponse
     */
    currency?: CurrencyEnum;
    /**
     * 
     * @type {PaymentRequestStatusEnum}
     * @memberof PaymentRequestResponse
     */
    status?: PaymentRequestStatusEnum;
    /**
     * 
     * @type {PayReqQuickStatusFilterTypeEnum}
     * @memberof PaymentRequestResponse
     */
    quickStatus?: PayReqQuickStatusFilterTypeEnum;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    cardOwnerName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    cardOwnerNationalID?: string | null;
    /**
     * 
     * @type {DealDetails}
     * @memberof PaymentRequestResponse
     */
    dealDetails?: DealDetails;
    /**
     * 
     * @type {number}
     * @memberof PaymentRequestResponse
     */
    vatRate?: number;
    /**
     * 
     * @type {number}
     * @memberof PaymentRequestResponse
     */
    vatTotal?: number;
    /**
     * 
     * @type {number}
     * @memberof PaymentRequestResponse
     */
    netTotal?: number;
    /**
     * Number Of payments (cannot be more than 999)
     * @type {number}
     * @memberof PaymentRequestResponse
     */
    numberOfPayments?: number;
    /**
     * Initial installment payment
     * @type {number}
     * @memberof PaymentRequestResponse
     */
    initialPaymentAmount?: number;
    /**
     * TotalAmount = InitialPaymentAmount + (NumberOfInstallments - 1) * InstallmentPaymentAmount
     * @type {number}
     * @memberof PaymentRequestResponse
     */
    totalAmount?: number;
    /**
     * Amount of one instalment payment
     * @type {number}
     * @memberof PaymentRequestResponse
     */
    installmentPaymentAmount?: number;
    /**
     * This amount
     * @type {number}
     * @memberof PaymentRequestResponse
     */
    paymentRequestAmount?: number;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    isRefund?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    userAmount?: boolean;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    redirectUrl?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    readonly onlyAddCard?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    showAuthCode?: boolean | null;
    /**
     * 
     * @type {TransactionTypeEnum}
     * @memberof PaymentRequestResponse
     */
    transactionType?: TransactionTypeEnum;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    initialInvoiceID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    comments?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    termsAndConditions?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    permanent?: boolean;
    /**
     * 
     * @type {BillingDetails}
     * @memberof PaymentRequestResponse
     */
    billingDetails?: BillingDetails;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    createBilling?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    showInvoiceSubject?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    hasAlternativeItems?: boolean;
    /**
     * 
     * @type {Array<Item>}
     * @memberof PaymentRequestResponse
     */
    alternativeItems?: Array<Item> | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestResponse
     */
    selectedItemID?: string | null;
    /**
     * 
     * @type {Array<CouponsConfiguration>}
     * @memberof PaymentRequestResponse
     */
    couponApplied?: Array<CouponsConfiguration> | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestResponse
     */
    hasCoupons?: boolean;
}

/**
 * 
 * 
 * initial
 * 
 * sending
 * 
 * sent
 * 
 * viewed
 * 
 * payed
 * 
 * permanent
 * 
 * billingCreated
 * 
 * resent
 * 
 * paymentFailed
 * 
 * rejected
 * 
 * canceled
 * 
 * sendingFailed
 * @export
 */
export const PaymentRequestStatusEnum = {
    INITIAL: 'initial',
    SENDING: 'sending',
    SENT: 'sent',
    VIEWED: 'viewed',
    PAYED: 'payed',
    PERMANENT: 'permanent',
    BILLING_CREATED: 'billingCreated',
    RESENT: 'resent',
    PAYMENT_FAILED: 'paymentFailed',
    REJECTED: 'rejected',
    CANCELED: 'canceled',
    SENDING_FAILED: 'sendingFailed'
} as const;
export type PaymentRequestStatusEnum = typeof PaymentRequestStatusEnum[keyof typeof PaymentRequestStatusEnum];

/**
 * 
 * @export
 * @interface PaymentRequestSummary
 */
export interface PaymentRequestSummary {
    /**
     * Primary reference
     * @type {string}
     * @memberof PaymentRequestSummary
     */
    paymentRequestID?: string;
    /**
     * Date-time when deal created initially in UTC
     * @type {string}
     * @memberof PaymentRequestSummary
     */
    paymentRequestTimestamp?: string | null;
    /**
     * Due date
     * @type {string}
     * @memberof PaymentRequestSummary
     */
    dueDate?: string | null;
    /**
     * Terminal
     * @type {string}
     * @memberof PaymentRequestSummary
     */
    terminalID?: string | null;
    /**
     * 
     * @type {PaymentRequestStatusEnum}
     * @memberof PaymentRequestSummary
     */
    status?: PaymentRequestStatusEnum;
    /**
     * 
     * @type {PayReqQuickStatusFilterTypeEnum}
     * @memberof PaymentRequestSummary
     */
    quickStatus?: PayReqQuickStatusFilterTypeEnum;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof PaymentRequestSummary
     */
    currency?: CurrencyEnum;
    /**
     * 
     * @type {number}
     * @memberof PaymentRequestSummary
     */
    paymentRequestAmount?: number | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestSummary
     */
    cardOwnerName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestSummary
     */
    consumerEmail?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestSummary
     */
    consumerID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestSummary
     */
    paymentTransactionID?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof PaymentRequestSummary
     */
    isRefund?: boolean;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestSummary
     */
    dealDescription?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestSummary
     */
    consumerName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestSummary
     */
    consumerExternalReference?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PaymentRequestSummary
     */
    consumerPhone?: string | null;
}

/**
 * 
 * 
 * intent
 * 
 * request
 * @export
 */
export const PaymentRequestTypeEnum = {
    INTENT: 'intent',
    REQUEST: 'request'
} as const;
export type PaymentRequestTypeEnum = typeof PaymentRequestTypeEnum[keyof typeof PaymentRequestTypeEnum];

/**
 * Information regarding what user actually paid in payment request (only relevant for UserAmount allowed PRs)
 * @export
 * @interface PaymentRequestUserPaidDetails
 */
export interface PaymentRequestUserPaidDetails {
    /**
     * 
     * @type {number}
     * @memberof PaymentRequestUserPaidDetails
     */
    vatRate?: number;
    /**
     * 
     * @type {number}
     * @memberof PaymentRequestUserPaidDetails
     */
    vatTotal?: number;
    /**
     * 
     * @type {number}
     * @memberof PaymentRequestUserPaidDetails
     */
    netTotal?: number;
    /**
     * 
     * @type {number}
     * @memberof PaymentRequestUserPaidDetails
     */
    transactionAmount?: number;
}

/**
 * 
 * 
 * card
 * 
 * cheque
 * 
 * cash
 * 
 * bank
 * 
 * blender
 * @export
 */
export const PaymentTypeEnum = {
    CARD: 'card',
    CHEQUE: 'cheque',
    CASH: 'cash',
    BANK: 'bank',
    BLENDER: 'blender'
} as const;
export type PaymentTypeEnum = typeof PaymentTypeEnum[keyof typeof PaymentTypeEnum];

/**
 * 
 * @export
 * @interface PinPadDetails
 */
export interface PinPadDetails {
    /**
     * 
     * @type {string}
     * @memberof PinPadDetails
     */
    terminalID?: string | null;
}

/**
 * 
 * 
 * All
 * 
 * Yes
 * 
 * No
 * @export
 */
export const PropertyPresenceEnum = {
    ALL: 'All',
    YES: 'Yes',
    NO: 'No'
} as const;
export type PropertyPresenceEnum = typeof PropertyPresenceEnum[keyof typeof PropertyPresenceEnum];


/**
 * 
 * 
 * today
 * 
 * yesterday
 * 
 * thisWeek
 * 
 * lastWeek
 * 
 * last30Days
 * 
 * thisMonth
 * 
 * lastMonth
 * 
 * last3Months
 * 
 * thisYear
 * 
 * lastYear
 * @export
 */
export const QuickDateFilterTypeEnum = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    THIS_WEEK: 'thisWeek',
    LAST_WEEK: 'lastWeek',
    LAST30_DAYS: 'last30Days',
    THIS_MONTH: 'thisMonth',
    LAST_MONTH: 'lastMonth',
    LAST3_MONTHS: 'last3Months',
    THIS_YEAR: 'thisYear',
    LAST_YEAR: 'lastYear'
} as const;
export type QuickDateFilterTypeEnum = typeof QuickDateFilterTypeEnum[keyof typeof QuickDateFilterTypeEnum];


/**
 * 
 * 
 * Pending
 * 
 * Completed
 * 
 * Failed
 * 
 * Canceled
 * 
 * AwaitingForTransmission
 * 
 * Chargeback
 * 
 * TransmissionFailed
 * 
 * InProgress
 * @export
 */
export const QuickStatusFilterTypeEnum = {
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    CANCELED: 'Canceled',
    AWAITING_FOR_TRANSMISSION: 'AwaitingForTransmission',
    CHARGEBACK: 'Chargeback',
    TRANSMISSION_FAILED: 'TransmissionFailed',
    IN_PROGRESS: 'InProgress'
} as const;
export type QuickStatusFilterTypeEnum = typeof QuickStatusFilterTypeEnum[keyof typeof QuickStatusFilterTypeEnum];

/**
 * Refund request
 * @export
 * @interface RefundRequest
 */
export interface RefundRequest {
    /**
     * EasyCard terminal reference
     * @type {string}
     * @memberof RefundRequest
     */
    terminalID: string;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof RefundRequest
     */
    currency?: CurrencyEnum;
    /**
     * 
     * @type {CardPresenceEnum}
     * @memberof RefundRequest
     */
    cardPresence?: CardPresenceEnum;
    /**
     * 
     * @type {CreditCardSecureDetails}
     * @memberof RefundRequest
     */
    creditCardSecureDetails?: CreditCardSecureDetails;
    /**
     * Stored credit card details token (should be omitted in case if full credit card details used)
     * @type {string}
     * @memberof RefundRequest
     */
    creditCardToken?: string | null;
    /**
     * Refund amount
     * @type {number}
     * @memberof RefundRequest
     */
    transactionAmount: number;
    /**
     * 
     * @type {number}
     * @memberof RefundRequest
     */
    vatRate?: number | null;
    /**
     * 
     * @type {number}
     * @memberof RefundRequest
     */
    vatTotal?: number | null;
    /**
     * 
     * @type {number}
     * @memberof RefundRequest
     */
    netTotal?: number | null;
    /**
     * Create document
     * @type {boolean}
     * @memberof RefundRequest
     */
    issueInvoice?: boolean | null;
    /**
     * Create Pinpad Transaction
     * @type {boolean}
     * @memberof RefundRequest
     */
    pinPad?: boolean | null;
    /**
     * Pinpad device in case of terminal with multiple devices
     * @type {string}
     * @memberof RefundRequest
     */
    pinPadDeviceID?: string | null;
    /**
     * 
     * @type {InvoiceDetails}
     * @memberof RefundRequest
     */
    invoiceDetails?: InvoiceDetails;
    /**
     * 
     * @type {InstallmentDetails}
     * @memberof RefundRequest
     */
    installmentDetails?: InstallmentDetails;
    /**
     * 
     * @type {TransactionTypeEnum}
     * @memberof RefundRequest
     */
    transactionType?: TransactionTypeEnum;
    /**
     * Only to be used for pin pad transactions when CredotCardSecureDetails is not available
     * @type {string}
     * @memberof RefundRequest
     */
    cardOwnerNationalID?: string | null;
    /**
     * SignalR connection id
     * @type {string}
     * @memberof RefundRequest
     */
    connectionID?: string | null;
    /**
     * ShvaAuthNum
     * @type {string}
     * @memberof RefundRequest
     */
    okNumber?: string | null;
    /**
     * 
     * @type {DealDetails}
     * @memberof RefundRequest
     */
    dealDetails?: DealDetails;
    /**
     * 
     * @type {string}
     * @memberof RefundRequest
     */
    comments?: string | null;
}

/**
 * 
 * 
 * unknown
 * 
 * creditCardIsMerchantsCard
 * 
 * nationalIdIsMerchantsId
 * 
 * singleTransactionAmountExceeded
 * 
 * dailyAmountExceeded
 * 
 * creditCardDailyUsageExceeded
 * 
 * refundNotMatchRegularAmount
 * 
 * refundExceededCollateral
 * 
 * cardOwnerNationalIdRequired
 * 
 * authCodeRequired
 * @export
 */
export const RejectionReasonEnum = {
    UNKNOWN: 'unknown',
    CREDIT_CARD_IS_MERCHANTS_CARD: 'creditCardIsMerchantsCard',
    NATIONAL_ID_IS_MERCHANTS_ID: 'nationalIdIsMerchantsId',
    SINGLE_TRANSACTION_AMOUNT_EXCEEDED: 'singleTransactionAmountExceeded',
    DAILY_AMOUNT_EXCEEDED: 'dailyAmountExceeded',
    CREDIT_CARD_DAILY_USAGE_EXCEEDED: 'creditCardDailyUsageExceeded',
    REFUND_NOT_MATCH_REGULAR_AMOUNT: 'refundNotMatchRegularAmount',
    REFUND_EXCEEDED_COLLATERAL: 'refundExceededCollateral',
    CARD_OWNER_NATIONAL_ID_REQUIRED: 'cardOwnerNationalIdRequired',
    AUTH_CODE_REQUIRED: 'authCodeRequired'
} as const;
export type RejectionReasonEnum = typeof RejectionReasonEnum[keyof typeof RejectionReasonEnum];


/**
 * 
 * 
 * oneTime
 * 
 * monthly
 * 
 * biMonthly
 * 
 * quarter
 * 
 * halfYear
 * 
 * year
 * @export
 */
export const RepeatPeriodTypeEnum = {
    ONE_TIME: 'oneTime',
    MONTHLY: 'monthly',
    BI_MONTHLY: 'biMonthly',
    QUARTER: 'quarter',
    HALF_YEAR: 'halfYear',
    YEAR: 'year'
} as const;
export type RepeatPeriodTypeEnum = typeof RepeatPeriodTypeEnum[keyof typeof RepeatPeriodTypeEnum];

/**
 * 
 * @export
 * @interface ResendInvoiceRequest
 */
export interface ResendInvoiceRequest {
    /**
     * EasyCard terminal reference
     * @type {string}
     * @memberof ResendInvoiceRequest
     */
    terminalID: string;
    /**
     * IDs of invoices which need to be resend
     * @type {Array<string>}
     * @memberof ResendInvoiceRequest
     */
    invoicesIDs: Array<string>;
}
/**
 * 
 * @export
 * @interface ResendSingleInvoiceRequest
 */
export interface ResendSingleInvoiceRequest {
    /**
     * Invoice ID
     * @type {string}
     * @memberof ResendSingleInvoiceRequest
     */
    invoiceID?: string;
    /**
     * Required. New invoice consumer email.
     * @type {string}
     * @memberof ResendSingleInvoiceRequest
     */
    email: string;
}

/**
 * 
 * 
 * UI
 * 
 * API
 * 
 * checkout
 * 
 * billing
 * 
 * device
 * 
 * paymentRequest
 * 
 * bit
 * 
 * googlePay
 * 
 * applePay
 * 
 * legacy
 * @export
 */
export const SharedApiDocumentOriginEnum = {
    UI: 'UI',
    API: 'API',
    CHECKOUT: 'checkout',
    BILLING: 'billing',
    DEVICE: 'device',
    PAYMENT_REQUEST: 'paymentRequest',
    BIT: 'bit',
    GOOGLE_PAY: 'googlePay',
    APPLE_PAY: 'applePay',
    LEGACY: 'legacy'
} as const;
export type SharedApiDocumentOriginEnum = typeof SharedApiDocumentOriginEnum[keyof typeof SharedApiDocumentOriginEnum];


/**
 * 
 * 
 * ManualInvoice
 * 
 * TransactionInvoice
 * 
 * InvoiceOnlyBilling
 * 
 * CreditCardBilling
 * 
 * BankBilling
 * @export
 */
export const SharedApiInvoiceBillingTypeEnum = {
    MANUAL_INVOICE: 'ManualInvoice',
    TRANSACTION_INVOICE: 'TransactionInvoice',
    INVOICE_ONLY_BILLING: 'InvoiceOnlyBilling',
    CREDIT_CARD_BILLING: 'CreditCardBilling',
    BANK_BILLING: 'BankBilling'
} as const;
export type SharedApiInvoiceBillingTypeEnum = typeof SharedApiInvoiceBillingTypeEnum[keyof typeof SharedApiInvoiceBillingTypeEnum];


/**
 * 
 * 
 * initial
 * 
 * sending
 * 
 * sent
 * 
 * canceled
 * 
 * cancellationFailed
 * 
 * sendingFailed
 * @export
 */
export const SharedApiInvoiceStatusEnum = {
    INITIAL: 'initial',
    SENDING: 'sending',
    SENT: 'sent',
    CANCELED: 'canceled',
    CANCELLATION_FAILED: 'cancellationFailed',
    SENDING_FAILED: 'sendingFailed'
} as const;
export type SharedApiInvoiceStatusEnum = typeof SharedApiInvoiceStatusEnum[keyof typeof SharedApiInvoiceStatusEnum];


/**
 * 
 * 
 * invoice
 * 
 * invoiceWithPaymentInfo
 * 
 * creditNote
 * 
 * paymentInfo
 * 
 * refundInvoice
 * 
 * receiptForDonation
 * @export
 */
export const SharedApiInvoiceTypeEnum = {
    INVOICE: 'invoice',
    INVOICE_WITH_PAYMENT_INFO: 'invoiceWithPaymentInfo',
    CREDIT_NOTE: 'creditNote',
    PAYMENT_INFO: 'paymentInfo',
    REFUND_INVOICE: 'refundInvoice',
    RECEIPT_FOR_DONATION: 'receiptForDonation'
} as const;
export type SharedApiInvoiceTypeEnum = typeof SharedApiInvoiceTypeEnum[keyof typeof SharedApiInvoiceTypeEnum];


/**
 * 
 * 
 * OnlyActive
 * 
 * OnlyDeleted
 * 
 * All
 * @export
 */
export const ShowDeletedEnum = {
    ONLY_ACTIVE: 'OnlyActive',
    ONLY_DELETED: 'OnlyDeleted',
    ALL: 'All'
} as const;
export type ShowDeletedEnum = typeof ShowDeletedEnum[keyof typeof ShowDeletedEnum];


/**
 * 
 * 
 * UNKNOWN
 * 
 * ISRACARD
 * 
 * VISA
 * 
 * DINERS_CLUB
 * 
 * AMEX
 * 
 * JCB
 * 
 * LEUMI_CARD
 * 
 * OTHER
 * 
 * MASTERCARD
 * @export
 */
export const SolekEnum = {
    UNKNOWN: 'UNKNOWN',
    ISRACARD: 'ISRACARD',
    VISA: 'VISA',
    DINERS_CLUB: 'DINERS_CLUB',
    AMEX: 'AMEX',
    JCB: 'JCB',
    LEUMI_CARD: 'LEUMI_CARD',
    OTHER: 'OTHER',
    MASTERCARD: 'MASTERCARD'
} as const;
export type SolekEnum = typeof SolekEnum[keyof typeof SolekEnum];


/**
 * 
 * 
 * regularDeal
 * 
 * initialDeal
 * 
 * refund
 * @export
 */
export const SpecialTransactionTypeEnum = {
    REGULAR_DEAL: 'regularDeal',
    INITIAL_DEAL: 'initialDeal',
    REFUND: 'refund'
} as const;
export type SpecialTransactionTypeEnum = typeof SpecialTransactionTypeEnum[keyof typeof SpecialTransactionTypeEnum];


/**
 * 
 * 
 * today
 * 
 * specifiedDate
 * @export
 */
export const StartAtTypeEnum = {
    TODAY: 'today',
    SPECIFIED_DATE: 'specifiedDate'
} as const;
export type StartAtTypeEnum = typeof StartAtTypeEnum[keyof typeof StartAtTypeEnum];


/**
 * 
 * 
 * success
 * 
 * warning
 * 
 * error
 * @export
 */
export const StatusEnum = {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
} as const;
export type StatusEnum = typeof StatusEnum[keyof typeof StatusEnum];

/**
 * 
 * @export
 * @interface SummariesAmountResponseBillingDealSummary
 */
export interface SummariesAmountResponseBillingDealSummary {
    /**
     * 
     * @type {string}
     * @memberof SummariesAmountResponseBillingDealSummary
     */
    dateFrom?: string | null;
    /**
     * 
     * @type {string}
     * @memberof SummariesAmountResponseBillingDealSummary
     */
    dateTo?: string | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponseBillingDealSummary
     */
    totalAmountILS?: number | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponseBillingDealSummary
     */
    totalAmountUSD?: number | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponseBillingDealSummary
     */
    totalAmountEUR?: number | null;
    /**
     * 
     * @type {Array<TotalsByInvoiceType>}
     * @memberof SummariesAmountResponseBillingDealSummary
     */
    totalsByInvoiceType?: Array<TotalsByInvoiceType> | null;
    /**
     * 
     * @type {Array<TotalsByDocumentOrigin>}
     * @memberof SummariesAmountResponseBillingDealSummary
     */
    totalsByDocumentOrigin?: Array<TotalsByDocumentOrigin> | null;
    /**
     * 
     * @type {Array<TotalsByInvoiceBillingType>}
     * @memberof SummariesAmountResponseBillingDealSummary
     */
    totalsByInvoiceBillingType?: Array<TotalsByInvoiceBillingType> | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponseBillingDealSummary
     */
    numberOfRecords?: number;
    /**
     * 
     * @type {Array<BillingDealSummary>}
     * @memberof SummariesAmountResponseBillingDealSummary
     */
    data?: Array<BillingDealSummary> | null;
}
/**
 * 
 * @export
 * @interface SummariesAmountResponseInvoiceSummary
 */
export interface SummariesAmountResponseInvoiceSummary {
    /**
     * 
     * @type {string}
     * @memberof SummariesAmountResponseInvoiceSummary
     */
    dateFrom?: string | null;
    /**
     * 
     * @type {string}
     * @memberof SummariesAmountResponseInvoiceSummary
     */
    dateTo?: string | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponseInvoiceSummary
     */
    totalAmountILS?: number | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponseInvoiceSummary
     */
    totalAmountUSD?: number | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponseInvoiceSummary
     */
    totalAmountEUR?: number | null;
    /**
     * 
     * @type {Array<TotalsByInvoiceType>}
     * @memberof SummariesAmountResponseInvoiceSummary
     */
    totalsByInvoiceType?: Array<TotalsByInvoiceType> | null;
    /**
     * 
     * @type {Array<TotalsByDocumentOrigin>}
     * @memberof SummariesAmountResponseInvoiceSummary
     */
    totalsByDocumentOrigin?: Array<TotalsByDocumentOrigin> | null;
    /**
     * 
     * @type {Array<TotalsByInvoiceBillingType>}
     * @memberof SummariesAmountResponseInvoiceSummary
     */
    totalsByInvoiceBillingType?: Array<TotalsByInvoiceBillingType> | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponseInvoiceSummary
     */
    numberOfRecords?: number;
    /**
     * 
     * @type {Array<InvoiceSummary>}
     * @memberof SummariesAmountResponseInvoiceSummary
     */
    data?: Array<InvoiceSummary> | null;
}
/**
 * 
 * @export
 * @interface SummariesAmountResponsePaymentRequestSummary
 */
export interface SummariesAmountResponsePaymentRequestSummary {
    /**
     * 
     * @type {string}
     * @memberof SummariesAmountResponsePaymentRequestSummary
     */
    dateFrom?: string | null;
    /**
     * 
     * @type {string}
     * @memberof SummariesAmountResponsePaymentRequestSummary
     */
    dateTo?: string | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponsePaymentRequestSummary
     */
    totalAmountILS?: number | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponsePaymentRequestSummary
     */
    totalAmountUSD?: number | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponsePaymentRequestSummary
     */
    totalAmountEUR?: number | null;
    /**
     * 
     * @type {Array<TotalsByInvoiceType>}
     * @memberof SummariesAmountResponsePaymentRequestSummary
     */
    totalsByInvoiceType?: Array<TotalsByInvoiceType> | null;
    /**
     * 
     * @type {Array<TotalsByDocumentOrigin>}
     * @memberof SummariesAmountResponsePaymentRequestSummary
     */
    totalsByDocumentOrigin?: Array<TotalsByDocumentOrigin> | null;
    /**
     * 
     * @type {Array<TotalsByInvoiceBillingType>}
     * @memberof SummariesAmountResponsePaymentRequestSummary
     */
    totalsByInvoiceBillingType?: Array<TotalsByInvoiceBillingType> | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponsePaymentRequestSummary
     */
    numberOfRecords?: number;
    /**
     * 
     * @type {Array<PaymentRequestSummary>}
     * @memberof SummariesAmountResponsePaymentRequestSummary
     */
    data?: Array<PaymentRequestSummary> | null;
}
/**
 * 
 * @export
 * @interface SummariesAmountResponseTransactionSummary
 */
export interface SummariesAmountResponseTransactionSummary {
    /**
     * 
     * @type {string}
     * @memberof SummariesAmountResponseTransactionSummary
     */
    dateFrom?: string | null;
    /**
     * 
     * @type {string}
     * @memberof SummariesAmountResponseTransactionSummary
     */
    dateTo?: string | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponseTransactionSummary
     */
    totalAmountILS?: number | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponseTransactionSummary
     */
    totalAmountUSD?: number | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponseTransactionSummary
     */
    totalAmountEUR?: number | null;
    /**
     * 
     * @type {Array<TotalsByInvoiceType>}
     * @memberof SummariesAmountResponseTransactionSummary
     */
    totalsByInvoiceType?: Array<TotalsByInvoiceType> | null;
    /**
     * 
     * @type {Array<TotalsByDocumentOrigin>}
     * @memberof SummariesAmountResponseTransactionSummary
     */
    totalsByDocumentOrigin?: Array<TotalsByDocumentOrigin> | null;
    /**
     * 
     * @type {Array<TotalsByInvoiceBillingType>}
     * @memberof SummariesAmountResponseTransactionSummary
     */
    totalsByInvoiceBillingType?: Array<TotalsByInvoiceBillingType> | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesAmountResponseTransactionSummary
     */
    numberOfRecords?: number;
    /**
     * 
     * @type {Array<TransactionSummary>}
     * @memberof SummariesAmountResponseTransactionSummary
     */
    data?: Array<TransactionSummary> | null;
}
/**
 * 
 * @export
 * @interface SummariesResponseCreditCardTokenSummary
 */
export interface SummariesResponseCreditCardTokenSummary {
    /**
     * 
     * @type {number}
     * @memberof SummariesResponseCreditCardTokenSummary
     */
    numberOfRecords?: number;
    /**
     * 
     * @type {Array<CreditCardTokenSummary>}
     * @memberof SummariesResponseCreditCardTokenSummary
     */
    data?: Array<CreditCardTokenSummary> | null;
}
/**
 * 
 * @export
 * @interface SummariesResponseExecutedWebhookSummary
 */
export interface SummariesResponseExecutedWebhookSummary {
    /**
     * 
     * @type {number}
     * @memberof SummariesResponseExecutedWebhookSummary
     */
    numberOfRecords?: number;
    /**
     * 
     * @type {Array<ExecutedWebhookSummary>}
     * @memberof SummariesResponseExecutedWebhookSummary
     */
    data?: Array<ExecutedWebhookSummary> | null;
}
/**
 * 
 * @export
 * @interface SummariesTotalsResponse
 */
export interface SummariesTotalsResponse {
    /**
     * 
     * @type {number}
     * @memberof SummariesTotalsResponse
     */
    ils?: number | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesTotalsResponse
     */
    ilsWithoutVat?: number | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesTotalsResponse
     */
    usd?: number | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesTotalsResponse
     */
    usdWithoutVat?: number | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesTotalsResponse
     */
    eur?: number | null;
    /**
     * 
     * @type {number}
     * @memberof SummariesTotalsResponse
     */
    eurWithoutVat?: number | null;
    /**
     * 
     * @type {Array<TotalsByInvoiceType>}
     * @memberof SummariesTotalsResponse
     */
    totalsByInvoiceType?: Array<TotalsByInvoiceType> | null;
    /**
     * 
     * @type {Array<TotalsByDocumentOrigin>}
     * @memberof SummariesTotalsResponse
     */
    totalsByDocumentOrigin?: Array<TotalsByDocumentOrigin> | null;
    /**
     * 
     * @type {Array<TotalsByInvoiceBillingType>}
     * @memberof SummariesTotalsResponse
     */
    totalsByInvoiceBillingType?: Array<TotalsByInvoiceBillingType> | null;
    /**
     * 
     * @type {TotalsByInvoiceStatus}
     * @memberof SummariesTotalsResponse
     */
    totalsByInvoiceStatus?: TotalsByInvoiceStatus;
}
/**
 * 
 * @export
 * @interface TotalsByDocumentOrigin
 */
export interface TotalsByDocumentOrigin {
    /**
     * 
     * @type {SharedApiDocumentOriginEnum}
     * @memberof TotalsByDocumentOrigin
     */
    source?: SharedApiDocumentOriginEnum;
    /**
     * 
     * @type {number}
     * @memberof TotalsByDocumentOrigin
     */
    refundedCount?: number | null;
    /**
     * 
     * @type {number}
     * @memberof TotalsByDocumentOrigin
     */
    invoiceCount?: number | null;
    /**
     * 
     * @type {number}
     * @memberof TotalsByDocumentOrigin
     */
    ils?: number | null;
    /**
     * 
     * @type {number}
     * @memberof TotalsByDocumentOrigin
     */
    ilsWithoutVat?: number | null;
}
/**
 * 
 * @export
 * @interface TotalsByInvoiceBillingType
 */
export interface TotalsByInvoiceBillingType {
    /**
     * 
     * @type {SharedApiInvoiceBillingTypeEnum}
     * @memberof TotalsByInvoiceBillingType
     */
    source?: SharedApiInvoiceBillingTypeEnum;
    /**
     * 
     * @type {number}
     * @memberof TotalsByInvoiceBillingType
     */
    refundedCount?: number | null;
    /**
     * 
     * @type {number}
     * @memberof TotalsByInvoiceBillingType
     */
    invoiceCount?: number | null;
    /**
     * 
     * @type {number}
     * @memberof TotalsByInvoiceBillingType
     */
    ils?: number | null;
    /**
     * 
     * @type {number}
     * @memberof TotalsByInvoiceBillingType
     */
    ilsWithoutVat?: number | null;
}
/**
 * 
 * @export
 * @interface TotalsByInvoiceStatus
 */
export interface TotalsByInvoiceStatus {
    /**
     * 
     * @type {SharedApiInvoiceStatusEnum}
     * @memberof TotalsByInvoiceStatus
     */
    source?: SharedApiInvoiceStatusEnum;
    /**
     * 
     * @type {number}
     * @memberof TotalsByInvoiceStatus
     */
    invoiceCount?: number | null;
    /**
     * 
     * @type {number}
     * @memberof TotalsByInvoiceStatus
     */
    ils?: number | null;
    /**
     * 
     * @type {number}
     * @memberof TotalsByInvoiceStatus
     */
    ilsWithoutVat?: number | null;
}
/**
 * 
 * @export
 * @interface TotalsByInvoiceType
 */
export interface TotalsByInvoiceType {
    /**
     * 
     * @type {SharedApiInvoiceTypeEnum}
     * @memberof TotalsByInvoiceType
     */
    source?: SharedApiInvoiceTypeEnum;
    /**
     * 
     * @type {number}
     * @memberof TotalsByInvoiceType
     */
    invoiceCount?: number | null;
    /**
     * 
     * @type {number}
     * @memberof TotalsByInvoiceType
     */
    ils?: number | null;
    /**
     * 
     * @type {number}
     * @memberof TotalsByInvoiceType
     */
    ilsWithoutVat?: number | null;
}

/**
 * 
 * 
 * initial
 * 
 * failedToCancelByAggregator
 * 
 * canceledByAggregator
 * @export
 */
export const TransactionFinalizationStatusEnum = {
    INITIAL: 'initial',
    FAILED_TO_CANCEL_BY_AGGREGATOR: 'failedToCancelByAggregator',
    CANCELED_BY_AGGREGATOR: 'canceledByAggregator'
} as const;
export type TransactionFinalizationStatusEnum = typeof TransactionFinalizationStatusEnum[keyof typeof TransactionFinalizationStatusEnum];

/**
 * Payment transaction details
 * @export
 * @interface TransactionResponse
 */
export interface TransactionResponse {
    /**
     * Primary transaction reference (UUId)
     * @type {string}
     * @memberof TransactionResponse
     */
    paymentTransactionID?: string;
    /**
     * Legal transaction day
     * @type {string}
     * @memberof TransactionResponse
     */
    transactionDate?: string | null;
    /**
     * Date-time when transaction created initially in UTC
     * @type {string}
     * @memberof TransactionResponse
     */
    transactionTimestamp?: string | null;
    /**
     * Reference to initial billing deal
     * @type {string}
     * @memberof TransactionResponse
     */
    initialTransactionID?: string | null;
    /**
     * Current deal number (billing)
     * @type {number}
     * @memberof TransactionResponse
     */
    currentDeal?: number | null;
    /**
     * EasyCard terminal UUId
     * @type {string}
     * @memberof TransactionResponse
     */
    terminalID?: string | null;
    /**
     * EasyCard terminal name
     * @type {string}
     * @memberof TransactionResponse
     */
    terminalName?: string | null;
    /**
     * Merchant
     * @type {string}
     * @memberof TransactionResponse
     */
    merchantID?: string | null;
    /**
     * 
     * @type {TransactionStatusEnum}
     * @memberof TransactionResponse
     */
    status?: TransactionStatusEnum;
    /**
     * 
     * @type {PaymentTypeEnum}
     * @memberof TransactionResponse
     */
    paymentTypeEnum?: PaymentTypeEnum;
    /**
     * 
     * @type {QuickStatusFilterTypeEnum}
     * @memberof TransactionResponse
     */
    quickStatus?: QuickStatusFilterTypeEnum;
    /**
     * 
     * @type {TransactionFinalizationStatusEnum}
     * @memberof TransactionResponse
     */
    finalizationStatus?: TransactionFinalizationStatusEnum;
    /**
     * 
     * @type {TransactionTypeEnum}
     * @memberof TransactionResponse
     */
    transactionType?: TransactionTypeEnum;
    /**
     * 
     * @type {SpecialTransactionTypeEnum}
     * @memberof TransactionResponse
     */
    specialTransactionType?: SpecialTransactionTypeEnum;
    /**
     * 
     * @type {JDealTypeEnum}
     * @memberof TransactionResponse
     */
    jDealType?: JDealTypeEnum;
    /**
     * Transaction J5 expired date (in gengeral after 1 day)
     * @type {string}
     * @memberof TransactionResponse
     */
    transactionJ5ExpiredDate?: string | null;
    /**
     * 
     * @type {RejectionReasonEnum}
     * @memberof TransactionResponse
     */
    rejectionReason?: RejectionReasonEnum;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof TransactionResponse
     */
    currency?: CurrencyEnum;
    /**
     * 
     * @type {CardPresenceEnum}
     * @memberof TransactionResponse
     */
    cardPresence?: CardPresenceEnum;
    /**
     * Number Of Installments
     * @type {number}
     * @memberof TransactionResponse
     */
    numberOfPayments?: number;
    /**
     * This transaction amount
     * @type {number}
     * @memberof TransactionResponse
     */
    transactionAmount?: number;
    /**
     * 
     * @type {number}
     * @memberof TransactionResponse
     */
    amount?: number;
    /**
     * Initial installment payment
     * @type {number}
     * @memberof TransactionResponse
     */
    initialPaymentAmount?: number;
    /**
     * TotalAmount = InitialPaymentAmount + (NumberOfInstallments - 1) * InstallmentPaymentAmount
     * @type {number}
     * @memberof TransactionResponse
     */
    totalAmount?: number;
    /**
     * Amount of one instalment payment
     * @type {number}
     * @memberof TransactionResponse
     */
    installmentPaymentAmount?: number;
    /**
     * 
     * @type {CreditCardDetails}
     * @memberof TransactionResponse
     */
    creditCardDetails?: CreditCardDetails;
    /**
     * 
     * @type {BankTransferDetails}
     * @memberof TransactionResponse
     */
    bankTransferDetails?: BankTransferDetails;
    /**
     * Stored credit card details token reference
     * @type {string}
     * @memberof TransactionResponse
     */
    creditCardToken?: string | null;
    /**
     * 
     * @type {DealDetails}
     * @memberof TransactionResponse
     */
    dealDetails?: DealDetails;
    /**
     * Shva details
     * @type {any}
     * @memberof TransactionResponse
     */
    shvaTransactionDetails?: any | null;
    /**
     * PayDay details
     * @type {any}
     * @memberof TransactionResponse
     */
    clearingHouseTransactionDetails?: any | null;
    /**
     * 
     * @type {any}
     * @memberof TransactionResponse
     */
    upayTransactionDetails?: any | null;
    /**
     * Date-time when transaction status updated
     * @type {string}
     * @memberof TransactionResponse
     */
    updatedDate?: string | null;
    /**
     * Concurrency key
     * @type {string}
     * @memberof TransactionResponse
     */
    updateTimestamp?: string | null;
    /**
     * Reference to billing schedule which produced this transaction
     * @type {string}
     * @memberof TransactionResponse
     */
    billingDealID?: string | null;
    /**
     * Rejection Reason Message (in case of rejected transaction)
     * @type {string}
     * @memberof TransactionResponse
     */
    rejectionMessage?: string | null;
    /**
     * Deal tax rate
     * @type {number}
     * @memberof TransactionResponse
     */
    vatRate?: number;
    /**
     * Total deal tax amount. VATTotal = NetTotal * VATRate
     * @type {number}
     * @memberof TransactionResponse
     */
    vatTotal?: number;
    /**
     * Deal amount before tax. PaymentRequestAmount = NetTotal + VATTotal
     * @type {number}
     * @memberof TransactionResponse
     */
    netTotal?: number;
    /**
     * We can know it from checkout page activity
     * @type {string}
     * @memberof TransactionResponse
     */
    consumerIP?: string | null;
    /**
     * Merchant's IP
     * @type {string}
     * @memberof TransactionResponse
     */
    merchantIP?: string | null;
    /**
     * Request ID
     * @type {string}
     * @memberof TransactionResponse
     */
    correlationId?: string | null;
    /**
     * Generated invoice ID
     * @type {string}
     * @memberof TransactionResponse
     */
    invoiceID?: string | null;
    /**
     * Create document for transaction
     * @type {boolean}
     * @memberof TransactionResponse
     */
    issueInvoice?: boolean;
    /**
     * 
     * @type {DocumentOriginEnum}
     * @memberof TransactionResponse
     */
    documentOrigin?: DocumentOriginEnum;
    /**
     * Reference to initial payment link creation request
     * @type {string}
     * @memberof TransactionResponse
     */
    paymentRequestID?: string | null;
    /**
     * 
     * @type {number}
     * @memberof TransactionResponse
     */
    processorResultCode?: number | null;
    /**
     * Any advanced payload which will be stored in EasyCard and then can be obtained using "GetTransaction"
     * @type {any}
     * @memberof TransactionResponse
     */
    extension?: any | null;
    /**
     * 
     * @type {any}
     * @memberof TransactionResponse
     */
    bitTransactionDetails?: any | null;
    /**
     * 
     * @type {number}
     * @memberof TransactionResponse
     */
    totalRefund?: number | null;
    /**
     * Origin site url or label
     * @type {string}
     * @memberof TransactionResponse
     */
    origin?: string | null;
    /**
     * Transaction can be transmitted manually
     * @type {boolean}
     * @memberof TransactionResponse
     */
    allowTransmission?: boolean;
    /**
     * Transaction transmission cannot be canceled manually
     * @type {boolean}
     * @memberof TransactionResponse
     */
    allowTransmissionCancellation?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof TransactionResponse
     */
    allowRefund?: boolean;
    /**
     * Invoice can be created for this transaction
     * @type {boolean}
     * @memberof TransactionResponse
     */
    allowInvoiceCreation?: boolean;
    /**
     * Merchant name
     * @type {string}
     * @memberof TransactionResponse
     */
    merchantName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionResponse
     */
    paymentIntentID?: string | null;
    /**
     * 
     * @type {SolekEnum}
     * @memberof TransactionResponse
     */
    solek?: SolekEnum;
    /**
     * 
     * @type {string}
     * @memberof TransactionResponse
     */
    comments?: string | null;
    /**
     * Reference to initial transaction
     * @type {string}
     * @memberof TransactionResponse
     */
    initialJ5TransactionID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionResponse
     */
    pinPadDeviceDescription?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionResponse
     */
    pinPadDeviceID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionResponse
     */
    payDate?: string | null;
    /**
     * 
     * @type {any}
     * @memberof TransactionResponse
     */
    blenderTransactionDetails?: any | null;
    /**
     * 
     * @type {any}
     * @memberof TransactionResponse
     */
    additionalFields?: any | null;
    /**
     * 
     * @type {Array<CouponsConfiguration>}
     * @memberof TransactionResponse
     */
    couponApplied?: Array<CouponsConfiguration> | null;
}

/**
 * 
 * 
 * initial
 * 
 * confirmedByAggregator
 * 
 * confirmedByPinpadPreProcessor
 * 
 * confirmedByProcessor
 * 
 * awaitingForTransmission
 * 
 * transmissionInProgress
 * 
 * transmissionCancelingInProgress
 * 
 * completed
 * 
 * awaitingToSelectJ5
 * 
 * chargeback
 * 
 * pending
 * 
 * chargebackFailed
 * 
 * transmissionToProcessorFailed
 * 
 * failedToCommitByAggregator
 * 
 * failedToConfirmByProcesor
 * 
 * failedToConfirmByAggregator
 * 
 * cancelledByMerchant
 * 
 * rejectedByProcessor
 * 
 * rejectedByAggregator
 * 
 * rejectedBy3Dsecure
 * @export
 */
export const TransactionStatusEnum = {
    INITIAL: 'initial',
    CONFIRMED_BY_AGGREGATOR: 'confirmedByAggregator',
    CONFIRMED_BY_PINPAD_PRE_PROCESSOR: 'confirmedByPinpadPreProcessor',
    CONFIRMED_BY_PROCESSOR: 'confirmedByProcessor',
    AWAITING_FOR_TRANSMISSION: 'awaitingForTransmission',
    TRANSMISSION_IN_PROGRESS: 'transmissionInProgress',
    TRANSMISSION_CANCELING_IN_PROGRESS: 'transmissionCancelingInProgress',
    COMPLETED: 'completed',
    AWAITING_TO_SELECT_J5: 'awaitingToSelectJ5',
    CHARGEBACK: 'chargeback',
    PENDING: 'pending',
    CHARGEBACK_FAILED: 'chargebackFailed',
    TRANSMISSION_TO_PROCESSOR_FAILED: 'transmissionToProcessorFailed',
    FAILED_TO_COMMIT_BY_AGGREGATOR: 'failedToCommitByAggregator',
    FAILED_TO_CONFIRM_BY_PROCESOR: 'failedToConfirmByProcesor',
    FAILED_TO_CONFIRM_BY_AGGREGATOR: 'failedToConfirmByAggregator',
    CANCELLED_BY_MERCHANT: 'cancelledByMerchant',
    REJECTED_BY_PROCESSOR: 'rejectedByProcessor',
    REJECTED_BY_AGGREGATOR: 'rejectedByAggregator',
    REJECTED_BY3_DSECURE: 'rejectedBy3Dsecure'
} as const;
export type TransactionStatusEnum = typeof TransactionStatusEnum[keyof typeof TransactionStatusEnum];

/**
 * 
 * @export
 * @interface TransactionSummary
 */
export interface TransactionSummary {
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    paymentTransactionID?: string;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    terminalName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    terminalID?: string;
    /**
     * 
     * @type {DocumentOriginEnum}
     * @memberof TransactionSummary
     */
    documentOrigin?: DocumentOriginEnum;
    /**
     * 
     * @type {SolekEnum}
     * @memberof TransactionSummary
     */
    solek?: SolekEnum;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    cardVendor?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    cardNumber?: string | null;
    /**
     * Rejection Reason Message (in case of rejected transaction)
     * @type {string}
     * @memberof TransactionSummary
     */
    rejectionMessage?: string | null;
    /**
     * 
     * @type {number}
     * @memberof TransactionSummary
     */
    processorResultCode?: number | null;
    /**
     * 
     * @type {TransactionTypeEnum}
     * @memberof TransactionSummary
     */
    transactionType?: TransactionTypeEnum;
    /**
     * 
     * @type {CurrencyEnum}
     * @memberof TransactionSummary
     */
    currency?: CurrencyEnum;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    transactionTimestamp?: string | null;
    /**
     * 
     * @type {TransactionStatusEnum}
     * @memberof TransactionSummary
     */
    status?: TransactionStatusEnum;
    /**
     * 
     * @type {PaymentTypeEnum}
     * @memberof TransactionSummary
     */
    paymentTypeEnum?: PaymentTypeEnum;
    /**
     * 
     * @type {QuickStatusFilterTypeEnum}
     * @memberof TransactionSummary
     */
    quickStatus?: QuickStatusFilterTypeEnum;
    /**
     * 
     * @type {SpecialTransactionTypeEnum}
     * @memberof TransactionSummary
     */
    specialTransactionType?: SpecialTransactionTypeEnum;
    /**
     * 
     * @type {JDealTypeEnum}
     * @memberof TransactionSummary
     */
    jDealType?: JDealTypeEnum;
    /**
     * 
     * @type {RejectionReasonEnum}
     * @memberof TransactionSummary
     */
    rejectionReason?: RejectionReasonEnum;
    /**
     * 
     * @type {CardPresenceEnum}
     * @memberof TransactionSummary
     */
    cardPresence?: CardPresenceEnum;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    cardOwnerName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    cardOwnerNationalID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    consumerExternalReference?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    shvaDealID?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    shvaDealNumber?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    invoiceID?: string | null;
    /**
     * 
     * @type {number}
     * @memberof TransactionSummary
     */
    numberOfPayments?: number;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    comments?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    countryCode?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    city?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    zip?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    street?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    house?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    apartment?: string | null;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    phone?: string | null;
    /**
     * 
     * @type {any}
     * @memberof TransactionSummary
     */
    additionalFields?: any | null;
    /**
     * 
     * @type {number}
     * @memberof TransactionSummary
     */
    transactionAmount?: number;
    /**
     * 
     * @type {number}
     * @memberof TransactionSummary
     */
    initialPaymentAmount?: number;
    /**
     * 
     * @type {number}
     * @memberof TransactionSummary
     */
    installmentPaymentAmount?: number;
    /**
     * 
     * @type {string}
     * @memberof TransactionSummary
     */
    dealDescription?: string | null;
}

/**
 * Generic transaction type
 * 
 * regularDeal (Simple deal type)
 * 
 * installments (Deal to pay by parts)
 * 
 * credit (Credit deal)
 * 
 * immediate (Credit deal)
 * @export
 */
export const TransactionTypeEnum = {
    REGULAR_DEAL: 'regularDeal',
    INSTALLMENTS: 'installments',
    CREDIT: 'credit',
    IMMEDIATE: 'immediate'
} as const;
export type TransactionTypeEnum = typeof TransactionTypeEnum[keyof typeof TransactionTypeEnum];

