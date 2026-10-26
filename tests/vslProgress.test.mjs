import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { clearProgress, PROGRESS_KEY, readProgress, saveProgress } from '../src/vslProgress.ts';

let items;
beforeEach(() => {
  items = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => items.get(key) ?? null,
      setItem: (key, value) => items.set(key, value),
      removeItem: key => items.delete(key),
    },
  });
});

test('saves per-video progress only after five seconds', () => {
  for (const time of [0, 5, -1, NaN, Infinity]) saveProgress(time, 600);
  assert.equal(readProgress(), null);
  saveProgress(123.5, 600);
  assert.equal(readProgress().time, 123.5);
  assert.equal(readProgress().duration, 600);
  assert(PROGRESS_KEY.endsWith('6adf45c8f9793299f8e5f7ae'));
});

test('clears progress in the last five seconds or at the end', () => {
  for (const time of [595, 599, 600, 601]) {
    saveProgress(50, 600);
    saveProgress(time, 600);
    assert.equal(readProgress(), null);
  }
  saveProgress(594.9, 600);
  assert.equal(readProgress().time, 594.9);
  clearProgress();
  assert.equal(readProgress(), null);
});

test('the new VSL does not resume progress from the previous video', () => {
  const oldKey = 'vsl_progress_6ad7e101b1390d33e6d77503';
  const previous = JSON.stringify({ time: 2600, duration: 3600, updatedAt: Date.now() });
  items.set(oldKey, previous);
  assert.equal(readProgress(), null);
  saveProgress(30, 3600);
  assert.equal(readProgress().time, 30);
  assert.equal(items.get(oldKey), previous);
  assert.notEqual(PROGRESS_KEY, oldKey);
});

test('expires after seven days, removes malformed and invalid records', () => {
  const now = Date.now();
  for (const record of [
    '{broken', 'null', JSON.stringify({ time: '30', updatedAt: now }),
    JSON.stringify({ time: 30 }),
    JSON.stringify({ time: 30, updatedAt: now - 7 * 86400000 - 1 }),
    JSON.stringify({ time: 30, updatedAt: now + 86400000 }),
    JSON.stringify({ time: 30, updatedAt: now, duration: 34 }),
    JSON.stringify({ time: 30, updatedAt: now, duration: -1 }),
  ]) {
    items.set(PROGRESS_KEY, record);
    assert.equal(readProgress(), null);
    assert.equal(items.has(PROGRESS_KEY), false);
  }
  items.set(PROGRESS_KEY, JSON.stringify({ time: 30, updatedAt: now - 6 * 86400000 }));
  assert.equal(readProgress().time, 30);
});

test('unknown duration does not discard valid progress', () => {
  for (const duration of [undefined, 0, NaN, Infinity]) {
    saveProgress(20, duration);
    assert.equal(readProgress().time, 20);
    assert.equal(readProgress().duration, undefined);
  }
});

test('blocked storage never interrupts playback', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('Storage blocked'); },
  });
  assert.doesNotThrow(() => saveProgress(50, 600));
  assert.doesNotThrow(clearProgress);
  assert.equal(readProgress(), null);
});
