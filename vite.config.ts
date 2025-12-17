import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteOssSignedUrlsDevPlugin } from './scripts/viteOssSignedUrlsDevPlugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), viteOssSignedUrlsDevPlugin(env)],
    server: {
      host: '127.0.0.1',
      port: 3208,
      strictPort: true,
    },
  };
});
