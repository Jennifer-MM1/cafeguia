// Fase 8.1 · API de reseñas.
// Se guardan en data/resenas.json para no necesitar una base de datos.
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const express = require('express');

const ARCHIVO = path.join(__dirname, '..', 'data', 'resenas.json');

function leer() {
  try {
    return JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'));
  } catch {
    return [];
  }
}

function escribir(resenas) {
  fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  fs.writeFileSync(ARCHIVO, JSON.stringify(resenas, null, 2));
}

const resenasDe = (lugarId) =>
  leer().filter((r) => r.lugarId === Number(lugarId)).sort((a, b) => b.fecha.localeCompare(a.fecha));

const router = express.Router();
const eventos = new EventEmitter(); // avisa de reseñas nuevas a otros módulos

// GET /api/resenas?lugar=3
router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json(req.query.lugar ? resenasDe(req.query.lugar) : leer());
});

// POST /api/resenas  { idCliente, lugarId, autor, calificacion, texto }
router.post('/', (req, res) => {
  const { idCliente, lugarId, autor, calificacion, texto } = req.body || {};
  const cal = Number(calificacion);
  if (!idCliente || !lugarId || !texto?.trim() || !(cal >= 1 && cal <= 5)) {
    return res.status(400).json({ error: 'Datos de reseña incompletos' });
  }

  const resenas = leer();
  // Idempotencia: si el Background Sync reintenta, no se duplica la reseña
  const existente = resenas.find((r) => r.idCliente === idCliente);
  if (existente) return res.status(200).json(existente);

  const nueva = {
    id: resenas.length ? Math.max(...resenas.map((r) => r.id)) + 1 : 1,
    idCliente,
    lugarId: Number(lugarId),
    autor: String(autor || 'Anónimo').slice(0, 40),
    calificacion: cal,
    texto: String(texto).slice(0, 500),
    fecha: new Date().toISOString(),
  };
  resenas.push(nueva);
  escribir(resenas);
  res.status(201).json(nueva);
  eventos.emit('nueva-resena', nueva); // la Fase 10 la usa para enviar un push
});

module.exports = { router, resenasDe, eventos };
