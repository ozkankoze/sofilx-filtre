// Yerel test sunucusu: dist/ + vercel.json rewrite'ları + api/catalog.mjs (Vercel'i taklit eder)
import http from 'node:http'; import { spawn } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const D = path.resolve('dist');
const T = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };
const cfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const catalog = fs.existsSync('api/catalog.mjs') ? (await import(path.resolve('api/catalog.mjs'))).default : null;
function match(src, url) {
  const names = []; const re = new RegExp('^' + src.replace(/\./g, '\\.').replace(/:(\w+)(\(([^)]+)\))?(\*)?/g, (m, n, g, alt, star) => { names.push(n); return alt ? `(${alt})` : star ? '(.*)' : '([^/]+?)'; }) + '$');
  const m = url.match(re); if (!m) return null; return Object.fromEntries(names.map((n, i) => [n, m[i + 1]]));
}
http.createServer((q, r) => {
  const [p, qs] = q.url.split('?'); const u = decodeURIComponent(p);
  if (u === '/api/catalog') { q.query = Object.fromEntries(new URLSearchParams(qs || '')); return catalog(q, r); }
  { const sf = path.join(D, u); if (u.startsWith('/pimg/') && fs.existsSync(sf)) { r.writeHead(200, { 'Content-Type': 'image/webp' }); return fs.createReadStream(sf).pipe(r); } }
  for (const rw of cfg.rewrites || []) {
    const m = match(rw.source, u); if (!m) continue;
    let dest = rw.destination; for (const [k, v] of Object.entries(m)) dest = dest.split(':' + k + '*').join(v).split(':' + k).join(v);
    if (dest.startsWith('http')) { r.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'max-age=3600' }); return spawn('curl', ['-s', '--retry', '2', dest]).stdout.pipe(r); } // dış rewrite: vekil olarak getir
    const du = new URL(dest, 'http://x'); const sp = new URLSearchParams(qs || ''); for (const [k, v] of du.searchParams) sp.set(k, v);
    q.query = Object.fromEntries(sp); r.setHeader = r.setHeader.bind(r);
    return catalog(q, r);
  }
  const f = path.join(D, u); for (const x of [f, f + '.html', path.join(f, 'index.html')]) if (fs.existsSync(x) && fs.statSync(x).isFile()) { r.writeHead(200, { 'Content-Type': T[path.extname(x)] || 'application/octet-stream' }); return fs.createReadStream(x).pipe(r); }
  r.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); fs.createReadStream(path.join(D, '404.html')).pipe(r);
}).listen(4321);
