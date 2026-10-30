import { obtenerCatalogo } from '../api.js';
import { tarjetaLugar } from '../util.js';

export async function vistaInicio(contenedor) {
  const catalogo = await obtenerCatalogo();
  const destacados = [...catalogo].sort((a, b) => b.calificacion - a.calificacion).slice(0, 3);
  contenedor.innerHTML = `
    <section class="heroe">
      <h1>Encuentra tu próximo café</h1>
      <p>Explora cafeterías, guarda tus favoritas y deja reseñas incluso sin internet.</p>
      <div class="acciones">
        <a class="boton" href="#/catalogo">Ver catálogo</a>
      </div>
    </section>
    <h2>Mejor calificadas</h2>
    <div class="rejilla">${destacados.map((l) => tarjetaLugar(l)).join('')}</div>`;
}
