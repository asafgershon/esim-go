// Error type definitions for better error handling

export enum ErrorType {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Authentication errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  BUNDLE_NOT_FOUND = 'BUNDLE_NOT_FOUND',
  INVALID_COUNTRY = 'INVALID_COUNTRY',
  
  // Payment errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  
  // Session errors
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALID = 'SESSION_INVALID',
  SESSION_CREATION_FAILED = 'SESSION_CREATION_FAILED',
  
  // eSIM errors
  ESIM_PROVISIONING_FAILED = 'ESIM_PROVISIONING_FAILED',
  ESIM_ACTIVATION_FAILED = 'ESIM_ACTIVATION_FAILED',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  code?: string;
  retryable?: boolean;
  actionRequired?: 'login' | 'refresh' | 'contact_support' | 'retry' | 'go_home';
}

// Error messages in Hebrew for better UX
export const ERROR_MESSAGES: Record<ErrorType, { title: string; message: string; action?: string }> = {
  [ErrorType.NETWORK_ERROR]: {
    title: 'בעיית רשת',
    message: 'לא הצלחנו להתחבר לשרת. אנא בדוק את החיבור לאינטרנט.',
    action: 'נסה שוב'
  },
  [ErrorType.API_ERROR]: {
    title: 'שגיאת שרת',
    message: 'השרת לא זמין כעת. אנא נסה שוב בעוד כמה דקות.',
    action: 'נסה שוב'
  },
  [ErrorType.TIMEOUT_ERROR]: {
    title: 'זמן ההמתנה נגמר',
    message: 'הבקשה לקחה יותר מדי זמן. אנא נסה שוב.',
    action: 'נסה שוב'
  },
  [ErrorType.AUTH_REQUIRED]: {
    title: 'נדרש כניסה למערכת',
    message: 'אנא התחבר כדי להמשיך.',
    action: 'התחבר'
  },
  [ErrorType.AUTH_EXPIRED]: {
    title: 'תוקף ההתחברות פג',
    message: 'אנא התחבר שוב כדי להמשיך.',
    action: 'התחבר שוב'
  },
  [ErrorType.AUTH_INVALID]: {
    title: 'נתוני התחברות שגויים',
    message: 'פרטי ההתחברות לא תקינים. אנא נסה שוב.',
    action: 'התחבר שוב'
  },
  [ErrorType.VALIDATION_FAILED]: {
    title: 'שגיאת אימות',
    message: 'לא הצלחנו לאמת את ההזמנה. אנא בדוק את הפרטים.',
    action: 'בדוק פרטים'
  },
  [ErrorType.BUNDLE_NOT_FOUND]: {
    title: 'החבילה לא נמצאה',
    message: 'לא נמצאו חבילות זמינות עבור היעד הנבחר.',
    action: 'בחר יעד אחר'
  },
  [ErrorType.INVALID_COUNTRY]: {
    title: 'יעד לא תקין',
    message: 'היעד שנבחר אינו נתמך. אנא בחר יעד אחר.',
    action: 'בחר יעד אחר'
  },
  [ErrorType.PAYMENT_FAILED]: {
    title: 'התשלום נכשל',
    message: 'לא הצלחנו לעבד את התשלום. אנא נסה שוב.',
    action: 'נסה שוב'
  },
  [ErrorType.PAYMENT_DECLINED]: {
    title: 'התשלום נדחה',
    message: 'הבנק דחה את העסקה. אנא בדוק את פרטי התשלום.',
    action: 'בדוק פרטים'
  },
  [ErrorType.PAYMENT_PROCESSING]: {
    title: 'מעבד תשלום',
    message: 'התשלום מעובד כעת. אנא המתן.',
    action: 'המתן'
  },
  [ErrorType.SESSION_EXPIRED]: {
    title: 'הפעלה נפסקה',
    message: 'הפעלה נפסקה עקב חוסר פעילות. אנא התחל מחדש.',
    action: 'התחל מחדש'
  },
  [ErrorType.SESSION_INVALID]: {
    title: 'פעלה לא תקינה',
    message: 'הפעלה אינה תקינה. אנא התחל מחדש.',
    action: 'התחל מחדש'
  },
  [ErrorType.SESSION_CREATION_FAILED]: {
    title: 'לא הצלחנו ליצור הפעלה',
    message: 'שגיאה ביצירת הפעלת קנייה. אנא נסה שוב.',
    action: 'נסה שוב'
  },
  [ErrorType.ESIM_PROVISIONING_FAILED]: {
    title: 'יצירת eSIM נכשלה',
    message: 'לא הצלחנו ליצור את כרטיס ה-eSIM. אנא פנה לתמיכה.',
    action: 'פנה לתמיכה'
  },
  [ErrorType.ESIM_ACTIVATION_FAILED]: {
    title: 'הפעלת eSIM נכשלה',
    message: 'לא הצלחנו להפעיל את כרטיס ה-eSIM. אנא פנה לתמיכה.',
    action: 'פנה לתמיכה'
  },
  [ErrorType.UNKNOWN_ERROR]: {
    title: 'שגיאה לא ידועה',
    message: 'התרחשה שגיאה לא צפויה. אנא נסה שוב.',
    action: 'נסה שוב'
  },
  [ErrorType.SERVER_ERROR]: {
    title: 'שגיאת שרת',
    message: 'שגיאה בשרת. אנא נסה שוב בעוד כמה דקות.',
    action: 'נסה שוב'
  },
};

// Helper function to parse GraphQL errors into AppError
export function parseGraphQLError(error: any): AppError {
  if (!error) {
    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: ERROR_MESSAGES[ErrorType.UNKNOWN_ERROR].message,
      retryable: true,
    };
  }

  // Handle network errors
  if (error.networkError) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: ERROR_MESSAGES[ErrorType.NETWORK_ERROR].message,
      details: error.networkError.message,
      retryable: true,
      actionRequired: 'retry',
    };
  }

  // Handle GraphQL errors
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    const graphQLError = error.graphQLErrors[0];
    const extensions = graphQLError.extensions || {};
    
    // Map specific error codes to our error types
    switch (extensions.code) {
      case 'UNAUTHENTICATED':
        return {
          type: ErrorType.AUTH_REQUIRED,
          message: ERROR_MESSAGES[ErrorType.AUTH_REQUIRED].message,
          retryable: false,
          actionRequired: 'login',
        };
      case 'NO_BUNDLES_FOUND':
        return {
          type: ErrorType.BUNDLE_NOT_FOUND,
          message: ERROR_MESSAGES[ErrorType.BUNDLE_NOT_FOUND].message,
          details: extensions.countryId,
          retryable: false,
        };
      case 'VALIDATION_FAILED':
        return {
          type: ErrorType.VALIDATION_FAILED,
          message: ERROR_MESSAGES[ErrorType.VALIDATION_FAILED].message,
          details: graphQLError.message,
          retryable: true,
        };
      default:
        return {
          type: ErrorType.API_ERROR,
          message: graphQLError.message || ERROR_MESSAGES[ErrorType.API_ERROR].message,
          code: extensions.code,
          retryable: true,
        };
    }
  }

  // Handle timeout errors
  if (error.message && error.message.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT_ERROR,
      message: ERROR_MESSAGES[ErrorType.TIMEOUT_ERROR].message,
      retryable: true,
      actionRequired: 'retry',
    };
  }

  // Default fallback
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: error.message || ERROR_MESSAGES[ErrorType.UNKNOWN_ERROR].message,
    retryable: true,
  };
}

// Helper function to determine if an error is retryable
export function isRetryableError(error: AppError): boolean {
  return error.retryable !== false && [
    ErrorType.NETWORK_ERROR,
    ErrorType.TIMEOUT_ERROR,
    ErrorType.API_ERROR,
    ErrorType.UNKNOWN_ERROR,
    ErrorType.SERVER_ERROR,
  ].includes(error.type);
}

// Helper function to get user-friendly error message
export function getErrorDisplay(error: AppError) {
  const errorConfig = ERROR_MESSAGES[error.type];
  return {
    title: errorConfig.title,
    message: error.details ? `${errorConfig.message}\n\nפרטים: ${error.details}` : errorConfig.message,
    actionText: errorConfig.action,
    retryable: isRetryableError(error),
    actionRequired: error.actionRequired,
  };
}