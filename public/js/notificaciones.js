// Fase 10.4 · Cliente: notificaciones locales y suscripción push.

export function soportaNotificaciones() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function soportaPush() {
  return soportaNotificaciones() && 'PushManager' in window;
}

export function permisoActual() {
  return soportaNotificaciones() ? Notification.permission : 'no-soportado';
}

// El permiso SIEMPRE debe pedirse como respuesta a un clic del usuario
export async function pedirPermiso() {
  if (!soportaNotificaciones()) return 'no-soportado';
  return Notification.requestPermission();
}

// Notificación local: la muestra el propio dispositivo, sin servidor
export async function notificacionLocal(titulo, opciones = {}) {
  if (Notification.permission !== 'granted') throw new Error('Sin permiso de notificaciones');
  const registro = await navigator.serviceWorker.ready;
  return registro.showNotification(titulo, {
    icon: 'icons/icon-192.png',
    badge: 'icons/badge-96.png',
    vibrate: [100, 50, 100],
    ...opciones,
  });
}

// La clave pública VAPID viene en Base64-URL; pushManager la necesita en bytes
function base64UrlABytes(base64) {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + relleno).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export async function suscripcionActual() {
  if (!soportaPush()) return null;
  const registro = await navigator.serviceWorker.ready;
  return registro.pushManager.getSubscription();
}

export async function suscribirPush() {
  if (!soportaPush()) throw new Error('Este navegador no soporta push');
  if ((await pedirPermiso()) !== 'granted') throw new Error('Permiso denegado');

  const r = await fetch('api/push/clave-publica');
  if (!r.ok) throw new Error('El servidor no tiene push configurado');
  const { clavePublica } = await r.json();

  const registro = await navigator.serviceWorker.ready;
  const suscripcion = await registro.pushManager.subscribe({
    userVisibleOnly: true, // obligatorio: cada push debe mostrar una notificación
    applicationServerKey: base64UrlABytes(clavePublica),
  });

  await fetch('api/push/suscribir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(suscripcion),
  });
  return suscripcion;
}

export async function desuscribirPush() {
  const suscripcion = await suscripcionActual();
  if (!suscripcion) return;
  await fetch('api/push/desuscribir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: suscripcion.endpoint }),
  }).catch(() => {});
  await suscripcion.unsubscribe();
}

export async function enviarPushDePrueba() {
  const r = await fetch('api/push/enviar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo: 'Promoción de hoy',
      cuerpo: '2x1 en capuchinos en Grano de Cantera hasta las 6 pm.',
      url: './#/lugar/1',
    }),
  });
  return r.json();
}
