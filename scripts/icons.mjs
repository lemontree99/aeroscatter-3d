// Deterministic first-party raster icons. No image library or network needed.
import { deflateSync } from 'node:zlib';
import { writeFile, mkdir } from 'node:fs/promises';
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const b of buffer) { crc ^= b; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}
const directory = new URL('../web/icons/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const size of [192, 512]) {
  const pixels = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const X = (x + 0.5) / size * 512 - 256, Y = (y + 0.5) / size * 512 - 256;
    let color = [16, 45, 59];
    for (const a of [0, Math.PI / 3, 2 * Math.PI / 3]) {
      const u = X * Math.cos(a) + Y * Math.sin(a), v = -X * Math.sin(a) + Y * Math.cos(a);
      if (Math.abs(Math.sqrt((u / 142) ** 2 + (v / 72) ** 2) - 1) < 0.035) color = [114, 197, 202];
    }
    if ((Math.abs(Y) < 5 && Math.abs(X) > 56 && Math.abs(X) < 178) || X * X + Y * Y < 29 ** 2) color = [224, 237, 240];
    const offset = y * (1 + size * 3) + 1 + x * 3;
    color.forEach((v, i) => pixels[offset + i] = v);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 2;
  const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
  await writeFile(new URL(`icon-${size}.png`, directory), png);
}
console.log('Generated 192px and 512px icons.');
