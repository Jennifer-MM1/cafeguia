import { obtenerLugar, hayServidor } from '../api.js';
import {
  escaparHTML, estrellas, mostrarAviso, calificacionHTML, precioTexto, fechaCorta, iniciales,
} from '../util.js';
import { icono } from '../iconos.js';
import { imgFoto, creditoFoto, ANCHOS } from '../fotos.js';
import { horarioHTML } from '../horario.js';
import { guardarResena, resenasLocales, resenasRemotas } from '../resenas.js';
import { compartir } from '../dispositivo.js';
import { comprimirImagen } from '../imagen.js';

export async function vistaFicha(contenedor, { id }) {
  const lugar = await obtenerLugar(id);
  if (!lugar) {
    contenedor.innerHTML = `<div class="vacio"><strong>No encontramos esa cafetería</strong>
      Puede que el enlace esté mal escrito.
      <div class="acciones" style="justify-content:center;margin-top:16px">
        <a class="boton" href="#/catalogo">Ver el catálogo</a></div></div>`;
    return;
  }

  contenedor.innerHTML = `
    <a class="volver" href="#/catalogo">${icono.volver}Catálogo</a>
    <header class="ficha-cabecera ${lugar.foto ? 'con-foto' : ''}" style="--c:${lugar.color}">
      ${imgFoto(lugar.foto, { ancho: ANCHOS.portada, clase: 'portada-foto', perezosa: false })}
      <h1>${escaparHTML(lugar.nombre)}</h1>
      <div class="resumen">
        ${calificacionHTML(lugar.calificacion)}
        <span>${precioTexto(lugar.precio)} (${lugar.precio})</span>
        ${horarioHTML(lugar)}
      </div>
    </header>
    ${lugar.foto ? `<p class="credito">${creditoFoto(lugar.foto)}</p>` : ''}

    <div class="ficha-cuerpo">
      <div>
        <p class="ficha-descripcion">${escaparHTML(lugar.descripcion)}</p>
        <dl class="datos">
          <div class="dato">${icono.pin}<div><dt>Dirección</dt><dd>${escaparHTML(lugar.direccion)}</dd></div></div>
          <div class="dato">${icono.reloj}<div><dt>Horario</dt><dd>${escaparHTML(lugar.horario)}</dd></div></div>
        </dl>
        <div class="etiquetas">${lugar.etiquetas.map((e) => `<span class="etiqueta">${escaparHTML(e)}</span>`).join('')}</div>
        <div class="acciones" id="acciones-ficha" style="margin-top:24px"></div>
      </div>

      <section class="panel" id="seccion-resenas" aria-labelledby="titulo-resenas">
        <h2 id="titulo-resenas">Reseñas</h2>
        <div id="lista-resenas"><p class="ayuda">Cargando reseñas…</p></div>
        <form id="form-resena" class="form-resena">
          <div class="fila-campos">
            <div>
              <label for="autor">Tu nombre</label>
              <input id="autor" name="autor" maxlength="40" placeholder="Anónimo" autocomplete="given-name">
            </div>
            <div>
              <label for="calificacion">Calificación</label>
              <select id="calificacion" name="calificacion">
                <option value="5">5 · Excelente</option>
                <option value="4">4 · Muy bueno</option>
                <option value="3">3 · Bueno</option>
                <option value="2">2 · Regular</option>
                <option value="1">1 · Malo</option>
              </select>
            </div>
          </div>
          <label for="texto">Tu reseña</label>
          <textarea id="texto" name="texto" maxlength="500" required
            placeholder="¿Qué pediste? ¿Cómo estuvo el lugar?"></textarea>
          <span class="etiqueta-campo">Foto (opcional)</span>
          <div class="campo-foto">
            <!-- Sin "capture": en el celular deja elegir entre la cámara y la galería -->
            <input type="file" id="foto" accept="image/*">
            <label for="foto" class="boton secundario" style="margin:0">${icono.camara}Agregar foto</label>
            <div class="vista-previa" id="vista-previa" hidden>
              <img alt="Foto que vas a publicar">
              <button type="button" id="quitar-foto" aria-label="Quitar foto">${icono.cerrar}</button>
            </div>
          </div>
          <p class="ayuda">Puedes escribirla sin internet: se publica sola cuando vuelvas a tener conexión.</p>
          <div class="acciones"><button class="boton" type="submit">Publicar reseña</button></div>
        </form>
      </section>
    </div>`;

  const acciones = contenedor.querySelector('#acciones-ficha');

  // Fase 6 · Favoritos guardados en IndexedDB
  const btnFav = document.createElement('button');
  btnFav.type = 'button';
  const pintarFav = (es) => {
    btnFav.className = es ? 'boton activo' : 'boton';
    btnFav.setAttribute('aria-pressed', String(es));
    btnFav.innerHTML = es ? `${icono.guardado}Guardada` : `${icono.guardar}Guardar`;
  };
  pintarFav(Boolean(await self.CafeDB.obtener('favoritos', lugar.id)));
  btnFav.addEventListener('click', async () => {
    const es = Boolean(await self.CafeDB.obtener('favoritos', lugar.id));
    if (es) await self.CafeDB.borrar('favoritos', lugar.id);
    else await self.CafeDB.guardar('favoritos', { id: lugar.id, fecha: Date.now() });
    pintarFav(!es);
    mostrarAviso(es ? 'Quitada de tus guardadas' : 'Guardada. La encuentras en Inicio.');
  });
  acciones.appendChild(btnFav);

  // Fase 11 · Compartir con la hoja nativa del dispositivo
  const btnCompartir = document.createElement('button');
  btnCompartir.type = 'button';
  btnCompartir.className = 'boton secundario';
  btnCompartir.innerHTML = `${icono.compartir}Compartir`;
  btnCompartir.addEventListener('click', async () => {
    const url = new URL(`#/lugar/${lugar.id}`, location.href).href;
    const r = await compartir({ titulo: lugar.nombre, texto: lugar.descripcion, url });
    if (r === 'copiado') mostrarAviso('Enlace copiado');
  });
  acciones.appendChild(btnCompartir);

  // Enlace a la versión renderizada en el servidor (solo si hay servidor Node)
  if (await hayServidor()) {
    acciones.insertAdjacentHTML('beforeend',
      `<a class="boton secundario" href="lugar/${lugar.id}">${icono.servidor}Versión SSR</a>`);
  }

  // Fase 8 · Reseñas: las del servidor + las locales que aún no se envían
  const lista = contenedor.querySelector('#lista-resenas');
  const titulo = contenedor.querySelector('#titulo-resenas');
  // Foto pendiente: Blob local (URL temporal). Foto publicada: archivo del servidor.
  const urlsTemporales = [];
  const fotoResena = (r) => {
    let src = r.foto;
    if (r.foto instanceof Blob) {
      src = URL.createObjectURL(r.foto);
      urlsTemporales.push(src);
    }
    return src ? `<img class="resena-foto" src="${escaparHTML(src)}" alt="Foto de la reseña de ${escaparHTML(r.autor)}" loading="lazy">` : '';
  };
  async function pintarResenas() {
    urlsTemporales.splice(0).forEach((u) => URL.revokeObjectURL(u));
    const [remotas, locales] = await Promise.all([resenasRemotas(lugar.id), resenasLocales(lugar.id)]);
    const yaEnServidor = new Set(remotas.map((r) => r.idCliente));
    const pendientes = locales.filter((r) => r.estado === 'pendiente' && !yaEnServidor.has(r.idCliente));
    const todas = [...pendientes, ...remotas];
    titulo.textContent = todas.length ? `Reseñas (${todas.length})` : 'Reseñas';
    lista.innerHTML = todas.length ? todas.map((r) => `
      <article class="resena">
        <span class="avatar" aria-hidden="true">${escaparHTML(iniciales(r.autor).slice(0, 1) || 'A')}</span>
        <div>
          <div class="resena-cabeza">
            <span class="resena-autor">${escaparHTML(r.autor)}</span>
            <span class="estrellas" aria-label="${r.calificacion} de 5">${estrellas(r.calificacion)}</span>
            ${r.estado === 'pendiente'
              ? '<span class="pendiente">Se publicará al reconectar</span>'
              : `<span class="resena-fecha">${fechaCorta(r.fecha)}</span>`}
          </div>
          <p>${escaparHTML(r.texto)}</p>
          ${fotoResena(r)}
        </div>
      </article>`).join('')
      : '<p class="ayuda" style="padding:12px 0">Nadie ha escrito una reseña todavía. Cuéntanos cómo te fue.</p>';
  }
  await pintarResenas();

  // Extra · Foto en la reseña: se comprime en el teléfono y se guarda como Blob
  const form = contenedor.querySelector('#form-resena');
  const entradaFoto = contenedor.querySelector('#foto');
  const vistaPrevia = contenedor.querySelector('#vista-previa');
  let fotoElegida = null;
  const ponerFoto = (blob) => {
    fotoElegida = blob;
    const img = vistaPrevia.querySelector('img');
    if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
    vistaPrevia.hidden = !blob;
    img.src = blob ? URL.createObjectURL(blob) : '';
  };
  // Si el usuario publica mientras la foto aún se procesa, el envío la espera
  let procesando = Promise.resolve();
  entradaFoto.addEventListener('change', () => {
    const archivo = entradaFoto.files[0];
    entradaFoto.value = '';
    if (!archivo) return;
    procesando = comprimirImagen(archivo)
      .then(ponerFoto)
      .catch((error) => mostrarAviso(error.message));
  });
  contenedor.querySelector('#quitar-foto').addEventListener('click', () => ponerFoto(null));

  // Extra · Llegó contenido compartido desde otra app (#/lugar/3?compartido=1)
  if (new URLSearchParams(location.hash.split('?')[1] || '').get('compartido')) {
    const compartido = await self.CafeDB.obtener('compartidos', 'ultimo');
    if (compartido) {
      form.texto.value = [compartido.texto, compartido.enlace].filter(Boolean).join('\n');
      // Las fotos compartidas llegan a tamaño original: se reducen igual que las de la cámara
      if (compartido.foto) ponerFoto(await comprimirImagen(compartido.foto).catch(() => null));
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      form.texto.focus({ preventScroll: true });
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await procesando;
    const datos = Object.fromEntries(new FormData(form));
    await guardarResena({ lugarId: lugar.id, ...datos, foto: fotoElegida });
    await self.CafeDB.borrar('compartidos', 'ultimo');
    form.reset();
    ponerFoto(null);
    mostrarAviso(navigator.onLine ? 'Publicando tu reseña…' : 'Sin conexión. Tu reseña se publicará al reconectar.');
    await pintarResenas();
  });

  // Cuando termina la sincronización, se vuelve a pintar (si seguimos en esta vista)
  const alSincronizar = () => {
    if (contenedor.contains(lista)) pintarResenas();
    else window.removeEventListener('resenas-sincronizadas', alSincronizar);
  };
  window.addEventListener('resenas-sincronizadas', alSincronizar);
}
