import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Optimized Vite configuration for CineBot
export default defineConfig(({ mode }) => ({
  // Development server optimizations
  server: {
    host: '::',
    port: 8080,
    open: true,
    cors: true,
    // Hot reload optimization
    hmr: {
      overlay: true,
    },
    // Proxy API calls to backend
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  // Performance-optimized plugins
  plugins: [
    react()
  ],

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Build optimizations
  build: {
    // Use esbuild for faster minification
    minify: mode === 'production' ? 'esbuild' : false,
    
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Optimize bundle
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunk for stable dependencies
          vendor: ['react', 'react-dom'],
          // UI components chunk
          ui: ['@radix-ui/react-avatar', '@radix-ui/react-dialog'],
          // Router chunk
          router: ['react-router-dom'],
          // Query chunk
          query: ['@tanstack/react-query'],
        },
        
        // Optimize chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    // Source maps for debugging (disabled in production for performance)
    sourcemap: mode === 'development',
    
    // Target modern browsers
    target: 'esnext',
    
    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: mode === 'production',
  },

  // Pre-bundling optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
    ],
  },

  // Define global constants
  define: {
    __DEV__: JSON.stringify(mode === 'development'),
    __PROD__: JSON.stringify(mode === 'production'),
  },

  // ESBuild optimizations
  esbuild: {
    // Remove console.log in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    // Enable tree shaking
    treeShaking: true,
    // Optimize for modern syntax
    target: 'esnext',
  },
}));
