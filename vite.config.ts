import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/StarbreakSalvage/',
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts']
  }
});
