// Fase 11.3 · Hidratación de la ficha SSR.
// El servidor ya mandó el HTML pintado. Aquí NO se vuelve a pintar: se toma el estado
// serializado (#estado-inicial) y se "conectan" los eventos al HTML existente.
import { registrarServiceWorker } from './registro-sw.js';
import { aplicarTema } from './preferencias.js';
import { compartir, vibrar } from './dispositivo.js';
import { mostrarAviso } from './util.js';
import { icono } from './iconos.js';
import { horarioHTML } from './horario.js';

const db = self.CafeDB;

function hidratar() {
  const { lugar } = JSON.parse(document.getElementById('estado-inicial').textContent);
  const acciones = document.getElementById('acciones-ssr');

  // 1) Guardar: lee y escribe en la misma IndexedDB que la app CSR
  const btnFav = document.createElement('button');
  btnFav.type = 'button';
  const pintar = (es) => {
    btnFav.className = es ? 'boton activo' : 'boton';
    btnFav.setAttribute('aria-pressed', String(es));
    btnFav.innerHTML = es ? `${icono.guardado}Guardada` : `${icono.guardar}Guardar`;
  };
  pintar(false);
  db.obtener('favoritos', lugar.id).then((f) => pintar(Boolean(f)));
  btnFav.addEventListener('click', async () => {
    const es = Boolean(await db.obtener('favoritos', lugar.id));
    if (es) await db.borrar('favoritos', lugar.id);
    else await db.guardar('favoritos', { id: lugar.id, fecha: Date.now() });
    pintar(!es);
    vibrar(30);
    mostrarAviso(es ? 'Quitada de tus guardadas' : 'Guardada. La encuentras en Inicio.');
  });

  // 2) Compartir con la hoja nativa del dispositivo
  const btnCompartir = document.createElement('button');
  btnCompartir.type = 'button';
  btnCompartir.className = 'boton secundario';
  btnCompartir.innerHTML = `${icono.compartir}Compartir`;
  btnCompartir.addEventListener('click', async () => {
    const r = await compartir({ titulo: lugar.nombre, texto: lugar.descripcion, url: location.href });
    if (r === 'copiado') mostrarAviso('Enlace copiado');
  });

  acciones.prepend(btnFav, btnCompartir);

  // 3) Abierto/cerrado: depende de la hora actual, por eso lo calcula el cliente
  const horario = document.getElementById('horario-ssr');
  if (horario) horario.outerHTML = horarioHTML(lugar);

  // Marca visible de que la página ya es interactiva
  const marca = document.getElementById('estado-ssr');
  if (marca) marca.textContent = 'Servidor + hidratada';
  document.getElementById('ficha-ssr').dataset.hidratada = 'true';
}

aplicarTema();
hidratar();
registrarServiceWorker();
