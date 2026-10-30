import { obtenerLugar, hayServidor } from '../api.js';
import { escaparHTML, estrellas } from '../util.js';

export async function vistaFicha(contenedor, { id }) {
  const lugar = await obtenerLugar(id);
  if (!lugar) {
    contenedor.innerHTML = '<p class="vacio">Esa cafetería no existe.</p>';
    return;
  }
  contenedor.innerHTML = `
    <div class="ficha-portada" style="background:${lugar.color}33">${lugar.emoji}</div>
    <h1>${escaparHTML(lugar.nombre)}</h1>
    <p class="meta"><span class="estrellas">${estrellas(lugar.calificacion)}</span>
      ${lugar.calificacion} · ${lugar.precio}</p>
    <p>${escaparHTML(lugar.descripcion)}</p>
    <div class="caja">
      <p class="meta">📍 ${escaparHTML(lugar.direccion)}</p>
      <p class="meta">🕒 ${escaparHTML(lugar.horario)}</p>
      <div>${lugar.etiquetas.map((e) => `<span class="etiqueta">${escaparHTML(e)}</span>`).join('')}</div>
    </div>
    <div class="acciones" id="acciones-ficha"></div>
    <section id="seccion-resenas"></section>`;

  // Enlace a la versión renderizada en el servidor (solo si hay servidor Node)
  if (await hayServidor()) {
    contenedor.querySelector('#acciones-ficha').insertAdjacentHTML('beforeend',
      `<a class="boton secundario" href="lugar/${lugar.id}">Ver versión SSR</a>`);
  }
}
