// Offline: pliki aplikacji w pamięci podręcznej. Strona główna — najpierw sieć (żeby dotarły aktualizacje), bez sieci z pamięci.
const CACHE = 'jedzenie-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
const SCOPE = new URL(self.registration.scope).pathname;
const mine = u => u.origin === location.origin && u.pathname.startsWith(SCOPE) && !u.pathname.slice(SCOPE.length).includes('/');

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('jedzenie-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !mine(new URL(req.url))) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
