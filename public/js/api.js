// Fase 4.1 · Acceso a los datos remotos del catálogo.
// Primero intenta la API del servidor Node; si no existe (por ejemplo en GitHub Pages)
// usa el archivo estático data/catalogo.json.
export async function obtenerCatalogo() {
  try {
    const r = await fetch('api/catalogo');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch {
    const r = await fetch('data/catalogo.json');
    if (!r.ok) throw new Error('No se pudo cargar el catálogo');
    return await r.json();
  }
}

export async function obtenerLugar(id) {
  const catalogo = await obtenerCatalogo();
  return catalogo.find((l) => l.id === Number(id)) || null;
}

// ¿Está disponible el servidor Node? (en GitHub Pages no lo está)
let servidorDisponible;
export async function hayServidor() {
  if (servidorDisponible !== undefined) return servidorDisponible;
  try {
    const r = await fetch('api/salud', { cache: 'no-store' });
    servidorDisponible = r.ok;
  } catch {
    servidorDisponible = false;
  }
  return servidorDisponible;
}
