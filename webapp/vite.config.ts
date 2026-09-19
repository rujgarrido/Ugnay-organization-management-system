import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Dev-only: the backend the Vite dev server proxies /api/* to. Production uses
// the Vercel rewrite in vercel.json instead, so app code never needs a URL.
const DEFAULT_DEV_API_TARGET = 'http://localhost:4000';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devApiTarget = env.VITE_DEV_API_TARGET || DEFAULT_DEV_API_TARGET;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      watch: {
        usePolling: true,
      },
      // Keeps the browser on http://localhost:5173/api/* (same-origin) so
      // cookies and the CSRF double-submit pair behave exactly as in prod.
      proxy: {
        '/api': {
          target: devApiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
