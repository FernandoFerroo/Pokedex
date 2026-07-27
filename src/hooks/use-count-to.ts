"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "./use-reduced-motion";

/**
 * Un número que persigue a su valor real.
 *
 * Escribe el texto DIRECTAMENTE en el nodo, como la inclinación holográfica
 * escribe sus variables: una cuenta atrás de medio segundo son treinta
 * fotogramas, y treinta renders de React para mover un contador es un precio
 * absurdo por una animación decorativa.
 *
 * Sólo anima cuando el número BAJA. Subir es lo que hace una recompensa —y
 * llega desde otra pantalla, con su propia ceremonia—; bajar es lo que hace una
 * compra, y ahí el contador es la mitad del acuse de recibo: los puntos tienen
 * que verse marcharse.
 *
 * El valor de reposo siempre es el de verdad. Quien pinte el nodo debe escribir
 * también el texto formateado como hijo, para que el servidor y el primer
 * pintado digan ya la cifra correcta; esto sólo se encarga del tramo animado.
 */
export function useCountTo(
  value: number,
  format: (value: number) => string,
  duration = 560,
) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  const reducedMotion = useReducedMotion();

  // El formateador viene del diccionario y cambia de identidad en cada render:
  // en las dependencias del efecto de abajo reiniciaría la cuenta a cada rato.
  // Se guarda en un efecto propio, declarado ANTES, para que el que anima ya
  // encuentre el de este render.
  const formatRef = useRef(format);
  useEffect(() => {
    formatRef.current = format;
  });

  useEffect(() => {
    const node = ref.current;
    const from = previous.current;
    previous.current = value;
    if (!node) return;

    const write = (n: number) => {
      node.textContent = formatRef.current(n);
    };

    if (reducedMotion || from <= value) {
      write(value);
      return;
    }

    let frame = 0;
    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      // Frena al final: los últimos puntos se leen, no se desvanecen.
      const eased = 1 - (1 - t) ** 3;
      write(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reducedMotion]);

  return ref;
}
