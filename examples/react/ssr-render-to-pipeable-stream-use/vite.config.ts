import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: fileURLToPath(new URL('./src/entry-client.tsx', import.meta.url)),
    },
  },
});
