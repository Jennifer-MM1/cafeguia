// Fase 10.2 · Genera el par de claves VAPID.
// La clave PÚBLICA se comparte con el navegador; la PRIVADA firma los push y
// nunca debe subirse a GitHub (vapid.json está en .gitignore).
// Uso: npm run vapid
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const ARCHIVO = path.join(__dirname, '..', 'vapid.json');

if (fs.existsSync(ARCHIVO) && !process.argv.includes('--forzar')) {
  console.log('Ya existe vapid.json. Usa "npm run vapid -- --forzar" para regenerarlo');
  console.log('(las suscripciones existentes dejarán de funcionar).');
  process.exit(0);
}

const { publicKey, privateKey } = webpush.generateVAPIDKeys();
const claves = {
  publicKey,
  privateKey,
  // Contacto que el servicio push usa si hay problemas con tus envíos
  subject: 'mailto:admin@cafeguia.local',
};
fs.writeFileSync(ARCHIVO, JSON.stringify(claves, null, 2));
console.log('✔ Claves VAPID guardadas en vapid.json');
console.log('Clave pública:', publicKey);
