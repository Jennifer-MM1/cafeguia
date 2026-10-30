// Utilidades compartidas por las vistas
import { icono } from './iconos.js';

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escaparHTML(texto = '') {
  return String(texto).replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

export function estrellas(valor = 0) {
  const llenas = Math.round(valor);
  return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
}

// "Grano de Cantera" → "GC"
export function iniciales(nombre = '') {
  return nombre.split(/\s+/).filter((p) => p.length > 2 || /^\d/.test(p))
    .slice(0, 2).map((p) => p[0].toUpperCase()).join('') || nombre.slice(0, 2).toUpperCase();
}

const PRECIOS = { $: 'Económico', $$: 'Precio medio', $$$: 'Precio alto' };
export const precioTexto = (precio) => PRECIOS[precio] || precio;

export function calificacionHTML(valor) {
  return `<span class="calificacion" aria-label="Calificación ${valor} de 5">${icono.estrella}${Number(valor).toFixed(1)}</span>`;
}

export function fechaCorta(iso) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Aviso flotante breve (toast)
export function mostrarAviso(texto, ms = 3500) {
  document.querySelectorAll('.aviso:not(#aviso-actualizacion)').forEach((a) => a.remove());
  const aviso = document.createElement('div');
  aviso.className = 'aviso';
  aviso.setAttribute('role', 'status');
  aviso.textContent = texto;
  document.body.appendChild(aviso);
  setTimeout(() => aviso.remove(), ms);
}

// Etiqueta grande de la portada (el nombre del lugar es la imagen)
export function selloLugar(lugar) {
  return `
    <a class="sello" href="#/lugar/${lugar.id}" style="--c:${lugar.color}">
      <span class="sello-arriba"><span>${escaparHTML(lugar.etiquetas[0])}</span><span>${lugar.precio}</span></span>
      <span class="sello-nombre">${escaparHTML(lugar.nombre)}</span>
      <span class="sello-pie">
        <span>${escaparHTML(lugar.direccion)}</span>
        ${calificacionHTML(lugar.calificacion)}
      </span>
    </a>`;
}

// Fila del directorio (catálogo y cerca de mí). "lado" es lo que va a la derecha.
export function filaLugar(lugar, lado = icono.ir) {
  return `
    <li>
      <a class="fila" href="#/lugar/${lugar.id}">
        <span class="fila-sello" style="--c:${lugar.color}" aria-hidden="true">${iniciales(lugar.nombre)}</span>
        <span class="fila-info">
          <h3>${escaparHTML(lugar.nombre)}</h3>
          <p>${escaparHTML(lugar.direccion)}</p>
          <span class="fila-datos">
            ${calificacionHTML(lugar.calificacion)}
            <span class="precio" title="${precioTexto(lugar.precio)}">${lugar.precio}</span>
          </span>
        </span>
        <span class="fila-lado">${lado}</span>
      </a>
    </li>`;
}
