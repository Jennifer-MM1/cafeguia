// Utilidades compartidas por las vistas
const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escaparHTML(texto = '') {
  return String(texto).replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

export function estrellas(valor = 0) {
  const llenas = Math.round(valor);
  return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
}

// Aviso flotante breve (toast)
export function mostrarAviso(texto, ms = 3500) {
  const aviso = document.createElement('div');
  aviso.className = 'aviso';
  aviso.setAttribute('role', 'status');
  aviso.textContent = texto;
  document.body.appendChild(aviso);
  setTimeout(() => aviso.remove(), ms);
}

export function tarjetaLugar(lugar, extra = '') {
  return `
    <a class="tarjeta" href="#/lugar/${lugar.id}">
      <div class="tarjeta-imagen" style="background:${lugar.color}22">${lugar.emoji}</div>
      <div class="tarjeta-cuerpo">
        <h3>${escaparHTML(lugar.nombre)}</h3>
        <p class="meta"><span class="estrellas">${estrellas(lugar.calificacion)}</span>
          ${lugar.calificacion} · ${lugar.precio}</p>
        <p class="meta">${escaparHTML(lugar.direccion)}</p>
        ${extra}
      </div>
    </a>`;
}
