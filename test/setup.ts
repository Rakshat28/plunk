import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { testDatabase } from './helpers/database';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Global test setup
beforeAll(async () => {
  // Initialize test database
  await testDatabase.initialize();
});

afterEach(async () => {
  // Clear all mocks first
  vi.clearAllMocks();

  // Restore real timers
  vi.useRealTimers();

  // Clean up database after each test
  // This must be last to ensure proper cleanup order
  await testDatabase.cleanup();

  // Force garbage collection hint (if available in test environment)
  if (global.gc) {
    global.gc();
  }
});

afterAll(async () => {
  // Disconnect from database
  await testDatabase.disconnect();
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';
