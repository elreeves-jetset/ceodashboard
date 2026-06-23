// myCEO Dashboard — Service Worker
// Caches the app for full offline use on iPhone

const CACHE = 'myceo-v4';
const ASSETS = [
  './dashboard.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache static assets immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: delete all old cache versions immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first for HTML (always gets latest), cache first for assets
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document' ||
                 url.pathname.endsWith('.html') ||
                 url.pathname === '/' ||
                 url.pathname.endsWith('/');

  if (isHTML) {
    // Network first for HTML — always show the latest version
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          if (resp && resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(e.request)) // fallback to cache if offline
    );
  } else {
    // Cache first for icons, manifest etc.
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
