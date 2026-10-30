// Fase 5.3 · Botón de instalación.
// Chrome/Edge disparan "beforeinstallprompt" cuando la PWA cumple los requisitos.
// Guardamos el evento para lanzar el diálogo cuando el usuario pulse nuestro botón.
let eventoInstalacion = null;
const oyentes = new Set();

const avisar = () => oyentes.forEach((fn) => fn(estadoInstalacion()));

window.addEventListener('beforeinstallprompt', (evento) => {
  evento.preventDefault();          // evita el mini-banner automático
  eventoInstalacion = evento;
  avisar();
});

window.addEventListener('appinstalled', () => {
  eventoInstalacion = null;
  console.log('[PWA] instalada');
  avisar();
});

export function estaInstalada() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true; // iOS
}

export function estadoInstalacion() {
  if (estaInstalada()) return 'instalada';
  if (eventoInstalacion) return 'disponible';
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return 'ios';
  return 'no-disponible';
}

export function alCambiarInstalacion(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

export async function instalar() {
  if (!eventoInstalacion) return false;
  eventoInstalacion.prompt();
  const { outcome } = await eventoInstalacion.userChoice;
  eventoInstalacion = null;
  avisar();
  return outcome === 'accepted';
}
