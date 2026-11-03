# UTMify Pixel and checkout attribution

Both variants load `https://cdn.utmify.com.br/scripts/pixel/pixel.js` with UTMify ID `6ae9e2107d72b21d880aae9f`. The user confirmed in UTMify that this integration targets Meta Pixel `2222600604970989` on 2026-11-03. The readable loader is equivalent to the supplied encoded snippet and guards against repeated SDK injection.

The previous direct Meta base code and noscript image are removed. UTMify owns Pixel delivery; the application does not send manual Meta checkout or purchase events. Vendor event behavior and server integration credentials are managed in UTMify, not in this repository. No access token belongs in the public site.

The UTM URL decorator, affiliate settings, stored attribution, JVZoo checkout URLs, dataLayer begin_checkout messages, GTM, Clarity, and VTurb remain enabled. The GTM export only installs the UTM decorator. Review externally published tags and event rules separately to prevent duplicate events.

Run `node --test tests/*.test.mjs`, `npm run build`, `npm run lint`, and `npm run typecheck`. Tests verify the loader configuration and duplicate guard without executing the remote vendor SDK. Confirm actual PageView and InitiateCheckout receipt separately in Meta Test events, for both variants and all checkout buttons. Existing rules on the old Meta Pixel do not transfer automatically.
