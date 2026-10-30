// Fase 4.1 · Acceso a los datos remotos del catálogo.
// Primero intenta la API del servidor Node; si no existe (por ejemplo en GitHub Pages)
// usa el archivo estático data/catalogo.json.
// Fase 6.3 · Cada respuesta buena se respalda en IndexedDB; si no hay red ni caché,
// se usa ese respaldo local.
const db = self.CafeDB;

async function descargarCatalogo() {
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

export async function obtenerCatalogo() {
  try {
    const catalogo = await descargarCatalogo();
    db.guardarVarios('catalogo', catalogo).catch(console.warn); // respaldo local
    return catalogo;
  } catch (error) {
    const respaldo = await db.obtenerTodos('catalogo');
    if (respaldo.length) {
      console.info('[datos] usando respaldo de IndexedDB');
      return respaldo;
    }
    throw error;
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
    return false; // sin red: no se memoriza, se vuelve a intentar después
  }
  return servidorDisponible;
}
