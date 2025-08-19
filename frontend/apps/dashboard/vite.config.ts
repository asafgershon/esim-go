import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import dotenv from "dotenv";
import { cleanEnv, str } from "envalid";

dotenv.config();

const env = cleanEnv(process.env, {
  VITE_ALLOWED_HOSTS: str({ desc: "Allowed hosts", default: "" }),
});

// https://vite.dev/config/
export default defineConfig(() => {
  const allowedHosts = env.VITE_ALLOWED_HOSTS.split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
        },
        output: {
          manualChunks: {
            ui: ["@workspace/ui"],
          },
        },
      },
    },
    define: {
      process: {
        env: {},
      },
    },
    optimizeDeps: {
      needsInterop: ["@graphql-typed-document-node/core"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined,
    },
  };
});
