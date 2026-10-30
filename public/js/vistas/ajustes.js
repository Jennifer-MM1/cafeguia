import { leerPreferencias, guardarPreferencia } from '../preferencias.js';
import { versionServiceWorker } from '../registro-sw.js';
import { hayServidor } from '../api.js';
import { mostrarAviso } from '../util.js';
import {
  soportaNotificaciones, soportaPush, permisoActual, pedirPermiso, notificacionLocal,
  suscripcionActual, suscribirPush, desuscribirPush, enviarPushDePrueba,
} from '../notificaciones.js';

const fila = (titulo, detalle, control) => `
  <div class="ajuste">
    <div class="ajuste-texto"><strong>${titulo}</strong>${detalle ? `<span>${detalle}</span>` : ''}</div>
    ${control}
  </div>`;

// Fase 10 · Sección de notificaciones
async function pintarNotificaciones(caja) {
  if (!soportaNotificaciones()) {
    caja.innerHTML = '<h2>Notificaciones</h2><p class="ayuda">Este navegador no puede mostrar notificaciones.</p>';
    return;
  }
  const [suscripcion, servidor] = await Promise.all([suscripcionActual(), hayServidor()]);
  const permiso = permisoActual();
  const textoPermiso = { granted: 'Permitidas', denied: 'Bloqueadas', default: 'Sin decidir' }[permiso];

  caja.innerHTML = `
    <h2>Notificaciones</h2>
    ${fila('Permiso del navegador', 'Se pide la primera vez que activas un aviso.', `<span class="ajuste-valor">${textoPermiso}</span>`)}
    ${fila('Avisos de reseñas y promociones', 'Te llegan aunque tengas la app cerrada.',
      `<span class="ajuste-valor">${suscripcion ? 'Activados' : 'Desactivados'}</span>`)}
    ${permiso === 'denied' ? '<p class="nota">Están bloqueadas. Para permitirlas, toca el candado junto a la dirección de la página.</p>' : ''}
    ${!servidor ? '<p class="nota">Los avisos push necesitan el servidor de CaféGuía. En la versión publicada en GitHub Pages solo funcionan las notificaciones de prueba.</p>' : ''}
    <div class="acciones">
      ${soportaPush() && servidor && !suscripcion && permiso !== 'denied' ? '<button class="boton" type="button" data-accion="suscribir">Activar avisos</button>' : ''}
      ${suscripcion && servidor ? '<button class="boton" type="button" data-accion="probar-push">Enviarme un aviso de prueba</button>' : ''}
      ${permiso !== 'denied' ? '<button class="boton secundario" type="button" data-accion="local">Probar notificación local</button>' : ''}
      ${suscripcion ? '<button class="boton secundario" type="button" data-accion="desuscribir">Desactivar avisos</button>' : ''}
    </div>`;

  caja.addEventListener('click', async (e) => {
    const boton = e.target.closest('[data-accion]');
    if (!boton) return;
    const { accion } = boton.dataset;
    boton.disabled = true;
    try {
      if (accion === 'local') {
        if ((await pedirPermiso()) !== 'granted') throw new Error('No diste permiso para mostrar notificaciones');
        await notificacionLocal('Así se ven los avisos de CaféGuía', {
          body: 'Esta notificación la creó tu dispositivo, sin pasar por el servidor.',
          data: { url: './#/ajustes' },
        });
      }
      if (accion === 'suscribir') { await suscribirPush(); mostrarAviso('Avisos activados'); }
      if (accion === 'desuscribir') { await desuscribirPush(); mostrarAviso('Avisos desactivados'); }
      if (accion === 'probar-push') {
        const r = await enviarPushDePrueba();
        mostrarAviso(r.enviados === 1 ? 'Aviso enviado a 1 dispositivo' : `Aviso enviado a ${r.enviados} dispositivos`);
      }
    } catch (error) {
      mostrarAviso(error.message);
    }
    boton.disabled = false;
    // Al cambiar la suscripción se vuelve a pintar la sección (en un nodo nuevo
    // para no acumular oyentes de clic)
    if (accion === 'suscribir' || accion === 'desuscribir') {
      const nueva = document.createElement('section');
      nueva.className = 'panel';
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
  const pendientes = resenas.filter((r) => r.estado === 'pendiente').length;

  let espacio = 'No disponible';
  if (navigator.storage?.estimate) {
    const { usage } = await navigator.storage.estimate();
    espacio = usage > 1024 * 1024 ? `${(usage / 1024 / 1024).toFixed(1)} MB` : `${Math.round(usage / 1024)} KB`;
  }

  contenedor.innerHTML = `
    <div class="ajustes">
      <header class="encabezado"><h1>Ajustes</h1></header>

      <section class="panel">
        <h2>Apariencia</h2>
        ${fila('Tema', 'Se guarda en este dispositivo.', `
          <label for="tema" class="solo-lector">Tema</label>
          <select id="tema">
            <option value="sistema">Igual que el sistema</option>
            <option value="claro">Claro</option>
            <option value="oscuro">Oscuro</option>
          </select>`)}
      </section>

      <section class="panel" id="caja-notificaciones"></section>

      <section class="panel">
        <h2>Datos sin conexión</h2>
        <p class="ayuda">Lo que CaféGuía guarda en este dispositivo para funcionar sin internet.</p>
        ${fila('Cafeterías disponibles sin conexión', '', `<span class="ajuste-valor">${catalogo.length}</span>`)}
        ${fila('Guardadas', '', `<span class="ajuste-valor">${favoritos.length}</span>`)}
        ${fila('Reseñas por publicar', pendientes ? 'Se publican solas al reconectar.' : '', `<span class="ajuste-valor">${pendientes}</span>`)}
        ${fila('Espacio usado', '', `<span class="ajuste-valor">${espacio}</span>`)}
        ${fila('Versión de la app', '', `<span class="ajuste-valor">${await versionServiceWorker()}</span>`)}
        <div class="acciones">
          <button id="borrar-datos" class="boton secundario" type="button">Borrar datos de este dispositivo</button>
        </div>
      </section>
    </div>`;

  const selTema = contenedor.querySelector('#tema');
  selTema.value = prefs.tema;
  selTema.addEventListener('change', () => guardarPreferencia('tema', selTema.value));

  await pintarNotificaciones(contenedor.querySelector('#caja-notificaciones'));

  contenedor.querySelector('#borrar-datos').addEventListener('click', async () => {
    const aviso = pendientes ? ` Perderás ${pendientes} reseña(s) que aún no se publican.` : '';
    if (!confirm(`Se borrarán tus guardadas, tus reseñas locales y la copia del catálogo.${aviso}`)) return;
    await Promise.all(['catalogo', 'favoritos', 'resenas'].map((s) => db.limpiar(s)));
    localStorage.clear();
    location.reload();
  });
}
