import { mkdir, cp, readdir, readFile, writeFile } from 'node:fs/promises';
import { bundle } from './bundle.mjs';
await bundle();
const source = new URL('../web/', import.meta.url), target = new URL('../dist/', import.meta.url);
await mkdir(target, { recursive: true });
for (const entry of await readdir(source)) await cp(new URL(entry, source), new URL(entry, target), { recursive: true });
// Portable single file for opening from chat/Finder; no adjacent JS/CSS required.
let standalone = await readFile(new URL('index.html', source), 'utf8');
standalone = standalone.replace(/(href|src)="(\.\/[^"?]+)\?v=[^"]*"/g, '$1="$2"');
const css = await readFile(new URL('styles.css', source), 'utf8');
const icon = await readFile(new URL('icons/icon.svg', source), 'utf8');
standalone = standalone.replace('  <link rel="stylesheet" href="./styles.css">', `<style>${css}</style>`)
  .replace(/^  <link rel="(?:manifest|apple-touch-icon)"[^>]+>\n/gm, '')
  .replaceAll('./icons/icon.svg', 'data:image/svg+xml,' + encodeURIComponent(icon));
for (const name of ['startup.js', 'app.bundle.js']) {
  const script = (await readFile(new URL(name, source), 'utf8')).replaceAll('</script', '<\\/script');
  standalone = standalone.replace(`  <script defer src="./${name}"></script>`, '');
  standalone = standalone.replace('</body>', `<script>${script}</script>\n</body>`);
}
await writeFile(new URL('../AeroScatter.html', import.meta.url), standalone);
console.log('静态站点已生成：dist/（无依赖，无编译器）');
console.log('独立单文件已生成：AeroScatter.html');
