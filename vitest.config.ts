import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{js,ts}'],
    // Generous: the suite's checks read the whole built site, and CI machines are slow.
    testTimeout: 30_000,
  },
});
