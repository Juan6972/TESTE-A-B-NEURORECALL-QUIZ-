import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../variante-b.html', import.meta.url), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).find(source => source.includes('const QUIZ_NOTICE_DELAY_MS'));
assert.ok(script, 'The standalone HTML must include its quiz script');

function page(search = '', reducedMotion = false) {
  class Element {
    children = [];
    listeners = new Map();
    attributes = new Map();
    hidden = false;
    textContent = '';
    dataset = {};
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
  element('quiz-success').hidden = true;
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
  return { element, advance, completeQuiz, videoTime };
}

test('quiz shows centered status sequence at 0/2/4s and reveals only at 5s', () => {
  const p = page();
  p.advance(60 * 60 * 1000);
  assert.equal(p.element('oferta-escondida').hidden, true);
  p.completeQuiz();
  assert.equal(p.element('quiz-panel').hidden, true);
  assert.equal(p.element('quiz-screen').hidden, true);
  assert.equal(p.element('quiz-section').hidden, true);
  assert.equal(p.element('quiz-loading').hidden, false);
  assert.equal(p.element('quiz-result').hidden, false);
  assert.equal(p.element('quiz-spinner').hidden, false);
  assert.equal(p.element('quiz-message').textContent, 'Reviewing your answers...');
  assert.equal(p.element('quiz-success').hidden, true);
  p.advance(1999);
  assert.equal(p.element('quiz-spinner').hidden, false);
  p.advance(1);
  assert.equal(p.element('quiz-spinner').hidden, true);
  assert.ok(p.element('quiz-message').classes.has('quiz-warning'));
  assert.equal(p.element('quiz-message').textContent, '⚠️ Your answers have been received.');
  assert.equal(p.element('oferta-escondida').hidden, true);
  p.advance(1999);
  assert.equal(p.element('quiz-success').hidden, true);
  assert.equal(p.element('oferta-escondida').hidden, true);
  p.advance(1);
  assert.equal(p.element('quiz-success').hidden, false);
  assert.equal(p.element('quiz-success').textContent, '✅ Your presentation is ready.');
  assert.equal(p.element('quiz-message').textContent, '⚠️ Your answers have been received.');
  p.advance(999);
  assert.equal(p.element('oferta-escondida').hidden, true);
  p.advance(1);
  assert.equal(p.element('oferta-escondida').hidden, false);
  assert.equal(p.element('oferta-escondida').attributes.get('aria-hidden'), 'false');
  assert.equal(p.element('quiz-loading').hidden, true);
  assert.equal(p.element('quiz-result').hidden, true);
  assert.equal(p.element('oferta-escondida').focused, true);
  assert.equal(p.element('oferta-escondida').scrollOptions.behavior, 'smooth');
  assert.equal(p.element('quiz-result').attributes.get('aria-busy'), 'false');
  assert.ok(p.element('quiz-message').classes.has('quiz-warning'));
});

test('checkout scroll respects the reduced-motion preference', () => {
  const p = page('', true);
  p.completeQuiz();
  p.advance(5000);
  assert.equal(p.element('oferta-escondida').hidden, false);
  assert.equal(p.element('oferta-escondida').scrollOptions.behavior, 'instant');
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

test('VSL cannot reveal early during the five-second loading sequence', () => {
  const p = page();
  p.completeQuiz();
  p.advance(2000);
  const warning = p.element('quiz-message').textContent;
  p.videoTime(2505);
  assert.equal(p.element('oferta-escondida').hidden, true);
  p.advance(2999);
  assert.equal(p.element('oferta-escondida').hidden, true);
  p.advance(1);
  assert.equal(p.element('oferta-escondida').hidden, false);
  assert.equal(p.element('quiz-message').textContent, warning);
  assert.equal(p.element('quiz-result').attributes.get('aria-busy'), 'false');
});
