import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: [
    "../../server/schema.graphql",
    "./schema.graphql"
  ],
  generates: {
    "./src/generated/types.ts": {
      plugins: ["typescript"],
      config: {
        // Only generate types, not resolvers
        skipTypename: false,
        // Use TypeScript enums for GraphQL enums
        enumsAsTypes: false,
        // Add __typename to interfaces/unions
        addUnderscoreToArgsType: true,
      }
    }
  }
};

export default config;