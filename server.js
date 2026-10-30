// Servidor de CaféGuía
// Entrega los archivos estáticos de /public, la API JSON y las páginas SSR.
const fs = require('fs');
const path = require('path');
const express = require('express');
const { renderFicha } = require('./server/ssr');
const resenas = require('./server/resenas');
const push = require('./server/push');

const app = express();
const PUERTO = process.env.PORT || 3000;
const RUTA_CATALOGO = path.join(__dirname, 'public', 'data', 'catalogo.json');

const leerCatalogo = () => JSON.parse(fs.readFileSync(RUTA_CATALOGO, 'utf8'));

app.use(express.json());

// El service worker nunca debe quedarse en la caché HTTP del navegador (Fase 9)
app.get('/sw.js', (req, res, next) => {
  res.set('Cache-Control', 'no-cache');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// ---------- API ----------
app.get('/api/salud', (req, res) => res.json({ ok: true, hora: new Date().toISOString() }));

// Fase 4.1 · Datos remotos del catálogo
app.get('/api/catalogo', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json(leerCatalogo());
});

app.get('/api/catalogo/:id', (req, res) => {
  const lugar = leerCatalogo().find((l) => l.id === Number(req.params.id));
  if (!lugar) return res.status(404).json({ error: 'No encontrado' });
  res.json(lugar);
});

// Fase 8.1 · Reseñas
app.use('/api/resenas', resenas.router);
// Fotos que los usuarios suben con sus reseñas (nombre fijo por reseña: no caducan solas)
app.use('/fotos', express.static(resenas.CARPETA_FOTOS, { maxAge: '7d' }));

// Fase 10.3 · Notificaciones push
app.use('/api/push', push.router);

// Cada reseña nueva genera un push para todos los suscritos
resenas.eventos.on('nueva-resena', (resena) => {
  const lugar = leerCatalogo().find((l) => l.id === resena.lugarId);
  push.enviarATodos({
    titulo: `Nueva reseña en ${lugar?.nombre || 'CaféGuía'}`,
    cuerpo: `${resena.autor}: ${'★'.repeat(resena.calificacion)} ${resena.texto.slice(0, 80)}`,
    url: `./#/lugar/${resena.lugarId}`,
  }).catch((e) => console.error('[push]', e.message));
});

// ---------- SSR ----------
// Fase 4.3 · La ficha de cada cafetería generada en el servidor
app.get('/lugar/:id', (req, res) => {
  const lugar = leerCatalogo().find((l) => l.id === Number(req.params.id));
  if (!lugar) return res.status(404).send('Cafetería no encontrada');
  res.send(renderFicha(lugar, resenas.resenasDe(lugar.id)));
});

app.listen(PUERTO, () => {
  console.log(`CaféGuía escuchando en http://localhost:${PUERTO}`);
});
