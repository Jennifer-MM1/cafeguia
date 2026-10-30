// Fotografías de las cafeterías (Unsplash, licencia libre).
// Se enlazan desde images.unsplash.com, como piden las reglas de Unsplash, en dos
// tamaños fijos. El service worker guarda esos mismos URLs para verlas sin conexión.
import { escaparHTML } from './util.js';

export const ANCHOS = { miniatura: 480, portada: 1200 };

export function fotoURL(foto, ancho = ANCHOS.miniatura) {
  return `${foto.src}?w=${ancho}&q=70&fm=jpg&fit=crop`;
}

// crossorigin="anonymous": la respuesta llega con CORS y el SW puede guardarla
// (una respuesta opaca no se puede revisar y ocupa mucho espacio en la caché)
export function imgFoto(foto, { ancho = ANCHOS.miniatura, clase = '', perezosa = true } = {}) {
  if (!foto) return '';
  return `<img class="${clase}" src="${fotoURL(foto, ancho)}" alt="${escaparHTML(foto.alt || '')}"
    crossorigin="anonymous" ${perezosa ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async">`;
}

const UTM = 'utm_source=cafeguia&utm_medium=referral';

export function creditoFoto(foto) {
  if (!foto) return '';
  return `Foto de <a href="${foto.pagina}?${UTM}" target="_blank" rel="noopener">${escaparHTML(foto.autor)}</a>
    en <a href="https://unsplash.com/?${UTM}" target="_blank" rel="noopener">Unsplash</a>`;
}
