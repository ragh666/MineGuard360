import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'rewrite-dashboard-root',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '/index.html') {
            req.url = '/dashboard.html';
          }
          next();
        });
      },
    },
  ],
  server: {
    port: Number(process.env.DASHBOARD_PORT) || 3001,
    strictPort: false,
  },
  build: {
    outDir: 'dist/dashboard',
    rollupOptions: {
      input: {
        index: 'dashboard.html',
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
