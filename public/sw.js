// Fase 3.2 · Service worker básico con los tres eventos base.
const VERSION = 'v1';
const CACHE_SHELL = `cafeguia-shell-${VERSION}`;

const ARCHIVOS_SHELL = [
  './',
  './index.html',
  './css/estilos.css',
  './js/app.js',
  './js/registro-sw.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// 1) install: se descarga y guarda el app shell
self.addEventListener('install', (evento) => {
  console.log('[SW] install', VERSION);
  evento.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => cache.addAll(ARCHIVOS_SHELL))
  );
});

// 2) activate: se borran cachés de versiones anteriores
self.addEventListener('activate', (evento) => {
  console.log('[SW] activate', VERSION);
  evento.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(nombres.filter((n) => n !== CACHE_SHELL).map((n) => caches.delete(n)))
    )
  );
});

// 3) fetch: primero la caché, si no está se va a la red
self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;
  evento.respondWith(
    caches.match(evento.request).then((respuesta) => respuesta || fetch(evento.request))
  );
});
