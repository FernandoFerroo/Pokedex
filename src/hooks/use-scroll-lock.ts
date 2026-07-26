"use client";

import { useEffect } from "react";

/**
 * Congela el desplazamiento de la página mientras hay una capa abierta encima
 * (el cajón de «Mi Equipo», el selector de especie, «Configuración de
 * Combate»…).
 *
 * `overscroll-contain` ya evita que la rueda encadene con el fondo cuando el
 * panel interior tiene recorrido propio; esto cubre el resto de casos — la
 * lista que aún no desborda, el arrastre táctil sobre la cabecera del panel o
 * sobre el velo — donde el gesto caía directamente en el documento.
 *
 * Se cuenta con referencias porque las capas se apilan: el cajón abre el
 * editor, y solo la última en cerrarse devuelve la página a su sitio.
 */
let locks = 0;
/** Estilo original del `body`, capturado por el primer cierre. */
let savedStyle = "";
/** Posición de la página en ese momento, restaurada por el último. */
let savedScrollY = 0;

function lock() {
  if (locks++ > 0) return;
  const { body } = document;
  savedStyle = body.getAttribute("style") ?? "";
  savedScrollY = window.scrollY;
  // Al sacar el `body` del flujo desaparece la barra de desplazamiento; el
  // relleno equivalente evita que el contenido dé un salto lateral.
  const gutter = window.innerWidth - document.documentElement.clientWidth;
  body.style.position = "fixed";
  body.style.top = `-${savedScrollY}px`;
  body.style.insetInline = "0";
  body.style.width = "100%";
  if (gutter > 0) body.style.paddingRight = `${gutter}px`;
}

function unlock() {
  if (locks === 0 || --locks > 0) return;
  const { body } = document;
  if (savedStyle) body.setAttribute("style", savedStyle);
  else body.removeAttribute("style");
  window.scrollTo(0, savedScrollY);
}

/** @param active Falso mientras la capa esté oculta (el cajón cerrado). */
export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
