import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  test: {
    enviroment: 'happy-dom',
    mockReset: true,
    setupFiles: './tests/setup-file.ts',
    browser: {
      enabled: true,
      provider: playwright({ launchOptions: { locale: 'en-US' } }),
      instances: [
        {
          browser: 'chromium',
          viewport: { width: 1200, height: 800 },
          providerOptions: {},
        },
      ],
    },
  },
})
