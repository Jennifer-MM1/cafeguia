// Servidor de CaféGuía
// Fase 0: servidor mínimo que entrega los archivos estáticos de /public.
const path = require('path');
const express = require('express');

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PUERTO, () => {
  console.log(`CaféGuía escuchando en http://localhost:${PUERTO}`);
});
