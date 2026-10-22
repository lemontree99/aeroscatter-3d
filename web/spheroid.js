// Electric dipole approximation, symmetry axis +Z, incident propagation +X.
// alpha is in volume units / (4 pi epsilon0). Radiation reaction enforces passivity.
export function depolarization(aspect) {
  if (!Number.isFinite(aspect) || aspect < 0.25 || aspect > 4) throw new RangeError('轴比 c/a 支持 0.25–4。');
  let axial;
  if (Math.abs(aspect - 1) < 1e-4) {
    const d = aspect - 1;
    axial = 1 / 3 - 4 * d / 15 + 6 * d * d / 35;
  } else if (aspect > 1) {
    const e = Math.sqrt(1 - 1 / aspect ** 2);
    axial = (1 - e * e) / (2 * e ** 3) * (Math.log((1 + e) / (1 - e)) - 2 * e);
  } else {
    const e = Math.sqrt(1 / aspect ** 2 - 1);
    axial = (1 + e * e) / e ** 3 * (e - Math.atan(e));
  }
  return { axial, transverse: (1 - axial) / 2 };
}

export function spheroidModel(radius, wavelength, index, kappa, aspect) {
  if (![radius, wavelength, index, kappa].every(Number.isFinite) || radius <= 0 || wavelength <= 0 || index < 1.01 || index > 2 || kappa < 0 || kappa > 1) throw new RangeError('无效的椭球尺寸、波长或折射率。');
  const factors = depolarization(aspect), wave = 2 * Math.PI / wavelength;
  const a = radius / Math.cbrt(aspect), c = radius * aspect ** (2 / 3);
  const validity = Math.max(1, Math.hypot(index, kappa)) * wave * Math.max(a, c);
  if (validity > 0.3) throw new RangeError('椭球近似要求 |m|·2π·最大半轴/λ ≤ 0.3。请减小等体积半径，或点击“小粒子椭球示例”。');
  const delta = [index ** 2 - kappa ** 2 - 1, 2 * index * kappa];
  function polarizability(L) {
    const dr = 1 + L * delta[0], di = L * delta[1], den = dr * dr + di * di;
    const re = radius ** 3 / 3 * (delta[0] * dr + delta[1] * di) / den;
    const im = radius ** 3 / 3 * (delta[1] * dr - delta[0] * di) / den;
    const reaction = 2 / 3 * wave ** 3;
    const rr = 1 + reaction * im, ri = -reaction * re, norm = rr * rr + ri * ri;
    return [(re * rr + im * ri) / norm, (im * rr - re * ri) / norm];
  }
  const transverse = polarizability(factors.transverse), axial = polarizability(factors.axial);
  const t2 = transverse[0] ** 2 + transverse[1] ** 2, z2 = axial[0] ** 2 + axial[1] ** 2;
  const mean2 = (t2 + z2) / 2, area = Math.PI * radius ** 2;
  const qsca = 8 * Math.PI / 3 * wave ** 4 * mean2 / area;
  const qext = 4 * Math.PI * wave * (transverse[1] + axial[1]) / 2 / area;
  const difference = qext - qsca;
  const qabs = Math.abs(difference) < 1e-12 * Math.max(1, qext) ? 0 : difference;
  function evaluate(theta, phi = 0) {
    const mu = Math.cos(theta), cp = Math.cos(phi), sp = Math.sin(phi), factor = wave ** 6;
    const perpendicular = factor * (t2 * sp * sp + z2 * cp * cp);
    const parallel = factor * mu * mu * (t2 * cp * cp + z2 * sp * sp);
    const cross = factor * mu * sp * cp * (z2 - t2), sum = perpendicular + parallel;
    return { perpendicular, parallel, total: sum / 2,
      signedPolarization: sum ? (perpendicular - parallel) / sum : 0,
      dolp: sum ? Math.min(1, Math.hypot(perpendicular - parallel, 2 * cross) / sum) : 0 };
  }
  const samples = Array.from({ length: 721 }, (_, i) => evaluate(i * Math.PI / 720));
  return { x: wave * radius, samples, evaluate, peak: wave ** 6 * mean2, qsca, qext, qabs, ssa: qsca / qext, a, c, validity, aspect };
}
