import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

const truckApiTarget = 'https://muniu-test.smartebao.com'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  server: {
    proxy: {
      '/smart-ebao-api': {
        target: truckApiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/smart-ebao-api/, ''),
      },
    },
  },
  preview: {
    proxy: {
      '/smart-ebao-api': {
        target: truckApiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/smart-ebao-api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
