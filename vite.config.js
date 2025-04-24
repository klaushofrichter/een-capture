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
        secure: false
      },
      '/g/aaa/api': {
        target: 'https://api.eagleeyenetworks.com',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'https://login.eagleeyenetworks.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    rollupOptions: {
      external: ['fs', 'path', 'url']
    }
  }
})
