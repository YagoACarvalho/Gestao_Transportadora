import { defineConfig } from 'vite';
export default defineConfig({ server: { host: '127.0.0.1', port: 5173, strictPort: true,
  proxy: { '/api': { target: 'https://localhost:7148', changeOrigin: true, secure: true } },
} });
