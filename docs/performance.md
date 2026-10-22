# Performance validation — 2026-10-22

## Technical update

- Variant A now includes a build-time render of the actual App inside the source `index.html` root. `scripts/prerender.mjs` uses React's server renderer through Vite, with no runtime server. Existing CSS, header/logo, hero text, icons, player location, and offer timing are preserved. The client still mounts normally, so saved video progress does not cause server/client hydration mismatches.
- Variant B replaces its three inline base64 images with content-hashed static AVIF/WebP sources. URLs remain in `data-src`/`data-srcset` through question 7, and only activate when question 8 appears. Encoding and fetching never block quiz answers or the existing 5.5-second offer reveal. The WebP fallbacks are byte-identical to the previous embedded files.
- Current built Variant B HTML decreases from about 126 KB to 44 KB (gzip about 77.7 KB to 13.0 KB). These are local build measurements, not public-network or Lighthouse scores.
- Both variants now use content-hashed image files and one-year immutable caching for `/assets/`. Unversioned compatibility images and favicons use a one-day cache; mutable tracking loaders revalidate. Vercel rewrites are unchanged.
- Added preconnect and DNS-prefetch hints for all four requested VTurb origins in Variant A, valid SVG/ICO favicons for both pages, and standard repository ignore rules.
- Removed `lucide-react` from dependencies, retaining its four exact SVG drawings locally with the license. The headphones drawing, dimensions, class names, and colors remain identical.

Controlled browser validation at 375 and 1440 px found pixel-identical before/after header, hero, and offer screenshots for both variants. In Variant A, withholding the React entry still produced the fully styled hero; releasing it preserved geometry and produced no observed layout shifts, including a saved-progress session. In Variant B, no product image requests occurred through question 7, and exactly three WebP requests began on question 8. The 46-minute Variant A gate and Variant B's existing quiz-plus-5.5-second gate passed. Vendor scripts were mocked or blocked during these checks, so this does not verify public-network performance or real tracking receipt.

## Earlier audit — 2026-10-19

The following measurements describe the earlier implementation at the time of that audit.

## Changes

- Removed the repository's visual badge and replaced the two social preview image references with the product image. No runtime badge element or badge-specific stylesheet was present.
- Split the offer into a lazy React component with its own stylesheet. Before release, no offer chunk or product image is requested and the wrapper occupies zero height. The existing 2,505-second video threshold, visit timer, saved-progress restoration and preview query are retained.
- Generated responsive 256/512/768-pixel AVIF and WebP images from the original PNG artwork. The 512-pixel AVIF set totals 57,783 bytes compared with 5,531,668 bytes for the original PNG set (98.96% reduction). Browsers select variants using `srcset`, `sizes` and device pixel ratio. Explicit dimensions, existing CSS image boxes, asynchronous decoding and native lazy loading retain card geometry.
- Inlined only the small entry stylesheet in production HTML to remove its blocking network request. Lazy offer CSS remains separate. React is a shared cached chunk, and JavaScript/CSS minification is explicit in Vite. There are no separate routes to split.
- Added connection hints for the two video resource origins. Above-the-fold video remains eager; tracking scripts and their load timing are unchanged.
- Removed unused `@supabase/supabase-js` and its 15 installed packages. System fonts already eliminate font download requests; no custom font or `@font-face` was added.

## Controlled Lighthouse comparison

Lighthouse ran against the production builds before and after the change, using default simulated mobile throttling and the desktop preset. **HTTPS third-party requests were blocked in both builds.** These results isolate first-party improvements and do not measure the public site with VTurb, analytics, ad scripts or media downloading. They do not establish a production score of 100.

| Metric | Before mobile | After mobile | Before desktop | After desktop |
| --- | ---: | ---: | ---: | ---: |
| Performance | 96 | 97 | 100 | 100 |
| First contentful paint | 1.7 s | 1.2 s | 0.4 s | 0.3 s |
| Largest contentful paint | 2.6 s | 2.6 s | 0.8 s | 0.7 s |
| Total blocking time | 0 ms | 0 ms | 0 ms | 0 ms |
| Cumulative layout shift | 0 | 0 | 0 | 0 |
| Initial transferred bytes | 5,707,143 | 57,644 | 5,707,143 | 57,644 |

The major transfer reduction comes from not requesting the hidden offer images. The test browser used an empty cache. The first-party page has no remaining stylesheet render-blocking request in the final Lighthouse audit.

A separate browser regression using a controlled VTurb API test double compared geometry before and after at 375, 768 and 1440 px. Card and image dimensions stayed identical. Video-to-banner spacing stayed 17, 17 and 25 px respectively; horizontal overflow was absent. The offer stayed hidden at 2,504 seconds and appeared at 2,505. Reload restored the offer and the resume choices, and Continue sought to the saved timestamp.

A separate regression loaded the real UTMify/Meta SDKs against the built application. It verified one copy of each SDK despite repeated GTM loader execution, one PageView and one ViewContent, no manual Meta checkout event, matching browser/server checkout event IDs, retained checkout amounts and quantities, complete campaign/click-ID passthrough, and no JavaScript page errors. Checkout conversions were intercepted during testing; no purchase or payment was performed. This does not establish receipt of a future JVZoo sale or access to the private Meta/GTM dashboards.

## Repeatable checks

```sh
npm ci
npm run build
npm run lint
npm run typecheck
node --test tests/*.test.mjs
npm run preview
```

For production Lighthouse, test the published domain with all services enabled in a browser that trusts the environment's existing TLS configuration. Do not disable certificate verification. Scores vary with vendor scripts, network conditions, device speed and video content.

In browser DevTools, test fresh storage without `showoffer`: the Network panel must show no `OfferSection` chunk or product images before release. Use `?showoffer=1` to inspect pricing cards, AVIF/WebP selection and lazy loading. At 375, 768 and 1440 px, verify spacing and compare the visible card content and destinations. Resume a saved session past 41:45 and check that both offer restoration and Continue/Start over work.
