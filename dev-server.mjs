import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./public/', import.meta.url));
const headers = JSON.parse(await readFile(new URL('./security-headers.json', import.meta.url), 'utf8'));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  const base = { ...headers, 'Cache-Control': 'no-store' };
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { ...base, Allow: 'GET, HEAD' }); res.end(); return; }
  try {
    const url = new URL(req.url, 'http://localhost'), pathname = decodeURIComponent(url.pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(path.resolve(root) + path.sep)) { res.writeHead(403, base); res.end('Forbidden'); return; }
    const data = await readFile(file);
    res.writeHead(200, { ...base, 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404, { ...base, 'Content-Type': 'text/html; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : await readFile(path.join(root, '404.html')));
  }
});
server.listen(Number(process.env.PORT ?? 4173), process.env.HOST || '127.0.0.1', () => console.log(`Local: http://${process.env.HOST || '127.0.0.1'}:${server.address().port}`));
