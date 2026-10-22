import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { coefficients, intensity, scatteringEfficiency, model } from '../web/mie.js';
import { scatteringBasis, radians } from '../web/geometry.js';

// Cross-implementation agreement, not a claim of exact analytical precision.
// The absolute floor avoids meaningless relative errors at near-zero components.
function near(actual, expected, relative = 1e-5, absolute = 1e-18) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= absolute + relative * Math.abs(expected), `${actual} != ${expected}`);
}
const reference = JSON.parse(readFileSync(new URL('./miepython-reference.json', import.meta.url)));
for (const c of reference.cases) test(`miepython ${reference.version}: m=${c.m}, x=${c.x}`, () => {
  const coeff = coefficients(c.x, c.m);
  near(scatteringEfficiency(coeff, c.x), c.qsca);
  for (const a of c.angular) {
    const result = intensity(coeff, Math.cos(radians(a.theta)));
    near(result.perpendicular, a.perpendicular);
    near(result.parallel, a.parallel);
  }
});
test('Rayleigh limit: perpendicular constant, parallel ~ cos²θ, side DoLP ~ 1', () => {
  const coeff = coefficients(0.05, 1.5), side = intensity(coeff, 0);
  near(side.signedPolarization, 1, 1e-6);
  for (const theta of [0, 30, 60, 120, 150, 180]) {
    const mu = Math.cos(radians(theta)), value = intensity(coeff, mu);
    near(value.perpendicular / side.perpendicular, 1, 0.003);
    near(value.parallel / value.perpendicular, mu ** 2, 0.004);
  }
});
test('Forward/backward directions have no net linear polarization', () => {
  for (const m of [1.01, 1.5, 2]) for (const x of [0.05, 1, 5, 16]) {
    const c = coefficients(x, m);
    near(intensity(c, 1).signedPolarization, 0);
    near(intensity(c, -1).signedPolarization, 0);
  }
});
test('Integrated unpolarized intensity agrees with Qsca (Simpson quadrature)', () => {
  for (const x of [0.05, 2, 16]) {
    const c = coefficients(x), steps = 4000;
    let integral = 0;
    for (let i = 0; i <= steps; i++) {
      const mu = -1 + 2 * i / steps, weight = i === 0 || i === steps ? 1 : i % 2 ? 4 : 2;
      integral += weight * intensity(c, mu).total;
    }
    integral *= 2 / steps / 3;
    near(2 * integral / x ** 2, scatteringEfficiency(c, x), 2e-6);
  }
});
test('Geometry: field axes are orthonormal and transverse at every azimuth', () => {
  const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
  for (const theta of [0, 30, 90, 170, 180]) for (const phi of [0, 45, 90, 210, 360]) {
    const { direction, parallel, perpendicular } = scatteringBasis(radians(theta), radians(phi));
    for (const vector of [direction, parallel, perpendicular]) near(dot(vector, vector), 1, 1e-12);
    near(dot(direction, parallel), 0, 0, 1e-14);
    near(dot(direction, perpendicular), 0, 0, 1e-14);
    near(dot(parallel, perpendicular), 0, 0, 1e-14);
    near(perpendicular[0], 0);
  }
});
test('UI parameter corners and sweep produce finite bounded intensities', () => {
  for (const r of [0.02, 0.08, 0.5, 1]) for (const wavelength of [0.4, 0.55, 0.8]) for (const m of [1.01, 1.5, 2]) {
    const result = model(r, wavelength, m);
    assert.ok(result.peak > 0 && Number.isFinite(result.peak));
    assert.ok(result.qsca >= 0 && Number.isFinite(result.qsca));
    for (const s of result.samples) {
      assert.ok(s.total >= 0 && Number.isFinite(s.total));
      assert.ok(Math.abs(s.signedPolarization) <= 1 + 1e-12);
    }
  }
});
test('Invalid inputs fail explicitly', () => {
  for (const x of [0, -1, NaN, Infinity, 17]) assert.throws(() => coefficients(x), RangeError);
  for (const m of [1, NaN, Infinity, 2.1]) assert.throws(() => coefficients(2, m), RangeError);
  assert.throws(() => intensity(coefficients(2), 2), RangeError);
  assert.throws(() => model(0.1, 0, 1.5), RangeError);
});
