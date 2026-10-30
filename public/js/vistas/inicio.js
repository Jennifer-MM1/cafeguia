import { obtenerCatalogo } from '../api.js';
import { tarjetaLugar } from '../util.js';
import { estadoInstalacion, alCambiarInstalacion, instalar } from '../instalacion.js';

// Fase 5.3 · Home con botón de instalación
let quitarOyente = null;

export async function vistaInicio(contenedor) {
  const catalogo = await obtenerCatalogo();
  const destacados = [...catalogo].sort((a, b) => b.calificacion - a.calificacion).slice(0, 3);
  contenedor.innerHTML = `
    <section class="heroe">
      <h1>Encuentra tu próximo café</h1>
      <p>Explora cafeterías, guarda tus favoritas y deja reseñas incluso sin internet.</p>
      <div class="acciones">
        <a class="boton" href="#/catalogo">Ver catálogo</a>
        <button id="btn-instalar" class="boton secundario" hidden>⬇ Instalar app</button>
      </div>
      <p id="ayuda-instalar" class="meta" style="color:#f3e3d3" hidden></p>
    </section>
    <h2>Mejor calificadas</h2>
    <div class="rejilla">${destacados.map((l) => tarjetaLugar(l)).join('')}</div>`;

  const boton = contenedor.querySelector('#btn-instalar');
  const ayuda = contenedor.querySelector('#ayuda-instalar');

  const pintar = (estado) => {
    boton.hidden = estado !== 'disponible';
    ayuda.hidden = !['ios', 'instalada'].includes(estado);
    if (estado === 'ios') ayuda.textContent = 'En iPhone: toca Compartir → «Agregar a pantalla de inicio».';
    if (estado === 'instalada') ayuda.textContent = '✔ Estás usando la app instalada.';
  };

  boton.addEventListener('click', () => instalar());
  quitarOyente?.();
  quitarOyente = alCambiarInstalacion(pintar);
  pintar(estadoInstalacion());
}
