import { obtenerLugar, hayServidor } from '../api.js';
import { escaparHTML, estrellas, mostrarAviso } from '../util.js';
import { guardarResena, resenasLocales, resenasRemotas } from '../resenas.js';

export async function vistaFicha(contenedor, { id }) {
  const lugar = await obtenerLugar(id);
  if (!lugar) {
    contenedor.innerHTML = '<p class="vacio">Esa cafetería no existe.</p>';
    return;
  }
  contenedor.innerHTML = `
    <div class="ficha-portada" style="background:${lugar.color}33">${lugar.emoji}</div>
    <h1>${escaparHTML(lugar.nombre)}</h1>
    <p class="meta"><span class="estrellas">${estrellas(lugar.calificacion)}</span>
      ${lugar.calificacion} · ${lugar.precio}</p>
    <p>${escaparHTML(lugar.descripcion)}</p>
    <div class="caja">
      <p class="meta">📍 ${escaparHTML(lugar.direccion)}</p>
      <p class="meta">🕒 ${escaparHTML(lugar.horario)}</p>
      <div>${lugar.etiquetas.map((e) => `<span class="etiqueta">${escaparHTML(e)}</span>`).join('')}</div>
    </div>
    <div class="acciones" id="acciones-ficha"></div>
    <section class="caja" id="seccion-resenas">
      <h2>Reseñas</h2>
      <div id="lista-resenas"><p class="meta">Cargando reseñas…</p></div>
      <h2>Escribe tu reseña</h2>
      <p class="meta">Funciona sin internet: se guarda en tu dispositivo y se envía sola al reconectar.</p>
      <form id="form-resena">
        <label for="autor">Tu nombre</label>
        <input id="autor" name="autor" maxlength="40" placeholder="Anónimo">
        <label for="calificacion">Calificación</label>
        <select id="calificacion" name="calificacion">
          <option value="5">★★★★★ Excelente</option>
          <option value="4">★★★★☆ Muy bueno</option>
          <option value="3">★★★☆☆ Bueno</option>
          <option value="2">★★☆☆☆ Regular</option>
          <option value="1">★☆☆☆☆ Malo</option>
        </select>
        <label for="texto">Comentario</label>
        <textarea id="texto" name="texto" maxlength="500" required></textarea>
        <div class="acciones"><button class="boton" type="submit">Publicar reseña</button></div>
      </form>
    </section>`;

  // Fase 6 · Favoritos guardados en IndexedDB
  const acciones = contenedor.querySelector('#acciones-ficha');
  acciones.insertAdjacentHTML('beforeend', '<button id="btn-favorito" class="boton"></button>');
  const btnFav = acciones.querySelector('#btn-favorito');
  const pintarFav = (es) => { btnFav.textContent = es ? '★ En favoritos' : '☆ Guardar en favoritos'; };
  pintarFav(Boolean(await self.CafeDB.obtener('favoritos', lugar.id)));
  btnFav.addEventListener('click', async () => {
    const es = Boolean(await self.CafeDB.obtener('favoritos', lugar.id));
    if (es) await self.CafeDB.borrar('favoritos', lugar.id);
    else await self.CafeDB.guardar('favoritos', { id: lugar.id, fecha: Date.now() });
    pintarFav(!es);
  });

  // Enlace a la versión renderizada en el servidor (solo si hay servidor Node)
  if (await hayServidor()) {
    acciones.insertAdjacentHTML('beforeend',
      `<a class="boton secundario" href="lugar/${lugar.id}">Ver versión SSR</a>`);
  }

  // Fase 8 · Reseñas: las del servidor + las locales que aún no se envían
  const lista = contenedor.querySelector('#lista-resenas');
  async function pintarResenas() {
    const [remotas, locales] = await Promise.all([resenasRemotas(lugar.id), resenasLocales(lugar.id)]);
    const yaEnServidor = new Set(remotas.map((r) => r.idCliente));
    const pendientes = locales.filter((r) => r.estado === 'pendiente' && !yaEnServidor.has(r.idCliente));
    const todas = [...pendientes, ...remotas];
    lista.innerHTML = todas.length ? todas.map((r) => `
      <div class="resena">
        <span class="resena-autor">${escaparHTML(r.autor)}</span>
        <span class="estrellas">${estrellas(r.calificacion)}</span>
        ${r.estado === 'pendiente' ? '<span class="pendiente">⏳ pendiente de envío</span>' : ''}
        <p>${escaparHTML(r.texto)}</p>
      </div>`).join('') : '<p class="meta">Aún no hay reseñas. ¡Sé el primero!</p>';
  }
  await pintarResenas();

  const form = contenedor.querySelector('#form-resena');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(form));
    await guardarResena({ lugarId: lugar.id, ...datos });
    form.reset();
    mostrarAviso(navigator.onLine ? 'Reseña guardada, enviando…' : 'Sin conexión: se enviará al reconectar');
    await pintarResenas();
  });

  // Cuando termina la sincronización, se vuelve a pintar (si seguimos en esta vista)
  const alSincronizar = () => {
    if (contenedor.contains(lista)) pintarResenas();
    else window.removeEventListener('resenas-sincronizadas', alSincronizar);
  };
  window.addEventListener('resenas-sincronizadas', alSincronizar);
}
