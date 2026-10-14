// Guarda la app entera en el móvil para que funcione sin conexión.
const CACHE = 'test-oposiciones-v2';
const FILES = ['./', 'index.html', 'tests.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png',
  'fonts/bricolage-grotesque-latin-400-normal.woff2',
  'fonts/bricolage-grotesque-latin-600-normal.woff2',
  'fonts/bricolage-grotesque-latin-700-normal.woff2',
  'fonts/ibm-plex-mono-latin-400-normal.woff2',
  'fonts/ibm-plex-mono-latin-600-normal.woff2',
  'fonts/source-serif-4-latin-400-normal.woff2',
  'fonts/source-serif-4-latin-600-normal.woff2',
  'lib/pdf.min.js',
  'lib/pdf.worker.min.js',
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // index.html y tests.json: primero la red (para recibir tests nuevos), y si no hay conexión, la copia guardada.
  if (url.origin === location.origin && (e.request.mode === 'navigate' || url.pathname.endsWith('/tests.json') || url.pathname.endsWith('/index.html'))) {
    e.respondWith(fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('index.html'))));
});
