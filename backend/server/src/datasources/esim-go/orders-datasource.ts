import { GraphQLError } from "graphql";
import { ESIMGoDataSource } from "./esim-go-base";
import type {
  AssignmentResponse,
  CreateOrderRequest,
  ESIMGoAssignment,
  ESIMGoOrder,
  OrderResponse,
} from "./types";

/**
 * DataSource for eSIM Go Orders API
 * Handles purchasing eSIMs and managing orders
 */
export class OrdersDataSource extends ESIMGoDataSource {
  /**
   * Create a new order to purchase eSIMs
   */
  async createOrder(request: CreateOrderRequest): Promise<ESIMGoOrder> {
    try {
      const response = await this.postWithErrorHandling<OrderResponse>(
        "/orders",
        {
          bundle_name: request.bundleName,
          quantity: request.quantity,
          customer_reference: request.customerReference,
          auto_activate: request.autoActivate || false,
        }
      );

      if (!response.success || !response.order) {
        throw new GraphQLError(response.error || "Failed to create order", {
          extensions: {
            code: response.errorCode || "ORDER_CREATION_FAILED",
          },
        });
      }

      return response.order;
    } catch (error) {
      // Re-throw with more context
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError("Failed to create eSIM order", {
        extensions: {
          code: "ORDER_CREATION_ERROR",
          originalError: error,
        },
      });
    }
  }

  /**
   * Get details of a specific order
   */
  async getOrder(orderReference: string): Promise<ESIMGoOrder | null> {
    const cacheKey = this.getCacheKey("order", { orderReference });

    // Try cache first (short TTL for order status updates)
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const order = await this.getWithErrorHandling<ESIMGoOrder>(
        `/orders/${orderReference}`
      );

      // Cache for 5 minutes
      await this.cache?.set(cacheKey, JSON.stringify(order), { ttl: 300 });

      return order;
    } catch (error: any) {
      // Return null for 404s
      if (error.extensions?.httpStatus === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get list of orders for the organization
   */
  async getOrders(params?: {
    status?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
  }): Promise<ESIMGoOrder[]> {
    const queryParams: Record<string, string> = {};

    if (params?.status) {
      queryParams.status = params.status;
    }
    if (params?.from_date) {
      queryParams.from_date = params.from_date;
    }
    if (params?.to_date) {
      queryParams.to_date = params.to_date;
    }
    if (params?.page) {
      queryParams.page = params.page.toString();
    }

    return await this.getAllPages<ESIMGoOrder>("/orders", queryParams);
  }

  /**
   * Download QR codes and assignment details for an order
   */
  async getOrderAssignments(
    orderReference: string
  ): Promise<ESIMGoAssignment[]> {
    const cacheKey = this.getCacheKey("assignments", { orderReference });

    // Try cache first (24 hours - assignments don't change)
    const cached = await this.cache?.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.getWithErrorHandling<AssignmentResponse>(
        `/esims/assignments/${orderReference}`
      );

      if (!response.success || !response.assignments) {
        throw new GraphQLError(response.error || "Failed to get assignments", {
          extensions: {
            code: "ASSIGNMENTS_FETCH_FAILED",
          },
        });
      }

      // Cache for 24 hours (assignments are immutable)
      await this.cache?.set(cacheKey, JSON.stringify(response.assignments), {
        ttl: 86400,
      });

      return response.assignments;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError("Failed to get order assignments", {
        extensions: {
          code: "ASSIGNMENTS_FETCH_ERROR",
          originalError: error,
        },
      });
    }
  }

  /**
   * Cancel an order (only works for orders in PROCESSING status)
   */
  async cancelOrder(orderReference: string): Promise<ESIMGoOrder> {
    try {
      const response = await this.postWithErrorHandling<OrderResponse>(
        `/orders/${orderReference}/cancel`
      );

      if (!response.success || !response.order) {
        throw new GraphQLError(response.error || "Failed to cancel order", {
          extensions: {
            code: response.errorCode || "ORDER_CANCELLATION_FAILED",
          },
        });
      }

      // Clear cache
      const cacheKey = this.getCacheKey("order", { orderReference });
      await this.cache?.delete(cacheKey);

      return response.order;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError("Failed to cancel order", {
        extensions: {
          code: "ORDER_CANCELLATION_ERROR",
          originalError: error,
        },
      });
    }
  }

  /**
   * Validate an order before purchase (recommended by eSIM Go)
   * Tests if the order will be successful without committing to purchase
   */
  async validateOrder(
    bundleName: string,
    quantity: number,
    customerReference?: string
  ): Promise<{
    isValid: boolean;
    bundleDetails?: any;
    totalPrice?: number;
    currency?: string;
    error?: string;
    errorCode?: string;
  }> {
    try {
      const response = await this.postWithErrorHandling<{
        success: boolean;
        bundle?: any;
        total_price?: number;
        currency?: string;
        error?: string;
        error_code?: string;
      }>("/orders", {
        type: "validate", // Key parameter for validation
        bundle_name: bundleName,
        quantity,
        customer_reference: customerReference,
      });

      if (!response.success) {
        return {
          isValid: false,
          error: response.error || "Validation failed",
          errorCode: response.error_code || "VALIDATION_FAILED",
        };
      }

      return {
        isValid: true,
        bundleDetails: response.bundle,
        totalPrice: response.total_price,
        currency: response.currency,
      };
    } catch (error) {
      if (error instanceof GraphQLError) {
        return {
          isValid: false,
          error: error.message,
          errorCode: (error.extensions?.code as string) || "VALIDATION_ERROR",
        };
      }
      return {
        isValid: false,
        error: "Failed to validate order",
        errorCode: "VALIDATION_ERROR",
      };
    }
  }

  /**
   * Calculate total price for an order (useful for preview)
   */
  async calculateOrderPrice(
    bundleName: string,
    quantity: number
  ): Promise<{ totalPrice: number; currency: string }> {
    try {
      const response = await this.postWithErrorHandling<{
        success: boolean;
        total_price: number;
        currency: string;
        error?: string;
      }>("/orders/calculate", {
        bundle_name: bundleName,
        quantity,
      });

      if (!response.success) {
        throw new GraphQLError(response.error || "Failed to calculate price", {
          extensions: {
            code: "PRICE_CALCULATION_FAILED",
          },
        });
      }

      return {
        totalPrice: response.total_price,
        currency: response.currency,
      };
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError("Failed to calculate order price", {
        extensions: {
          code: "PRICE_CALCULATION_ERROR",
          originalError: error,
        },
      });
    }
  }
}
