import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  test: {
    enviroment: 'happy-dom',
    mockReset: true,
    setupFiles: './tests/setup-file.js',
    browser: {
      enabled: true,
      provider: playwright(),
      // https://vitest.dev/guide/browser/playwright
      instances: [
        { browser: 'chromium' },
      ],
    },
  },
})
