// Fase 7.3 · Indicador de conexión en el shell.
// navigator.onLine dice si hay red local; los eventos online/offline avisan los cambios.
const oyentes = new Set();

export function enLinea() {
  return navigator.onLine;
}

export function alCambiarConexion(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

export function iniciarIndicador() {
  const barra = document.querySelector('.barra');
  const pastilla = document.createElement('span');
  pastilla.className = 'estado-red';
  pastilla.setAttribute('role', 'status');
  pastilla.setAttribute('aria-live', 'polite');
  barra.appendChild(pastilla);

  const pintar = () => {
    const ok = navigator.onLine;
    pastilla.textContent = ok ? 'En línea' : 'Sin conexión';
    pastilla.classList.toggle('sin-red', !ok);
    oyentes.forEach((fn) => fn(ok));
  };
  window.addEventListener('online', pintar);
  window.addEventListener('offline', pintar);
  pintar();
}
