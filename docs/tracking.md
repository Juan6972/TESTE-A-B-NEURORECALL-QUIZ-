# Tracking ownership and GTM setup

UTMify is the single owner of Meta browser events and CAPI events for both variants. The page loaders and GTM import configure internal UTMify Pixel `6ade433bd5ad48f637021bd2`, decoded from the installation snippet supplied on 2026-10-28. The intended Meta destination is `1434368118267256`; that association and its CAPI credentials are managed in the UTMify account and must be verified there. Updating the internal ID does not itself prove receipt in Meta.

UTMify generates an event ID and sends the same identifier through its browser and server paths. Do not add a separate `fbq('track'...)`, `fbq('trackSingle'...)`, Meta base pixel, automatic-event installation, or manual CAPI call for these same events.

- **PageView:** UTMify initialization, once per document load.
- **ViewContent:** UTMify's existing time/scroll rules, once per document load.
- **InitiateCheckout:** UTMify's existing BUY NOW rule. The application's `recordCheckout` function only pushes `begin_checkout` with the selected USD amount and bottle quantity into `dataLayer`; it does not send Meta/CAPI events.
- **Purchase:** the existing checkout/order integration sends actual completed orders through CAPI. Never fire Purchase from a landing-page visit or BUY NOW click.

The direct page loaders are retained so the existing Meta/CAPI tracking continues if GTM has no published tags. Both direct loaders and GTM tags check for the existing vendor scripts before injecting them. Importing the supplied tags therefore does not create a second UTMify SDK or duplicate initialization.

## Import into the existing GTM container

1. Open container **GTM-MFKJ3937** in Google Tag Manager.
2. Export a backup of the current workspace. Use Admin > Import Container and select `config/gtm-neurorecall.json`.
3. Choose the intended workspace and **Merge**. Review conflicting names individually; do not overwrite unrelated tags.
4. The import supplies two Custom HTML tags (UTMify UTMs and UTMify Pixel) and one All pages trigger. Those tags load the existing UTMify integration; they do not independently send PageView, ViewContent, InitiateCheckout or Purchase to Meta.
5. Preview the page. Confirm one request for each vendor SDK and one Meta pixel initialization, even with the page fallback loaders enabled. If GTM custom-template consent or CSP settings block Custom HTML, review those settings rather than installing another Meta pixel as a fallback.
6. Submit/publish the reviewed GTM workspace. Committing the JSON file to GitHub does not import or publish it in Google Tag Manager.

Publishing GTM requires access to the user's GTM account. No usable Google account credentials or GTM connector were available in this environment, so import/publication must be completed in that account. GTM import compatibility should be confirmed in Preview before publication.

## Verification

Run `node --test tests/*.test.mjs`, `npm run build`, `npm run lint`, and `npm run typecheck`.

In a fresh browser context, use a QA UTM campaign and verify:

- Complete campaign names and click IDs are preserved in all checkout links before and after the UTMify URL decorator loads. Affiliate ID and checkout destinations remain unchanged.
- One PageView and one ViewContent reach UTMify per document load. Their browser/server event IDs match.
- One BUY NOW click invokes the UTMify checkout path once. No application `trackSingle` checkout call occurs. Immediate repeat clicks follow UTMify's existing deduplication rules.
- `dataLayer` contains the selected package amount (158 / 294 / 207 USD) and quantity (2 / 6 / 3). Do not treat this dataLayer message as proof those amount fields are sent in UTMify's Meta payload; UTMify controls that payload.
- Meta Test Events and the UTMify account show browser/server deduplication. Test Purchase only with the checkout provider's supported test-order flow.

A 6.1/10 event match-quality score is not proof of duplicate events. The exact Meta Diagnostics message is required to resolve that warning. Never fabricate email, phone, customer identifiers, purchase events, or matching fields to raise the score.
