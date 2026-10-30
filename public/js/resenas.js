// Fase 8.2 · Guardar local primero, enviar después.
// 1. La reseña se guarda en IndexedDB con estado "pendiente" (funciona sin red).
// 2. Se registra un Background Sync: el navegador despertará al service worker
//    cuando haya conexión, aunque el usuario ya haya cerrado la app.
// 3. Si el navegador no soporta Background Sync, se envía al volver el evento "online".
import { mostrarAviso } from './util.js';

const db = self.CafeDB;
const ETIQUETA_SYNC = 'enviar-resenas';

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

export async function guardarResena({ lugarId, autor, calificacion, texto }) {
  const resena = {
    idCliente: crypto.randomUUID(), // evita duplicados si el envío se reintenta
    lugarId: Number(lugarId),
    autor: autor.trim() || 'Anónimo',
    calificacion: Number(calificacion),
    texto: texto.trim(),
    fecha: new Date().toISOString(),
    estado: 'pendiente',
  };
  await db.guardar('resenas', resena);
  await programarEnvio();
  return resena;
}

async function programarEnvio() {
  const registro = await navigator.serviceWorker?.ready;
  if (registro && 'sync' in registro) {
    await registro.sync.register(ETIQUETA_SYNC);
    console.log('[sync] registrado', ETIQUETA_SYNC);
  } else if (navigator.onLine) {
    await enviarDesdeLaPagina();
  }
}

// Respaldo para Firefox y Safari (no tienen Background Sync)
export async function enviarDesdeLaPagina() {
  try {
    const n = await db.enviarResenasPendientes();
    if (n) avisarSincronizadas(n);
  } catch (e) {
    console.warn('[sync] no se pudieron enviar todavía', e.message);
  }
}

function avisarSincronizadas(n) {
  mostrarAviso(`✔ ${n} reseña(s) enviada(s) al servidor`);
  window.dispatchEvent(new CustomEvent('resenas-sincronizadas'));
}

export function iniciarSincronizacion() {
  window.addEventListener('online', () => {
    if (!('SyncManager' in window)) enviarDesdeLaPagina();
  });
  // El service worker avisa cuando terminó el sync en segundo plano
  navigator.serviceWorker?.addEventListener('message', (e) => {
    if (e.data?.tipo === 'resenas-sincronizadas') avisarSincronizadas(e.data.cantidad);
  });
}
