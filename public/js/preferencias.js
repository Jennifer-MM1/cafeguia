// Fase 6.2 · Preferencias en localStorage.
// localStorage es síncrono y solo guarda texto: ideal para datos pequeños como el tema.
const CLAVE = 'cafeguia:preferencias';
const POR_DEFECTO = { tema: 'sistema', orden: 'calificacion', ultimaVisita: null };

export function leerPreferencias() {
  try {
    return { ...POR_DEFECTO, ...JSON.parse(localStorage.getItem(CLAVE) || '{}') };
  } catch {
    return { ...POR_DEFECTO };
  }
}

export function guardarPreferencia(nombre, valor) {
  const prefs = { ...leerPreferencias(), [nombre]: valor };
  try {
    localStorage.setItem(CLAVE, JSON.stringify(prefs));
  } catch (e) {
    console.warn('No se pudo guardar la preferencia', e);
  }
  if (nombre === 'tema') aplicarTema();
  return prefs;
}

export function aplicarTema() {
  const { tema } = leerPreferencias();
  const oscuroSistema = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const oscuro = tema === 'oscuro' || (tema === 'sistema' && oscuroSistema);
  document.documentElement.dataset.tema = oscuro ? 'oscuro' : 'claro';
}

// Registra la visita y devuelve la anterior (para el saludo de la Home)
export function registrarVisita() {
  const anterior = leerPreferencias().ultimaVisita;
  guardarPreferencia('ultimaVisita', new Date().toISOString());
  return anterior;
}
