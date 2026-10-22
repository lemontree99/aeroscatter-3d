import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { coefficients, intensity, scatteringEfficiency, extinctionEfficiency, model } from '../web/mie.js';

const reference = JSON.parse(readFileSync(new URL('./absorbing-reference.json', import.meta.url)));
function near(actual, expected) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= 1e-5 * Math.abs(expected) + 1e-18, `${actual} != ${expected}`);
}
for (const c of reference.cases) test(`absorbing n=${c.n}, kappa=${c.kappa}, x=${c.x}`, () => {
  const coeff = coefficients(c.x, c.n, c.kappa);
  const qsca = scatteringEfficiency(coeff, c.x), qext = extinctionEfficiency(coeff, c.x);
  near(qsca, c.qsca); near(qext, c.qext); near(qext - qsca, c.qabs);
  for (const angle of c.angular) {
    const s = intensity(coeff, Math.cos(angle.theta * Math.PI / 180));
    near(s.perpendicular, angle.perpendicular); near(s.parallel, angle.parallel);
  }
});
test('Passive-sphere sweep: energy closure, nonnegative absorption, bounded SSA', () => {
  for (const r of [0.02, 0.08, 0.5, 1]) for (const wavelength of [0.4, 0.55, 0.8]) for (const n of [1.01, 1.5, 2]) for (const k of [0, 0.001, 0.1, 1]) {
    const s = model(r, wavelength, n, k);
    assert.ok(s.qabs >= 0 && Number.isFinite(s.qabs));
    assert.ok(s.ssa >= 0 && s.ssa <= 1 + 1e-12);
    assert.ok(Math.abs(s.qext - s.qsca - s.qabs) < 1e-12);
    if (k === 0) { assert.equal(s.qabs, 0); near(s.ssa, 1); }
    for (const mu of [-1, 0, 1]) {
      const a = intensity(s.coeff, mu);
      assert.ok(a.total >= 0 && Number.isFinite(a.total));
      assert.ok(Math.abs(a.signedPolarization) <= 1 + 1e-12);
      if (Math.abs(mu) === 1) assert.ok(Math.abs(a.signedPolarization) < 1e-12);
    }
  }
});
test('Negative, nonfinite and out-of-range absorption are rejected, not sign-flipped', () => {
  for (const k of [-0.01, NaN, Infinity, 1.01]) {
    assert.throws(() => coefficients(2, 1.5, k), RangeError);
    assert.throws(() => model(0.08, 0.55, 1.5, k), RangeError);
  }
});
