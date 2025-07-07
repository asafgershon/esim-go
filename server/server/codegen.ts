import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: ["../../schema.graphql"],
  generates: {
    "./src/types.ts": {
      plugins: [
        "typescript",
        "typescript-resolvers",
      ],
      config: {
        contextType: "./context/types#Context",
      },
    },
  },
};

export default config;
