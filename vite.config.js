import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('/node_modules/react-router/')) return 'router-vendor'
          if (id.includes('/node_modules/react-router-dom/')) return 'router-vendor'
          if (id.includes('/node_modules/framer-motion/')) return 'motion-vendor'

          if (id.includes('/node_modules/@react-three/drei/')) return 'drei-vendor'
          if (id.includes('/node_modules/@react-three/fiber/')) return 'r3f-vendor'
          if (id.includes('/node_modules/three/')) return 'three-core-vendor'

          if (id.includes('/node_modules/react/')) return 'react-vendor'
          if (id.includes('/node_modules/react-dom/')) return 'react-vendor'
          if (id.includes('/node_modules/scheduler/')) return 'react-vendor'

          if (id.includes('@stripe/stripe-js')) return 'stripe-vendor'
          if (id.includes('axios')) return 'network-vendor'
          if (id.includes('qrcode.react')) return 'qrcode-vendor'

          return 'vendor'
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://www.wedpix.ro',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
