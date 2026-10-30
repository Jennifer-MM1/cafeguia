// Fase 4.2 · Enrutador del lado del cliente (CSR) basado en el hash de la URL.
// Se usa #/ruta porque funciona en cualquier hosting estático, incluido GitHub Pages.
import { vistaInicio } from './vistas/inicio.js';
import { vistaCatalogo } from './vistas/catalogo.js';
import { vistaFicha } from './vistas/ficha.js';
import { vistaCerca } from './vistas/cerca.js';
import { vistaAjustes } from './vistas/ajustes.js';

const RUTAS = [
  { patron: /^\/$/, nombre: 'inicio', vista: vistaInicio },
  { patron: /^\/catalogo$/, nombre: 'catalogo', vista: vistaCatalogo },
  { patron: /^\/lugar\/(?<id>\d+)$/, nombre: 'catalogo', vista: vistaFicha },
  { patron: /^\/cerca$/, nombre: 'cerca', vista: vistaCerca },
  { patron: /^\/ajustes$/, nombre: 'ajustes', vista: vistaAjustes },
];

async function resolver() {
  const ruta = location.hash.slice(1) || '/';
  const contenedor = document.getElementById('vista');
  const coincidencia = RUTAS.map((r) => ({ ...r, m: ruta.match(r.patron) })).find((r) => r.m);

  document.querySelectorAll('.menu a').forEach((a) =>
    a.classList.toggle('activa', a.dataset.ruta === coincidencia?.nombre));

  if (!coincidencia) {
    contenedor.innerHTML = '<h1>404</h1><p class="vacio">Página no encontrada.</p>';
    return;
  }
  contenedor.innerHTML = '<p class="cargando">Cargando…</p>';
  try {
    await coincidencia.vista(contenedor, coincidencia.m.groups || {});
  } catch (error) {
    console.error(error);
    contenedor.innerHTML = '<p class="vacio">No se pudo cargar esta sección.</p>';
  }
  contenedor.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

export function iniciarEnrutador() {
  window.addEventListener('hashchange', resolver);
  return resolver();
}
