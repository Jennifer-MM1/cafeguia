// Fase 3.1 · Registro del service worker.
// Fase 9.2 · Detecta versiones nuevas y avisa al usuario.
//
// Ciclo de vida: installing → installed (waiting) → activating → activated
// Si ya hay un SW controlando la página, el nuevo se queda en "waiting".
// Le mostramos un aviso; al aceptar, le pedimos skipWaiting() y recargamos.

let recargando = false;
let actualizacionSolicitada = false; // evita recargar en la primera instalación

export async function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Este navegador no soporta service workers.');
    return null;
  }
  try {
    // Ruta relativa: funciona igual en localhost y en GitHub Pages (/repositorio/)
    const registro = await navigator.serviceWorker.register('./sw.js');
    console.log('[SW] registrado con alcance', registro.scope);
    vigilarActualizaciones(registro);
    return registro;
  } catch (error) {
    console.error('[SW] error al registrar', error);
    return null;
  }
}

function vigilarActualizaciones(registro) {
  // Ya había una versión esperando de una visita anterior
  if (registro.waiting && navigator.serviceWorker.controller) {
    mostrarAvisoActualizacion(registro.waiting);
  }

  // Se encontró un sw.js distinto en el servidor
  registro.addEventListener('updatefound', () => {
    const nuevo = registro.installing;
    nuevo.addEventListener('statechange', () => {
      // "installed" + ya hay controlador = es una actualización, no la primera instalación
      if (nuevo.state === 'installed' && navigator.serviceWorker.controller) {
        mostrarAvisoActualizacion(nuevo);
      }
    });
  });

  // Cuando el SW nuevo toma el control, recargamos una sola vez
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando || !actualizacionSolicitada) return;
    recargando = true;
    location.reload();
  });

  // Buscar actualizaciones al volver a la app y cada 30 minutos
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') registro.update().catch(() => {});
  });
  setInterval(() => registro.update().catch(() => {}), 30 * 60 * 1000);
}

function mostrarAvisoActualizacion(trabajador) {
  if (document.getElementById('aviso-actualizacion')) return;
  const aviso = document.createElement('div');
  aviso.id = 'aviso-actualizacion';
  aviso.className = 'aviso';
  aviso.setAttribute('role', 'alert');
  aviso.innerHTML = `
    <span>✨ Hay una versión nueva de CaféGuía.</span>
    <button class="boton" type="button">Actualizar</button>`;
  aviso.querySelector('button').addEventListener('click', () => {
    aviso.querySelector('button').disabled = true;
    actualizacionSolicitada = true;
    trabajador.postMessage({ tipo: 'SKIP_WAITING' });
  });
  document.body.appendChild(aviso);
}

// Pregunta al SW activo qué versión es (se muestra en Ajustes)
export async function versionServiceWorker() {
  const sw = navigator.serviceWorker?.controller;
  if (!sw) return 'sin service worker';
  return new Promise((resolver) => {
    const alResponder = (e) => {
      if (e.data?.tipo !== 'VERSION') return;
      navigator.serviceWorker.removeEventListener('message', alResponder);
      resolver(e.data.version);
    };
    navigator.serviceWorker.addEventListener('message', alResponder);
    sw.postMessage({ tipo: 'VERSION' });
    setTimeout(() => resolver('desconocida'), 1500);
  });
}
