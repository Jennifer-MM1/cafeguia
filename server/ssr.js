// Fase 4.3 · SSR: el servidor arma el HTML completo de la ficha de una cafetería.
// El navegador recibe el contenido ya pintado (útil para SEO y para la primera carga);
// después, en la Fase 11, el cliente "hidrata" la página para hacerla interactiva.
const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (t = '') => String(t).replace(/[&<>"']/g, (c) => ENTIDADES[c]);
const estrellas = (v) => '★'.repeat(Math.round(v)) + '☆'.repeat(5 - Math.round(v));

function renderResenas(resenas) {
  if (!resenas.length) return '<p class="meta">Aún no hay reseñas. ¡Sé el primero!</p>';
  return resenas.map((r) => `
      <div class="resena">
        <span class="resena-autor">${esc(r.autor)}</span>
        <span class="estrellas">${estrellas(r.calificacion)}</span>
        <p>${esc(r.texto)}</p>
      </div>`).join('');
}

function renderFicha(lugar, resenas = []) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="/">
  <title>${esc(lugar.nombre)} · CaféGuía</title>
  <meta name="description" content="${esc(lugar.descripcion)}">
  <link rel="stylesheet" href="css/estilos.css">
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#2b1a12">
  <link rel="icon" type="image/png" href="icons/icon-192.png">
</head>
<body>
  <header class="barra">
    <a class="marca" href="./#/"><span class="marca-logo" aria-hidden="true">☕</span>
      <span class="marca-nombre">CaféGuía</span></a>
    <span class="estado-red">SSR</span>
  </header>
  <nav class="menu" aria-label="Navegación principal">
    <a href="./#/">Inicio</a>
    <a href="./#/catalogo" class="activa">Catálogo</a>
    <a href="./#/cerca">Cerca de mí</a>
    <a href="./#/ajustes">Ajustes</a>
  </nav>
  <main class="vista" id="ficha-ssr" data-lugar-id="${lugar.id}">
    <div class="ficha-portada" style="background:${lugar.color}33">${lugar.emoji}</div>
    <h1>${esc(lugar.nombre)}</h1>
    <p class="meta"><span class="estrellas">${estrellas(lugar.calificacion)}</span>
      ${lugar.calificacion} · ${lugar.precio}</p>
    <p>${esc(lugar.descripcion)}</p>
    <div class="caja">
      <p class="meta">📍 ${esc(lugar.direccion)}</p>
      <p class="meta">🕒 ${esc(lugar.horario)}</p>
      <div>${lugar.etiquetas.map((e) => `<span class="etiqueta">${esc(e)}</span>`).join('')}</div>
    </div>
    <div class="acciones" id="acciones-ssr">
      <a class="boton secundario" href="./#/lugar/${lugar.id}">Abrir en la app (CSR)</a>
    </div>
    <section class="caja">
      <h2>Reseñas</h2>
      <div id="lista-resenas">${renderResenas(resenas)}</div>
    </section>
    <p class="meta">Página generada en el servidor el ${new Date().toLocaleString('es-MX')}.</p>
  </main>
  <!-- Estado inicial serializado para la hidratación (Fase 11) -->
  <script id="estado-inicial" type="application/json">${JSON.stringify({ lugar, resenas }).replace(/</g, '\\u003c')}</script>
  <script src="js/db.js"></script>
  <script type="module" src="js/hidratar.js"></script>
</body>
</html>`;
}

module.exports = { renderFicha };
