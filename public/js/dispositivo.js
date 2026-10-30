// Fase 11.1 · Módulo de dispositivo: acceso a elementos físicos con APIs web.
// Todas requieren HTTPS (o localhost) y varias piden permiso al usuario.

export const soporte = {
  geolocalizacion: 'geolocation' in navigator,
  vibracion: 'vibrate' in navigator,
  compartir: 'share' in navigator,
  bateria: 'getBattery' in navigator,
  orientacion: 'DeviceOrientationEvent' in window,
};

// ---------- GPS / ubicación ----------

// Error con un "codigo" para que la interfaz explique qué hacer en cada caso
export class ErrorUbicacion extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo; // 'inseguro' | 'no-soportado' | 'denegado' | 'no-disponible' | 'tiempo'
  }
}

const CODIGOS = { 1: 'denegado', 2: 'no-disponible', 3: 'tiempo' };

function pedirPosicion(opciones) {
  return new Promise((resolver, rechazar) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolver({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        precision: Math.round(pos.coords.accuracy),
      }),
      (error) => rechazar(new ErrorUbicacion(CODIGOS[error.code] || 'no-disponible', error.message)),
      opciones
    );
  });
}

// Estado del permiso sin preguntarle al usuario: 'granted' | 'denied' | 'prompt' | 'desconocido'
export async function permisoUbicacion() {
  try {
    return (await navigator.permissions.query({ name: 'geolocation' })).state;
  } catch {
    return 'desconocido';
  }
}

/**
 * Pide la ubicación en dos intentos:
 *  1. Precisa (GPS), con 8 s de espera.
 *  2. Si tarda o no hay GPS (computadoras sin GPS, interiores), una aproximada
 *     por wifi o red, aceptando una lectura de hasta 5 minutos de antigüedad.
 * Si el permiso está bloqueado no tiene caso reintentar.
 */
export async function obtenerUbicacion({ precisa = true } = {}) {
  // La geolocalización solo existe en páginas seguras: https:// o localhost.
  // Abrir la app como http://192.168.x.x desde el celular la desactiva.
  if (!window.isSecureContext) {
    throw new ErrorUbicacion('inseguro', 'La página no es segura (https)');
  }
  if (!soporte.geolocalizacion) {
    throw new ErrorUbicacion('no-soportado', 'Este navegador no ofrece ubicación');
  }
  if (precisa) {
    try {
      return await pedirPosicion({ enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 });
    } catch (error) {
      if (error.codigo === 'denegado') throw error;
    }
  }
  return pedirPosicion({ enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 });
}

// Distancia en km entre dos coordenadas (fórmula de Haversine)
export function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180;
  const R = 6371;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Motor de vibración (Android; iOS lo ignora)
export function vibrar(patron = 60) {
  if (soporte.vibracion) navigator.vibrate(patron);
}

// Hoja nativa de compartir; si no existe, copia el enlace al portapapeles
export async function compartir({ titulo, texto, url }) {
  if (soporte.compartir) {
    try {
      await navigator.share({ title: titulo, text: texto, url });
      return 'compartido';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelado';
    }
  }
  await navigator.clipboard?.writeText(url);
  return 'copiado';
}

// Nivel de batería (solo Chrome/Edge)
export async function estadoBateria() {
  if (!soporte.bateria) return null;
  const b = await navigator.getBattery();
  return { nivel: Math.round(b.level * 100), cargando: b.charging };
}
