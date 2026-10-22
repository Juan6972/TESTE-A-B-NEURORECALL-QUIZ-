import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../variante-b.html', import.meta.url), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).find(source => source.includes('const QUIZ_REVEAL_DELAY_MS'));
assert.ok(script, 'The standalone HTML must include its quiz script');

function page(search = '', reducedMotion = false) {
  class Element {
    children = [];
    listeners = new Map();
    attributes = new Map();
    hidden = false;
    textContent = '';
    dataset = {};
    style = {};
    classes = new Set();
    classList = { add: name => this.classes.add(name) };
    setAttribute(name, value) { this.attributes.set(name, value); }
    removeAttribute(name) {
      this.attributes.delete(name);
      if (name === 'hidden') this.hidden = false;
    }
    addEventListener(name, listener) {
      const listeners = this.listeners.get(name) || [];
      listeners.push(listener);
      this.listeners.set(name, listeners);
    }
    emit(name, event = {}) { for (const fn of this.listeners.get(name) || []) fn(event); }
    append(child) { this.children.push(child); }
    replaceChildren() { this.children = []; }
    focus() { this.focused = true; }
    scrollIntoView(options) { this.scrollOptions = options; }
    getBoundingClientRect() { return { height: 420 }; }
    querySelectorAll() { return []; }
  }
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  element('oferta-escondida').hidden = true;
  element('quiz-result').hidden = true;
  element('quiz-loading').hidden = true;
  const offerImages = [...html.matchAll(/<img\b[^>]*data-src="([^"]+)"[^>]*>/g)].map(match => {
    const image = new Element();
    image.dataset.src = match[1];
    image.setAttribute('data-src', match[1]);
    image.loading = 'lazy';
    image.decodeCalls = 0;
    image.decode = () => { image.decodeCalls++; return Promise.resolve(); };
    return image;
  });
  const offerSources = [...html.matchAll(/<source\b[^>]*data-srcset="([^"]+)"[^>]*>/g)].map(match => {
    const source = new Element();
    source.dataset.srcset = match[1];
    source.setAttribute('data-srcset', match[1]);
    return source;
  });
  element('oferta-escondida').querySelectorAll = selector => {
    if (selector === 'source[data-srcset]') return offerSources.filter(source => source.attributes.has('data-srcset'));
    if (selector === 'img[data-src]') return offerImages.filter(image => image.attributes.has('data-src'));
    return [];
  };
  const player = new Element();
  player.parentElement = new Element();
  const timers = new Map();
  let now = 0;
  let nextId = 1;
  const storage = { getItem: () => null, setItem() {}, removeItem() {} };
  const context = {
    document: {
      getElementById: element,
      createElement: () => new Element(),
      querySelector: () => player,
      querySelectorAll: () => [],
      addEventListener() {},
      head: new Element(),
    },
    window: { addEventListener() {}, matchMedia: () => ({ matches: reducedMotion }) },
    localStorage: storage,
    sessionStorage: storage,
    location: { search },
    URL, URLSearchParams,
    setTimeout(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimeout: id => timers.delete(id),
    setInterval() { return -1; },
    clearInterval() {},
  };
  context.window.location = context.location;
  vm.runInNewContext(script, context);
  function advance(ms) {
    const target = now + ms;
    while (true) {
      const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > target) break;
      const [id, timer] = next;
      timers.delete(id);
      now = timer.at;
      timer.callback();
    }
    now = target;
  }
  function completeQuiz() {
    for (let index = 0; index < 8; index++) {
      assert.equal(element('quiz-counter').textContent, `Question ${index + 1} of 8`);
      const options = element('quiz-options').children;
      options[0].emit('click');
      options.at(-1).emit('click'); // A second click must not skip a question.
      if (index === 7) {
        assert.equal(element('quiz-section').hidden, true);
        assert.equal(element('quiz-loading').hidden, false);
        break;
      }
      advance(299);
      assert.equal(element('quiz-counter').textContent, `Question ${index + 1} of 8`);
      advance(1);
    }
  }
  const videoTime = time => player.emit('video:timeupdate', { detail: { time } });
  return { element, advance, completeQuiz, videoTime, offerImages, offerSources };
}

test('original 0/2/4/5.5s preparation reveals the offer in place without forced scrolling', () => {
  const p = page();
  p.advance(60 * 60 * 1000);
  assert.equal(p.element('oferta-escondida').hidden, true);
  p.completeQuiz();
  assert.equal(p.element('quiz-section').hidden, true);
  assert.equal(p.element('quiz-loading').hidden, false);
  assert.equal(p.element('quiz-loading').style.minHeight, '420px');
  assert.equal(p.element('quiz-message').textContent, 'We are reviewing your answers...');
  p.advance(1999);
  assert.equal(p.element('quiz-message').textContent, 'We are reviewing your answers...');
  p.advance(1);
  assert.equal(p.element('quiz-message').textContent, '⚠️ Your answers have been received. Preparing the next step...');
  assert.ok(p.element('quiz-spinner').classes.has('is-updating'));
  p.advance(2000);
  assert.equal(p.element('quiz-success').hidden, false);
  assert.equal(p.element('quiz-spinner').hidden, true);
  assert.equal(p.element('quiz-success').textContent, '✅ Your presentation is ready. You can explore the available packages next.');
  p.advance(1499);
  assert.equal(p.element('oferta-escondida').hidden, true);
  p.advance(1);
  assert.equal(p.element('oferta-escondida').hidden, false);
  assert.equal(p.element('oferta-escondida').attributes.get('aria-hidden'), 'false');
  assert.equal(p.element('quiz-loading').hidden, true);
  assert.equal(p.element('quiz-result').hidden, true);
  assert.equal(p.element('oferta-escondida').focused, true);
  assert.equal(p.element('oferta-escondida').scrollOptions, undefined);
});

test('checkout receives focus without forcing a scroll when reduced motion is enabled', () => {
  const p = page('', true);
  p.completeQuiz();
  p.advance(5500);
  assert.equal(p.element('oferta-escondida').hidden, false);
  assert.equal(p.element('oferta-escondida').focused, true);
  assert.equal(p.element('oferta-escondida').scrollOptions, undefined);
});

test('initial quiz is ready immediately and wall time or preview URL cannot reveal the offer', () => {
  const p = page('?showoffer=1');
  assert.equal(p.element('quiz-counter').textContent, 'Question 1 of 8');
  assert.equal(p.element('quiz-options').children.length, 2);
  p.advance(60 * 60 * 1000);
  assert.equal(p.element('oferta-escondida').hidden, true);
  assert.equal(p.element('quiz-panel').hidden, false);
});

test('VSL cannot bypass the eight quiz answers even after the pitch threshold', () => {
  const p = page();
  p.videoTime(2504.99);
  assert.equal(p.element('oferta-escondida').hidden, true);
  p.videoTime(2505);
  assert.equal(p.element('oferta-escondida').hidden, true);
  p.videoTime(3600);
  p.advance(60000);
  assert.equal(p.element('oferta-escondida').hidden, true);
  assert.equal(p.element('quiz-panel').hidden, false);
});

test('VSL cannot bypass the original final quiz transition', () => {
  const p = page();
  p.completeQuiz();
  p.videoTime(2505);
  assert.equal(p.element('oferta-escondida').hidden, true);
  p.advance(5499);
  assert.equal(p.element('oferta-escondida').hidden, true);
  p.advance(1);
  assert.equal(p.element('oferta-escondida').hidden, false);
  assert.equal(p.element('quiz-loading').hidden, true);
});


test('offer assets stay inert through question 7 and start loading only when question 8 appears', () => {
  const p = page();
  assert.equal(p.offerImages.length, 3);
  assert.equal(p.offerSources.length, 6);
  function notRequested() {
    for (const image of p.offerImages) assert.equal(image.attributes.has('src'), false);
    for (const source of p.offerSources) assert.equal(source.attributes.has('srcset'), false);
  }
  notRequested();
  for (let question = 1; question < 7; question++) {
    p.element('quiz-options').children[0].emit('click');
    p.advance(300);
    notRequested();
  }
  p.element('quiz-options').children[0].emit('click');
  p.advance(299);
  notRequested();
  p.advance(1);
  assert.equal(p.element('quiz-counter').textContent, 'Question 8 of 8');
  for (const source of p.offerSources) assert.equal(source.attributes.get('srcset'), source.dataset.srcset);
  for (const image of p.offerImages) {
    assert.equal(image.attributes.get('src'), image.dataset.src);
    assert.equal(image.loading, 'eager');
    assert.equal(image.decodeCalls, 1);
  }
  assert.equal(p.element('oferta-escondida').hidden, true);
  p.element('quiz-options').children[0].emit('click');
  p.advance(5500);
  assert.equal(p.element('oferta-escondida').hidden, false);
  for (const image of p.offerImages) assert.equal(image.decodeCalls, 1);
});

test('standalone offer uses existing content-hashed AVIF and WebP files instead of inline image data', () => {
  assert.equal(html.includes('data:image/'), false);
  const paths = [...html.matchAll(/data-src(?:set)?="(\/assets\/[^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(paths).size, 6);
  for (const path of paths) {
    const bytes = readFileSync(new URL(`../public${path}`, import.meta.url));
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
    assert.ok(path.endsWith(`-${hash}.avif`) || path.endsWith(`-${hash}.webp`));
  }
});
