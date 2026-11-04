import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { transform } from 'esbuild';

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
    {
      name: 'minify-inline-page-code',
      apply: 'build',
      enforce: 'post',
      async generateBundle(_options, bundle) {
        for (const asset of Object.values(bundle)) {
          if (asset.type !== 'asset' || !asset.fileName.endsWith('.html') || typeof asset.source !== 'string') continue;
          // Standalone quiz scripts are intentionally inline. Compress them at
          // build time without changing execution order or deferring tracking.
          const pattern = /<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>/g;
          let source = '';
          let previous = 0;
          for (const match of asset.source.matchAll(pattern)) {
            source += asset.source.slice(previous, match.index);
            const [, tag, attributes, code] = match;
            const executable = tag === 'style' || (!/\bsrc\s*=/.test(attributes) &&
              (!/\btype\s*=/.test(attributes) || /type=["'](?:text\/javascript|application\/javascript|module)["']/.test(attributes)));
            if (executable && code.trim()) {
              const result = await transform(code, {
                loader: tag === 'style' ? 'css' : 'js',
                minify: true,
                target: 'es2020',
                legalComments: 'none',
              });
              source += `<${tag}${attributes}>${result.code.replace(/<\/(script|style)/gi, '<\\/$1')}</${tag}>`;
            } else source += match[0];
            previous = match.index! + match[0].length;
          }
          asset.source = source + asset.source.slice(previous);
        }
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
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        variantB: fileURLToPath(new URL('./variante-b.html', import.meta.url)),
      },
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});
