import { obtenerCatalogo } from '../api.js';
import { filaLugar, escaparHTML } from '../util.js';
import { icono } from '../iconos.js';
import { leerPreferencias, guardarPreferencia } from '../preferencias.js';

const ORDENES = {
  calificacion: { texto: 'Mejor calificadas', fn: (a, b) => b.calificacion - a.calificacion },
  precio: { texto: 'Más económicas', fn: (a, b) => a.precio.length - b.precio.length || b.calificacion - a.calificacion },
  nombre: { texto: 'Por nombre', fn: (a, b) => a.nombre.localeCompare(b.nombre, 'es') },
};

// Lee ?q= y ?etiqueta= de la ruta (#/catalogo?etiqueta=wifi)
function parametros() {
  return new URLSearchParams(location.hash.split('?')[1] || '');
}

export async function vistaCatalogo(contenedor) {
  const catalogo = await obtenerCatalogo();
  const etiquetas = [...new Set(catalogo.flatMap((l) => l.etiquetas))].sort((a, b) => a.localeCompare(b, 'es'));
  const params = parametros();
  const estado = {
    texto: params.get('q') || '',
    etiqueta: params.get('etiqueta') || '',
    orden: ORDENES[leerPreferencias().orden] ? leerPreferencias().orden : 'calificacion',
  };

  contenedor.innerHTML = `
    <header class="encabezado">
      <h1>Catálogo</h1>
      <p>Todas las cafeterías de la guía. Filtra por lo que necesitas o búscalas por nombre.</p>
    </header>
    <div class="buscador">
      ${icono.buscar}
      <label for="buscar" class="solo-lector">Buscar cafetería</label>
      <input id="buscar" type="search" placeholder="Nombre, dirección o etiqueta" autocomplete="off">
    </div>
    <div class="chips" role="group" aria-label="Filtrar por etiqueta">
      ${etiquetas.map((e) => `<button class="chip" type="button" data-etiqueta="${escaparHTML(e)}">${escaparHTML(e)}</button>`).join('')}
    </div>
    <div class="seccion-titulo" style="margin-top:18px">
      <p class="contador" id="contador" style="margin:0"></p>
      <label class="solo-lector" for="orden">Ordenar</label>
      <select id="orden" style="width:auto;min-height:38px;padding:4px 12px">
        ${Object.entries(ORDENES).map(([k, o]) => `<option value="${k}">${o.texto}</option>`).join('')}
      </select>
    </div>
    <div id="resultados"></div>`;

  const buscar = contenedor.querySelector('#buscar');
  const resultados = contenedor.querySelector('#resultados');
  const contador = contenedor.querySelector('#contador');
  const chips = contenedor.querySelectorAll('.chip');
  const orden = contenedor.querySelector('#orden');
  buscar.value = estado.texto;
  orden.value = estado.orden;

  const pintar = () => {
    const t = estado.texto.trim().toLowerCase();
    const filtrados = catalogo
      .filter((l) => !estado.etiqueta || l.etiquetas.includes(estado.etiqueta))
      .filter((l) => !t || [l.nombre, l.direccion, ...l.etiquetas].some((c) => c.toLowerCase().includes(t)))
      .sort(ORDENES[estado.orden].fn);

    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.etiqueta === estado.etiqueta)));
    contador.textContent = filtrados.length === 1 ? '1 cafetería' : `${filtrados.length} cafeterías`;
    resultados.innerHTML = filtrados.length
      ? `<ul class="directorio">${filtrados.map((l) => filaLugar(l)).join('')}</ul>`
      : `<div class="vacio"><strong>Ninguna cafetería coincide</strong>
          Prueba con otra palabra o quita el filtro.
          <div class="acciones" style="justify-content:center;margin-top:16px">
            <button class="boton secundario" id="limpiar" type="button">Quitar filtros</button>
          </div></div>`;
    resultados.querySelector('#limpiar')?.addEventListener('click', () => {
      estado.texto = '';
      estado.etiqueta = '';
      buscar.value = '';
      pintar();
    });
  };

  buscar.addEventListener('input', () => { estado.texto = buscar.value; pintar(); });
  chips.forEach((c) => c.addEventListener('click', () => {
    estado.etiqueta = estado.etiqueta === c.dataset.etiqueta ? '' : c.dataset.etiqueta;
    pintar();
  }));
  // Si se llegó con un filtro (desde Inicio), mostrar ese chip en la fila deslizable
  const activo = [...chips].find((c) => c.dataset.etiqueta === estado.etiqueta);
  if (activo) {
    const fila = activo.parentElement;
    fila.scrollLeft = activo.offsetLeft - fila.offsetLeft - 16;
  }
  orden.addEventListener('change', () => {
    estado.orden = orden.value;
    guardarPreferencia('orden', orden.value); // Fase 6.2: se recuerda en localStorage
    pintar();
  });
  pintar();
}
