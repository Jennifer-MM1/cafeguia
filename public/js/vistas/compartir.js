// Extra · Destino de "Compartir" (Web Share Target).
// Cuando el usuario comparte una foto, un texto o un enlace desde otra app
// (galería, Maps, WhatsApp) y elige CaféGuía, el service worker guarda lo
// recibido en IndexedDB y abre esta vista para elegir la cafetería.
import { obtenerCatalogo } from '../api.js';
import { filaLugar, escaparHTML } from '../util.js';

const db = self.CafeDB;

export async function vistaCompartir(contenedor) {
  const [compartido, catalogo] = await Promise.all([
    db.obtener('compartidos', 'ultimo'), obtenerCatalogo(),
  ]);

  if (!compartido) {
    contenedor.innerHTML = `
      <div class="vacio"><strong>No hay nada compartido</strong>
        Instala CaféGuía en tu teléfono. Luego, desde la galería o cualquier app,
        toca Compartir y elige CaféGuía para usar esa foto o ese texto en una reseña.
        <div class="acciones" style="justify-content:center;margin-top:16px">
          <a class="boton" href="#/catalogo">Ver el catálogo</a></div></div>`;
    return;
  }

  const urlFoto = compartido.foto ? URL.createObjectURL(compartido.foto) : '';
  const texto = [compartido.titulo, compartido.texto, compartido.enlace].filter(Boolean).join(' ');

  contenedor.innerHTML = `
    <header class="encabezado">
      <h1>¿De qué cafetería es?</h1>
      <p>Elige el lugar y empezamos una reseña con lo que compartiste.</p>
    </header>
    <div class="panel compartido">
      ${urlFoto ? `<img src="${urlFoto}" alt="Foto compartida">` : ''}
      <div>
        <p>${texto ? escaparHTML(texto) : '<span class="ayuda">Solo una foto</span>'}</p>
        <div class="acciones" style="margin-top:12px">
          <button class="boton secundario" type="button" id="descartar">Descartar</button>
        </div>
      </div>
    </div>
    <ul class="directorio" style="margin-top:20px">
      ${catalogo.map((l) => filaLugar(l)
        .replace(`href="#/lugar/${l.id}"`, `href="#/lugar/${l.id}?compartido=1"`)).join('')}
    </ul>`;

  contenedor.querySelector('#descartar').addEventListener('click', async () => {
    await db.borrar('compartidos', 'ultimo');
    if (urlFoto) URL.revokeObjectURL(urlFoto);
    location.hash = '#/';
  });
}
