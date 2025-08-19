import { CodegenConfig } from "@graphql-codegen/cli";
import { cleanEnv, str } from "envalid";

const env = cleanEnv(process.env, {
  NEXT_PUBLIC_GRAPHQL_ENDPOINT: str({ default: "http://localhost:5001/graphql" }),
});

const apiUrl = env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;

const config: CodegenConfig = {
  schema: "../../../backend/server/schema.graphql",
  documents: ["src/**/*.tsx", "src/**/*.ts"],
  generates: {
    "./src/__generated__/": {
      preset: "client",
      presetConfig: {
        gqlTagName: "gql",
      },
    },
    "./src/__generated__/types.ts": {
      plugins: ["typescript", "typescript-operations"],
    },
  },
};

export default config; 