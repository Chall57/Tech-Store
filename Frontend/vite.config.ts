import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.API_PROXY_TARGET || (mode === 'e2e' ? 'http://127.0.0.1:8081' : 'http://127.0.0.1:8080')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': apiProxyTarget,
        '/actuator': apiProxyTarget,
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
      exclude: ['cypress/**', 'node_modules/**'],
    },
  }
})
