# Meta Pixel, UTM attribution and checkout telemetry

Meta Pixel `1585173316267621` is installed directly in the HTML head of both variants as requested on 2026-11-02. It initializes once per document load and sends `PageView` using the supplied base code. Each HTML body also contains the hidden noscript image fallback. React mounting and quiz transitions do not initialize another Pixel.

UTMify's Pixel SDK remains removed. The site does not configure another Meta Pixel or a server-side Conversions API integration. The supplied base code does not implement InitiateCheckout or Purchase.

The following remain enabled:

- UTMify's `utms/latest.js` URL decorator, with the existing affiliate/sub-ID settings.
- Capture of campaign UTMs and click identifiers in session storage and passthrough to JVZoo checkout URLs, including the existing `tid` fallback.
- `begin_checkout` messages in `dataLayer`, with the selected amount and bottle quantity. The legacy `tracking_owner` metadata is retained for compatibility; the checkout handler does not send Meta browser or CAPI events.
- The existing GTM container, Microsoft Clarity and VTurb player.

## External account settings

This repository does not control tags already published in GTM or existing UTMify/JVZoo server integrations. Pixel installations and event rules in those accounts must be reviewed separately to prevent unwanted or duplicate sends. No dataset, account, history, token or published external tag was changed by this installation.

`config/gtm-neurorecall.json` contains only the UTM decorator tag. Do not install another copy of the Meta base code through GTM while this direct HTML installation is enabled. Use GTM Preview to identify legacy Meta or UTMify Pixel tags and keep unrelated analytics tags.

## Verification

Run `node --test tests/*.test.mjs`, `npm run build`, `npm run lint`, and `npm run typecheck`.

In a fresh browser session, verify that both variants request one Meta SDK and initialize the intended Pixel with one PageView. Check receipt in the Meta account separately. Both variants should retain their existing offer gates, pricing and checkout destinations, with complete campaign names and click IDs in checkout URLs. The application must not request the removed UTMify Pixel loader or send manual checkout/purchase events to Meta. Check any remaining vendor requests against published GTM and account settings.
