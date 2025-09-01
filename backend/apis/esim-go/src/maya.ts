import z from "zod";

// Maya Bundle Schema
export const MayaBundleSchema = z.object({
  uid: z.string(),
  name: z.string(),
  countries_enabled: z.array(z.string()),
  data_quota_mb: z.number(),
  data_quota_bytes: z.number(),
  validity_days: z.number(),
  policy_id: z.number(),
  policy_name: z.string(),
  wholesale_price_usd: z.string(),
});

// Maya Products Response Schema
const MayaProductsResponseSchema = z.object({
  result: z.number(),
  status: z.number(),
  request_id: z.string(),
  message: z.string().optional(),
  developer_message: z.string(),
  products: z.array(MayaBundleSchema),
});

// Maya Create eSIM Request Schema
export const MayaCreateEsimRequestSchema = z.object({
  product_uid: z.string().describe("The UID of the Maya bundle/product"),
  quantity: z.number().int().positive().default(1).describe("Number of eSIMs to create"),
  metadata: z.record(z.any(), z.any()).optional().describe("Optional metadata for the eSIM"),
});

// Maya eSIM Activation Details Schema
export const MayaEsimActivationSchema = z.object({
  qr_code: z.string().describe("QR code data for eSIM activation"),
  lpa_string: z.string().describe("LPA activation string"),
  manual_activation_code: z.string().optional().describe("Manual activation code if supported"),
});

// Maya eSIM Details Schema
export const MayaEsimSchema = z.object({
  esim_id: z.string().describe("Unique identifier for the eSIM"),
  iccid: z.string().describe("ICCID of the eSIM"),
  status: z.enum(["active", "pending", "used", "expired", "failed"]).describe("Current status of the eSIM"),
  created_at: z.string().describe("ISO timestamp of eSIM creation"),
  expires_at: z.string().optional().describe("ISO timestamp of eSIM expiration"),
  activation: MayaEsimActivationSchema.describe("Activation details for the eSIM"),
  bundle_name: z.string().describe("Name of the associated bundle"),
  bundle_uid: z.string().describe("UID of the associated bundle"),
  data_quota_mb: z.number().describe("Data quota in MB"),
  validity_days: z.number().describe("Validity period in days"),
});

// Maya Create eSIM Response Schema
export const MayaCreateEsimResponseSchema = z.object({
  result: z.number(),
  status: z.number(),
  request_id: z.string(),
  message: z.string().optional(),
  developer_message: z.string(),
  esims: z.array(MayaEsimSchema).describe("Array of created eSIMs"),
  transaction_id: z.string().optional().describe("Transaction ID for tracking"),
  total_cost_usd: z.string().optional().describe("Total cost in USD"),
});

// Maya Error Response Schema
export const MayaErrorResponseSchema = z.object({
  result: z.number(),
  status: z.number(),
  request_id: z.string(),
  message: z.string(),
  developer_message: z.string(),
  error_code: z.string().optional(),
  details: z.record(z.any(), z.any()).optional(),
});

// Type definitions
export type MayaBundle = z.infer<typeof MayaBundleSchema>;
export type MayaProductsResponse = z.infer<typeof MayaProductsResponseSchema>;
export type MayaCreateEsimRequest = z.infer<typeof MayaCreateEsimRequestSchema>;
export type MayaCreateEsimResponse = z.infer<typeof MayaCreateEsimResponseSchema>;
export type MayaEsim = z.infer<typeof MayaEsimSchema>;
export type MayaEsimActivation = z.infer<typeof MayaEsimActivationSchema>;
export type MayaErrorResponse = z.infer<typeof MayaErrorResponseSchema>;

export interface MayaApiConfig {
  auth: string;
  baseUrl?: string;
}

export class MayaApi {
  private auth: string;
  private baseUrl: string;

  constructor(config: MayaApiConfig) {
    this.auth = config.auth;
    this.baseUrl = config.baseUrl || "https://api.maya.net/connectivity/v1";
  }

  /**
   * Get Maya products/bundles
   */
  async getProducts(countryId?: string, regionId?: string): Promise<MayaProductsResponse> {
    const url = new URL(`${this.baseUrl}/account/products`);
    
    if (countryId) {
      url.searchParams.set("country", countryId);
    }
    if (regionId) {
      url.searchParams.set("region", regionId);
    }

    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        Authorization: this.auth,
      },
    });

    if (!response.ok) {
      throw new Error(`Maya API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const parsedData = MayaProductsResponseSchema.parse(data);
    return parsedData;
  }

  /**
   * Create eSIM(s) for a specific Maya product/bundle
   */
  async createEsim(params: MayaCreateEsimRequest): Promise<MayaCreateEsimResponse> {
    const url = `${this.baseUrl}/esims`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.auth,
      },
      body: JSON.stringify({
        product_uid: params.product_uid,
        quantity: params.quantity || 1,
        ...(params.metadata && { metadata: params.metadata }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Try to parse as Maya error response
      try {
        const mayaError = MayaErrorResponseSchema.parse(errorData);
        throw new MayaApiError(
          mayaError.message || `Maya API error: ${response.status}`,
          response.status,
          mayaError
        );
      } catch (parseError) {
        // If not a valid Maya error response, throw generic error
        throw new MayaApiError(
          `Maya API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }
    }

    const data = await response.json();
    const parsedData = MayaCreateEsimResponseSchema.parse(data);
    return parsedData;
  }

  /**
   * Get eSIM status and details
   */
  async getEsimStatus(esimId: string): Promise<MayaEsim> {
    const url = `${this.baseUrl}/esims/${esimId}`;
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: this.auth,
      },
    });

    if (!response.ok) {
      throw new MayaApiError(
        `Maya API error: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    const parsedData = MayaEsimSchema.parse(data);
    return parsedData;
  }

  // Add more Maya API methods here as needed
}

// Custom error class for Maya API errors
export class MayaApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorDetails?: MayaErrorResponse | any
  ) {
    super(message);
    this.name = "MayaApiError";
  }
}