import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || Number(process.env.DASHBOARD_PORT) || 3001,
    host: true,
  },
  build: {
    outDir: 'dist',
  },
});
