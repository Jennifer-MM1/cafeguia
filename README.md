# ☕ CaféGuía — PWA completa paso a paso

Guía de cafeterías construida como **Aplicación Web Progresiva**: se instala, funciona sin conexión, guarda reseñas en el dispositivo y las sincroniza al recuperar la red, y recibe notificaciones push.

> Los datos de las cafeterías son ficticios y sirven solo como ejemplo.

## Diseño

- **Paleta** tomada de la planta del café: porcelana `#F2F4F1` (fondo), tinta `#1C2620`, verde hoja `#1F5A44` (acciones), cereza `#B3343F` (calificaciones) y salvia `#5E6B64` (texto secundario). Tiene tema oscuro.
- **Tipografía:** [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) (licencia OFL), alojada en `public/fonts/` para que funcione sin conexión. Su eje de ancho permite los nombres condensados.
- **Elemento principal:** cada cafetería se muestra como una etiqueta de tostador, con su nombre grande sobre su propio color.
- **Navegación:** pestañas abajo en el celular y en la barra superior en escritorio. Íconos SVG en `public/js/iconos.js`.

## Inicio rápido

```bash
npm install
npm run vapid      # genera las claves para push (solo la primera vez)
npm start          # http://localhost:3000
```

## Estructura

```
cafeguia/
├── server.js                 Servidor Express: estáticos, API y SSR
├── server/
│   ├── ssr.js                Plantilla SSR de la ficha (/lugar/:id)
│   ├── resenas.js            API de reseñas (POST idempotente)
│   └── push.js               Suscripciones y envío push (web-push + VAPID)
├── scripts/
│   ├── generar-iconos.js     Genera los PNG de los íconos sin dependencias
│   └── generar-vapid.js      Genera vapid.json (no se sube a Git)
├── public/                   ← lo que se publica en GitHub Pages
│   ├── index.html            App shell
│   ├── offline.html          Página de respaldo sin conexión
│   ├── manifest.json
│   ├── sw.js                 Service worker
│   ├── css/estilos.css
│   ├── icons/
│   ├── data/catalogo.json    Datos remotos del catálogo
│   └── js/
│       ├── app.js            Punto de entrada
│       ├── enrutador.js      CSR con rutas #/...
│       ├── vistas/           inicio, catalogo, ficha, cerca, ajustes
│       ├── db.js             IndexedDB (compartido con el SW)
│       ├── preferencias.js   localStorage
│       ├── api.js            Catálogo remoto + respaldo local
│       ├── conexion.js       Indicador en línea / sin conexión
│       ├── resenas.js        Local primero + Background Sync
│       ├── registro-sw.js    Registro y aviso de actualización
│       ├── notificaciones.js Locales y push
│       ├── dispositivo.js    GPS, vibración, compartir, batería
│       ├── hidratar.js       Hidratación de la ficha SSR
│       └── instalacion.js    Botón «Instalar app»
├── docs/PRUEBAS.md           Plantilla del reporte de pruebas (Fase 12)
└── .github/workflows/pages.yml  Publicación automática (Fase 13)
```

---

## Guía por fases

Al terminar cada fase: **verifica** y haz un **commit**.

```bash
git add -A
git commit -m "Fase N: descripción"
```

### Fase 0 · Entorno de desarrollo y repositorio
- **0.1** Verificar herramientas: `node -v` (≥ 18), `npm -v`, `git --version`, Chrome o Edge.
- **0.2** `mkdir cafeguia && cd cafeguia && git init && npm init -y && npm install express web-push`
- **0.3** `package.json` con los scripts `start`, `dev`, `iconos` y `vapid`. `.gitignore` excluye `node_modules/`, `vapid.json` y los datos generados.
- **0.4** `server.js` mínimo con `express.static('public')`.
- ✔ **Verificar:** `npm start` y abrir `http://localhost:3000`.

### Fase 1 · App shell
- **1.1** `index.html`: barra, menú, `<main id="vista">` y pie. Es la «carcasa» que se guarda en caché y carga al instante.
- **1.2** `estilos.css` mobile-first con variables CSS y tema oscuro.

### Fase 2 · Manifiesto e íconos
- **2.1** `npm run iconos` genera 192, 512, maskable (con zona segura), apple-touch-icon y badge.
- **2.2** `manifest.json` con `start_url` y `scope` **relativos** (`./`), necesario para GitHub Pages.
- ✔ **Verificar:** DevTools → Application → Manifest sin errores.

### Fase 3 · Service worker básico
- **3.1** `registro-sw.js` registra `./sw.js` en el evento `load`.
- **3.2** `sw.js` con `install` (guardar shell), `activate` (borrar cachés viejas) y `fetch` (caché, luego red).

### Fase 4 · CSR y SSR
- **4.1** `GET /api/catalogo`; si no hay servidor se usa `data/catalogo.json`.
- **4.2** `enrutador.js`: rutas por hash (`#/catalogo`, `#/lugar/3`), cada vista pinta en `#vista`.
- **4.3** `GET /lugar/:id`: el servidor devuelve la ficha completa en HTML, más el estado en `<script id="estado-inicial">`.

### Fase 5 · Splash y Home
- **5.1** Splash del sistema: lo genera Android con `name`, `background_color` e íconos del manifiesto.
- **5.2** Splash propio (`#splash`) que se oculta cuando la primera vista está lista.
- **5.3** `instalacion.js` captura `beforeinstallprompt` y muestra **⬇ Instalar app**; en iOS muestra instrucciones.

### Fase 6 · localStorage e IndexedDB
- **6.1** `db.js`: BD `cafeguia` con almacenes `catalogo`, `favoritos` y `resenas` (índices `porLugar` y `porEstado`).
- **6.2** `preferencias.js`: tema y última visita en localStorage.
- **6.3** `api.js` respalda cada descarga del catálogo en IndexedDB y lo usa si todo lo demás falla.

### Fase 7 · Estrategias de caché y offline
| Recurso | Estrategia |
|---|---|
| Shell (HTML, CSS, JS) | **Cache first** |
| API y `catalogo.json` | **Network first** |
| Imágenes e íconos | **Stale-while-revalidate** |
| Navegación sin copia | `offline.html` |
- **7.3** `conexion.js` muestra «● En línea / ● Sin conexión».

### Fase 8 · Reseñas sin conexión y Background Sync
- **8.1** `POST /api/resenas`, idempotente por `idCliente` (los reintentos no duplican).
- **8.2** La reseña se guarda en IndexedDB como `pendiente` y se registra `sync.register('enviar-resenas')`.
- **8.3** El SW escucha `sync`, envía las pendientes y avisa a la página con `postMessage`. Si el navegador no tiene Background Sync (Firefox, Safari, Brave), se envía desde la página con el evento `online`.

### Fase 9 · Ciclo de vida del service worker
- **9.1** El SW nuevo espera en *waiting*; al recibir `{tipo:'SKIP_WAITING'}` llama `skipWaiting()`. En `activate` llama `clients.claim()`.
- **9.2** `registro-sw.js` detecta `updatefound` y muestra **«✨ Hay una versión nueva»**; al aceptar, recarga con `controllerchange`.

### Fase 10 · Notificaciones locales y push
- **10.1** Flujo: clave pública → `pushManager.subscribe()` → `POST /api/push/suscribir` → `web-push` firma y envía → evento `push` en el SW → `showNotification`.
- **10.2** `npm run vapid` crea `vapid.json`. **Nunca subas la clave privada.**
- **10.3** `server/push.js`: guarda suscripciones, envía a todas y elimina las caducadas (404/410). Cada reseña nueva dispara un push.
- **10.4** `notificaciones.js`: permiso, notificación local, suscribir/desuscribir.
- **10.5** `sw.js`: eventos `push` y `notificationclick`.

### Fase 11 · Dispositivo e hidratación
- **11.1** `dispositivo.js`: geolocalización, Haversine, vibración, Web Share, batería.
- **11.2** «Cerca de mí» ordena por distancia (con ubicación de ejemplo si se niega el permiso).
- **11.3** `hidratar.js` toma el HTML del SSR y le conecta favoritos y compartir **sin volver a pintarlo**.

### Fase 12 · Pruebas
Llena [docs/PRUEBAS.md](docs/PRUEBAS.md): herramientas, casos de prueba y Lighthouse.

---

## Funciones extra

| Función | Archivos | Qué demuestra |
|---|---|---|
| **Fotografías reales** | `data/catalogo.json`, `js/fotos.js`, `sw.js` | Imágenes de otro origen (Unsplash) con CORS; el SW las precarga al instalarse en una caché sin versión (`cafeguia-fotos`) para verlas sin conexión |
| **Abierto ahora** | `js/horario.js` | Lógica sin red con la zona horaria de la ciudad (`Intl`, `America/Mexico_City`); filtro en el catálogo; en la ficha SSR lo agrega la hidratación porque depende de la hora |
| **Fotos en las reseñas** | `js/imagen.js`, `js/db.js`, `server/resenas.js` | Cámara o galería, compresión con `<canvas>`, Blob guardado en IndexedDB y subida en dos pasos idempotentes (`POST` de la reseña + `PUT /api/resenas/:id/foto`) al reconectar |
| **Compartir hacia CaféGuía** | `manifest.json` (`share_target`), `sw.js`, `js/vistas/compartir.js` | Web Share Target: el SW recibe el `POST` con la foto, la guarda en IndexedDB y redirige con `303`. Funciona también en GitHub Pages porque no toca el servidor |
| **Mapa en «Cerca de mí»** | `js/mapa.js`, `vendor/leaflet/`, `sw.js` | Leaflet alojado en la app (carga solo al abrir el mapa) con mosaicos de OpenStreetMap; el SW guarda hasta 500 mosaicos ya vistos. La ubicación reintenta con menor precisión y explica cada falla (permiso bloqueado, página sin https, GPS apagado) |
| **Contador en el ícono** | `js/db.js` (`actualizarInsignia`) | Badging API (`setAppBadge`): número de reseñas por publicar en el ícono de la app instalada, actualizado desde la página y desde el SW |

**Créditos de las fotografías:** Jonathan Borba, julian urrutia, 99.films, Ichsan Chairul, Chris J. Davis, Robert Bye, Jorge Garcia, Konrad Hofmann, Homniom Coffee y Joseph Cortez, en [Unsplash](https://unsplash.com) (Licencia Unsplash). Cada foto muestra su crédito en la ficha de la cafetería. Son ilustrativas: las cafeterías de la guía son ficticias.

### Ciudades

La guía cubre **San Juan del Río** (6 cafeterías) y **Jalpan de Serra** (4). Cada cafetería tiene un campo `ciudad` en `data/catalogo.json`; las ciudades se definen en `js/ciudades.js` (nombre, punto de referencia y centro para «Cerca de mí»). La ciudad elegida en Inicio o en el Catálogo se recuerda en localStorage. Para agregar otra ciudad: añádela a `CIUDADES` y agrega sus cafeterías al catálogo con ese mismo nombre en `ciudad`.

**Cómo probar «Compartir»:** instala la app en Android, abre la galería, toca *Compartir* en una foto y elige CaféGuía. En escritorio puedes simularlo desde la consola:

```js
const fd = new FormData();
fd.append('texto', 'Probando');
fd.append('foto', await (await fetch('icons/icon-512.png')).blob(), 'foto.png');
await fetch('./compartir-destino', { method: 'POST', body: fd, redirect: 'manual' });
location.hash = '#/compartir';
```

---

## Fase 13 · Publicación

### 13.1 Subir el repositorio a GitHub
1. Crea un repositorio vacío en GitHub (sin README), por ejemplo `cafeguia`.
2. Conéctalo y sube:
   ```bash
   git remote add origin https://github.com/<usuario>/cafeguia.git
   git push -u origin main
   ```

### 13.2 Activar GitHub Pages
1. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. El workflow `.github/workflows/pages.yml` publica la carpeta `public/` en cada push a `main`.
3. Revisa la pestaña **Actions**; al terminar, la app queda en `https://<usuario>.github.io/cafeguia/`.

### 13.3 Qué funciona en GitHub Pages y qué necesita el servidor
GitHub Pages solo sirve archivos estáticos (no ejecuta Node).

| Función | GitHub Pages | Servidor Node |
|---|---|---|
| Instalación, manifiesto, íconos | ✅ | ✅ |
| Service worker y modo offline | ✅ | ✅ |
| Catálogo (CSR) | ✅ desde `data/catalogo.json` | ✅ desde `/api/catalogo` |
| Favoritos, tema (IndexedDB / localStorage) | ✅ | ✅ |
| Cerca de mí, compartir, vibración | ✅ (HTTPS) | ✅ |
| Notificaciones **locales** | ✅ | ✅ |
| Ficha **SSR** `/lugar/:id` + hidratación | ❌ | ✅ |
| Envío de reseñas (se quedan pendientes en el dispositivo) | ❌ | ✅ |
| Notificaciones **push** | ❌ | ✅ |

Para tener todo en línea, despliega `server.js` en un hosting con Node (Render, Railway, Fly.io) y define `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` como variables de entorno.

### 13.4 Publicar una actualización
1. Haz tus cambios.
2. Sube `VERSION` en `public/sw.js` (por ejemplo `v10` → `v11`). **Sin este paso los usuarios seguirán viendo los archivos en caché.**
3. Commit y push:
   ```bash
   git add -A
   git commit -m "Actualización: descripción"
   git push
   ```
4. Al abrir la app, los usuarios verán **«✨ Hay una versión nueva»**.

### Probar la ubicación en el celular

Los navegadores solo dan la ubicación en páginas **https** o en **localhost**. Si abres la app desde el celular como `http://192.168.x.x:3000`, «Usar mi ubicación» no puede funcionar (la app lo explica en pantalla). Opciones:

- Usar la versión publicada en GitHub Pages (es https).
- En Chrome para Android, conectar el celular por USB y usar `chrome://inspect` → *Port forwarding* (`3000` → `localhost:3000`); así el celular abre `http://localhost:3000`.
