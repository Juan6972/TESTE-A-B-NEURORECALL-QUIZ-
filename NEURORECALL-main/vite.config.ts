import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inline-entry-css',
      apply: 'build',
      enforce: 'post',
      generateBundle(_options, bundle) {
        // Only inline the entry stylesheet; lazy offer CSS remains a separate chunk.
        const html = bundle['index.html'];
        if (html?.type !== 'asset' || typeof html.source !== 'string') return;
        html.source = html.source.replace(
          /<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
          (tag, href: string) => {
            const css = bundle[href.replace(/^\//, '')];
            if (css?.type !== 'asset' || typeof css.source !== 'string') return tag;
            return `<style>${css.source.replace(/<\/style/gi, '<\\/style')}</style>`;
          },
        );
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
