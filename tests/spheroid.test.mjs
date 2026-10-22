import test from 'node:test';
import assert from 'node:assert/strict';
import { depolarization, spheroidModel } from '../web/spheroid.js';
import { model } from '../web/mie.js';

test('Depolarization factors agree with independent ellipsoid integral', () => {
  for (const q of [0.25, 0.5, 0.95, 1, 1.05, 2, 4]) {
    const N = 20000;
    const integrand = t => {
      if (t === 1) return 0;
      const s = t / (1 - t);
      return q / (2 * (s + 1) * (s + q * q) ** 1.5 * (1 - t) ** 2);
    };
    let sum = integrand(0);
    for (let i = 1; i < N; i++) sum += (i % 2 ? 4 : 2) * integrand(i / N);
    const expected = sum / (3 * N), f = depolarization(q);
    assert.ok(Math.abs(f.axial - expected) < 1e-6, `q=${q}`);
    assert.equal(f.axial + 2 * f.transverse, 1);
  }
});
test('Sphere limit recovers Rayleigh efficiency and Mie small-particle angular intensity', () => {
  const r = 0.005, w = 0.55, n = 1.5, s = spheroidModel(r, w, n, 0, 1);
  const rayleigh = 8 / 3 * s.x ** 4 * ((n * n - 1) / (n * n + 2)) ** 2;
  assert.ok(Math.abs(s.qsca / rayleigh - 1) < 1e-6);
  const mie = model(r, w, n);
  assert.ok(Math.abs(s.qsca / mie.qsca - 1) < 0.005);
  for (const theta of [0, 0.5, 1, Math.PI / 2, Math.PI]) {
    const actual = s.evaluate(theta, 0.7);
    assert.ok(Math.abs(actual.total / s.peak - (1 + Math.cos(theta) ** 2) / 2) < 1e-12);
  }
});
test('Spheroid responds to azimuth, preserves volume, and uses full linear polarization', () => {
  const s = spheroidModel(0.008, 0.55, 1.5, 0.1, 2);
  assert.ok(Math.abs(s.a * s.a * s.c / 0.008 ** 3 - 1) < 1e-12);
  assert.notEqual(s.evaluate(1, 0).total, s.evaluate(1, Math.PI / 2).total);
  const offPlane = s.evaluate(0, Math.PI / 4);
  assert.ok(offPlane.dolp > 0.01);
  assert.ok(Math.abs(offPlane.signedPolarization) < 1e-12);
});
test('Angular integral agrees with Qsca for fixed orientation', () => {
  const r = 0.008, w = 0.55, s = spheroidModel(r, w, 1.7, 0.2, 0.4);
  let integral = 0;
  const N = 160, M = 64;
  for (let i = 0; i < N; i++) {
    const mu = -1 + 2 * (i + 0.5) / N;
    for (let j = 0; j < M; j++) integral += s.evaluate(Math.acos(mu), 2 * Math.PI * j / M).total * 2 / N * 2 * Math.PI / M;
  }
  const q = integral / ((2 * Math.PI / w) ** 2 * Math.PI * r * r);
  assert.ok(Math.abs(q / s.qsca - 1) < 1e-4);
});
test('Passive spheroids conserve energy and reject unsupported sizes', () => {
  for (const aspect of [0.25, 0.5, 1, 2, 4]) for (const n of [1.01, 1.5, 2]) for (const k of [0, 0.001, 0.1, 1]) {
    const s = spheroidModel(0.004, 0.8, n, k, aspect);
    assert.ok(s.qabs >= 0); assert.ok(s.ssa > 0 && s.ssa <= 1 + 1e-12);
    assert.ok(Math.abs(s.qext - s.qsca - s.qabs) < 1e-12);
    if (k === 0) assert.equal(s.qabs, 0);
    for (const theta of [0, 1, 2, Math.PI]) for (const phi of [0, 0.4, 1.2]) {
      const v = s.evaluate(theta, phi);
      assert.ok(Number.isFinite(v.total) && v.total >= 0);
      assert.ok(v.total <= s.peak * (1 + 1e-12));
      assert.ok(v.dolp >= 0 && v.dolp <= 1);
    }
  }
  assert.throws(() => spheroidModel(0.08, 0.55, 1.5, 0, 2), RangeError);
  assert.throws(() => depolarization(0), RangeError);
});
