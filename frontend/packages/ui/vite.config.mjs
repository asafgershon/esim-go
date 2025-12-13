const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react-swc").default;
const { resolve } = require("path");
const useClientPlugin = require("./vite-plugin-use-client");

module.exports = defineConfig(({ mode }) => ({
  plugins: [react(), useClientPlugin()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "components/smooth-scroll-container": resolve(
          __dirname,
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
        // Keep GSAP bundled with smooth-scroll-container, separate from main bundle
        manualChunks: (id) => {
          if (id.includes("node_modules/gsap")) {
            return undefined; // Let it be bundled with smooth-scroll-container
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
      "@": resolve(__dirname, "./src"),
      "@workspace/ui/lib": resolve(__dirname, "./src/lib"),
      "@workspace/ui/hooks": resolve(__dirname, "./src/hooks"),
      "@workspace/ui/components": resolve(__dirname, "./src/components"),
      "@workspace/ui": resolve(__dirname, "./src"),
    },
  },
}));
