// Punto de entrada de la aplicación
import { registrarServiceWorker } from './registro-sw.js';
import { iniciarEnrutador } from './enrutador.js';

iniciarEnrutador();

window.addEventListener('load', () => {
  registrarServiceWorker();
});
