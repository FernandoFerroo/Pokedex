"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Si el sistema pide movimiento reducido.
 *
 * Casi todo el movimiento de la app se apaga en CSS, que es donde debe estar.
 * Esto es para lo poco que además hay que decidir en JavaScript: saltarse un
 * efecto que sólo existe para hacer esperar, en lugar de reproducirlo en un
 * milisegundo y hacer esperar igual.
 *
 * Arranca en `false` en servidor y en el primer render para no descuadrar el
 * HTML, y se corrige tras montar.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(media.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
