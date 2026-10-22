import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const web = new URL('../web/', import.meta.url);
test('Manifest and all precache resources exist; portable relative paths', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', web)));
  assert.equal(manifest.scope, './');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const png = await readFile(new URL(icon.src, web));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    const size = Number(icon.sizes.split('x')[0]);
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  const script = await readFile(new URL('sw.js', web), 'utf8');
  const events = {};
  let assets;
  const caches = { open: async () => ({ addAll: async paths => { assets = paths; } }) };
  runInNewContext(script, { self: { addEventListener: (name, handler) => events[name] = handler }, caches });
  let installed;
  events.install({ waitUntil: promise => installed = promise });
  await installed;
  assert.ok(assets.length >= 10);
  for (const asset of assets) {
    assert.ok(asset.startsWith('./'));
    await readFile(new URL(asset === './' ? './index.html' : asset, web));
  }
});
test('Service worker uses cached assets when network is unavailable', async () => {
  const events = {}, cachedResponse = { ok: true, source: 'offline cache' };
  let networkCalls = 0;
  runInNewContext(await readFile(new URL('sw.js', web), 'utf8'), {
    URL,
    self: { location: { origin: 'https://example.org' }, registration: { scope: 'https://example.org/aeroscatter/' }, addEventListener: (name, handler) => events[name] = handler },
    caches: { match: async () => cachedResponse },
    fetch: () => { networkCalls++; throw new Error('offline'); }
  });
  let response;
  events.fetch({ request: { method: 'GET', url: 'https://example.org/aeroscatter/index.html' }, respondWith: promise => response = promise });
  assert.equal(await response, cachedResponse);
  assert.equal(networkCalls, 0);
  response = undefined;
  events.fetch({ request: { method: 'GET', url: 'https://other.org/' }, respondWith: promise => response = promise });
  assert.equal(response, undefined);
});
