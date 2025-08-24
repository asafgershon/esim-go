import type { PubSubInstance } from "../../context/pubsub";
import type { Checkout, SubscriptionResolvers } from "../../types";
import { CheckoutSessionNotFoundError } from "./errors";

export const checkoutSubscriptionsV2: SubscriptionResolvers = {
  checkout: {
    subscribe: async (_, { id }, { services }) => {
      const session = await services.checkoutSessionServiceV2.getSession(id);
      if (!session) throw new CheckoutSessionNotFoundError(id);

      setImmediate(async () => {
        publish(services.pubsub)(id, {
          id,
        });
      });
      return services.pubsub.asyncIterator(`CHECKOUT_UPDATED:${id}`);
    },
  },
};

export const publish = (pubsub: PubSubInstance) => (id: string, checkout: Checkout) =>
  pubsub.publish(`CHECKOUT_UPDATED:${id}`, {
    checkout,
  });

// bundle: {
//     id: session.bundle.externalId || "",
//     dataAmount: session.bundle.dataAmount || "",
//     numOfDays: session.bundle.numOfDays,
//     speed: session.bundle.speed,
//     price: Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: "USD",
//     }).format(session.bundle.price || 0),
//     pricePerDay: Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: "USD",
//     }).format(session.bundle.pricePerDay || 1),
//     country: {
//       __typename: "Country",
//       iso: session.bundle.countryId,
//       name: "", // We let the field resolver handle the name
//     },
//     discounts: [],
//   },
