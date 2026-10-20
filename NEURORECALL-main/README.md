# NEURORECALL

React + TypeScript landing page built with Vite. Requires Node.js 24 and npm.

```sh
npm ci
npm run dev -- --host 0.0.0.0
```

Production and validation:

```sh
npm run build
npm run preview
npm run lint
npm run typecheck
node --test tests/*.test.mjs
```

The offer is released at 41:45 (2,505 seconds), retaining the existing returning-visit timer and saved-video-progress behavior. Use `?showoffer=1` to preview the offer without waiting. The offer's JavaScript, CSS and product images load only after release. React is a separate cached production chunk. Above-the-fold video loading and tracking initialization remain unchanged.

Product images use responsive AVIF with WebP fallback, native lazy loading and explicit dimensions. Original artwork is retained in `assets/source-images/`, outside the public build. To regenerate the 256/512/768-pixel variants, install Python Pillow with AVIF/WebP support and run:

```sh
python scripts/optimize-images.py
```

The page uses system fonts, so it makes no font downloads and needs no `@font-face` loading configuration. Tracking ownership and GTM import instructions are documented in [docs/tracking.md](docs/tracking.md).

Performance changes and audit conditions: [docs/performance.md](docs/performance.md).
