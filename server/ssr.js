// Fase 4.3 · SSR: el servidor arma el HTML completo de la ficha de una cafetería.
// El navegador recibe el contenido ya pintado (útil para SEO y para la primera carga);
// después, en la Fase 11, el cliente "hidrata" la página para hacerla interactiva.
// El marcado es el mismo que pinta la vista CSR (public/js/vistas/ficha.js).
const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (t = '') => String(t).replace(/[&<>"']/g, (c) => ENTIDADES[c]);
const estrellas = (v) => '★'.repeat(Math.round(v)) + '☆'.repeat(5 - Math.round(v));
const PRECIOS = { $: 'Económico', $$: 'Precio medio', $$$: 'Precio alto' };
const fecha = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

// Los mismos íconos que public/js/iconos.js (el servidor no puede importar módulos del navegador)
const svg = (d) => `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONO = {
  inicio: svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>'),
  lista: svg('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>'),
  pin: svg('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  ajustes: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  reloj: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  volver: svg('<path d="M15 18l-6-6 6-6"/>'),
  estrella: '<svg class="icono" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>',
  taza: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3.5c0 1.2 1 1.3 1 2.5M12 3.5c0 1.2 1 1.3 1 2.5"/></svg>',
};

function renderResenas(resenas) {
  if (!resenas.length) {
    return '<p class="ayuda" style="padding:12px 0">Nadie ha escrito una reseña todavía.</p>';
  }
  return resenas.map((r) => `
      <article class="resena">
        <span class="avatar" aria-hidden="true">${esc((r.autor || 'A')[0].toUpperCase())}</span>
        <div>
          <div class="resena-cabeza">
            <span class="resena-autor">${esc(r.autor)}</span>
            <span class="estrellas" aria-label="${r.calificacion} de 5">${estrellas(r.calificacion)}</span>
            <span class="resena-fecha">${fecha(r.fecha)}</span>
          </div>
          <p>${esc(r.texto)}</p>
        </div>
      </article>`).join('');
}

function renderFicha(lugar, resenas = []) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <base href="/">
  <title>${esc(lugar.nombre)} | CaféGuía</title>
  <meta name="description" content="${esc(lugar.descripcion)}">
  <link rel="preload" href="fonts/bricolage-grotesque.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="css/estilos.css">
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#f2f4f1">
  <link rel="icon" type="image/png" href="icons/icon-192.png">
</head>
<body>
  <header class="barra">
    <a class="marca" href="./#/" aria-label="CaféGuía, inicio">
      <span class="marca-sello" aria-hidden="true">${ICONO.taza}</span>
      CaféGuía
    </a>
    <nav class="menu" aria-label="Navegación principal">
      <a href="./#/">${ICONO.inicio}Inicio</a>
      <a href="./#/catalogo" class="activa">${ICONO.lista}Catálogo</a>
      <a href="./#/cerca">${ICONO.pin}Cerca de mí</a>
      <a href="./#/ajustes">${ICONO.ajustes}Ajustes</a>
    </nav>
    <span class="estado-red" id="estado-ssr">Generada en el servidor</span>
  </header>

  <main class="vista" id="ficha-ssr" data-lugar-id="${lugar.id}">
    <a class="volver" href="./#/catalogo">${ICONO.volver}Catálogo</a>
    <header class="ficha-cabecera" style="--c:${lugar.color}">
      <h1>${esc(lugar.nombre)}</h1>
      <div class="resumen">
        <span class="calificacion" aria-label="Calificación ${lugar.calificacion} de 5">${ICONO.estrella}${Number(lugar.calificacion).toFixed(1)}</span>
        <span>${PRECIOS[lugar.precio] || ''} (${lugar.precio})</span>
      </div>
    </header>

    <div class="ficha-cuerpo">
      <div>
        <p class="ficha-descripcion">${esc(lugar.descripcion)}</p>
        <dl class="datos">
          <div class="dato">${ICONO.pin}<div><dt>Dirección</dt><dd>${esc(lugar.direccion)}</dd></div></div>
          <div class="dato">${ICONO.reloj}<div><dt>Horario</dt><dd>${esc(lugar.horario)}</dd></div></div>
        </dl>
        <div class="etiquetas">${lugar.etiquetas.map((e) => `<span class="etiqueta">${esc(e)}</span>`).join('')}</div>
        <div class="acciones" id="acciones-ssr" style="margin-top:24px">
          <a class="boton secundario" href="./#/lugar/${lugar.id}">Abrir en la app</a>
        </div>
        <p class="ayuda" style="margin-top:20px">Página generada en el servidor el ${new Date().toLocaleString('es-MX')}</p>
      </div>

      <section class="panel" aria-labelledby="titulo-resenas">
        <h2 id="titulo-resenas">${resenas.length ? `Reseñas (${resenas.length})` : 'Reseñas'}</h2>
        <div id="lista-resenas">${renderResenas(resenas)}</div>
        <p class="ayuda">Para escribir una reseña, abre esta cafetería en la app.</p>
      </section>
    </div>
  </main>
  <!-- Estado inicial serializado para la hidratación (Fase 11) -->
  <script id="estado-inicial" type="application/json">${JSON.stringify({ lugar, resenas }).replace(/</g, '\\u003c')}</script>
  <script src="js/db.js"></script>
  <script type="module" src="js/hidratar.js"></script>
</body>
</html>`;
}

module.exports = { renderFicha };
