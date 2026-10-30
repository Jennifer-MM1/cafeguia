// Ciudades de la guía. La elegida se recuerda en localStorage (Fase 6.2)
// y la comparten Inicio y Catálogo.
import { leerPreferencias, guardarPreferencia } from './preferencias.js';
import { escaparHTML } from './util.js';

export const CIUDADES = [
  { nombre: 'San Juan del Río', referencia: 'la Plaza Independencia', centro: { lat: 20.3886, lng: -99.9961 } },
  { nombre: 'Jalpan de Serra', referencia: 'la Misión de Santiago', centro: { lat: 21.2168, lng: -99.4739 } },
];

// '' significa todas las ciudades
export function ciudadElegida() {
  const { ciudad } = leerPreferencias();
  return CIUDADES.some((c) => c.nombre === ciudad) ? ciudad : '';
}

export function elegirCiudad(ciudad) {
  guardarPreferencia('ciudad', ciudad);
}

export function filtrarPorCiudad(catalogo, ciudad = ciudadElegida()) {
  return ciudad ? catalogo.filter((l) => l.ciudad === ciudad) : catalogo;
}

// "San Juan del Río y Jalpan de Serra"
export function nombresCiudades() {
  const n = CIUDADES.map((c) => c.nombre);
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n.at(-1)}` : n[0];
}

// Control segmentado: Todas | San Juan del Río | Jalpan de Serra
export function selectorCiudad(actual = ciudadElegida()) {
  const opciones = [{ valor: '', texto: 'Todas' }, ...CIUDADES.map((c) => ({ valor: c.nombre, texto: c.nombre }))];
  return `
    <div class="segmentos" role="group" aria-label="Ciudad">
      ${opciones.map((o) => `<button type="button" data-ciudad="${escaparHTML(o.valor)}"
        aria-pressed="${o.valor === actual}">${escaparHTML(o.texto)}</button>`).join('')}
    </div>`;
}

// Conecta los botones del selector; "alCambiar" recibe la ciudad nueva
export function conectarSelector(contenedor, alCambiar) {
  contenedor.querySelectorAll('.segmentos [data-ciudad]').forEach((b) => {
    b.addEventListener('click', () => {
      elegirCiudad(b.dataset.ciudad);
      contenedor.querySelectorAll('.segmentos [data-ciudad]').forEach((o) =>
        o.setAttribute('aria-pressed', String(o === b)));
      alCambiar(b.dataset.ciudad);
    });
  });
}
