// Fase 8.2 · Guardar local primero, enviar después.
// 1. La reseña se guarda en IndexedDB con estado "pendiente" (funciona sin red).
// 2. Se registra un Background Sync: el navegador despertará al service worker
//    cuando haya conexión, aunque el usuario ya haya cerrado la app.
// 3. Si el navegador no soporta Background Sync, se envía al volver el evento "online".
import { mostrarAviso } from './util.js';

const db = self.CafeDB;
const ETIQUETA_SYNC = 'enviar-resenas';
let syncDisponible = 'SyncManager' in window;

export async function resenasLocales(lugarId) {
  return db.porIndice('resenas', 'porLugar', Number(lugarId));
}

export async function resenasRemotas(lugarId) {
  try {
    const r = await fetch(`api/resenas?lugar=${lugarId}`);
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

export async function guardarResena({ lugarId, autor, calificacion, texto, foto = null }) {
  const resena = {
    idCliente: crypto.randomUUID(), // evita duplicados si el envío se reintenta
    lugarId: Number(lugarId),
    autor: autor.trim() || 'Anónimo',
    calificacion: Number(calificacion),
    texto: texto.trim(),
    fecha: new Date().toISOString(),
    estado: 'pendiente',
  };
  // IndexedDB guarda el Blob tal cual: la foto queda en el teléfono hasta subirse
  if (foto) resena.foto = foto;
  await db.guardar('resenas', resena);
  await db.actualizarInsignia();
  await programarEnvio();
  return resena;
}

async function programarEnvio() {
  if (syncDisponible) {
    try {
      const registro = await navigator.serviceWorker.ready;
      await registro.sync.register(ETIQUETA_SYNC);
      console.log('[sync] registrado', ETIQUETA_SYNC);
      return;
    } catch (e) {
      // Algunos navegadores tienen la API pero desactivada (p. ej. Brave):
      // "UnknownError: Background Sync is disabled"
      console.warn('[sync] Background Sync no disponible:', e.message);
      syncDisponible = false;
    }
  }
  if (navigator.onLine) await enviarDesdeLaPagina();
}

// Respaldo para Firefox, Safari y navegadores con Background Sync desactivado
export async function enviarDesdeLaPagina() {
  try {
    const n = await db.enviarResenasPendientes();
    if (n) avisarSincronizadas(n);
  } catch (e) {
    console.warn('[sync] no se pudieron enviar todavía', e.message);
  }
}

function avisarSincronizadas(n) {
  mostrarAviso(n === 1 ? "Tu reseña se publicó" : `Se publicaron ${n} reseñas`);
  window.dispatchEvent(new CustomEvent('resenas-sincronizadas'));
}

export function iniciarSincronizacion() {
  window.addEventListener('online', () => {
    if (!syncDisponible) enviarDesdeLaPagina();
  });
  // Reseñas que quedaron pendientes de una visita anterior
  db.actualizarInsignia();
  db.porIndice('resenas', 'porEstado', 'pendiente').then((p) => {
    if (p.length && navigator.onLine) programarEnvio();
  });
  // El service worker avisa cuando terminó el sync en segundo plano
  navigator.serviceWorker?.addEventListener('message', (e) => {
    if (e.data?.tipo === 'resenas-sincronizadas') avisarSincronizadas(e.data.cantidad);
  });
}
