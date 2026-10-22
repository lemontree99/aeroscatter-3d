export const radians = degrees => degrees * Math.PI / 180;
export const add = (a, b, scale = 1) => a.map((v, i) => v + scale * b[i]);

// Incident k = +X. Changing azimuth rotates the scattering plane about X.
export function scatteringBasis(theta, phi) {
  return {
    direction: [Math.cos(theta), Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi)],
    parallel: [-Math.sin(theta), Math.cos(theta) * Math.cos(phi), Math.cos(theta) * Math.sin(phi)],
    perpendicular: [0, -Math.sin(phi), Math.cos(phi)],
    radial: [0, Math.cos(phi), Math.sin(phi)]
  };
}
