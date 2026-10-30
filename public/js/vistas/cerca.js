// Fase 11.2 · Vista «Cerca de mí»: ordena las cafeterías por distancia usando el GPS.
import { obtenerCatalogo } from '../api.js';
import { filaLugar, escaparHTML } from '../util.js';
import { icono } from '../iconos.js';
import { CIUDADES } from '../ciudades.js';
import { obtenerUbicacion, distanciaKm, vibrar, estadoBateria, soporte } from '../dispositivo.js';

// Más allá de esta distancia la cafetería cuenta como "en otra ciudad"
const RADIO_CIUDAD_KM = 30;
// Solo se calcula el tiempo a pie para distancias que se pueden caminar
const MAXIMO_A_PIE_KM = 3;

const formatoDistancia = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`);
// Caminando a ~80 m por minuto
const minutosAPie = (km) => Math.max(1, Math.round((km * 1000) / 80));

const ladoDistancia = (km) => `<span class="distancia">${formatoDistancia(km)}</span>
  ${km <= MAXIMO_A_PIE_KM ? `<small>${minutosAPie(km)} min a pie</small>` : ''}`;

export async function vistaCerca(contenedor) {
  const bateria = await estadoBateria();
  const ahorro = bateria && bateria.nivel < 20 && !bateria.cargando;

  contenedor.innerHTML = `
    <header class="encabezado">
      <h1>Cerca de mí</h1>
      <p>Ordenamos las cafeterías por distancia con el GPS de tu teléfono. Tu ubicación no se envía a ningún servidor.</p>
    </header>
    ${ahorro ? `<p class="nota">Tu batería está al ${bateria.nivel}%. Usaremos una ubicación aproximada para gastar menos energía.</p>` : ''}
    <div class="acciones" style="margin-top:16px">
      <button id="btn-ubicar" class="boton" type="button" ${soporte.geolocalizacion ? '' : 'disabled'}>${icono.cerca}Usar mi ubicación</button>
      ${CIUDADES.map((c, i) => `<button class="boton secundario" type="button" data-ejemplo="${i}">
        Probar desde ${escaparHTML(c.nombre)}</button>`).join('')}
    </div>
    <p id="estado-ubicacion" class="contador" role="status"></p>
    <div id="lista-cerca"></div>`;

  const estado = contenedor.querySelector('#estado-ubicacion');
  const lista = contenedor.querySelector('#lista-cerca');

  async function mostrar(origen, descripcion) {
    const catalogo = await obtenerCatalogo();
    const ordenados = catalogo
      .map((l) => ({ ...l, km: distanciaKm(origen, l) }))
      .sort((a, b) => a.km - b.km);
    const cercanas = ordenados.filter((l) => l.km <= RADIO_CIUDAD_KM);
    const lejanas = ordenados.filter((l) => l.km > RADIO_CIUDAD_KM);

    estado.textContent = descripcion;
    lista.innerHTML = `
      ${cercanas.length
        ? `<ul class="directorio">${cercanas.map((l) => filaLugar(l, ladoDistancia(l.km))).join('')}</ul>`
        : '<p class="nota">No hay cafeterías de la guía a menos de 30 km. Estas son las más cercanas:</p>'}
      ${lejanas.length ? `
        <section class="seccion">
          ${cercanas.length ? '<div class="seccion-titulo"><h2>En otras ciudades</h2></div>' : ''}
          <ul class="directorio">${lejanas.map((l) => filaLugar(l, ladoDistancia(l.km))).join('')}</ul>
        </section>` : ''}`;
    vibrar([40, 30, 40]);
  }

  contenedor.querySelector('#btn-ubicar').addEventListener('click', async () => {
    estado.textContent = 'Buscando tu ubicación…';
    try {
      const pos = await obtenerUbicacion({ precisa: !ahorro });
      await mostrar(pos, `Distancias desde tu ubicación (precisión de ${pos.precision} m).`);
    } catch (e) {
      estado.textContent = `${e.message}. Puedes probar desde el centro de alguna de las ciudades.`;
    }
  });

  // Si el usuario no da permiso, se puede usar el centro de cada ciudad
  contenedor.querySelectorAll('[data-ejemplo]').forEach((b) => {
    b.addEventListener('click', () => {
      const c = CIUDADES[Number(b.dataset.ejemplo)];
      mostrar(c.centro, `Distancias desde ${c.referencia}, en el centro de ${c.nombre}.`);
    });
  });
}
