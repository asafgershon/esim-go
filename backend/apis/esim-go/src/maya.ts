import z from "zod";

// ✅ 1. Maya Bundle Schema
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

// ✅ 2. Maya Products Response Schema
export const MayaProductsResponseSchema = z.object({
  result: z.number(),
  status: z.number(),
  request_id: z.string(),
  message: z.string().optional(),
  developer_message: z.string(),
  products: z.array(MayaBundleSchema),
});

// ✅ 3. Maya Create eSIM Request Schema
export const MayaCreateEsimRequestSchema = z.object({
  product_uid: z.string().describe("The UID of the Maya bundle/product"),
  quantity: z.number().int().positive().default(1).describe("Number of eSIMs to create"),
  metadata: z.record(z.string(), z.any()).optional().describe("Optional metadata for the eSIM"),
});

// ✅ 4. Maya eSIM Activation Details Schema (future use)
export const MayaEsimActivationSchema = z.object({
  qr_code: z.string().describe("QR code data for eSIM activation"),
  lpa_string: z.string().describe("LPA activation string"),
  manual_activation_code: z.string().optional().describe("Manual activation code if supported"),
});

// ✅ 5. Maya eSIM Details Schema
export const MayaEsimSchema = z.object({
  uid: z.string().describe("Unique identifier for the eSIM"),
  iccid: z.string().describe("ICCID of the eSIM"),
  activation_code: z.string().describe("LPA activation code for eSIM activation"),
  manual_code: z.string().describe("Manual activation code (optional for manual setup)"),
  smdp_address: z.string().describe("SM-DP+ address used for eSIM activation"),
  auto_apn: z.number().optional().describe("Auto APN configuration flag (1 = enabled)"),
  apn: z.string().optional().describe("Access Point Name (APN) for data connectivity"),
  state: z.string().describe("Internal state of the eSIM (e.g. RELEASED, ACTIVE)"),
  service_status: z.string().describe("Service status of the eSIM (e.g. active, inactive)"),
  network_status: z.string().describe("Network status of the eSIM (e.g. ENABLED, DISABLED)"),
  tag: z.union([z.string(), z.number()]).optional().describe("Optional tag used in Maya dashboard"),
  date_assigned: z.string().describe("Timestamp of when the eSIM was assigned (YYYY-MM-DD HH:mm:ss)"),
});

// ✅ 6. Maya Create eSIM Response Schema
export const MayaCreateEsimResponseSchema = z.object({
  result: z.number().describe("API result code (1 = success)"),
  status: z.number().describe("HTTP-like status code (e.g. 201)"),
  request_id: z.string().describe("Unique request ID for tracking"),
  message: z.string().optional().describe("Response message"),
  developer_message: z.string().optional().describe("Developer-facing message or notes"),
  esim: MayaEsimSchema.optional().describe("Single created eSIM object"),
  esims: z.array(MayaEsimSchema).optional().describe("Array of created eSIMs (optional for bulk requests)"),
  transaction_id: z.string().optional().describe("Transaction ID for tracking"),
  total_cost_usd: z.string().optional().describe("Total cost in USD"),
});

// ✅ 7. Maya Error Response Schema
export const MayaErrorResponseSchema = z.object({
  result: z.number(),
  status: z.number(),
  request_id: z.string(),
  message: z.string(),
  developer_message: z.string(),
  error_code: z.string().optional(),
  details: z.record(z.any(), z.any()).optional(),
});

// ✅ 8. Type definitions (exported for TS)
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
    this.baseUrl = "https://api.maya.net/connectivity/v1";
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
  const url = `${this.baseUrl}/esim`;

  const apiKey = "y5b7HUu2PkCK";
  const apiSecret = "BcM1pD9MhpY5eZNunPJqRCEQGIyDbmmceIw69bszr7xQT6KLqvVvj4kFo8Xz1SuH";

const authHeader = "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  console.log("🔐 Authorization Header:", authHeader);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      plan_type_id: params.product_uid,
      quantity: params.quantity || 1,
      ...(params.metadata && { metadata: params.metadata }),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    try {
      const mayaError = MayaErrorResponseSchema.parse(errorData);
      throw new MayaApiError(
        mayaError.message || `Maya API error: ${response.status}`,
        response.status,
        mayaError
      );
    } catch {
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