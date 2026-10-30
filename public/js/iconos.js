// Íconos SVG en línea (trazo de 24×24, heredan el color del texto).
// Van dentro del JS para que funcionen sin conexión sin pedir archivos extra.
const trazo = (d) =>
  `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const icono = {
  inicio: trazo('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>'),
  lista: trazo('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>'),
  cerca: trazo('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  ajustes: trazo('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  buscar: trazo('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  reloj: trazo('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  pin: trazo('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  guardar: trazo('<path d="M6 3h12v18l-6-4.5L6 21z"/>'),
  guardado: '<svg class="icono" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4.5L6 21z"/></svg>',
  compartir: trazo('<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  descargar: trazo('<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>'),
  campana: trazo('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
  sinRed: trazo('<path d="M2 8.5a15 15 0 0 1 5-2.9M22 8.5a15 15 0 0 0-8.5-3.4"/><path d="M5 12a10 10 0 0 1 4-2M19 12a10 10 0 0 0-2.4-1.5"/><path d="M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/><path d="m3 3 18 18"/>'),
  servidor: trazo('<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>'),
  volver: trazo('<path d="M15 18l-6-6 6-6"/>'),
  ir: trazo('<path d="M9 18l6-6-6-6"/>'),
  estrella: '<svg class="icono" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>',
};
