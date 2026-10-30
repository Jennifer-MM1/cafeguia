// Fase 2.1 · Genera los íconos PNG de la PWA sin dependencias externas.
// Dibuja una taza de café sobre fondo café oscuro y escribe archivos PNG válidos
// usando solo zlib (incluido en Node). Uso: npm run iconos
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SALIDA = path.join(__dirname, '..', 'public', 'icons');
const FONDO = [43, 26, 18];      // --cafe-900
const TAZA = [246, 239, 230];    // --crema
const CAFE = [217, 130, 43];     // --acento

// Tabla CRC32 para los bloques PNG
const TABLA = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABLA[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function bloque(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const tipoYDatos = Buffer.concat([Buffer.from(tipo), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(tipoYDatos));
  return Buffer.concat([largo, tipoYDatos, crc]);
}

// Devuelve el color de cada pixel. "zonaSegura" encoge el dibujo para íconos maskable.
function colorEn(x, y, t, zonaSegura) {
  const esc = zonaSegura ? 0.62 : 0.8;
  const u = ((x / t) - 0.5) / esc + 0.5; // coordenadas normalizadas 0..1
  const v = ((y / t) - 0.5) / esc + 0.5;

  // Cuerpo de la taza: rectángulo con esquinas inferiores redondeadas
  const enCuerpo = u > 0.18 && u < 0.7 && v > 0.32 && v < 0.82 &&
    !(v > 0.7 && Math.hypot(Math.max(0, Math.abs(u - 0.44) - 0.14), v - 0.7) > 0.12);
  // Asa: anillo a la derecha
  const dAsa = Math.hypot(u - 0.72, v - 0.52);
  const enAsa = dAsa > 0.07 && dAsa < 0.13 && u > 0.7;
  // Superficie del café
  const enCafe = u > 0.22 && u < 0.66 && v > 0.36 && v < 0.43;
  // Platito
  const enPlato = u > 0.1 && u < 0.86 && v > 0.84 && v < 0.89;
  // Vapor: tres ondas
  const enVapor = [0.32, 0.44, 0.56].some((cx) =>
    v > 0.12 && v < 0.27 && Math.abs(u - (cx + 0.025 * Math.sin(v * 40))) < 0.018);

  if (enCafe) return CAFE;
  if (enCuerpo || enAsa || enPlato || enVapor) return TAZA;
  return FONDO;
}

function crearPNG(t, zonaSegura) {
  const filas = [];
  for (let y = 0; y < t; y++) {
    const fila = Buffer.alloc(1 + t * 3); // byte de filtro + RGB
    for (let x = 0; x < t; x++) {
      const [r, g, b] = colorEn(x, y, t, zonaSegura);
      fila[1 + x * 3] = r;
      fila[2 + x * 3] = g;
      fila[3 + x * 3] = b;
    }
    filas.push(fila);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(t, 0);
  ihdr.writeUInt32BE(t, 4);
  ihdr[8] = 8;  // profundidad de bits
  ihdr[9] = 2;  // tipo de color RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    bloque('IHDR', ihdr),
    bloque('IDAT', zlib.deflateSync(Buffer.concat(filas))),
    bloque('IEND', Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(SALIDA, { recursive: true });
const ICONOS = [
  { nombre: 'icon-192.png', t: 192 },
  { nombre: 'icon-512.png', t: 512 },
  { nombre: 'maskable-512.png', t: 512, zonaSegura: true },
  { nombre: 'apple-touch-icon.png', t: 180 },
  { nombre: 'badge-96.png', t: 96 },
];
for (const { nombre, t, zonaSegura } of ICONOS) {
  fs.writeFileSync(path.join(SALIDA, nombre), crearPNG(t, zonaSegura));
  console.log('✔', nombre);
}
