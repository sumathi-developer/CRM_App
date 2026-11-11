import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

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
  plugins: [react(), tailwindcss()],
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
      '/custom-fields': apiProxyConfig,
      '/tags': apiProxyConfig,
      '/lead-generation': apiProxyConfig,
      '/pipelines': apiProxyConfig,
      '/deals': apiProxyConfig,
      '/contacts': apiProxyConfig,
      '/leads': apiProxyConfig,
      '/activities': apiProxyConfig,
      '/tasks': apiProxyConfig,
      '/notes': apiProxyConfig,
      '/products': apiProxyConfig,
      '/notifications': apiProxyConfig,
      '/reports': apiProxyConfig,
      '/files': apiProxyConfig,
      '/calendar': apiProxyConfig,
      '/communications': apiProxyConfig,
      '/search': apiProxyConfig,
      '/analytics': apiProxyConfig,
      '/audit-logs': apiProxyConfig,
      '/help-support': apiProxyConfig,
      '/organizations': apiProxyConfig,
    },
  },
});
