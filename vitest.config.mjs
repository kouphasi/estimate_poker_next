import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const hasDatabase = !!process.env.DATABASE_URL;

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['__tests__/setup.ts'],
    include: ['__tests__/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      ...(hasDatabase ? [] : ['__tests__/unit/migrations.test.ts']),
      'node_modules/**',
      'dist/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '.next/',
        '*.config.ts',
        '*.config.js',
        '*.config.mjs',
        'types/',
        '.specify/',
        'specs/',
      ],
      // Coverage thresholds are only enforced in CI when DATABASE_URL is set
      // Unit tests alone don't meet these thresholds since they don't test API routes/pages
      thresholds: hasDatabase ? {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      } : undefined,
    },
    testTimeout: 30000, // 30秒 (NFR-006)
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
