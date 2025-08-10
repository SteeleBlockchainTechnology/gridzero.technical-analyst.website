import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
// Prefer explicit FRONTEND/BACKEND_PORT in dev; fall back to defaults
const frontendPort = Number(process.env.FRONTEND_PORT || process.env.VITE_FRONTEND_PORT || 3000);
const backendPort = Number(process.env.BACKEND_PORT || process.env.VITE_BACKEND_PORT || 5000);

export default defineConfig({
  plugins: [react()],
  server: {
    port: frontendPort,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
      '/ws': {
        target: `ws://localhost:${backendPort}`,
        ws: true,
      }
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable for production
    minify: 'esbuild', // Use built-in esbuild minifier (faster, no extra dependencies)
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', '@radix-ui/react-select', '@radix-ui/react-slot', '@radix-ui/react-switch'],
          utils: ['axios', 'clsx', 'tailwind-merge']
        }
      }
    }
  },
  define: {
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Add public directory configuration
  publicDir: 'public',
});
