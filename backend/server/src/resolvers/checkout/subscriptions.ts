import type { PubSubInstance } from "../../context/pubsub";
import type { Checkout, Country, SubscriptionResolvers } from "../../types";
import { CheckoutSessionNotFoundError } from "./errors";

export const checkoutSubscriptionsV2: SubscriptionResolvers = {
  checkout: {
    subscribe: async (_, { id }, { services }) => {
      const session = await services.checkoutSessionServiceV2.getSession(id);
      if (!session) throw new CheckoutSessionNotFoundError(id);

      setImmediate(async () => {
        // Publish the complete session data on initial subscription
        const fullSession = await services.checkoutSessionServiceV2.getSession(id);
        if (fullSession) {
          publish(services.pubsub)(id, {
            id,
            bundle: fullSession.bundle ? {
              id: fullSession.bundle.externalId || "",
              country: {
                iso: fullSession.bundle.countryId || "",
                __typename: "Country",
              } as Country,
              numOfDays: fullSession.bundle.numOfDays,
              dataAmount: fullSession.bundle.dataAmount || "",
              speed: fullSession.bundle.speed || [],
              price: fullSession.bundle.price || 0,
              pricePerDay: fullSession.bundle.pricePerDay || 0,
              currency: "USD",
              discounts: fullSession.bundle.discounts || [],
              validated: fullSession.bundle.validated || false,
              completed: fullSession.bundle.completed || false,
            } : undefined,
            auth: fullSession.auth,
            delivery: fullSession.delivery,
            payment: fullSession.payment,
          });
        }
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
