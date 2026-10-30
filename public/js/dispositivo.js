// Fase 11.1 · Módulo de dispositivo: acceso a elementos físicos con APIs web.
// Todas requieren HTTPS (o localhost) y varias piden permiso al usuario.

export const soporte = {
  geolocalizacion: 'geolocation' in navigator,
  vibracion: 'vibrate' in navigator,
  compartir: 'share' in navigator,
  bateria: 'getBattery' in navigator,
  orientacion: 'DeviceOrientationEvent' in window,
};

// GPS / ubicación
export function obtenerUbicacion({ precisa = true, tiempoMax = 10000 } = {}) {
  return new Promise((resolver, rechazar) => {
    if (!soporte.geolocalizacion) return rechazar(new Error('Geolocalización no disponible'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolver({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        precision: Math.round(pos.coords.accuracy),
      }),
      (error) => rechazar(new Error({
        1: 'Permiso de ubicación denegado',
        2: 'No se pudo determinar la ubicación',
        3: 'Se agotó el tiempo para obtener la ubicación',
      }[error.code] || error.message)),
      { enableHighAccuracy: precisa, timeout: tiempoMax, maximumAge: 60000 }
    );
  });
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
