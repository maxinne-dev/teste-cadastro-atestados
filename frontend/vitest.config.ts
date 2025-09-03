import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    dangerouslyIgnoreUnhandledErrors: true,
    restoreMocks: true,
    clearMocks: true,
    env: {
      MODE: 'test',
      NODE_ENV: 'test',
    },
  },
  define: {
    'import.meta.env.MODE': '"test"',
  },
})

