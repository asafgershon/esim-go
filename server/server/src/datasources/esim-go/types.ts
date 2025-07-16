/**
 * TypeScript interfaces for eSIM Go API responses
 */

export interface ESIMGoCountry {
  name: string;
  region: string;
  iso: string;
}

export interface ESIMGoDataPlan {
  name: string;
  description: string;
  bundleGroup?: string;
  baseCountry: ESIMGoCountry;
  countries: {
    name: string;
    iso: string;
  }[];
  unlimited: boolean;
  dataAmount: number; // MB, -1 for unlimited
  duration: number; // days
  speed: string;
  roamingCountries: ESIMGoCountry[];
  price: number;
  billingType: string;
  availableQuantity?: number;
  id?: string;
}

export interface ESIMGoOrder {
  id: string;
  reference: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  bundleName: string;
  quantity: number;
  totalPrice: number;
  currency: string;
  createdAt: string;
  completedAt?: string;
  esims?: ESIMGoESIM[];
}

export interface ESIMGoESIM {
  iccid: string;
  customerRef?: string;
  qrCode?: string;
  status: 'PROCESSING' | 'ASSIGNED' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';
  assignedDate?: string;
  lastAction?: string;
  actionDate?: string;
  bundles?: ESIMGoBundle[];
}

export interface ESIMGoBundle {
  name: string;
  state: 'PROCESSING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';
  remainingData?: number; // bytes, null for unlimited
  usedData: number; // bytes
  startDate?: string;
  endDate?: string;
}

export interface ESIMGoAssignment {
  orderReference: string;
  iccid: string;
  qrCode: string;
  apn?: string;
  dataRoaming?: boolean;
  networkMode?: string;
  personalHotspot?: boolean;
}

// API Request interfaces
export interface CreateOrderRequest {
  bundleName: string;
  quantity: number;
  customerReference?: string;
  autoActivate?: boolean;
}

export interface UpdateESIMRequest {
  customerRef?: string;
  action?: 'SUSPEND' | 'RESTORE' | 'CANCEL';
}

// API Response interfaces
export interface CatalogueResponse {
  data: ESIMGoDataPlan[];
  pagination?: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

export interface OrderResponse {
  success: boolean;
  order?: ESIMGoOrder;
  error?: string;
  errorCode?: string;
}

export interface ESIMListResponse {
  data: ESIMGoESIM[];
  pagination?: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

export interface BundleStatusResponse {
  success: boolean;
  bundle?: ESIMGoBundle;
  error?: string;
}

export interface AssignmentResponse {
  success: boolean;
  assignments?: ESIMGoAssignment[];
  error?: string;
}

// Country interfaces (extracted from Networks API)
export interface ESIMGoNetworkCountry {
  iso: string;
  country: string;
  region: string;
  networks: any[]; // We don't use network details, just need for API response
  flag: string;
  hebrewName: string;
}

export interface NetworksResponse {
  data: ESIMGoNetworkCountry[];
  pagination?: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

export interface ESIMGoNetworkResponse {
  countryNetworks: {
    name: string;
  }[];
}

// Inventory interfaces
export interface ESIMGoInventoryItem {
  id: string;
  total: number;
  remaining: number;
  expiry: string; // ISO date string
}

export interface ESIMGoInventoryBundle {
  name: string;
  desc: string;
  useDms: boolean;
  available: ESIMGoInventoryItem[];
  countries: ESIMGoCountry[];
  data: number; // MB, -1 for unlimited
  duration: number; // days
  durationUnit: string;
  autostart: boolean;
  unlimited: boolean;
  speed: string;
  allowances: string[];
}

export interface ESIMGoInventoryResponse {
  bundles: ESIMGoInventoryBundle[];
}