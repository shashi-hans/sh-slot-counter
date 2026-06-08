import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: 'demo',
  plugins: [react()],
  resolve: {
    alias: {
      // live-edit the source directly, no rebuild needed
      'slot-counter': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
});
