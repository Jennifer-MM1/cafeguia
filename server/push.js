// Fase 10.3 · Servidor: guardar suscripciones y enviar push.
//
// Flujo completo:
//  1. El navegador pide la clave pública VAPID      GET  /api/push/clave-publica
//  2. Se suscribe con pushManager.subscribe()        (lo hace el navegador con su servicio push)
//  3. Envía la suscripción al servidor               POST /api/push/suscribir
//  4. El servidor firma y envía el mensaje con web-push al servicio push
//  5. El servicio push despierta al service worker → evento "push"
const fs = require('fs');
const path = require('path');
const express = require('express');
const webpush = require('web-push');

const ARCHIVO_SUSCRIPCIONES = path.join(__dirname, '..', 'data', 'suscripciones.json');
const ARCHIVO_VAPID = path.join(__dirname, '..', 'vapid.json');

// Claves desde variables de entorno (hosting) o desde vapid.json (local)
function cargarClaves() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
      subject: process.env.VAPID_SUBJECT || 'mailto:admin@cafeguia.local',
    };
  }
  if (fs.existsSync(ARCHIVO_VAPID)) return JSON.parse(fs.readFileSync(ARCHIVO_VAPID, 'utf8'));
  return null;
}

const claves = cargarClaves();
if (claves) {
  webpush.setVapidDetails(claves.subject, claves.publicKey, claves.privateKey);
} else {
  console.warn('⚠ Sin claves VAPID: ejecuta "npm run vapid" para habilitar las notificaciones push.');
}

function leerSuscripciones() {
  try {
    return JSON.parse(fs.readFileSync(ARCHIVO_SUSCRIPCIONES, 'utf8'));
  } catch {
    return [];
  }
}

function guardarSuscripciones(lista) {
  fs.mkdirSync(path.dirname(ARCHIVO_SUSCRIPCIONES), { recursive: true });
  fs.writeFileSync(ARCHIVO_SUSCRIPCIONES, JSON.stringify(lista, null, 2));
}

// Envía un mensaje a todas las suscripciones y limpia las que ya no existen
async function enviarATodos(mensaje) {
  if (!claves) return { enviados: 0, fallidos: 0 };
  const suscripciones = leerSuscripciones();
  const carga = JSON.stringify(mensaje);
  const resultados = await Promise.allSettled(
    suscripciones.map((s) => webpush.sendNotification(s, carga, { TTL: 60 * 60 }))
  );

  // 404/410 = el usuario revocó el permiso o la suscripción caducó
  const vigentes = suscripciones.filter((_, i) => {
    const r = resultados[i];
    return !(r.status === 'rejected' && [404, 410].includes(r.reason?.statusCode));
  });
  if (vigentes.length !== suscripciones.length) guardarSuscripciones(vigentes);

  const enviados = resultados.filter((r) => r.status === 'fulfilled').length;
  return { enviados, fallidos: resultados.length - enviados };
}

const router = express.Router();

router.get('/clave-publica', (req, res) => {
  if (!claves) return res.status(503).json({ error: 'Push no configurado (falta npm run vapid)' });
  res.json({ clavePublica: claves.publicKey });
});

router.post('/suscribir', (req, res) => {
  const suscripcion = req.body;
  if (!suscripcion?.endpoint || !suscripcion?.keys) {
    return res.status(400).json({ error: 'Suscripción inválida' });
  }
  const lista = leerSuscripciones().filter((s) => s.endpoint !== suscripcion.endpoint);
  lista.push(suscripcion);
  guardarSuscripciones(lista);
  res.status(201).json({ ok: true, total: lista.length });
});

router.post('/desuscribir', (req, res) => {
  const lista = leerSuscripciones().filter((s) => s.endpoint !== req.body?.endpoint);
  guardarSuscripciones(lista);
  res.json({ ok: true, total: lista.length });
});

// Envío manual (para probar). En producción protege esta ruta con autenticación.
router.post('/enviar', async (req, res) => {
  const { titulo = 'CaféGuía', cuerpo = 'Mensaje de prueba ☕', url = './' } = req.body || {};
  res.json(await enviarATodos({ titulo, cuerpo, url }));
});

module.exports = { router, enviarATodos };
