import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3333,
    host: '127.0.0.1',
    proxy: {
      '/oauth2': {
        target: 'https://auth.eagleeyenetworks.com',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Proxy] OAuth request: ${req.method} ${req.url}`)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(
              `[Proxy] OAuth response: ${proxyRes.statusCode} for ${req.method} ${req.url}`
            )
          })
        }
      },
      '/g/aaa/api': {
        target: 'https://api.eagleeyenetworks.com',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Proxy] API request: ${req.method} ${req.url}`)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`[Proxy] API response: ${proxyRes.statusCode} for ${req.method} ${req.url}`)
          })
        }
      },
      '/api': {
        target: 'https://login.eagleeyenetworks.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Proxy] Login API request: ${req.method} ${req.url}`)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(
              `[Proxy] Login API response: ${proxyRes.statusCode} for ${req.method} ${req.url}`
            )
          })
        }
      }
    }
  },
  build: {
    rollupOptions: {
      external: ['fs', 'path', 'url']
    }
  }
})
