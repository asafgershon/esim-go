"use client";

import { ApolloProvider } from "@apollo/client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { apolloClient } from "@/lib/apollo-client";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ApolloProvider client={apolloClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </ApolloProvider>
  );
};
