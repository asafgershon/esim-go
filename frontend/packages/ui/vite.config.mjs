import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import useClientPlugin from "./vite-plugin-use-client.js";

export default defineConfig(({ mode }) => ({
  plugins: [react(), useClientPlugin()],
  build: {
    lib: {
      entry: {
        index: resolve("src/index.ts"),
        "components/smooth-scroll-container": resolve(
          "src/components/smooth-scroll-container.tsx"
        ),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        const ext = format === "es" ? "mjs" : "cjs";
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: [
        "react",
        "next",
        "next/link",
        "react-dom",
        "react/jsx-runtime",
        /^@radix-ui/,
        /^@dnd-kit/,
        /^@tanstack/,
        "class-variance-authority",
        "clsx",
        "cmdk",
        "date-fns",
        "fuse.js",
        /^gsap/,
        "is-mobile",
        "lucide-react",
        "overlayscrollbars",
        "overlayscrollbars-react",
        "tailwind-merge",
        "vaul",
        "libphonenumber-js",
        "react-circle-flags",
        "country-data-list",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
        manualChunks: (id) => {
          if (id.includes("node_modules/gsap")) {
            return undefined;
          }
        },
      },
    },
    target: "es2020",
    sourcemap: true,
    minify: false,
    emptyOutDir: false,
    outDir: "dist",
  },
  resolve: {
    alias: {
      "@": resolve("./src"),
      "@workspace/ui/lib": resolve("./src/lib"),
      "@workspace/ui/hooks": resolve("./src/hooks"),
      "@workspace/ui/components": resolve("./src/components"),
      "@workspace/ui": resolve("./src"),
    },
  },
}));
