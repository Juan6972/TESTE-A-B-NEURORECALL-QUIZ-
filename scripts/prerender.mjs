import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { createServer } from 'vite';

// Render the actual App at build time, so the first HTML paint uses exactly the
// same header, hero, SVGs, and video frame as React's first client render.
const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: App } = await server.ssrLoadModule('/src/App.tsx');
  const shell = renderToStaticMarkup(createElement(App));
  const indexPath = new URL('../index.html', import.meta.url);
  const before = await readFile(indexPath, 'utf8');
  const rootPattern = /<div id="root">[\s\S]*?<\/div>(\s*<script type="module" src="\/src\/main\.tsx"><\/script>)/;
  if (!rootPattern.test(before)) throw new Error('Cannot find the HTML root and React entry');
  const after = before.replace(rootPattern, () => `<div id="root">${shell}</div>\n    <script type="module" src="/src/main.tsx"></script>`);
  if (before !== after) {
    if (process.argv.includes('--check')) throw new Error('Run npm run prerender to refresh the static HTML shell');
    await writeFile(indexPath, after);
  }
  console.log('Variant A: static HTML shell synchronized with App.');
} finally {
  await server.close();
}
