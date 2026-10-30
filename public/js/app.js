// Punto de entrada de la aplicación
import { registrarServiceWorker } from './registro-sw.js';

window.addEventListener('load', () => {
  registrarServiceWorker();
});

document.getElementById('vista').innerHTML =
  '<h1>CaféGuía</h1><p>El app shell ya se guarda en caché.</p>';
