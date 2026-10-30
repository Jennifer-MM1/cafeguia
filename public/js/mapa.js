// Mapa de «Cerca de mí» con Leaflet (alojado en vendor/leaflet) y mosaicos de
// OpenStreetMap (gratuitos con atribución; en tema oscuro se oscurecen con CSS). Leaflet se carga solo cuando se abre el mapa.
// El service worker guarda los mosaicos que ya viste para mostrarlos sin conexión.
import { escaparHTML, iniciales } from './util.js';
import { horarioHTML } from './horario.js';

const MOSAICOS = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATRIBUCION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

let cargando = null;

// Inserta leaflet.css y leaflet.js una sola vez y devuelve el objeto L
export function cargarLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  cargando ||= new Promise((resolver, rechazar) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'vendor/leaflet/leaflet.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'vendor/leaflet/leaflet.js';
    js.onload = () => resolver(window.L);
    js.onerror = () => {
      cargando = null;
      rechazar(new Error('No se pudo cargar el mapa'));
    };
    document.head.appendChild(js);
  });
  return cargando;
}

const comoLlegar = (l) =>
  `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`;

function popupLugar(l) {
  return `
    <div class="popup-lugar">
      <strong>${escaparHTML(l.nombre)}</strong>
      <span>${escaparHTML(l.direccion)}</span>
      ${horarioHTML(l)}
      <span class="popup-acciones">
        <a href="#/lugar/${l.id}">Ver cafetería</a>
        <a href="${comoLlegar(l)}" target="_blank" rel="noopener">Cómo llegar</a>
      </span>
    </div>`;
}

/**
 * Crea el mapa dentro de "elemento" con un marcador por cafetería.
 * Devuelve funciones para mostrar al usuario y encuadrar puntos.
 */
export async function crearMapa(elemento, lugares) {
  const L = await cargarLeaflet();
  const mapa = L.map(elemento, {
    scrollWheelZoom: false, // que la rueda del ratón desplace la página, no el mapa
    tap: true,
  });
  L.tileLayer(MOSAICOS, {
    maxZoom: 19,
    crossOrigin: true, // respuestas CORS: el service worker puede guardarlas
    attribution: ATRIBUCION,
  }).addTo(mapa);

  const marcadores = new Map();
  for (const l of lugares) {
    const icono = L.divIcon({
      className: 'pin-cafe',
      html: `<span style="--c:${l.color}">${escaparHTML(iniciales(l.nombre))}</span>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -18],
    });
    const m = L.marker([l.lat, l.lng], { icon: icono, title: l.nombre, alt: l.nombre, keyboard: true })
      .bindPopup(popupLugar(l))
      .addTo(mapa);
    marcadores.set(l.id, m);
  }

  let usuario = null;

  let ultimoEncuadre = null;

  function encuadrar(puntos, zoomMaximo = 16) {
    if (!puntos.length) return;
    ultimoEncuadre = { puntos, zoomMaximo };
    // Sin animación: el salto suele ser grande (de toda la región a una calle) y así
    // no depende de que terminen las transiciones CSS
    mapa.fitBounds(L.latLngBounds(puntos), { padding: [48, 48], maxZoom: zoomMaximo, animate: false });
  }

  // Encuadre inicial: todas las cafeterías recibidas
  encuadrar(lugares.map((l) => [l.lat, l.lng]), 15);

  // Si el mapa cambia de tamaño (giro del teléfono, pestaña que estaba en segundo
  // plano, ventana redimensionada), Leaflet recalcula y se repite el último encuadre.
  // Al dejar de existir el contenedor (otra vista), se libera el mapa.
  const observador = new ResizeObserver(() => {
    if (!elemento.isConnected) {
      observador.disconnect();
      mapa.remove();
      return;
    }
    if (!elemento.clientWidth || !elemento.clientHeight) return;
    mapa.invalidateSize({ animate: false });
    if (ultimoEncuadre) encuadrar(ultimoEncuadre.puntos, ultimoEncuadre.zoomMaximo);
  });
  observador.observe(elemento);

  return {
    mapa,
    encuadrar,
    abrir(id) {
      const m = marcadores.get(id);
      if (!m) return;
      mapa.setView(m.getLatLng(), Math.max(mapa.getZoom(), 16), { animate: false });
      m.openPopup();
    },
    // Punto azul del usuario y círculo de precisión
    mostrarUsuario({ lat, lng, precision }, { etiqueta = 'Estás aquí' } = {}) {
      if (usuario) usuario.forEach((capa) => capa.remove());
      const punto = L.marker([lat, lng], {
        icon: L.divIcon({ className: 'pin-usuario', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] }),
        title: etiqueta,
        zIndexOffset: 1000,
      }).bindPopup(etiqueta);
      usuario = [punto];
      if (precision && precision < 3000) {
        usuario.push(L.circle([lat, lng], {
          radius: precision, color: '#2f7cf6', weight: 1, fillColor: '#2f7cf6', fillOpacity: 0.12, interactive: false,
        }));
      }
      usuario.forEach((capa) => capa.addTo(mapa));
    },
  };
}
