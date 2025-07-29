/**
 * Pure utility functions for eSIM activation
 */

export interface ESIMData {
  smDpAddress: string;
  activationCode: string;
  confirmationCode?: string | null;
}

export interface PlatformDetection {
  platform: 'ios' | 'android' | 'windows' | 'other';
  version: string | null;
  supportsUniversalLinks: boolean;
  supportsLPAScheme: boolean;
  recommendedMethod: 'universalLink' | 'lpaScheme' | 'manual';
}

export interface InstallationLinks {
  universalLink: string;
  lpaScheme: string;
  manual: {
    smDpAddress: string;
    activationCode: string;
    confirmationCode: string | null;
  };
  qrCodeData: string;
}

/**
 * Detect platform capabilities from user agent
 * @param userAgent - Browser user agent string
 * @returns Platform detection results
 */
export const detectPlatform = (userAgent: string): PlatformDetection => {
  const iosMatch = userAgent.match(/OS (\d+)_(\d+)/);
  const isIOS174Plus = iosMatch && 
    (parseInt(iosMatch[1]) > 17 || 
     (parseInt(iosMatch[1]) === 17 && parseInt(iosMatch[2]) >= 4));
  
  const isAndroid = /Android/i.test(userAgent);
  const isWindows = /Windows/i.test(userAgent);
  const isIOS = !!iosMatch;
  
  return {
    platform: isAndroid ? 'android' : isIOS ? 'ios' : isWindows ? 'windows' : 'other',
    version: iosMatch ? `${iosMatch[1]}.${iosMatch[2]}` : null,
    supportsUniversalLinks: !!isIOS174Plus,
    supportsLPAScheme: isWindows || isAndroid,
    recommendedMethod: isIOS174Plus ? 'universalLink' : 
                      (isWindows || isAndroid) ? 'lpaScheme' : 'manual'
  };
};

/**
 * Generate all eSIM activation link formats
 * @param esimData - eSIM provisioning data
 * @returns All activation link formats
 */
export const generateInstallationLinks = (esimData: ESIMData): InstallationLinks => {
  const { smDpAddress, activationCode, confirmationCode } = esimData;
  
  // Build LPA string according to GSMA standard
  // Format: LPA:1$<SM-DP+ Address>$<Activation Code>[$<Confirmation Code>]
  const lpaString = `LPA:1$${smDpAddress}$${activationCode}${confirmationCode ? `$${confirmationCode}` : ''}`;
  
  return {
    // iOS 17.4+ Universal Link (primary method)
    universalLink: `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpaString)}`,
    
    // LPA scheme for Android/Windows  
    lpaScheme: lpaString.toLowerCase(),
    
    // Manual entry components
    manual: {
      smDpAddress,
      activationCode,
      confirmationCode: confirmationCode || null
    },
    
    // QR code data (fallback)
    qrCodeData: lpaString
  };
};

/**
 * Get platform-specific manual setup instructions
 * @param platform - Platform identifier
 * @returns Step-by-step instructions
 */
export const getManualInstructions = (platform: PlatformDetection['platform']): string[] => {
  const instructions = {
    ios: [
      'פתח הגדרות → סלולרי → הוסף תוכנית סלולרית',
      'הקש על "הזן פרטים באופן ידני"', 
      'הזן את כתובת SM-DP+ וקוד ההפעלה',
      'עקוב אחר ההוראות להשלמת ההתקנה'
    ],
    android: [
      'פתח הגדרות → רשת ואינטרנט → רשת סלולרית',
      'הקש על "הוסף תוכנית נתונים" או "הוסף eSIM"',
      'בחר "הזן קוד הפעלה באופן ידני"',
      'הזן את פרטי ההפעלה והשלם את ההתקנה'
    ],
    windows: [
      'פתח הגדרות → רשת ואינטרנט → סלולרי',
      'לחץ על "הוסף פרופיל eSIM"',
      'הזן את כתובת SM-DP+ וקוד ההפעלה',
      'עקוב אחר אשף ההתקנה'
    ],
    other: [
      'פתח את הגדרות הסלולר/נייד במכשיר',
      'חפש "הוסף eSIM" או "הוסף תוכנית סלולרית"', 
      'בחר הזנה ידנית והזן את פרטי ההפעלה'
    ]
  };
  
  return instructions[platform] || instructions.other;
};

/**
 * Generate QR code URL for eSIM activation
 * @param lpaString - LPA string for QR generation
 * @returns QR code URL
 */
export const generateQRCodeURL = (lpaString: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(lpaString)}&size=400x400`;
};