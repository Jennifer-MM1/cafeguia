// Fase 11.2 · Vista «Cerca de mí»: ordena las cafeterías por distancia usando el GPS.
import { obtenerCatalogo } from '../api.js';
import { tarjetaLugar } from '../util.js';
import { obtenerUbicacion, distanciaKm, vibrar, estadoBateria, soporte } from '../dispositivo.js';

// Si el usuario no da permiso, se puede usar el centro de San Juan del Río
const UBICACION_EJEMPLO = { lat: 20.3886, lng: -99.9961, precision: null, ejemplo: true };

export async function vistaCerca(contenedor) {
  const bateria = await estadoBateria();
  contenedor.innerHTML = `
    <h1>Cerca de mí</h1>
    <p class="meta">Usamos el GPS de tu dispositivo para ordenar las cafeterías por distancia.
      Tu ubicación no sale de tu teléfono.</p>
    ${bateria && bateria.nivel < 20 && !bateria.cargando
      ? `<p class="meta">🔋 Batería al ${bateria.nivel}%: usaremos ubicación aproximada para ahorrar energía.</p>` : ''}
    <div class="acciones">
      <button id="btn-ubicar" class="boton" ${soporte.geolocalizacion ? '' : 'disabled'}>📍 Usar mi ubicación</button>
      <button id="btn-ejemplo" class="boton secundario">Usar ubicación de ejemplo</button>
    </div>
    <p id="estado-ubicacion" class="meta" role="status"></p>
    <div id="lista-cerca" class="rejilla"></div>`;

  const estado = contenedor.querySelector('#estado-ubicacion');
  const lista = contenedor.querySelector('#lista-cerca');

  async function mostrar(origen) {
    const catalogo = await obtenerCatalogo();
    const ordenados = catalogo
      .map((l) => ({ ...l, km: distanciaKm(origen, l) }))
      .sort((a, b) => a.km - b.km);
    estado.textContent = origen.ejemplo
      ? 'Mostrando distancias desde el centro de San Juan del Río (ejemplo).'
      : `Tu ubicación: ${origen.lat.toFixed(4)}, ${origen.lng.toFixed(4)} (±${origen.precision} m)`;
    lista.innerHTML = ordenados.map((l) => tarjetaLugar(l,
      `<p class="distancia">${l.km < 1 ? `${Math.round(l.km * 1000)} m` : `${l.km.toFixed(1)} km`}</p>`)).join('');
    vibrar([40, 30, 40]);
  }

  contenedor.querySelector('#btn-ubicar').addEventListener('click', async () => {
    estado.textContent = 'Buscando tu ubicación…';
    try {
      const precisa = !(bateria && bateria.nivel < 20 && !bateria.cargando);
      await mostrar(await obtenerUbicacion({ precisa }));
    } catch (e) {
      estado.textContent = `✖ ${e.message}. Puedes usar la ubicación de ejemplo.`;
    }
  });
  contenedor.querySelector('#btn-ejemplo').addEventListener('click', () => mostrar(UBICACION_EJEMPLO));
}
