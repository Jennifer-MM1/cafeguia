// Fase 11.2 · Vista «Cerca de mí»: ordena las cafeterías por distancia usando el GPS
// y las muestra en un mapa.
import { obtenerCatalogo } from '../api.js';
import { filaLugar, escaparHTML } from '../util.js';
import { icono } from '../iconos.js';
import { CIUDADES, ciudadElegida, filtrarPorCiudad } from '../ciudades.js';
import { crearMapa } from '../mapa.js';
import {
  obtenerUbicacion, permisoUbicacion, distanciaKm, vibrar, estadoBateria, soporte,
} from '../dispositivo.js';

// Más allá de esta distancia la cafetería cuenta como "en otra ciudad"
const RADIO_CIUDAD_KM = 30;
// Solo se calcula el tiempo a pie para distancias que se pueden caminar
const MAXIMO_A_PIE_KM = 3;

const formatoDistancia = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`);
// Caminando a ~80 m por minuto
const minutosAPie = (km) => Math.max(1, Math.round((km * 1000) / 80));

const ladoDistancia = (km) => `<span class="distancia">${formatoDistancia(km)}</span>
  ${km <= MAXIMO_A_PIE_KM ? `<small>${minutosAPie(km)} min a pie</small>` : ''}`;

// Qué hacer en cada tipo de falla (los códigos vienen de dispositivo.js)
function ayudaUbicacion(codigo) {
  const ayudas = {
    denegado: ['La ubicación está bloqueada para esta página',
      'Toca el candado junto a la dirección, activa «Ubicación» y vuelve a intentarlo. '
      + 'En la app instalada: mantén presionado su ícono, entra a Información de la app y luego a Permisos.'],
    inseguro: ['Esta dirección no permite usar la ubicación',
      `Los navegadores solo comparten la ubicación en páginas https o en localhost, y abriste ${escaparHTML(location.host)}. `
      + 'En tu celular usa la versión publicada en GitHub Pages, que es https.'],
    'no-disponible': ['No pudimos saber dónde estás',
      'Revisa que la ubicación del dispositivo esté encendida. En Windows: Configuración, Privacidad y seguridad, Ubicación.'],
    tiempo: ['Tardó demasiado en encontrarte',
      'Enciende el wifi o acércate a una ventana y vuelve a intentarlo.'],
    'no-soportado': ['Este navegador no ofrece ubicación',
      'Prueba con una versión reciente de Chrome, Edge, Firefox o Safari.'],
  };
  const [titulo, texto] = ayudas[codigo] || ayudas['no-disponible'];
  return `<div class="nota nota-error" role="alert"><div><strong>${titulo}</strong>${texto}
    <br>Mientras tanto, puedes probar desde el centro de una ciudad.</div></div>`;
}

export async function vistaCerca(contenedor) {
  const [bateria, catalogo, permiso] = await Promise.all([
    estadoBateria(), obtenerCatalogo(), permisoUbicacion(),
  ]);
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
    <div id="ayuda-ubicacion">${permiso === 'denied' ? ayudaUbicacion('denegado') : ''}</div>
    <div id="mapa" class="mapa" aria-label="Mapa de cafeterías"></div>
    <p id="estado-ubicacion" class="contador" role="status">Toca «Usar mi ubicación» para ver las más cercanas.</p>
    <div id="lista-cerca"></div>`;

  const estado = contenedor.querySelector('#estado-ubicacion');
  const lista = contenedor.querySelector('#lista-cerca');
  const ayuda = contenedor.querySelector('#ayuda-ubicacion');
  const btnUbicar = contenedor.querySelector('#btn-ubicar');

  // El mapa abre con todas las cafeterías, encuadrado en la ciudad elegida
  let mapa = null;
  try {
    mapa = await crearMapa(contenedor.querySelector('#mapa'), catalogo);
    const ciudad = ciudadElegida();
    if (ciudad) mapa.encuadrar(filtrarPorCiudad(catalogo, ciudad).map((l) => [l.lat, l.lng]), 15);
  } catch {
    contenedor.querySelector('#mapa').outerHTML = '<p class="nota">El mapa no está disponible sin conexión hasta que lo abras una vez con internet.</p>';
  }

  function mostrar(origen, descripcion, esUsuario) {
    const ordenados = catalogo
      .map((l) => ({ ...l, km: distanciaKm(origen, l) }))
      .sort((a, b) => a.km - b.km);
    const cercanas = ordenados.filter((l) => l.km <= RADIO_CIUDAD_KM);
    const lejanas = ordenados.filter((l) => l.km > RADIO_CIUDAD_KM);

    if (mapa) {
      mapa.mostrarUsuario(origen, { etiqueta: esUsuario ? 'Estás aquí' : descripcion });
      // Encuadre: tú y las 4 más cercanas (o la más cercana si estás lejos de todas)
      const enfoque = (cercanas.length ? cercanas : ordenados).slice(0, cercanas.length ? 4 : 1);
      mapa.encuadrar([[origen.lat, origen.lng], ...enfoque.map((l) => [l.lat, l.lng])]);
    }

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

  btnUbicar.addEventListener('click', async () => {
    const textoOriginal = btnUbicar.innerHTML;
    btnUbicar.disabled = true;
    btnUbicar.innerHTML = `${icono.cerca}Buscando…`;
    ayuda.innerHTML = '';
    estado.textContent = 'Buscando tu ubicación. Si el navegador lo pide, toca «Permitir».';
    try {
      const pos = await obtenerUbicacion({ precisa: !ahorro });
      mostrar(pos, `Distancias desde tu ubicación (precisión de ${pos.precision} m).`, true);
    } catch (error) {
      ayuda.innerHTML = ayudaUbicacion(error.codigo);
      estado.textContent = '';
    } finally {
      btnUbicar.disabled = false;
      btnUbicar.innerHTML = textoOriginal;
    }
  });

  // Sin permiso, se puede usar el centro de cada ciudad
  contenedor.querySelectorAll('[data-ejemplo]').forEach((b) => {
    b.addEventListener('click', () => {
      const c = CIUDADES[Number(b.dataset.ejemplo)];
      ayuda.innerHTML = '';
      mostrar({ ...c.centro, precision: null },
        `Distancias desde ${c.referencia}, en el centro de ${c.nombre}.`, false);
    });
  });
}
