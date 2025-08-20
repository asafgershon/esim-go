import crypto from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { GraphQLError } from "graphql";
import { createLogger } from "../lib/logger";
import type { CheckoutSessionTokenPayload } from "../resolvers/checkout/types";
import { CheckoutErrorCode } from "../resolvers/checkout/types";

const logger = createLogger({ component: "checkout-token-service" });

// Token configuration
const TOKEN_EXPIRY_SECONDS = 30 * 60; // 30 minutes
const TOKEN_ISSUER = "hiilo-checkout";

// Validation schema
const CheckoutSessionTokenSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  exp: z.number(),
  iss: z.string(),
});

export class CheckoutTokenService {
  private readonly jwtSecret: string;

  constructor(jwtSecret?: string) {
    if (!jwtSecret && !process.env.CHECKOUT_JWT_SECRET) {
      throw new Error("JWT secret is required for checkout token service");
    }
    this.jwtSecret = jwtSecret || process.env.CHECKOUT_JWT_SECRET!;
  }

  /**
   * Generates a secure JWT token for a checkout session
   */
  generateToken(userId: string, sessionId: string): string {
    const payload: CheckoutSessionTokenPayload = {
      userId,
      sessionId,
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
      iss: TOKEN_ISSUER,
    };

    logger.debug("Generating checkout token", { userId, sessionId });
    return jwt.sign(payload, this.jwtSecret);
  }

  /**
   * Validates and decodes a checkout token
   */
  validateToken(token: string): CheckoutSessionTokenPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as unknown;
      
      // Validate the decoded token with Zod schema
      const validatedToken = CheckoutSessionTokenSchema.parse(decoded);
      
      if (validatedToken.iss !== TOKEN_ISSUER) {
        logger.warn("Invalid token issuer", { 
          expected: TOKEN_ISSUER, 
          received: validatedToken.iss 
        });
        throw new Error("Invalid token issuer");
      }
      
      logger.debug("Token validated successfully", { 
        sessionId: validatedToken.sessionId 
      });
      
      return validatedToken;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn("Token expired", { error });
        throw new GraphQLError("Checkout token has expired", {
          extensions: { code: CheckoutErrorCode.SESSION_EXPIRED },
        });
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn("Invalid token", { error });
        throw new GraphQLError("Invalid checkout token", {
          extensions: { code: CheckoutErrorCode.INVALID_TOKEN },
        });
      }
      
      if (error instanceof z.ZodError) {
        logger.warn("Token validation failed", { error: error.errors });
        throw new GraphQLError("Invalid token structure", {
          extensions: { code: CheckoutErrorCode.INVALID_TOKEN },
        });
      }
      
      logger.error("Unexpected error validating token", error as Error);
      throw new GraphQLError("Failed to validate checkout token", {
        extensions: { code: CheckoutErrorCode.INVALID_TOKEN },
      });
    }
  }

  /**
   * Generates a SHA256 hash of a token for secure storage
   */
  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Checks if a token is expired without throwing
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as CheckoutSessionTokenPayload | null;
      if (!decoded || !decoded.exp) {
        return true;
      }
      return decoded.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }

  /**
   * Gets the remaining time in seconds for a token
   */
  getTokenRemainingTime(token: string): number {
    try {
      const decoded = jwt.decode(token) as CheckoutSessionTokenPayload | null;
      if (!decoded || !decoded.exp) {
        return 0;
      }
      const remaining = decoded.exp - Math.floor(Date.now() / 1000);
      return Math.max(0, remaining);
    } catch {
      return 0;
    }
  }
}

// Singleton instance
let tokenServiceInstance: CheckoutTokenService | null = null;

/**
 * Gets or creates the checkout token service instance
 */
export function getCheckoutTokenService(): CheckoutTokenService {
  if (!tokenServiceInstance) {
    tokenServiceInstance = new CheckoutTokenService();
  }
  return tokenServiceInstance;
}

export default CheckoutTokenService;