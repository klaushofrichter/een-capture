import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'
import { APP_NAME, APP_DESCRIPTION } from './src/constants.js'

export default defineConfig(({ command }) => {
  const config = {
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
          configure: proxy => {
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log(`[Proxy] OAuth request: ${req.method} ${req.url}`)
            })
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log(
                `[Proxy] OAuth response: ${proxyRes.statusCode} for ${req.method} ${req.url}`
              )
            })
          }
        },
        '/api': {
          target: 'https://login.eagleeyenetworks.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
          configure: proxy => {
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log(`[Proxy] Login API request: ${req.method} ${req.url}`)
            })
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log(
                `[Proxy] Login API response: ${proxyRes.statusCode} for ${req.method} ${req.url}`
              )
            })
          }
        }
      }
    },
    preview: {
      port: 3333,
      host: '127.0.0.1'
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        external: ['fs', 'path', 'url']
      }
    },
    // Add template data for HTML processing
    template: {
      transformIndexHtml: {
        data: {
          APP_NAME,
          APP_DESCRIPTION
        }
      }
    }
  }

  // Set base path conditionally for build command (GitHub Pages)
  if (command === 'build') {
    config.base = '/een-login/'
  } else {
    // For serve (local development), use the default base '/'
    config.base = '/'
  }

  return config
})
