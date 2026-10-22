# NEURORECALL

React + TypeScript landing page built with Vite. Requires Node.js 24 and npm.

Production URLs: Variant A uses `/a`; Variant B uses `/b`, configured in `vercel.json`. The existing `/`, `/quiz` and `/variante-b.html` URLs also work. The rewrites retain campaign query parameters.

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
node scripts/prerender.mjs --check
```

`npm run build` first renders the current React App into `index.html` at build time. The header, hero, original SVG icons, and reserved video frame therefore paint from HTML with the existing inlined entry CSS, before the React chunk arrives. The client mounts the same layout in one commit; video resume decisions remain client-only. Run `npm run prerender` after changing the App to refresh the checked-in HTML shell.

In Variant A, the offer is released when the video reaches 46:00 (2,760 seconds). Returning viewers can resume saved video progress, but elapsed visit time, saved progress alone and URL parameters do not unlock the offer. Variant B unlocks its offer after all eight quiz answers and the original 0/2/4/5.5-second preparation stages, preparing product images on question 8. Its visible question counter is removed, the transition reserves the quiz height, and the offer appears in place with a short opacity fade and no forced scrolling or looping CTA effects. The offer's JavaScript, CSS and product images in Variant A load only after release. React is a separate cached production chunk. Above-the-fold video loading and tracking initialization remain unchanged.

Product images use static AVIF/WebP files and explicit dimensions. Variant A retains responsive AVIF sources with WebP fallback and loads them with the offer. Variant B prioritizes the byte-identical original WebP files, with AVIF as an alternative, contains no inline image data, and activates its image URLs only when question 8 appears, then decodes asynchronously during the existing reveal sequence. Content-hashed image copies in `public/assets/` and Vite's hashed chunks receive a one-year immutable cache; legacy `/images/` URLs remain compatible with a one-day cache, while tracking loaders revalidate. Original artwork is retained in `assets/source-images/`, outside the public build. To regenerate the 256/512/768-pixel variants, hashed copies, React manifest, and standalone quiz image URLs, install Python Pillow with AVIF/WebP support and run:

```sh
python scripts/optimize-images.py
```

The page uses system fonts, so it makes no font downloads and needs no `@font-face` loading configuration. Tracking ownership and GTM import instructions are documented in [docs/tracking.md](docs/tracking.md).

Performance changes and audit conditions: [docs/performance.md](docs/performance.md).
