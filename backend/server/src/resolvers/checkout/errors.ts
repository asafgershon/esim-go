import { GraphQLError } from "graphql";

export class CheckoutSessionNotFoundError extends GraphQLError {
  constructor(id: string) {
    super(`Checkout session not found: ${id}`, {
      extensions: {
        code: 'CHECKOUT_SESSION_NOT_FOUND',
      },
    });
  }
}