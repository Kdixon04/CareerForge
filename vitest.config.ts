import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Use React's automatic JSX runtime (as Next.js/tsconfig do) so component unit
  // tests can render without a global React in scope.
  esbuild: { jsx: 'automatic' },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
