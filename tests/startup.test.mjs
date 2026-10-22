import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { bundle } from '../scripts/bundle.mjs';

await bundle();
const source = await readFile(new URL('../web/app.bundle.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');
function environment(protocol = 'file:') {
  const elements = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m => [m[1], {
    value: '', min: 0, max: 360, checked: false, hidden: false, style: {}, listeners: {},
    addEventListener(name, callback) { this.listeners[name] = callback; }
  }]));
  const ctx = new Proxy({}, { get: (_, key) => key === 'measureText' ? () => ({ width: 40 }) : () => {} });
  Object.assign(elements.scene, { clientWidth: 900, clientHeight: 440, getContext: () => ctx });
  const document = { getElementById: id => elements[id], documentElement: { dataset: {} } };
  const frames = [], timers = [], windowEvents = {};
  const env = {
    document, location: { protocol }, navigator: {}, devicePixelRatio: 1,
    window: { isSecureContext: true, addEventListener: (name, callback) => windowEvents[name] = callback },
    localStorage: { getItem: () => null, setItem() {} },
    getComputedStyle: () => ({ getPropertyValue: () => '#17323c' }),
    requestAnimationFrame: fn => frames.push(fn),
    setTimeout: fn => timers.push(fn), clearTimeout() {},
    ResizeObserver: class { observe() {} }, matchMedia: () => ({ addEventListener() {} })
  };
  return { env, elements, frames, timers, windowEvents };
}
test('Standalone bundle initializes and draws without ES module loading', () => {
  assert.doesNotMatch(source, /^import |^export /m);
  assert.doesNotMatch(html, /<script[^>]*type="module"/);
  const { env, elements, frames } = environment();
  runInNewContext(source, env);
  frames.shift()();
  assert.equal(env.document.documentElement.dataset.appReady, 'true');
  assert.equal(elements['pol-value'].textContent, '99.6%');
  assert.match(elements['offline-status'].textContent, /本地文件模式/);
  elements.theta.value = 0;
  elements.theta.listeners.input();
  assert.equal(elements['pol-value'].textContent, '0.0%');
});
test('Absorption slider recomputes efficiencies and complex-index label', () => {
  const { env, elements, frames } = environment();
  runInNewContext(source, env); frames.shift()();
  const previous = elements['absorption-value'].textContent;
  elements.kappa.value = 0.1; elements.kappa.listeners.input();
  assert.match(elements['complex-index'].textContent, /1.50 \+ 0.100i/);
  assert.notEqual(elements['absorption-value'].textContent, previous);
  assert.equal(elements.error.hidden, true);
});
test('Spheroid example changes model, azimuth responds, and invalid parameters clear stale output', () => {
  const { env, elements, frames } = environment();
  runInNewContext(source, env); frames.shift()();
  elements['ellipsoid-example'].listeners.click();
  assert.equal(elements.error.hidden, true);
  assert.match(elements['shape-status'].textContent, /电偶极近似/);
  const before = elements['intensity-value'].textContent;
  elements.phi.value = 90; elements.phi.listeners.input();
  assert.notEqual(elements['intensity-value'].textContent, before);
  elements.radius.value = 0.1; elements.radius.listeners.input();
  assert.equal(elements.error.hidden, false);
  assert.equal(elements['pol-value'].textContent, '—');
  assert.equal(elements['absorption-value'].textContent, '');
});
test('Pending offline setup cannot block rendering and has a timeout message', () => {
  const { env, elements, frames, timers } = environment('http:');
  env.navigator.serviceWorker = { register: () => new Promise(() => {}) };
  runInNewContext(source, env);
  frames.shift()();
  assert.equal(env.document.documentElement.dataset.appReady, 'true');
  timers.shift()();
  assert.match(elements['offline-status'].textContent, /不影响三维图使用/);
});
test('Missing main script produces an actionable startup failure message', async () => {
  const { env, elements, windowEvents } = environment();
  env.HTMLScriptElement = class {};
  runInNewContext(await readFile(new URL('../web/startup.js', import.meta.url), 'utf8'), env);
  const target = new env.HTMLScriptElement(); target.getAttribute = () => './app.bundle.js';
  windowEvents.error({ target });
  assert.equal(elements.error.hidden, false);
  assert.match(elements.error.textContent, /无法读取 .\/app.bundle.js/);
});
