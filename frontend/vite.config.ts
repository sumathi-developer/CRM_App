import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxyConfig = {
  target: 'http://localhost:3000',
  changeOrigin: true,
  bypass: (req: any) => {
    if (req.headers && req.headers.accept && req.headers.accept.includes('text/html')) {
      return '/index.html';
    }
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': apiProxyConfig,
      '/users': apiProxyConfig,
      '/settings': apiProxyConfig,
      '/workspaces': apiProxyConfig,
      '/roles': apiProxyConfig,
      '/permissions': apiProxyConfig,
      '/teams': apiProxyConfig,
    },
  },
});
