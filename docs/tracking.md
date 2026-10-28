# UTM attribution and checkout telemetry

The UTMify Pixel installation was removed from both variants at the user's request on 2026-10-28. Neither page initializes a Meta Pixel or loads UTMify's Pixel SDK. No replacement Pixel was added.

The following remain enabled:

- UTMify's `utms/latest.js` URL decorator, with the existing affiliate/sub-ID settings.
- Capture of campaign UTMs and click identifiers in session storage and passthrough to JVZoo checkout URLs, including the existing `tid` fallback.
- `begin_checkout` messages in `dataLayer`, with the selected amount and bottle quantity. The legacy `tracking_owner` metadata is retained for compatibility; it does not initialize a Pixel or send Meta/CAPI events.
- The existing GTM container, Microsoft Clarity and VTurb player.

## External account settings

This repository does not control tags already published in GTM or existing UTMify/JVZoo server integrations. If those integrations still send to the removed Meta destination, they must be paused separately in the corresponding account. Removing the landing-page SDK does not delete the Meta dataset, its history, or account settings.

`config/gtm-neurorecall.json` now contains only the UTM decorator tag. Importing it with Merge does not delete or pause a previously published Pixel tag. Use GTM Preview to identify any remaining Meta or UTMify Pixel tag, pause the specific tag, review the changes, then publish. Keep unrelated analytics tags.

## Verification

Run `node --test tests/*.test.mjs`, `npm run build`, `npm run lint`, and `npm run typecheck`.

In a fresh browser session, verify that both variants retain their existing offer gates, pricing and checkout destinations. Complete campaign names and click IDs should remain in checkout URLs. The application must not request the removed UTMify Pixel loader, initialize a Meta Pixel, or send Meta/CAPI events. Check any remaining vendor requests separately against the published GTM and account settings.
