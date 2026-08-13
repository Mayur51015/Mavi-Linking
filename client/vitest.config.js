import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vitest 3.2 does not pick up the plugin's JSX handling under Vite 8, so the
  // transform falls back to the classic runtime and every render() fails with
  // "React is not defined". Setting the automatic runtime here fixes it
  // without making each test file import React.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
  },
});