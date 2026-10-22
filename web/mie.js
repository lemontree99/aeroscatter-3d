// Passive homogeneous sphere: m = n + i*kappa, exp(-i*omega*t), outgoing h^(1).
// [real, imaginary] complex pairs. Intensity amplitudes use Wiscombe normalization.
function complexMultiply(a, b) {
  return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
}
function complexDivide(a, b) {
  const denominator = b[0] ** 2 + b[1] ** 2;
  return [(a[0] * b[0] + a[1] * b[1]) / denominator, (a[1] * b[0] - a[0] * b[1]) / denominator];
}
export function coefficients(x, nReal = 1.5, kappa = 0) {
  if (!Number.isFinite(x) || x < 0.05 || x > 16 || !Number.isFinite(nReal) || nReal < 1.01 || nReal > 2 || !Number.isFinite(kappa) || kappa < 0 || kappa > 1) {
    throw new RangeError('支持范围：0.05 ≤ x ≤ 16，1.01 ≤ n ≤ 2，0 ≤ κ ≤ 1。');
  }
  const m = [nReal, kappa];
  const stop = Math.ceil(x + 4 * Math.cbrt(x) + 2);
  const N = Math.ceil(Math.max(stop, Math.hypot(...m) * x)) + 35;
  const D = Array.from({ length: N + 1 }, () => [0, 0]), z = m.map(v => v * x);
  for (let n = N; n > 0; n--) {
    const t = complexDivide([n, 0], z);
    const reciprocal = complexDivide([1, 0], [D[n][0] + t[0], D[n][1] + t[1]]);
    D[n - 1] = [t[0] - reciprocal[0], t[1] - reciprocal[1]];
  }
  let p0 = Math.sin(x), p1 = Math.sin(x) / x - Math.cos(x);
  let c0 = Math.cos(x), c1 = Math.cos(x) / x + Math.sin(x);
  const out = [];
  function ratio(factor) {
    const numerator = [factor[0] * p1 - p0, factor[1] * p1];
    const denominator = complexMultiply(factor, [p1, -c1]);
    denominator[0] -= p0; denominator[1] += c0;
    return complexDivide(numerator, denominator);
  }
  for (let n = 1; n <= stop; n++) {
    const A = complexDivide(D[n], m), B = complexMultiply(m, D[n]);
    A[0] += n / x; B[0] += n / x;
    out.push({ n, a: ratio(A), b: ratio(B) });
    const pn = (2 * n + 1) * p1 / x - p0, cn = (2 * n + 1) * c1 / x - c0;
    p0 = p1; p1 = pn; c0 = c1; c1 = cn;
  }
  return out;
}

export function intensity(coeff, mu) {
  if (!Number.isFinite(mu) || Math.abs(mu) > 1) throw new RangeError('cos θ 必须在 [-1, 1] 内。');
  let previous = 0, pi = 1;
  const s1 = [0, 0], s2 = [0, 0];
  for (const { n, a, b } of coeff) {
    const tau = n * mu * pi - (n + 1) * previous, f = (2 * n + 1) / (n * (n + 1));
    for (let j = 0; j < 2; j++) {
      s1[j] += f * (a[j] * pi + b[j] * tau);
      s2[j] += f * (a[j] * tau + b[j] * pi);
    }
    const next = ((2 * n + 1) * mu * pi - (n + 1) * previous) / n;
    previous = pi; pi = next;
  }
  const perpendicular = s1[0] ** 2 + s1[1] ** 2;
  const parallel = s2[0] ** 2 + s2[1] ** 2;
  const sum = perpendicular + parallel;
  return { perpendicular, parallel, total: sum / 2, signedPolarization: sum > 0 ? (perpendicular - parallel) / sum : 0 };
}

export function scatteringEfficiency(coeff, x) {
  return 2 / x ** 2 * coeff.reduce((sum, { n, a, b }) => sum + (2 * n + 1) * (a[0] ** 2 + a[1] ** 2 + b[0] ** 2 + b[1] ** 2), 0);
}

export function extinctionEfficiency(coeff, x) {
  return 2 / x ** 2 * coeff.reduce((sum, { n, a, b }) => sum + (2 * n + 1) * (a[0] + b[0]), 0);
}

export function model(radius, wavelength, index, kappa = 0) {
  if (![radius, wavelength, index].every(Number.isFinite) || radius <= 0 || wavelength <= 0) throw new RangeError('半径、波长必须为正数。');
  const x = 2 * Math.PI * radius / wavelength, coeff = coefficients(x, index, kappa);
  const samples = Array.from({ length: 721 }, (_, i) => intensity(coeff, Math.cos(i * Math.PI / 720)));
  const qsca = scatteringEfficiency(coeff, x), qext = extinctionEfficiency(coeff, x);
  const difference = qext - qsca;
  const qabs = Math.abs(difference) < 1e-12 * Math.max(1, qext) ? 0 : difference;
  return { x, coeff, samples, peak: Math.max(...samples.map(s => s.total)), qsca, qext, qabs, ssa: qsca / qext };
}
