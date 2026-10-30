import { obtenerCatalogo } from '../api.js';
import { selloLugar, filaLugar } from '../util.js';
import { icono } from '../iconos.js';
import { estadoInstalacion, alCambiarInstalacion, instalar } from '../instalacion.js';

// Fase 5.3 · Home con botón de instalación
let quitarOyente = null;

const ATAJOS = [
  { etiqueta: 'estudiar', texto: 'Para estudiar' },
  { etiqueta: 'wifi', texto: 'Con wifi' },
  { etiqueta: 'terraza', texto: 'Con terraza' },
  { etiqueta: 'para llevar', texto: 'Para llevar' },
  { etiqueta: 'desayunos', texto: 'Desayunos' },
];

export async function vistaInicio(contenedor) {
  const [catalogo, favoritos] = await Promise.all([
    obtenerCatalogo(), self.CafeDB.obtenerTodos('favoritos'),
  ]);
  const destacados = [...catalogo].sort((a, b) => b.calificacion - a.calificacion).slice(0, 3);
  const idsFavoritos = new Set(favoritos.map((f) => f.id));
  const misFavoritos = catalogo.filter((l) => idsFavoritos.has(l.id));

  contenedor.innerHTML = `
    <section class="portada">
      <h1>¿Dónde tomamos café hoy?</h1>
      <p>${catalogo.length} cafeterías de San Juan del Río, con horarios, precios y reseñas de quienes ya fueron.</p>
      <form class="buscador" role="search" id="form-buscar">
        ${icono.buscar}
        <label for="q" class="solo-lector">Buscar cafetería</label>
        <input id="q" name="q" type="search" placeholder="Busca una cafetería" autocomplete="off">
      </form>
      <div class="chips">
        ${ATAJOS.map((a) => `<a class="chip" href="#/catalogo?etiqueta=${encodeURIComponent(a.etiqueta)}"
          style="display:inline-flex;align-items:center;text-decoration:none">${a.texto}</a>`).join('')}
      </div>
    </section>

    <section class="seccion">
      <div class="seccion-titulo">
        <h2>Las mejor calificadas</h2>
        <a href="#/catalogo">Ver todas</a>
      </div>
      <div class="sellos">${destacados.map(selloLugar).join('')}</div>
    </section>

    ${misFavoritos.length ? `
    <section class="seccion">
      <div class="seccion-titulo"><h2>Tus guardadas</h2></div>
      <ul class="directorio">${misFavoritos.map((l) => filaLugar(l)).join('')}</ul>
    </section>` : ''}

    <div class="aviso-instalar" id="aviso-instalar" hidden>
      <span class="marca-sello" aria-hidden="true">${icono.descargar}</span>
      <p id="texto-instalar"></p>
      <button id="btn-instalar" class="boton" hidden>Instalar</button>
    </div>`;

  contenedor.querySelector('#form-buscar').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = contenedor.querySelector('#q').value.trim();
    location.hash = q ? `#/catalogo?q=${encodeURIComponent(q)}` : '#/catalogo';
  });

  const caja = contenedor.querySelector('#aviso-instalar');
  const texto = contenedor.querySelector('#texto-instalar');
  const boton = contenedor.querySelector('#btn-instalar');

  const pintar = (estado) => {
    caja.hidden = !['disponible', 'ios'].includes(estado);
    boton.hidden = estado !== 'disponible';
    if (estado === 'disponible') {
      texto.innerHTML = '<strong>Instala CaféGuía</strong>Ábrela desde tu pantalla de inicio y úsala sin conexión.';
    }
    if (estado === 'ios') {
      texto.innerHTML = '<strong>Instala CaféGuía en tu iPhone</strong>Toca Compartir y elige «Agregar a pantalla de inicio».';
    }
  };

  boton.addEventListener('click', () => instalar());
  quitarOyente?.();
  quitarOyente = alCambiarInstalacion(pintar);
  pintar(estadoInstalacion());
}
