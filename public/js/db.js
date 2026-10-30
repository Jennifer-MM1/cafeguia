// Fase 6.1 · Capa IndexedDB.
// Es un script clásico (no módulo) para poder usarlo en la página con <script>
// y en el service worker con importScripts('js/db.js'). Expone self.CafeDB.
(function (global) {
  const NOMBRE = 'cafeguia';
  const VERSION = 1;

  // Almacenes (tablas):
  //  - catalogo:  copia local de los datos remotos (respaldo offline)
  //  - favoritos: cafeterías marcadas por el usuario
  //  - resenas:   reseñas escritas en el dispositivo; estado = 'pendiente' | 'enviada'
  let promesaConexion = null;

  function abrir() {
    if (promesaConexion) return promesaConexion;
    promesaConexion = new Promise((resolver, rechazar) => {
      const solicitud = indexedDB.open(NOMBRE, VERSION);

      // Solo se ejecuta al crear la BD o al subir VERSION
      solicitud.onupgradeneeded = () => {
        const db = solicitud.result;
        if (!db.objectStoreNames.contains('catalogo')) {
          db.createObjectStore('catalogo', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('favoritos')) {
          db.createObjectStore('favoritos', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('resenas')) {
          const resenas = db.createObjectStore('resenas', { keyPath: 'idLocal', autoIncrement: true });
          resenas.createIndex('porLugar', 'lugarId');
          resenas.createIndex('porEstado', 'estado');
        }
      };
      solicitud.onsuccess = () => resolver(solicitud.result);
      solicitud.onerror = () => rechazar(solicitud.error);
    });
    return promesaConexion;
  }

  // Convierte una IDBRequest en promesa
  const comoPromesa = (req) => new Promise((ok, mal) => {
    req.onsuccess = () => ok(req.result);
    req.onerror = () => mal(req.error);
  });

  async function almacen(nombre, modo = 'readonly') {
    const db = await abrir();
    return db.transaction(nombre, modo).objectStore(nombre);
  }

  const CafeDB = {
    async obtenerTodos(nombre) {
      return comoPromesa((await almacen(nombre)).getAll());
    },
    async obtener(nombre, clave) {
      return comoPromesa((await almacen(nombre)).get(clave));
    },
    async porIndice(nombre, indice, valor) {
      return comoPromesa((await almacen(nombre)).index(indice).getAll(valor));
    },
    async guardar(nombre, valor) {
      return comoPromesa((await almacen(nombre, 'readwrite')).put(valor));
    },
    async guardarVarios(nombre, valores) {
      const db = await abrir();
      const tx = db.transaction(nombre, 'readwrite');
      valores.forEach((v) => tx.objectStore(nombre).put(v));
      return new Promise((ok, mal) => {
        tx.oncomplete = () => ok(valores.length);
        tx.onerror = () => mal(tx.error);
      });
    },
    async borrar(nombre, clave) {
      return comoPromesa((await almacen(nombre, 'readwrite')).delete(clave));
    },
    async limpiar(nombre) {
      return comoPromesa((await almacen(nombre, 'readwrite')).clear());
    },
  };

  // Fase 8 · Envía al servidor las reseñas pendientes. Lo usan tanto el evento
  // "sync" del service worker como la página (navegadores sin Background Sync).
  // Si alguna falla, lanza un error para que el navegador reintente el sync.
  CafeDB.enviarResenasPendientes = async function (url = 'api/resenas') {
    const pendientes = await CafeDB.porIndice('resenas', 'porEstado', 'pendiente');
    let enviadas = 0;
    for (const resena of pendientes) {
      const { idLocal, estado, ...datos } = resena;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!r.ok) throw new Error(`El servidor respondió ${r.status}`);
      const guardada = await r.json();
      await CafeDB.guardar('resenas', { ...resena, estado: 'enviada', idServidor: guardada.id });
      enviadas++;
    }
    return enviadas;
  };

  global.CafeDB = CafeDB;
})(self);
