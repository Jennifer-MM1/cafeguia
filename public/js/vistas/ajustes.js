import { leerPreferencias, guardarPreferencia } from '../preferencias.js';
import { versionServiceWorker } from '../registro-sw.js';

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

  contenedor.querySelector('#borrar-datos').addEventListener('click', async () => {
    if (!confirm('¿Borrar favoritos, reseñas locales y el respaldo del catálogo?')) return;
    await Promise.all(['catalogo', 'favoritos', 'resenas'].map((s) => db.limpiar(s)));
    localStorage.clear();
    location.reload();
  });
}
