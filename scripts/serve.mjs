import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { bundle } from './bundle.mjs';
await bundle();

const root = fileURLToPath(new URL('../web/', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
    const bytes = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(bytes);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.on('error', error => { console.error(`无法启动：${error.message}。可设置 PORT=4174 使用其他端口。`); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${server.address().port}/`;
  console.log(`AeroScatter 3D: ${url}\n停止：Ctrl+C`);
  if (process.argv.includes('--open') && process.platform === 'darwin') spawn('open', [url], { stdio: 'ignore' }).on('error', () => {});
});
