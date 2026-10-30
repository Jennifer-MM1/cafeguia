import { leerPreferencias, guardarPreferencia } from '../preferencias.js';
import { versionServiceWorker } from '../registro-sw.js';
import { hayServidor } from '../api.js';
import { mostrarAviso } from '../util.js';
import {
  soportaNotificaciones, soportaPush, permisoActual, pedirPermiso, notificacionLocal,
  suscripcionActual, suscribirPush, desuscribirPush, enviarPushDePrueba,
} from '../notificaciones.js';

// Fase 10 · Sección de notificaciones
async function pintarNotificaciones(caja) {
  if (!soportaNotificaciones()) {
    caja.innerHTML = '<h2>Notificaciones</h2><p class="meta">Este navegador no soporta notificaciones.</p>';
    return;
  }
  const [suscripcion, servidor] = await Promise.all([suscripcionActual(), hayServidor()]);
  const permiso = permisoActual();
  const textoPermiso = { granted: '✔ concedido', denied: '✖ bloqueado', default: 'sin decidir' }[permiso];

  caja.innerHTML = `
    <h2>Notificaciones</h2>
    <p class="meta">Permiso: <strong>${textoPermiso}</strong> ·
      Push: <strong>${suscripcion ? 'suscrito' : 'no suscrito'}</strong></p>
    ${permiso === 'denied' ? '<p class="meta">Desbloquéalas desde el candado de la barra de direcciones.</p>' : ''}
    ${!servidor ? '<p class="meta">Push necesita el servidor Node (no funciona en GitHub Pages).</p>' : ''}
    <div class="acciones">
      <button class="boton secundario" data-accion="local">Probar notificación local</button>
      ${soportaPush() && servidor && !suscripcion && permiso !== 'denied' ? '<button class="boton" data-accion="suscribir">Activar push</button>' : ''}
      ${suscripcion && servidor ? '<button class="boton" data-accion="probar-push">Enviarme un push</button>' : ''}
      ${suscripcion ? '<button class="boton secundario" data-accion="desuscribir">Desactivar push</button>' : ''}
    </div>`;

  caja.addEventListener('click', async (e) => {
    const accion = e.target.dataset?.accion;
    if (!accion) return;
    e.target.disabled = true;
    try {
      if (accion === 'local') {
        if ((await pedirPermiso()) !== 'granted') throw new Error('Permiso denegado');
        await notificacionLocal('Hola desde CaféGuía ☕', {
          body: 'Esta notificación la generó tu dispositivo, sin servidor.',
          data: { url: './#/ajustes' },
        });
      }
      if (accion === 'suscribir') { await suscribirPush(); mostrarAviso('✔ Push activado'); }
      if (accion === 'desuscribir') { await desuscribirPush(); mostrarAviso('Push desactivado'); }
      if (accion === 'probar-push') {
        const r = await enviarPushDePrueba();
        mostrarAviso(`Push enviado a ${r.enviados} dispositivo(s)`);
      }
    } catch (error) {
      mostrarAviso(`✖ ${error.message}`);
    }
    e.target.disabled = false;
    // Al cambiar la suscripción se vuelve a pintar la sección (en un nodo nuevo
    // para no acumular oyentes de clic)
    if (accion === 'suscribir' || accion === 'desuscribir') {
      const nueva = document.createElement('section');
      nueva.className = 'caja';
      nueva.id = 'caja-notificaciones';
      caja.replaceWith(nueva);
      pintarNotificaciones(nueva);
    }
  });
}

const db = self.CafeDB;

// Fase 6 · Ajustes: preferencias (localStorage) y datos locales (IndexedDB)
export async function vistaAjustes(contenedor) {
  const prefs = leerPreferencias();
  const [catalogo, favoritos, resenas] = await Promise.all([
    db.obtenerTodos('catalogo'), db.obtenerTodos('favoritos'), db.obtenerTodos('resenas'),
  ]);

  let espacio = 'no disponible';
  if (navigator.storage?.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    espacio = `${(usage / 1024).toFixed(0)} KB usados de ${(quota / 1024 / 1024).toFixed(0)} MB`;
  }

  contenedor.innerHTML = `
    <h1>Ajustes</h1>

    <section class="caja">
      <h2>Apariencia <small class="meta">(localStorage)</small></h2>
      <label for="tema">Tema</label>
      <select id="tema">
        <option value="sistema">Igual que el sistema</option>
        <option value="claro">Claro</option>
        <option value="oscuro">Oscuro</option>
      </select>
    </section>

    <section class="caja" id="caja-notificaciones"></section>

    <section class="caja">
      <h2>Datos en este dispositivo <small class="meta">(IndexedDB)</small></h2>
      <p class="meta">Catálogo respaldado: ${catalogo.length} cafeterías</p>
      <p class="meta">Favoritos: ${favoritos.length}</p>
      <p class="meta">Reseñas locales: ${resenas.length}
        (${resenas.filter((r) => r.estado === 'pendiente').length} pendientes de enviar)</p>
      <p class="meta">Almacenamiento: ${espacio}</p>
      <p class="meta">Versión del service worker: <strong>${await versionServiceWorker()}</strong></p>
      <div class="acciones">
        <button id="borrar-datos" class="boton secundario">Borrar datos locales</button>
      </div>
    </section>`;

  const selTema = contenedor.querySelector('#tema');
  selTema.value = prefs.tema;
  selTema.addEventListener('change', () => guardarPreferencia('tema', selTema.value));

  await pintarNotificaciones(contenedor.querySelector('#caja-notificaciones'));

  contenedor.querySelector('#borrar-datos').addEventListener('click', async () => {
    if (!confirm('¿Borrar favoritos, reseñas locales y el respaldo del catálogo?')) return;
    await Promise.all(['catalogo', 'favoritos', 'resenas'].map((s) => db.limpiar(s)));
    localStorage.clear();
    location.reload();
  });
}
