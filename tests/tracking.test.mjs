import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { captureTracking, buildCheckoutUrl, recordCheckout } from '../src/tracking.ts';

let storage;
beforeEach(() => {
  storage = new Map();
  globalThis.window = { location: { search: '' }, dataLayer: [] };
  globalThis.sessionStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
});

test('preserves complete campaign names and long click IDs before UTMify loads', () => {
  const values = { utm_campaign: 'US Memory - Q4.2026 / A+B', fbclid: 'a'.repeat(240), gbraid: 'iOS_campaign.1', wbraid: 'iOS_click.2' };
  window.location.search = '?' + new URLSearchParams(values);
  const tracking = captureTracking();
  assert.deepEqual(tracking, values);
  const result = new URL(buildCheckoutUrl('https://jvz9.com/c/3640757/446317', tracking));
  for (const [key, value] of Object.entries(values)) assert.equal(result.searchParams.get(key), value);
  assert.equal(result.origin, 'https://jvz9.com');
  assert.equal(result.pathname, '/c/3640757/446317');
  assert.equal(result.searchParams.get('tid'), 'USMemory-Q42026AB');
  window.location.search = '';
  assert.deepEqual(captureTracking(), values);
});

test('preserves existing affiliate parameters and tid', () => {
  const result = new URL(buildCheckoutUrl('https://jvz9.com/c/3640757/446321?tid=original&utm_source=original', { utm_source: 'new', utm_medium: 'paid' }));
  assert.equal(result.pathname, '/c/3640757/446321');
  assert.equal(result.searchParams.get('tid'), 'original');
  assert.equal(result.searchParams.get('utm_source'), 'original');
  assert.equal(result.searchParams.get('utm_medium'), 'paid');
});

test('preserves affiliate and product paths for all three new checkout links', () => {
  for (const product of ['446317', '446319', '446321']) {
    const result = new URL(buildCheckoutUrl(`https://jvz9.com/c/3640757/${product}`, {
      utm_campaign: 'Memory US / A+B', utm_content: 'variant_b', fbclid: 'click-id-123',
    }));
    assert.equal(result.origin, 'https://jvz9.com');
    assert.equal(result.pathname, `/c/3640757/${product}`);
    assert.equal(result.searchParams.get('utm_campaign'), 'Memory US / A+B');
    assert.equal(result.searchParams.get('utm_content'), 'variant_b');
    assert.equal(result.searchParams.get('fbclid'), 'click-id-123');
    assert.equal(result.searchParams.get('tid'), 'MemoryUSAB');
  }
});

test('rejects malformed stored attribution and works when storage is blocked', () => {
  for (const value of ['{bad', 'null', '[]', '42', '"text"']) {
    storage.set('neurorecall_tracking', value);
    assert.deepEqual(captureTracking(), {});
  }
  storage.set('neurorecall_tracking', JSON.stringify({ utm_source: 'paid', fbclid: 12, unknown: 'ignore' }));
  assert.deepEqual(captureTracking(), { utm_source: 'paid' });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new Error('Blocked'); } });
  window.location.search = '?utm_source=paid';
  assert.deepEqual(captureTracking(), { utm_source: 'paid' });
  window.location.search = '';
  assert.deepEqual(captureTracking(), {});
  delete globalThis.sessionStorage;
});

test('checkout telemetry preserves prices without sending a second Meta/CAPI event', t => {
  let now = 10000;
  t.mock.method(Date, 'now', () => now);
  window.fbq = () => assert.fail('Application must not send a second Meta event');
  window.fetch = () => assert.fail('Application must not send a second CAPI event');
  for (const [value, quantity] of [[158, 2], [294, 6], [207, 3]]) {
    now += 2000;
    recordCheckout(value, quantity);
    recordCheckout(value, quantity); // Ignore an immediate double click.
  }
  assert.equal(window.dataLayer.length, 3);
  assert.deepEqual(window.dataLayer.map(e => [e.event, e.ecommerce.value, e.ecommerce.currency, e.ecommerce.items[0].quantity]), [
    ['begin_checkout', 158, 'USD', 2], ['begin_checkout', 294, 'USD', 6], ['begin_checkout', 207, 'USD', 3],
  ]);
});

function browserContext(existing = []) {
  const scripts = [...existing];
  const document = {
    scripts,
    getElementById: id => scripts.find(script => script.id === id),
    createElement: () => ({ src: '', setAttribute(name, value) { this[name] = value; } }),
    head: { appendChild: script => scripts.push(script) },
  };
  return vm.createContext({ window: {}, document, console });
}

test('embedded fallback and GTM tags inject only the UTM decorator once', () => {
  const context = browserContext();
  const config = JSON.parse(fs.readFileSync(new URL('../config/gtm-neurorecall.json', import.meta.url), 'utf8'));
  for (const kind of ['utms']) {
    const source = fs.readFileSync(new URL(`../public/tracking/utmify-${kind}.js`, import.meta.url), 'utf8');
    vm.runInContext(source, context);
    vm.runInContext(source, context);
  }
  for (const tag of config.containerVersion.tag) {
    const html = tag.parameter.find(p => p.key === 'html').value;
    vm.runInContext(html.replace(/^<script>\n/, '').replace(/<\/script>$/, ''), context);
    assert.deepEqual(tag.firingTriggerId, ['1']);
  }
  assert.equal(context.document.scripts.length, 1);
  assert.equal(new Set(context.document.scripts.map(script => script.src)).size, 1);
  assert.equal(context.window.pixelId, undefined);
  const utms = context.document.scripts.find(script => script.id === 'neurorecall-utmify-utms');
  assert.equal(utms['data-utmify-prevent-subids'], '');
  assert.equal(utms['data-utmify-prevent-xcod-sck'], '');
});

test('loaders reuse an existing vendor SDK even without our script id', () => {
  for (const [kind, url] of [
    ['utms', 'https://cdn.utmify.com.br/scripts/utms/latest.js'],
  ]) {
    const context = browserContext([{ src: url }]);
    vm.runInContext(fs.readFileSync(new URL(`../public/tracking/utmify-${kind}.js`, import.meta.url), 'utf8'), context);
    assert.equal(context.document.scripts.length, 1);
  }
});

// Keep browser tracking disabled in both entry points and future GTM imports.
test('both variants and GTM import omit the removed Pixel initialization', () => {
  const config = JSON.parse(fs.readFileSync(new URL('../config/gtm-neurorecall.json', import.meta.url), 'utf8'));
  const sources = [
    fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8'),
    fs.readFileSync(new URL('../variante-b.html', import.meta.url), 'utf8'),
    JSON.stringify(config),
  ];
  for (const source of sources) {
    assert.doesNotMatch(source, /utmify-pixel|scripts\/pixel\/pixel\.js|window\.pixelId|fbq\s*\(|connect\.facebook\.net|fbevents\.js/);
    assert.match(source, /utmify-utms|scripts\/utms\/latest\.js/);
    assert.match(source, /GTM-MFKJ3937/);
  }
  assert.equal(fs.existsSync(new URL('../public/tracking/utmify-pixel.js', import.meta.url)), false);
});
