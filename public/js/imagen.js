// Extra · Reduce una foto de la cámara antes de guardarla.
// Una foto de celular pesa 3–8 MB; redimensionada a 1280 px en JPEG queda en ~200 KB,
// cabe de sobra en IndexedDB y se sube rápido cuando vuelve la conexión.
const LADO_MAXIMO = 1280;
const CALIDAD = 0.8;

export async function comprimirImagen(archivo, ladoMaximo = LADO_MAXIMO) {
  if (!archivo?.type?.startsWith('image/')) throw new Error('El archivo no es una imagen');

  // createImageBitmap respeta la orientación EXIF (fotos verticales del celular)
  const imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  const escala = Math.min(1, ladoMaximo / Math.max(imagen.width, imagen.height));
  const ancho = Math.round(imagen.width * escala);
  const alto = Math.round(imagen.height * escala);

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  lienzo.getContext('2d').drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();

  return new Promise((resolver, rechazar) => {
    lienzo.toBlob(
      (blob) => (blob ? resolver(blob) : rechazar(new Error('No se pudo procesar la foto'))),
      'image/jpeg',
      CALIDAD
    );
  });
}
