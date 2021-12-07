import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  server: {
    port: 8080,
  },
  build: {
    target: 'es2015',
  },
  plugins: [
    vue(),
  ],
});
