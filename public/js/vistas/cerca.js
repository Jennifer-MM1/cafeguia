// Fase 11.2 · Vista «Cerca de mí»: ordena las cafeterías por distancia usando el GPS.
import { obtenerCatalogo } from '../api.js';
import { filaLugar } from '../util.js';
import { icono } from '../iconos.js';
import { obtenerUbicacion, distanciaKm, vibrar, estadoBateria, soporte } from '../dispositivo.js';

// Si el usuario no da permiso, se puede usar el centro de San Juan del Río
const UBICACION_EJEMPLO = { lat: 20.3886, lng: -99.9961, precision: null, ejemplo: true };

const formatoDistancia = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);
// Caminando a ~80 m por minuto
const minutosAPie = (km) => Math.max(1, Math.round((km * 1000) / 80));

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
      <button id="btn-ejemplo" class="boton secundario" type="button">Probar desde el centro</button>
    </div>
    <p id="estado-ubicacion" class="contador" role="status"></p>
    <div id="lista-cerca"></div>`;

  const estado = contenedor.querySelector('#estado-ubicacion');
  const lista = contenedor.querySelector('#lista-cerca');

  async function mostrar(origen) {
    const catalogo = await obtenerCatalogo();
    const ordenados = catalogo
      .map((l) => ({ ...l, km: distanciaKm(origen, l) }))
      .sort((a, b) => a.km - b.km);
    estado.textContent = origen.ejemplo
      ? 'Distancias desde el Jardín Independencia, en el centro de San Juan del Río.'
      : `Distancias desde tu ubicación (precisión de ${origen.precision} m).`;
    lista.innerHTML = `<ul class="directorio">${ordenados.map((l) => filaLugar(l,
      `<span class="distancia">${formatoDistancia(l.km)}</span><small>${minutosAPie(l.km)} min a pie</small>`)).join('')}</ul>`;
    vibrar([40, 30, 40]);
  }

  contenedor.querySelector('#btn-ubicar').addEventListener('click', async () => {
    estado.textContent = 'Buscando tu ubicación…';
    try {
      await mostrar(await obtenerUbicacion({ precisa: !ahorro }));
    } catch (e) {
      estado.textContent = `${e.message}. Puedes probar desde el centro de la ciudad.`;
    }
  });
  contenedor.querySelector('#btn-ejemplo').addEventListener('click', () => mostrar(UBICACION_EJEMPLO));
}
