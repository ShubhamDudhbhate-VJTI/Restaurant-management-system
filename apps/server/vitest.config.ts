import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    setupFiles: ['./src/__tests__/bootstrap.ts'],
    include: ['src/**/*.test.ts'],
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
});
