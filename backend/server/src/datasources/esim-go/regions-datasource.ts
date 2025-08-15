import { regionNamesHebrew } from "./hebrew-names";

type ISOCountryCode = string;

type RegionalBundle = {
  "3D"?: string;
  "5D"?: string;
  "7D"?: string;
  "10D"?: string;
  "15D"?: string;
  "30D"?: string;
};

type Region = {
  name: string;
  nameHebrew: string;
  countryIds: ISOCountryCode[];
  bundleIds?: {
    unlimited: RegionalBundle;
    unlimitedEssential?: RegionalBundle;
    unlimitedPlus?: RegionalBundle;
  };
};

/**
 * Predefined eSIM regions based on eSIM Go rate sheet
 * Extracted from: eSIMGo Rate Sheet 2nd June 2025 Standard 2.xlsx
 *
 * Bundle ID Format: esim_{TYPE}_{DURATION}_{REGION_CODE}_V2
 * Types: UL (Unlimited Lite), ULE (Unlimited Essential), ULP (Unlimited Plus)
 * Durations: 3D, 5D, 7D, 10D, 15D, 30D
 */
export const PREDEFINED_REGIONS: Region[] = [
  {
    name: "Africa",
    nameHebrew: regionNamesHebrew.Africa || "אפריקה",
    countryIds: [
      "EG", // Egypt
      "MA", // Morocco
      "TZ", // Tanzania-United Republic of
      "UG", // Uganda
      "TN", // Tunisia
      "ZA", // South Africa
      "ZM", // Zambia
      "MG", // Madagascar
      "NG", // Nigeria
      "KE", // Kenya
      "MU", // Mauritius
      "NA", // Namibia
      "BW", // Botswana
    ],
    bundleIds: {
      unlimited: {
        "3D": "esim_UL_3D_RAF_V2",
        "5D": "esim_UL_5D_RAF_V2",
        "7D": "esim_UL_7D_RAF_V2",
        "10D": "esim_UL_10D_RAF_V2",
      },
    },
  },
  {
    name: "Americas",
    nameHebrew: regionNamesHebrew.Americas || "אמריקה",
    countryIds: [
      "AR", // Argentina
      "BR", // Brazil
      "CL", // Chile
      "CO", // Colombia
      "CR", // Costa Rica
      "EC", // Ecuador
      "SV", // El Salvador
      "PE", // Peru
      "UY", // Uruguay
      "GF", // French Guiana
      "MX", // Mexico
    ],
    bundleIds: {
      unlimited: {
        "3D": "esim_UL_3D_RLA_V2",
        "5D": "esim_UL_5D_RLA_V2",
        "7D": "esim_UL_7D_RLA_V2",
        "10D": "esim_UL_10D_RLA_V2",
        "15D": "esim_UL_15D_RLA_V2",
        "30D": "esim_UL_30D_RLA_V2",
      },
      unlimitedEssential: {
        "3D": "esim_ULE_3D_RLA_V2",
        "5D": "esim_ULE_5D_RLA_V2",
        "7D": "esim_ULE_7D_RLA_V2",
        "10D": "esim_ULE_10D_RLA_V2",
        "15D": "esim_ULE_15D_RLA_V2",
        "30D": "esim_ULE_30D_RLA_V2",
      },
      unlimitedPlus: {
        "3D": "esim_ULP_3D_RLA_V2",
        "5D": "esim_ULP_5D_RLA_V2",
        "7D": "esim_ULP_7D_RLA_V2",
        "10D": "esim_ULP_10D_RLA_V2",
        "15D": "esim_ULP_15D_RLA_V2",
        "30D": "esim_ULP_30D_RLA_V2",
      },
    },
  },
  {
    name: "Asia",
    nameHebrew: regionNamesHebrew.Asia || "אסיה",
    countryIds: [
      "AU", // Australia
      "HK", // Hong Kong
      "ID", // Indonesia
      "KR", // Korea-Republic of
      "MO", // Macao
      "MY", // Malaysia
      "PK", // Pakistan
      "SG", // Singapore
      "LK", // Sri Lanka
      "TW", // Taiwan-Province of China
      "TH", // Thailand
      "UZ", // Uzbekistan
      "VN", // VietNam
      "IN", // India
      "NP", // Nepal
    ],
    bundleIds: {
      unlimited: {
        "3D": "esim_UL_3D_RAS_V2",
        "5D": "esim_UL_5D_RAS_V2",
        "7D": "esim_UL_7D_RAS_V2",
        "10D": "esim_UL_10D_RAS_V2",
        "15D": "esim_UL_15D_RAS_V2",
        "30D": "esim_UL_30D_RAS_V2",
      },
      unlimitedEssential: {
        "3D": "esim_ULE_3D_RAS_V2",
        "5D": "esim_ULE_5D_RAS_V2",
        "7D": "esim_ULE_7D_RAS_V2",
        "10D": "esim_ULE_10D_RAS_V2",
        "15D": "esim_ULE_15D_RAS_V2",
        "30D": "esim_ULE_30D_RAS_V2",
      },
      unlimitedPlus: {
        "3D": "esim_ULP_3D_RAS_V2",
        "5D": "esim_ULP_5D_RAS_V2",
        "7D": "esim_ULP_7D_RAS_V2",
        "10D": "esim_ULP_10D_RAS_V2",
        "15D": "esim_ULP_15D_RAS_V2",
        "30D": "esim_ULP_30D_RAS_V2",
      },
    },
  },
  {
    name: "Balkans",
    nameHebrew: regionNamesHebrew.Balkans || "הבלקן",
    countryIds: [
      "AL", // Albania
      "BA", // Bosnia and Herzegovina
      "BG", // Bulgaria
      "GR", // Greece
      "HR", // Croatia
      "MK", // Macedonia
      "ME", // Montenegro
      "RO", // Romania
      "RS", // Serbia
      "SI", // Slovenia
    ],
    bundleIds: {
      unlimited: {
        "3D": "esim_UL_3D_RBK_V2",
        "5D": "esim_UL_5D_RBK_V2",
        "7D": "esim_UL_7D_RBK_V2",
        "10D": "esim_UL_10D_RBK_V2",
        "15D": "esim_UL_15D_RBK_V2",
      },
    },
  },
  {
    name: "EU+",
    nameHebrew: regionNamesHebrew["EU+"] || "אירופה מורחבת",
    countryIds: [
      "AT", // Austria
      "DK", // Denmark
      "IE", // Ireland
      "IT", // Italy
      "SE", // Sweden
      "FR", // France
      "BG", // Bulgaria
      "CY", // Cyprus
      "EE", // Estonia
      "FI", // Finland
      "GR", // Greece
      "HU", // Hungary
      "LV", // Latvia
      "LT", // Lithuania
      "NL", // Netherlands
      "NO", // Norway
      "PL", // Poland
      "RO", // Romania
      "SK", // Slovakia
      "ES", // Spain
      "GB", // United Kingdom
      "TR", // Turkey
      "DE", // Germany
      "MT", // Malta
      "CH", // Switzerland
      "BE", // Belgium
      "HR", // Croatia
      "CZ", // Czech Republic
      "LI", // Liechtenstein
      "LU", // Luxembourg
      "PT", // Portugal
      "SI", // Slovenia
      "IS", // Iceland
      "IC", // Canary Islands
      "VA", // Vatican City
      "CY", // Northern Cyprus (Note: Using CY as CYP is not standard ISO)
    ],
    // Note: EU+ seems to use country-specific bundles rather than regional ones
    // Individual country codes like AT, BE, DE, etc. are used
    bundleIds: {
      unlimited: {
        // EU+ uses individual country bundles, not a single regional bundle
        // e.g., esim_UL_3D_AT_V2, esim_UL_3D_BE_V2, etc.
      },
    },
  },
  {
    name: "Middle East & Africa",
    nameHebrew:
      regionNamesHebrew["Middle East & Africa"] || "המזרח התיכון ואפריקה",
    countryIds: [
      "EG", // Egypt
      "IL", // Israel
      "JO", // Jordan
      "KW", // Kuwait
      "MA", // Morocco
      "OM", // Oman
      "TR", // Turkey
      "AE", // United Arab Emirates
    ],
    // Note: This region uses individual country bundles
    bundleIds: {
      unlimited: {
        // Uses individual country codes like IL, JO, KW, etc.
      },
    },
  },
  {
    name: "North America",
    nameHebrew: regionNamesHebrew["North America"] || "צפון אמריקה",
    countryIds: [
      "CA", // Canada
      "MX", // Mexico
      "US", // United States of America
      "PR", // Puerto Rico
    ],
    // Note: North America uses individual country bundles (CA, US, MX)
    bundleIds: {
      unlimited: {
        // Uses individual country codes
      },
    },
  },
  {
    name: "Oceania",
    nameHebrew: regionNamesHebrew.Oceania || "אוקיאניה",
    countryIds: [
      "AU", // Australia
      "NZ", // New Zealand
    ],
    // Note: Oceania uses individual country bundles (AU, NZ)
    bundleIds: {
      unlimited: {
        // Uses individual country codes
      },
    },
  },
  {
    name: "Caribbean",
    nameHebrew: regionNamesHebrew.Caribbean || "הקריביים",
    countryIds: [
      "AI", // Anguilla
      "AG", // Antigua and Barbuda
      "BS", // Bahamas
      "BB", // Barbados
      "KY", // Cayman Islands
      "GD", // Grenada
      "JM", // Jamaica
      "MS", // Montserrat
      "AN", // Netherlands Antilles
      "KN", // Saint Kitts and Nevis
      "LC", // Saint Lucia
      "VC", // Saint Vincent and the Grenadines
      "TT", // Trinidad and Tobago
      "TC", // Turks and Caicos Islands
      "VG", // Virgin Islands- British
      "AW", // Aruba
      "BQ", // Bonaire, saint Eustatius and Saba
      "CW", // Curacao
      "DM", // Dominica
      "GP", // Guadeloupe
      "GY", // Guyana
      "HT", // Haiti
      "SV", // El Salvador
      "GF", // French Guiana
      "BM", // Bermuda
    ],
    bundleIds: {
      unlimited: {
        "3D": "esim_UL_3D_RCA_V2",
        "5D": "esim_UL_5D_RCA_V2",
        "7D": "esim_UL_7D_RCA_V2",
        "10D": "esim_UL_10D_RCA_V2",
        "15D": "esim_UL_15D_RCA_V2",
      },
    },
  },
  {
    name: "Global",
    nameHebrew: regionNamesHebrew.Global || "גלובלי",
    countryIds: [
      "AT", // Austria
      "DK", // Denmark
      "IE", // Ireland
      "IT", // Italy
      "SE", // Sweden
      "IM", // Isle of Man
      "FR", // France
      "BG", // Bulgaria
      "CY", // Cyprus
      "EE", // Estonia
      "FI", // Finland
      "GR", // Greece
      "HU", // Hungary
      "LV", // Latvia
      "LT", // Lithuania
      "NL", // Netherlands
      "NO", // Norway
      "PL", // Poland
      "RO", // Romania
      "SK", // Slovakia
      "ES", // Spain
      "GB", // United Kingdom
      "TR", // Turkey
      "DE", // Germany
      "MT", // Malta
      "CH", // Switzerland
      "BE", // Belgium
      "HR", // Croatia
      "CZ", // Czech Republic
      "LI", // Liechtenstein
      "LU", // Luxembourg
      "PT", // Portugal
      "SI", // Slovenia
      "IS", // Iceland
      "UA", // Ukraine
      "JE", // Jersey
      "SG", // Singapore
      "MO", // Macao
      "HK", // Hong Kong
      "IL", // Israel
      "AX", // Aaland Islands
      "ID", // Indonesia
      "VN", // VietNam
      "RU", // Russian Federation
      "AE", // United Arab Emirates
      "AU", // Australia
      "TH", // Thailand
      "TW", // Taiwan-Province of China
    ],
    bundleIds: {
      unlimited: {
        "3D": "esim_UL_3D_AX_V2",
        "5D": "esim_UL_5D_AX_V2",
        "7D": "esim_UL_7D_AX_V2",
        "10D": "esim_UL_10D_AX_V2",
        "15D": "esim_UL_15D_AX_V2",
        "30D": "esim_UL_30D_AX_V2",
      },
    },
  },
];

/**
 * Helper functions for working with regions and bundle IDs
 */

// Get region by name
export const getRegionByName = (name: string): Region | undefined => {
  return PREDEFINED_REGIONS.find(
    (region) => region.name.toLowerCase() === name.toLowerCase()
  );
};

// Get all country codes from all regions (unique)
export const getAllCountryCodes = (): ISOCountryCode[] => {
  const allCodes = new Set<ISOCountryCode>();
  PREDEFINED_REGIONS.forEach((region) => {
    region.countryIds.forEach((code) => allCodes.add(code));
  });
  return Array.from(allCodes).sort();
};

// Find which regions contain a specific country
export const getRegionsForCountry = (countryCode: ISOCountryCode): Region[] => {
  return PREDEFINED_REGIONS.filter((region) =>
    region.countryIds.includes(countryCode)
  );
};

// Get available bundle IDs for a region
export const getRegionBundles = (
  regionName: string,
  bundleType: "unlimited" | "unlimitedEssential" | "unlimitedPlus" = "unlimited"
): RegionalBundle | undefined => {
  const region = getRegionByName(regionName);
  return region?.bundleIds?.[bundleType];
};

// Get bundle ID for specific region, type, and duration
export const getBundleId = (
  regionName: string,
  duration: keyof RegionalBundle,
  bundleType: "unlimited" | "unlimitedEssential" | "unlimitedPlus" = "unlimited"
): string | undefined => {
  const bundles = getRegionBundles(regionName, bundleType);
  return bundles?.[duration];
};


// Get regions that have actual regional
export const getRegions = () => {
  return PREDEFINED_REGIONS;
}
