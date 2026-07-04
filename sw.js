// Service worker da Estação: shell 100% offline, cache-first.
// Bump manual do CACHE a cada deploy — é o "sistema de build" do projeto.
const CACHE = 'chs-v1';

const SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/ui.js',
  './js/weather.js',
  './js/geocode.js',
  './js/content.js',
  './js/comedy.js',
  './js/rng.js',
  './js/storage.js',
  './js/audio.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Open-Meteo NÃO passa por aqui: o fallback vive no weather.js/localStorage,
  // onde o timestamp fica visível pra UI fazer piada com a idade do dado.
  if (url.hostname.endsWith('open-meteo.com')) return;
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
    )
  );
});
