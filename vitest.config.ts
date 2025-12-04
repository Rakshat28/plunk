import {defineConfig} from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        '**/*.config.ts',
        '**/*.config.js',
        'test/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    // Memory optimization: Run tests in sequence to prevent memory issues
    // This is critical for tests that create large datasets
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Run all tests in a single fork to limit memory
      },
    },
    // Run tests sequentially to avoid database cleanup conflicts
    fileParallelism: false,
    // Limit concurrent test files to reduce memory pressure
    maxConcurrency: 3,
    // Only include our test files, not dependency tests
    include: [
      'apps/**/__tests__/**/*.{test,spec}.{ts,tsx}',
      'packages/**/__tests__/**/*.{test,spec}.{ts,tsx}',
      'test/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['node_modules/**', '**/node_modules/**', 'dist/**', '.next/**', '.turbo/**'],
  },
  resolve: {
    alias: {
      '@plunk/db': path.resolve(__dirname, './packages/db/src'),
      '@plunk/shared': path.resolve(__dirname, './packages/shared/src'),
      '@plunk/types': path.resolve(__dirname, './packages/types/src'),
    },
  },
});
