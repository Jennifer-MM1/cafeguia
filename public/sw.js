// =====================================================================
// CaféGuía · Service worker
// Fase 3: eventos base · Fase 7: estrategias de caché y offline
// Fase 8: Background Sync · Fase 9: ciclo de vida · Fase 10: push
// =====================================================================

// La misma capa IndexedDB que usa la página (expone self.CafeDB)
importScripts('./js/db.js');

// Cambia este número en cada publicación: el navegador detecta un sw.js
// distinto, instala la versión nueva y se borran las cachés viejas.
const VERSION = 'v14';
const CACHE_SHELL = `cafeguia-shell-${VERSION}`;
const CACHE_DATOS = `cafeguia-datos-${VERSION}`;
const CACHE_RECURSOS = `cafeguia-recursos-${VERSION}`;

// App shell: todo lo necesario para arrancar sin red
const ARCHIVOS_SHELL = [
  './',
  './index.html',
  './offline.html',
  './css/estilos.css',
  './js/app.js',
  './js/db.js',
  './js/registro-sw.js',
  './js/enrutador.js',
  './js/api.js',
  './js/util.js',
  './js/iconos.js',
  './fonts/bricolage-grotesque.woff2',
  './js/instalacion.js',
  './js/preferencias.js',
  './js/conexion.js',
  './js/resenas.js',
  './js/notificaciones.js',
  './js/dispositivo.js',
  './js/hidratar.js',
  './js/vistas/inicio.js',
  './js/vistas/catalogo.js',
  './js/vistas/ficha.js',
  './js/vistas/cerca.js',
  './js/vistas/ajustes.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ---------------------------------------------------------------------
// install: guarda el shell
// ---------------------------------------------------------------------
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => cache.addAll(ARCHIVOS_SHELL))
  );
});

// ---------------------------------------------------------------------
// activate: borra cachés de versiones anteriores
// ---------------------------------------------------------------------
self.addEventListener('activate', (evento) => {
  const vigentes = [CACHE_SHELL, CACHE_DATOS, CACHE_RECURSOS];
  evento.waitUntil(
    caches.keys().then((nombres) => Promise.all(
      nombres.filter((n) => n.startsWith('cafeguia-') && !vigentes.includes(n))
        .map((n) => caches.delete(n))
    ))
      // Fase 9.1 · clients.claim(): el SW nuevo controla de inmediato las pestañas
      // abiertas, sin esperar a que el usuario recargue.
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------
// Fase 9.1 · skipWaiting bajo demanda.
// Una versión nueva se queda en "waiting" hasta que el usuario acepta el aviso;
// así no se cambia el código a mitad de lo que está haciendo.
// ---------------------------------------------------------------------
self.addEventListener('message', (evento) => {
  if (evento.data?.tipo === 'SKIP_WAITING') self.skipWaiting();
  if (evento.data?.tipo === 'VERSION') evento.source?.postMessage({ tipo: 'VERSION', version: VERSION });
});

// ---------------------------------------------------------------------
// Las tres estrategias
// ---------------------------------------------------------------------

// 1) Cache first: para el shell, que casi nunca cambia (cambia con VERSION).
async function primeroCache(request) {
  const enCache = await caches.match(request, { ignoreSearch: true });
  if (enCache) return enCache;
  const respuesta = await fetch(request);
  if (respuesta.ok) (await caches.open(CACHE_SHELL)).put(request, respuesta.clone());
  return respuesta;
}

// 2) Network first: para datos (catálogo, reseñas, páginas SSR).
//    Siempre se intenta lo más reciente; si no hay red, se usa la última copia.
async function primeroRed(request, nombreCache = CACHE_DATOS) {
  const cache = await caches.open(nombreCache);
  try {
    const respuesta = await fetch(request);
    if (respuesta.ok) cache.put(request, respuesta.clone());
    return respuesta;
  } catch (error) {
    const enCache = await cache.match(request);
    if (enCache) return enCache;
    throw error;
  }
}

// 3) Stale-while-revalidate: para íconos e imágenes.
//    Responde al instante con la caché y la actualiza en segundo plano.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_RECURSOS);
  const enCache = await cache.match(request);
  const actualizacion = fetch(request).then((respuesta) => {
    if (respuesta.ok) cache.put(request, respuesta.clone());
    return respuesta;
  }).catch(() => enCache);
  return enCache || actualizacion;
}

// ---------------------------------------------------------------------
// fetch: decide qué estrategia usar en cada petición
// ---------------------------------------------------------------------
self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  const url = new URL(request.url);

  // Solo GET del mismo origen. Los POST (reseñas, push) van directo a la red.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Datos: API y catálogo estático → network first
  if (url.pathname.includes('/api/') || url.pathname.endsWith('/data/catalogo.json')) {
    evento.respondWith(primeroRed(request));
    return;
  }

  // Navegación (el usuario abre una URL)
  if (request.mode === 'navigate') {
    // Páginas SSR /lugar/:id → network first; sin red y sin copia → offline.html
    if (url.pathname.includes('/lugar/')) {
      evento.respondWith(
        primeroRed(request).catch(() => caches.match('./offline.html'))
      );
      return;
    }
    // Cualquier otra navegación es el shell (index.html) → cache first
    evento.respondWith(
      caches.match('./index.html')
        .then((r) => r || fetch(request))
        .catch(() => caches.match('./offline.html'))
    );
    return;
  }

  // Imágenes e íconos → stale-while-revalidate
  if (request.destination === 'image') {
    evento.respondWith(staleWhileRevalidate(request));
    return;
  }

  // CSS, JS y demás archivos del shell → cache first
  evento.respondWith(primeroCache(request));
});

// ---------------------------------------------------------------------
// Fase 8.3 · sync: el navegador lo dispara cuando vuelve la conexión
// (incluso con la app cerrada). Si la promesa falla, el navegador reintenta.
// ---------------------------------------------------------------------
self.addEventListener('sync', (evento) => {
  if (evento.tag === 'enviar-resenas') {
    evento.waitUntil(sincronizarResenas());
  }
});

async function sincronizarResenas() {
  const cantidad = await self.CafeDB.enviarResenasPendientes('./api/resenas');
  console.log('[SW] reseñas sincronizadas:', cantidad);
  if (!cantidad) return;
  const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  ventanas.forEach((c) => c.postMessage({ tipo: 'resenas-sincronizadas', cantidad }));
}

// ---------------------------------------------------------------------
// Fase 10.5 · push: llega un mensaje del servidor (aunque la app esté cerrada)
// ---------------------------------------------------------------------
self.addEventListener('push', (evento) => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch {
    datos = { cuerpo: evento.data?.text() };
  }
  const titulo = datos.titulo || 'CaféGuía';
  evento.waitUntil(
    self.registration.showNotification(titulo, {
      body: datos.cuerpo || 'Tienes novedades',
      icon: './icons/icon-192.png',
      badge: './icons/badge-96.png',
      vibrate: [100, 50, 100],
      tag: datos.tag,                     // mismo tag = reemplaza la anterior
      data: { url: datos.url || './' },
      actions: [
        { action: 'abrir', title: 'Ver' },
        { action: 'cerrar', title: 'Cerrar' },
      ],
    })
  );
});

// Al tocar la notificación: enfocar una ventana abierta o abrir una nueva
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  if (evento.action === 'cerrar') return;
  const destino = new URL(evento.notification.data?.url || './', self.registration.scope).href;
  evento.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const abierta = ventanas.find((v) => v.url.startsWith(self.registration.scope));
    if (abierta) {
      await abierta.focus();
      return abierta.navigate(destino);
    }
    return self.clients.openWindow(destino);
  })());
});
