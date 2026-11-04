# Verification — 2026-11-04

Variant A's temporary checkout-test bypass was removed. Its offer starts hidden and mounts only when reported video progress reaches 2,760 seconds (46:00). Variant B retains the eight-answer quiz and 5.5-second final transition.

Passed build, lint, TypeScript checks and all 22 unit tests. Chromium checks against the production build also passed:

- A offer hidden at 2,759.9 seconds and visible at 2,760 seconds.
- A and B save progress on exit, resume the same fractional second after reload, offer resume after back/forward cache restoration, and clear progress when choosing Start over.
- B cannot unlock from video progress alone; completing all eight answers reveals the offer after preparation.
- Three checkout links point to the intended JVZoo product paths and retain campaign and click identifiers.
- Product images load and the 390px mobile layout has no horizontal overflow.
- Routes /, /a, /b, /quiz and /variante-b.html return successfully under the local Vercel rewrite equivalent.
- No browser JavaScript errors or GTM requests in either tested flow. Current source contains neither of the previously reported legacy Pixel IDs.

Browser checks use a simulated VTurb public API and inert third-party responses. They validate the site's integration logic, not live VTurb streaming, external redirects, Meta event delivery, UTMify server settings or the completed Vercel deployment. Resume requires the same browser storage, valid for seven days; clearing storage or switching browser/device prevents recovery.
