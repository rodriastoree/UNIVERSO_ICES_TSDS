const CACHE = 'ices-activity-v4-20261026-10';
// La bienvenida y la animación usan solo recursos locales y funcionan sin conexión.
const ASSETS = ['./', './index.html', './actividad.html', './welcome.css', './welcome.js', './intro.css', './intro.js', './offline.js', './activity.css', './app.js', './journey.js', './catalog.js', './validation.js', './experience.js', './storage.js', './sheet-theme.js', './ices-logo-web.png', './favicon.svg'];
const assetURLs = new Set(ASSETS.map(path => new URL(path, self.location).href));
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith('ices-activity-') && key !== CACHE).map(key => caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !assetURLs.has(event.request.url)) return;
  event.respondWith((async () => (await (await caches.open(CACHE)).match(event.request)) || fetch(event.request))());
});
