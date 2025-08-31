import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: [
    "../server/schema.graphql",
    "../packages/rules-engine/schema.graphql"
  ],
  generates: {
    "./src/types/generated/types.ts": {
      plugins: ["typescript"],
      config: {
        // Only generate types, not resolvers
        skipTypename: true,
        // Use TypeScript enums for GraphQL enums (important for SyncJobType)
        enumsAsTypes: false,
        // Add underscore to args type
        addUnderscoreToArgsType: true,
        // Only generate the types we need
        onlyOperationTypes: false,
        // Generate scalars
        scalars: {
          DateTime: "string",
          JSON: "any",
          ISOCountryCode: "string"
        }
      }
    }
  }
};

export default config;