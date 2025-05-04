import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:8000', // Backend server address
        changeOrigin: true, // Recommended for virtual hosted sites
        // You might not need rewrite if backend already expects /api/v1 prefix
        // rewrite: (path) => path.replace(/^\/api\/v1/, '') 
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}); 