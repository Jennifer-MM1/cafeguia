// Fase 3.1 · Registro del service worker.
// Se registra al cargar la página para no competir con la carga inicial del shell.
export async function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Este navegador no soporta service workers.');
    return null;
  }
  try {
    // Ruta relativa: funciona igual en localhost y en GitHub Pages (/repositorio/)
    const registro = await navigator.serviceWorker.register('./sw.js');
    console.log('[SW] registrado con alcance', registro.scope);
    return registro;
  } catch (error) {
    console.error('[SW] error al registrar', error);
    return null;
  }
}
