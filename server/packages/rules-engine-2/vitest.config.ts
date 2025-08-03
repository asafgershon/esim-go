import { defineConfig } from 'vitest/config'

const dir = import.meta.dirname;
export default defineConfig({
  test: {
    globals: true,
    root: dir,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/'
      ]
    }
  }
})