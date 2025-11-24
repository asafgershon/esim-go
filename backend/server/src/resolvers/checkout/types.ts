import type { CheckoutState } from "../../services/checkout-session.service";
// שורת הייבוא הבעייתית נמחקה

// ==================================
// --- הוספות חדשות ---
// הגדרות ספציפיות כדי להחליף את 'any'
// ==================================

/**
 * המידע על המדינה כפי שהוא נשמר ב-session
 */
export interface CountryInfo {
  iso2: string;
  name: string;
}

/**
 * הגדרה מדויקת של המידע בשלב ה-bundle
 */
export interface BundleStep {
  completed: boolean;
  validated: boolean;
  countryId: string;
  country: CountryInfo | null; // <-- השדה החדש שהוספנו
  numOfDays: number;
  price: number;
  pricePerDay: number;
  externalId: string;
  dataAmount: string;
  speed: string[];
  discounts: string[];
  provider?: any; // <-- הוחזר ל-any כדי למנוע את השגיאה
}

/**
 * מבנה כללי של כל השלבים בתהליך
 */
export interface CheckoutSteps {
  bundle?: Partial<BundleStep>; // שימוש ב-Partial כי לא כל השדות קיימים תמיד
  delivery?: {
    completed: boolean;
    email?: string;
    phone?: string;
  };
  // ניתן להוסיף כאן הגדרות לשלבים נוספים בעתיד
}

// ==================================
// --- קבצים קיימים שעודכנו ---
// ==================================

/**
 * Database session data with multiple possible field formats
 */
export interface CheckoutSessionData {
  id: string;
  state?: CheckoutState;
  userId?: string;
  user_id?: string;
  plan_id?: string;
  plan_snapshot?: string | Record<string, any>;
  pricing: any;
  paymentIntentId?: string;
  payment_intent_id?: string;
  orderId?: string;
  order_id?: string;
  expiresAt?: string;
  expires_at?: string;
  createdAt?: string;
  created_at?: string;
  steps?: CheckoutSteps; // <-- שונה מ-any
  metadata?: CheckoutMetadata;
}

/**
 * Session metadata structure
 */
export interface CheckoutMetadata {
  state?: CheckoutState;
  isValidated?: boolean;
  validationError?: string;
  validationDetails?: {
    error?: string;
    bundleDetails?: any;
    totalPrice?: number;
    currency?: string;
  };
  planSnapshot?: any;
  steps?: CheckoutSteps; // <-- שונה מ-any
  paymentIntent?: {
    url?: string;
    id?: string;
  };
  [key: string]: any;
}

/**
 * GraphQL response DTO for checkout session
 */
export interface CheckoutSessionDTO {
  id: string;
  token: string;
  expiresAt: string;
  isComplete: boolean;
  isValidated: boolean;
  timeRemaining: number;
  createdAt: string;
  planSnapshot: any;
  pricing: any;
  steps: any;
  paymentStatus: string;
  paymentUrl: string | null;
  paymentIntentId: string | null;
  orderId: string | null;
  metadata: any;

    bundle?: {
    id: string;
    price: number;
    numOfDays: number;
    currency: string;
    completed: boolean;

    country: {
      iso: string;
      name: string;
      nameHebrew?: string | null;
    } | null;

    dataAmount: string;     // למשל "Unlimited"
    discounts: number[];    // רשימת הנחות (מספרים)
    pricePerDay: number;    // 0 אם לא בשימוש
    speed: string[]; 
  };
}

/**
 * Token payload structure
 */
export interface CheckoutSessionTokenPayload {
  userId: string;
  sessionId: string;
  exp: number;
  iss: string;
}

/**
 * Checkout error codes
 */
export enum CheckoutErrorCode {
  INVALID_TOKEN = "INVALID_TOKEN",
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  UNAUTHORIZED = "UNAUTHORIZED",
}

/**
 * Service initialization state
 */
export interface CheckoutServiceState {
  isInitialized: boolean;
  initializationError?: Error;
}