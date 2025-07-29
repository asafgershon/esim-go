/**
 * Utility functions for eSIM activation link generation
 */

export interface ESIMData {
  smDpAddress: string;
  activationCode: string;
  confirmationCode: string | null;
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
 * Generate various eSIM installation link formats
 */
export const generateInstallationLinks = (esimData: ESIMData): InstallationLinks => {
  const { smDpAddress, activationCode, confirmationCode } = esimData;
  
  // Build LPA string according to SGP.22 specification
  // Format: LPA:1$[SM-DP+ Address]$[Matching ID/Activation Code]$[Confirmation Code]
  const lpaString = `LPA:1$${smDpAddress}$${activationCode}${confirmationCode ? `$${confirmationCode}` : ''}`;
  
  // iOS 17.4+ Universal Link
  const universalLink = `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpaString)}`;
  
  // Android/Windows LPA scheme (lowercase)
  const lpaScheme = lpaString.toLowerCase();
  
  return {
    universalLink,
    lpaScheme,
    manual: {
      smDpAddress,
      activationCode,
      confirmationCode: confirmationCode || null
    },
    qrCodeData: lpaString
  };
};

/**
 * Generate QR code URL from LPA string
 */
export const generateQRCodeUrl = (lpaString: string, size: number = 400): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(lpaString)}&size=${size}x${size}`;
};