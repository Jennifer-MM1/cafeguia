import { obtenerCatalogo } from '../api.js';
import { tarjetaLugar } from '../util.js';

export async function vistaCatalogo(contenedor) {
  const catalogo = await obtenerCatalogo();
  contenedor.innerHTML = `
    <h1>Catálogo</h1>
    <label for="buscar">Buscar</label>
    <input id="buscar" type="search" placeholder="Nombre o etiqueta (wifi, terraza…)">
    <div id="resultados" class="rejilla" style="margin-top:14px"></div>`;

  const resultados = contenedor.querySelector('#resultados');
  const pintar = (texto = '') => {
    const t = texto.trim().toLowerCase();
    const filtrados = catalogo.filter((l) =>
      !t || l.nombre.toLowerCase().includes(t) || l.etiquetas.some((e) => e.includes(t)));
    resultados.innerHTML = filtrados.length
      ? filtrados.map((l) => tarjetaLugar(l)).join('')
      : '<p class="vacio">Sin resultados.</p>';
  };
  contenedor.querySelector('#buscar').addEventListener('input', (e) => pintar(e.target.value));
  pintar();
}
