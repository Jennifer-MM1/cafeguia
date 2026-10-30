// Punto de entrada de la aplicación
import { registrarServiceWorker } from './registro-sw.js';
import { iniciarEnrutador } from './enrutador.js';
import './instalacion.js';
import { aplicarTema } from './preferencias.js';
import { iniciarIndicador } from './conexion.js';
import { iniciarSincronizacion } from './resenas.js';
import { icono } from './iconos.js';

// Íconos del menú (se insertan desde JS para no repetir los SVG en el HTML)
document.querySelectorAll('.menu a[data-icono]').forEach((a) => {
  a.insertAdjacentHTML('afterbegin', icono[a.dataset.icono]);
});

aplicarTema();
iniciarIndicador();
iniciarSincronizacion();

// Fase 5.2 · Ocultar el splash cuando la primera vista esté lista
// (con un mínimo de 700 ms para que no sea un parpadeo).
async function arrancar() {
  const splash = document.getElementById('splash');
  const minimo = new Promise((r) => setTimeout(r, 700));
  await Promise.all([iniciarEnrutador(), minimo]);
  splash.classList.add('oculto');
  splash.addEventListener('transitionend', () => splash.remove(), { once: true });
}

arrancar();

window.addEventListener('load', () => {
  registrarServiceWorker();
});
