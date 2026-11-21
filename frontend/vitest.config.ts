import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { maxWorkers: 2, testTimeout: 15000, environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], passWithNoTests: false, restoreMocks: true } });
