// Fase 11.3 · Hidratación de la ficha SSR.
// El servidor ya mandó el HTML pintado. Aquí NO se vuelve a pintar: se toma el estado
// serializado (#estado-inicial) y se "conectan" los eventos al HTML existente.
import { registrarServiceWorker } from './registro-sw.js';
import { aplicarTema } from './preferencias.js';
import { compartir, vibrar } from './dispositivo.js';
import { mostrarAviso } from './util.js';

const db = self.CafeDB;

function hidratar() {
  const { lugar } = JSON.parse(document.getElementById('estado-inicial').textContent);
  const acciones = document.getElementById('acciones-ssr');

  // 1) Favorito: lee y escribe en la misma IndexedDB que la app CSR
  const btnFav = document.createElement('button');
  btnFav.className = 'boton';
  const pintar = (es) => { btnFav.textContent = es ? '★ En favoritos' : '☆ Guardar en favoritos'; };
  db.obtener('favoritos', lugar.id).then((f) => pintar(Boolean(f)));
  btnFav.addEventListener('click', async () => {
    const es = Boolean(await db.obtener('favoritos', lugar.id));
    if (es) await db.borrar('favoritos', lugar.id);
    else await db.guardar('favoritos', { id: lugar.id, fecha: Date.now() });
    pintar(!es);
    vibrar(30);
  });

  // 2) Compartir con la hoja nativa del dispositivo
  const btnCompartir = document.createElement('button');
  btnCompartir.className = 'boton secundario';
  btnCompartir.textContent = '↗ Compartir';
  btnCompartir.addEventListener('click', async () => {
    const r = await compartir({ titulo: lugar.nombre, texto: lugar.descripcion, url: location.href });
    if (r === 'copiado') mostrarAviso('Enlace copiado al portapapeles');
  });

  acciones.prepend(btnFav, btnCompartir);

  // Marca visible de que la página ya es interactiva
  const marca = document.querySelector('.barra .estado-red');
  if (marca) marca.textContent = 'SSR + hidratada';
  document.getElementById('ficha-ssr').dataset.hidratada = 'true';
}

aplicarTema();
hidratar();
registrarServiceWorker();
