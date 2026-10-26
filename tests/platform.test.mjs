import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import vm from 'node:vm';
test('las cabeceras de Vercel coinciden con las comprobadas localmente', async () => {
  const headers = JSON.parse(await readFile('security-headers.json', 'utf8')), config = JSON.parse(await readFile('vercel.json', 'utf8'));
  assert.deepEqual(Object.fromEntries(config.headers[0].headers.map(h => [h.key, h.value])), headers);
  assert.match(headers['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
});
test('el servidor entrega imágenes con tipo correcto, errores comprensibles y cabeceras de protección', async t => {
  const server = spawn(process.execPath, ['dev-server.mjs'], { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => server.kill());
  const url = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Servidor sin respuesta')), 10000);
    server.once('error', reject); server.stdout.on('data', chunk => { const match = String(chunk).match(/http:\/\/[^\s]+/); if (match) { clearTimeout(timeout); resolve(match[0]); } });
  });
  const response = await fetch(url); assert.equal(response.status, 200); assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
  assert.match(await response.text(), /Tres|tres funciones/);
  const image = await fetch(url + '/ices-logo-web.png'); assert.equal(image.headers.get('content-type'), 'image/png');
  assert.ok(Number(image.headers.get('content-length') || (await image.arrayBuffer()).byteLength) < 60000);
  const missing = await fetch(url + '/no-existe'); assert.equal(missing.status, 404); assert.match(await missing.text(), /No encontramos/);
  assert.equal((await fetch(url, { method: 'POST' })).status, 405);
  assert.equal((await fetch(url + '/%2f..%2fpackage.json')).status, 403);
  const video = await fetch(url + '/media/video-stand.mp4', { headers: { Range: 'bytes=0-31' } });
  assert.equal(video.status, 206); assert.equal(video.headers.get('content-type'), 'video/mp4');
  assert.match(video.headers.get('content-range'), /^bytes 0-31\/\d+$/); assert.equal((await video.arrayBuffer()).byteLength, 32);
  const invalidRange = await fetch(url + '/media/video-stand.mp4', { headers: { Range: 'bytes=999999999-' } });
  assert.equal(invalidRange.status, 416);
  const videoHead = await fetch(url + '/media/video-stand.mp4', { method: 'HEAD' });
  assert.equal(videoHead.status, 200); assert.equal(Number(videoHead.headers.get('content-length')), 4503853);
});
test('la actividad en caché sigue sirviendo recursos cuando la red no responde', async () => {
  const handlers = {}, cachesMap = new Map([['otro-sitio', new Map()], ['ices-activity-antiguo', new Map()]]);
  const location = 'https://actividad.test/sw.js';
  const caches = {
    keys: async () => [...cachesMap.keys()], delete: async key => cachesMap.delete(key),
    open: async key => {
      if (!cachesMap.has(key)) cachesMap.set(key, new Map()); const values = cachesMap.get(key);
      return { addAll: async paths => { for (const path of paths) { const content = await readFile('public/' + (path === './' ? 'index.html' : path.slice(2))); values.set(new URL(path, location).href, content); } }, match: async req => values.get(req.url) };
    }
  };
  let claimed = false;
  vm.runInNewContext(await readFile('public/sw.js', 'utf8'), { URL, Set, caches, fetch: async () => { throw new Error('Sin red'); }, self: { location, clients: { claim: async () => { claimed = true; } }, addEventListener: (key, handler) => { handlers[key] = handler; } } });
  let completion;
  handlers.install({ waitUntil: promise => { completion = promise; } }); await completion;
  handlers.activate({ waitUntil: promise => { completion = promise; } }); await completion;
  assert.equal(claimed, true); assert.equal(cachesMap.has('otro-sitio'), true); assert.equal(cachesMap.has('ices-activity-antiguo'), false);
  for (const path of ['/', '/index.html', '/actividad.html', '/welcome.js', '/welcome.css', '/app.js', '/activity.css', '/ices-logo-web.png', '/media/video-stand-poster.jpg']) {
    let response;
    handlers.fetch({ request: { method: 'GET', url: 'https://actividad.test' + path }, respondWith: promise => { response = promise; } });
    assert.ok((await response).length > 0, path);
  }
  let intercepted = false;
  handlers.fetch({ request: { method: 'GET', url: 'https://externo.test/otro' }, respondWith: () => { intercepted = true; } });
  assert.equal(intercepted, false);
  handlers.fetch({ request: { method: 'GET', url: 'https://actividad.test/media/video-stand.mp4' }, respondWith: () => { intercepted = true; } });
  assert.equal(intercepted, false, 'el video no se descarga ni se intercepta como parte de la caché de la actividad');
});
