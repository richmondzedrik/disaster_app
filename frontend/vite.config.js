import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
  optimizeDeps: {
    include: ['axios', 'leaflet', 'leaflet-routing-machine']
  },
  css: {
    preprocessorOptions: {
      css: {
        additionalData: `@import "leaflet/dist/leaflet.css";`
      }
    }
  },
  base: '/',
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        sourcemapExcludeSources: true
      }
    }
  }
})