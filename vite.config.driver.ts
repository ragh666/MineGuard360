import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: Number(process.env.DRIVER_PORT) || 3000,
    strictPort: false,
  },
  build: {
    outDir: 'dist/driver',
    rollupOptions: {
      input: {
        driver: 'index.html',
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
