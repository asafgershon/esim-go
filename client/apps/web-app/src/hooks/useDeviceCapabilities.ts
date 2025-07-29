import { useEffect, useState } from 'react';

export interface DeviceCapabilities {
  platform: 'ios' | 'android' | 'windows' | 'other';
  version: string | null;
  supportsUniversalLinks: boolean;
  supportsLPAScheme: boolean;
  recommendedMethod: 'universalLink' | 'lpaScheme' | 'manual';
  isIOS174Plus: boolean;
}

export const useDeviceCapabilities = (): DeviceCapabilities => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    platform: 'other',
    version: null,
    supportsUniversalLinks: false,
    supportsLPAScheme: false,
    recommendedMethod: 'manual',
    isIOS174Plus: false,
  });

  useEffect(() => {
    const detectCapabilities = () => {
      const userAgent = navigator.userAgent;
      
      // iOS detection with version
      const iosMatch = userAgent.match(/OS (\d+)_(\d+)/);
      const isIOS = !!iosMatch;
      const isIOS174Plus = iosMatch && 
        (parseInt(iosMatch[1]) > 17 || 
         (parseInt(iosMatch[1]) === 17 && parseInt(iosMatch[2]) >= 4));
      
      // Platform detection
      const isAndroid = /Android/i.test(userAgent);
      const isWindows = /Windows/i.test(userAgent);
      
      const platform = isAndroid ? 'android' : 
                      isIOS ? 'ios' : 
                      isWindows ? 'windows' : 
                      'other';
      
      const version = iosMatch ? `${iosMatch[1]}.${iosMatch[2]}` : null;
      
      setCapabilities({
        platform,
        version,
        supportsUniversalLinks: !!isIOS174Plus,
        supportsLPAScheme: isWindows || isAndroid,
        recommendedMethod: isIOS174Plus ? 'universalLink' : 
                          (isWindows || isAndroid) ? 'lpaScheme' : 
                          'manual',
        isIOS174Plus: !!isIOS174Plus,
      });
    };

    detectCapabilities();
  }, []);

  return capabilities;
};

export const getPlatformInstructions = (platform: DeviceCapabilities['platform']): string[] => {
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