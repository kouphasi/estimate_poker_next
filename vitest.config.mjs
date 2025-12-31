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
      // Unit test coverage focuses on domain and application layers
      // Infrastructure, pages, and API routes are tested via integration/E2E tests
      include: [
        'src/domain/**/*.ts',
        'src/application/**/*.ts',
        'app/components/**/*.tsx',
      ],
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
        // Exclude index.ts barrel files (just re-exports)
        '**/index.ts',
        // Exclude repository interfaces (just type definitions)
        '**/*Repository.ts',
        // Exclude React components that require complex mocking (NextAuth, context, etc.)
        'app/components/Providers.tsx',
        'app/components/Toast.tsx',
        'app/components/auth/**',
      ],
      // Coverage thresholds are enforced in CI when DATABASE_URL is set
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
      '@/domain': resolve(__dirname, './src/domain'),
      '@/application': resolve(__dirname, './src/application'),
      '@/infrastructure': resolve(__dirname, './src/infrastructure'),
      '@': resolve(__dirname, './'),
    },
  },
});
