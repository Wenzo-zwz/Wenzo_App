import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // The repository root and docs contain generated, directly hostable pages.
  // Keep the Vite entry separate so local development always uses source files.
  root: fileURLToPath(new URL('./src', import.meta.url)),
  publicDir: '../public',
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true },
});
