import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(() => {
  const allowedHosts = (process.env.VITE_ALLOWED_HOSTS || '').split(',').map(h => h.trim()).filter(Boolean);
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@workspace/ui": path.resolve(__dirname, "../../packages/ui/src"),
      },
    },
    server: {
      allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined,
    },
  };
});
