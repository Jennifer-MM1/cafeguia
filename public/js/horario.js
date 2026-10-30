// «Abierto ahora»: calcula si una cafetería está abierta a partir de sus horarios.
// Se usa la hora de Querétaro (America/Mexico_City, igual en todas las ciudades de la guía), no la del dispositivo,
// para que el resultado sea correcto aunque el teléfono esté en otra zona horaria.
// Funciona sin conexión: no consulta ningún servidor.

const ZONA = 'America/Mexico_City';
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const AVISO_CIERRE = 45; // minutos antes de cerrar en que se avisa "cierra pronto"

// Día de la semana (0 = domingo) y minutos desde medianoche en la zona de la ciudad
function ahoraEnLaCiudad(fecha = new Date()) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: ZONA, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    }).formatToParts(fecha).map((p) => [p.type, p.value])
  );
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(partes.weekday);
  return { dia, minutos: Number(partes.hour) * 60 + Number(partes.minute) };
}

const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const hora = (hhmm) => hhmm.replace(/^0/, '');

function turnoDelDia(lugar, dia) {
  return (lugar.horarios || []).find((t) => t.dias.includes(dia)) || null;
}

/**
 * Devuelve { abierto, pronto, texto } para mostrar en la interfaz.
 * Ejemplos de texto: "Abierto hasta las 21:00", "Cierra a las 21:00",
 * "Abre hoy a las 10:00", "Abre mañana a las 8:00", "Abre el lunes a las 8:00".
 */
export function estadoHorario(lugar, fecha = new Date()) {
  if (!lugar.horarios?.length) return { abierto: false, pronto: false, texto: lugar.horario || '' };
  const { dia, minutos } = ahoraEnLaCiudad(fecha);
  const hoy = turnoDelDia(lugar, dia);

  if (hoy && minutos >= aMinutos(hoy.abre) && minutos < aMinutos(hoy.cierra)) {
    const faltan = aMinutos(hoy.cierra) - minutos;
    return faltan <= AVISO_CIERRE
      ? { abierto: true, pronto: true, texto: `Cierra pronto, a las ${hora(hoy.cierra)}` }
      : { abierto: true, pronto: false, texto: `Abierto hasta las ${hora(hoy.cierra)}` };
  }
  if (hoy && minutos < aMinutos(hoy.abre)) {
    return { abierto: false, pronto: false, texto: `Abre hoy a las ${hora(hoy.abre)}` };
  }
  // Buscar el siguiente día con horario
  for (let i = 1; i <= 7; i++) {
    const siguiente = (dia + i) % 7;
    const turno = turnoDelDia(lugar, siguiente);
    if (turno) {
      const cuando = i === 1 ? 'mañana' : `el ${DIAS[siguiente]}`;
      return { abierto: false, pronto: false, texto: `Abre ${cuando} a las ${hora(turno.abre)}` };
    }
  }
  return { abierto: false, pronto: false, texto: 'Sin horario' };
}

export function estaAbierto(lugar, fecha) {
  return estadoHorario(lugar, fecha).abierto;
}

export function horarioHTML(lugar, fecha) {
  const e = estadoHorario(lugar, fecha);
  const clase = e.abierto ? (e.pronto ? 'pronto' : 'abierto') : 'cerrado';
  return `<span class="horario ${clase}">${e.texto}</span>`;
}
