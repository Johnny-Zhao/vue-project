import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

function createManualChunk(id: string) {
  if (!id.includes('node_modules')) {
    return undefined
  }

  if (id.includes('element-plus')) {
    return 'element-plus'
  }

  if (
    id.includes('@vue') ||
    id.includes('vue-router') ||
    id.includes('pinia') ||
    id.includes('/vue/')
  ) {
    return 'vue-core'
  }

  if (id.includes('axios')) {
    return 'network'
  }

  return 'vendor'
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const truckApiPrefix = env.VITE_TRUCK_API_BASE_URL || '/smart-ebao-api'
  const truckApiTarget = env.VITE_TRUCK_API_TARGET || 'https://muniu-test.smartebao.com'
  const enableVueDevTools = env.VITE_ENABLE_DEVTOOLS === 'true'

  return {
    plugins: [vue(), vueJsx(), enableVueDevTools ? vueDevTools() : null].filter(Boolean),
    server: {
      proxy: {
        [truckApiPrefix]: {
          target: truckApiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${truckApiPrefix}`), ''),
        },
      },
    },
    preview: {
      proxy: {
        [truckApiPrefix]: {
          target: truckApiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${truckApiPrefix}`), ''),
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            return createManualChunk(id)
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
