const TRACKING_KEY = 'neurorecall_tracking';
const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'fbclid', 'gclid', 'ttclid', 'gbraid', 'wbraid',
];

function sanitizeTid(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 80);
}

export function captureTracking(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const incoming: Record<string, string> = {};
  for (const key of TRACKING_PARAMS) {
    const value = params.get(key);
    // URLSearchParams safely encodes values. Do not truncate click IDs or strip
    // spaces/punctuation from campaign names before UTMify has loaded.
    if (value) incoming[key] = value;
  }
  if (Object.keys(incoming).length > 0) {
    try {
      sessionStorage.setItem(TRACKING_KEY, JSON.stringify(incoming));
    } catch { /* Attribution still works without storage. */ }
    return incoming;
  }
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(TRACKING_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const stored = parsed as Record<string, unknown>;
    return Object.fromEntries(TRACKING_PARAMS
      .filter(key => typeof stored[key] === 'string' && stored[key])
      .map(key => [key, stored[key] as string]));
  } catch {
    return {};
  }
}

export function buildCheckoutUrl(baseUrl: string, tracking: Record<string, string>): string {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(tracking)) {
    if (!url.searchParams.has(key) && value) url.searchParams.set(key, value);
  }
  if (!url.searchParams.has('tid')) {
    const tid = tracking.utm_campaign || tracking.fbclid || tracking.gclid || tracking.ttclid || '';
    if (tid) url.searchParams.set('tid', sanitizeTid(tid));
  }
  return url.toString();
}

let lastCheckoutAt = -Infinity;

export function recordCheckout(value: number, numItems: number) {
  const now = Date.now();
  if (now - lastCheckoutAt < 1000) return;
  lastCheckoutAt = now;
  // Reporting only: the application does not send Meta browser or CAPI events.
  // Keep the existing payload shape for any independent GTM analytics tags.
  const target = window as unknown as { dataLayer?: unknown[] };
  target.dataLayer = target.dataLayer || [];
  target.dataLayer.push({
    event: 'begin_checkout',
    tracking_owner: 'utmify',
    ecommerce: {
      currency: 'USD',
      value,
      items: [{
        item_id: `neurorecall_${numItems}_bottles`,
        item_name: `NeuroRecall ${numItems}-bottle package`,
        price: value / numItems,
        quantity: numItems,
      }],
    },
  });
}
