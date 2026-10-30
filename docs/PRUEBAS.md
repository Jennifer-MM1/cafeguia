# Fase 12 · Reporte de pruebas — CaféGuía

**Alumno:** ______________________  **Fecha:** ____________
**URL probada:** `http://localhost:3000` y `https://<usuario>.github.io/<repositorio>/`
**Navegadores / dispositivos:** ______________________

---

## 12.1 Herramientas

| Herramienta | Para qué se usa | Dónde |
|---|---|---|
| **Chrome DevTools → Application** | Ver el manifiesto, el service worker (estado, *Update on reload*, *skipWaiting*), Cache Storage, IndexedDB, localStorage y disparar eventos *Push* y *Sync* manualmente | `F12` → pestaña **Application** |
| **DevTools → Network** | Simular *Offline* / *Slow 3G* y ver qué respuestas salen de `(ServiceWorker)` | `F12` → **Network** → menú *Throttling* |
| **Lighthouse** | Auditoría de rendimiento, accesibilidad, buenas prácticas y SEO | `F12` → **Lighthouse** o `npx lighthouse http://localhost:3000 --view` |
| **DevTools → Sensors** | Simular una ubicación GPS para «Cerca de mí» | `F12` → `Ctrl+Shift+P` → *Show Sensors* |
| **Device Mode** | Ver la app en tamaño de celular | `Ctrl+Shift+M` |
| **chrome://serviceworker-internals** | Ver todos los SW registrados y sus registros | Barra de direcciones |
| **Remote debugging (Android)** | Probar en un teléfono real conectado por USB | `chrome://inspect` |
| **curl / Postman** | Probar la API: `/api/catalogo`, `/api/resenas`, `/api/push/*` | Terminal |

---

## 12.2 Casos de prueba

Marca el resultado: ✅ pasa · ❌ falla · ➖ no aplica. Adjunta captura en cada caso.

| # | Fase | Caso | Pasos | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|---|---|
| CP-01 | 0 | Servidor arranca | `npm install` → `npm start` | Consola muestra `CaféGuía escuchando en http://localhost:3000` | | |
| CP-02 | 1 | App shell visible | Abrir `/` | Barra, menú, contenido y pie visibles; sin errores en consola | | |
| CP-03 | 2 | Manifiesto válido | Application → Manifest | Nombre, colores e íconos (192, 512, maskable) sin advertencias | | |
| CP-04 | 2 | Instalable | Pulsar **⬇ Instalar app** en Inicio | Se abre el diálogo de instalación y la app abre en ventana propia | | |
| CP-05 | 3 | SW registrado | Application → Service Workers | `sw.js` con estado *activated and is running* | | |
| CP-06 | 3 | Shell en caché | Application → Cache Storage | Existe `cafeguia-shell-vN` con index.html, css y js | | |
| CP-07 | 4 | CSR | Navegar Inicio → Catálogo → ficha | Cambia la vista sin recargar la página (solo cambia el `#`) | | |
| CP-08 | 4 | SSR | Abrir `/lugar/1` y ver *Ver código fuente* | El HTML ya trae el nombre, la descripción y las reseñas | | |
| CP-09 | 5 | Splash | Recargar la página | Aparece la taza animada y se desvanece al cargar | | |
| CP-10 | 6 | localStorage | Ajustes → Tema oscuro → recargar | El tema se conserva; aparece en Application → Local Storage | | |
| CP-11 | 6 | IndexedDB | Guardar un favorito | Aparece en Application → IndexedDB → `cafeguia` → `favoritos` | | |
| CP-12 | 7 | Offline (shell) | Network → *Offline* → recargar | La app carga completa; indicador «● Sin conexión» en rojo | | |
| CP-13 | 7 | Offline (datos) | Offline → Catálogo | Se muestran las cafeterías desde caché / IndexedDB | | |
| CP-14 | 7 | Página offline | Offline → abrir `/lugar/6` sin haberla visitado | Se muestra `offline.html` | | |
| CP-15 | 8 | Reseña sin red | Offline → ficha → publicar reseña | Aparece con la etiqueta «⏳ pendiente de envío» | | |
| CP-16 | 8 | Background Sync | Volver a *Online* (o Application → Service Workers → *Sync* con la etiqueta `enviar-resenas`) | Aviso «✔ reseña(s) enviada(s)»; la reseña aparece en `/api/resenas` | | |
| CP-17 | 8 | Sin duplicados | Enviar dos veces el mismo `idCliente` con curl | El servidor responde 201 la primera vez y 200 la segunda, sin duplicar | | |
| CP-18 | 9 | Versión nueva | Cambiar `VERSION` en `sw.js` → recargar | Aparece «✨ Hay una versión nueva» | | |
| CP-19 | 9 | Actualizar | Pulsar **Actualizar** | La página se recarga una vez; Ajustes muestra la nueva versión; las cachés viejas desaparecen | | |
| CP-20 | 10 | Notificación local | Ajustes → *Probar notificación local* | Aparece la notificación del sistema | | |
| CP-21 | 10 | Suscripción push | Ajustes → *Activar push* | Se guarda en `data/suscripciones.json` | | |
| CP-22 | 10 | Push recibido | *Enviarme un push* (o Application → *Push*) | Llega la notificación aunque la pestaña esté en segundo plano | | |
| CP-23 | 10 | Clic en notificación | Tocar la notificación | Se enfoca/abre la app en la ficha indicada | | |
| CP-24 | 10 | Push por reseña | Publicar una reseña estando suscrito | Llega «Nueva reseña en …» | | |
| CP-25 | 11 | Geolocalización | Cerca de mí → *Usar mi ubicación* (Sensors: Ciudad de México o personalizada) | Lista ordenada por distancia | | |
| CP-26 | 11 | Permiso denegado | Denegar la ubicación | Mensaje claro y opción de ubicación de ejemplo | | |
| CP-27 | 11 | Compartir | Ficha → *Compartir* | Hoja nativa (móvil) o «Enlace copiado» (escritorio) | | |
| CP-28 | 11 | Hidratación | Abrir `/lugar/2` | La pastilla dice «SSR + hidratada» y el botón de favorito funciona | | |
| CP-29 | 12 | Lighthouse | Ejecutar Lighthouse (móvil) | Rendimiento ≥ 90, Accesibilidad ≥ 90, Buenas prácticas ≥ 90 | | |
| CP-30 | 13 | GitHub Pages | Abrir la URL publicada | La app carga, se instala y funciona offline | | |
| CP-31 | Extra | Fotos sin conexión | Abrir la app una vez → Network *Offline* → recargar | Las fotos de las cafeterías se ven; están en Cache Storage → `cafeguia-fotos` | | |
| CP-32 | Extra | Abierto ahora | Catálogo → chip *Abierto ahora* | Solo quedan las abiertas según la hora de la Ciudad de México | | |
| CP-33 | Extra | Horario en SSR | Abrir `/lugar/4` | El estado abierto/cerrado aparece después de la hidratación | | |
| CP-34 | Extra | Reseña con foto | Ficha → *Agregar foto* → publicar | La foto aparece en la reseña y se guarda en `data/fotos/` | | |
| CP-35 | Extra | Foto sin conexión | Offline → reseña con foto → volver a *Online* | Queda «Se publicará al reconectar» con su foto; al reconectar se suben reseña y foto | | |
| CP-36 | Extra | Compartir hacia la app | Android: galería → Compartir → CaféGuía (o el código del README) | Abre «¿De qué cafetería es?»; al elegir una, el formulario trae el texto y la foto | | |
| CP-38 | Extra | Mapa con mi ubicación | Cerca de mí → *Usar mi ubicación* → *Permitir* | Punto azul con círculo de precisión; el mapa encuadra tu posición y las 4 cafeterías más cercanas | | |
| CP-39 | Extra | Ubicación bloqueada | Bloquear el permiso y tocar *Usar mi ubicación* | Mensaje que explica cómo desbloquearla; los botones «Probar desde…» siguen funcionando | | |
| CP-40 | Extra | Página no segura | Abrir la app desde el celular con `http://IP-de-la-PC:3000` | Mensaje que explica que hace falta https (usar GitHub Pages) | | |
| CP-41 | Extra | Mapa sin conexión | Ver el mapa con internet → *Offline* → recargar | Se ven los mosaicos ya vistos (Cache Storage → `cafeguia-mapa`) | | |
| CP-37 | Extra | Contador en el ícono | App instalada → reseña sin conexión | El ícono muestra 1; al publicarse, desaparece | | |

### Puntuación Lighthouse

| Categoría | localhost | GitHub Pages |
|---|---|---|
| Rendimiento | | |
| Accesibilidad | | |
| Buenas prácticas | | |
| SEO | | |

### Problemas encontrados y solución

| # | Problema | Causa | Solución |
|---|---|---|---|
| 1 | En algunos navegadores `sync.register()` lanza `UnknownError: Background Sync is disabled` | La API existe pero está desactivada (Brave, navegadores embebidos) | `resenas.js` captura el error y envía desde la página con el evento `online` |
| 2 | | | |

### Conclusión

_Escribe aquí qué aprendiste y qué mejorarías._
