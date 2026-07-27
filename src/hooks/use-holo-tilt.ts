"use client";

import { useCallback, useEffect, useRef } from "react";

interface HoloTiltOptions {
  /**
   * Grados de giro en los extremos. El visor a 380 px aguanta 22; una funda
   * de 110 px con ese mismo valor no se inclina, se dobla como una lámina.
   */
  max?: number;
  /** Sin inclinación: sólo se mueve el brillo. Para rejillas largas. */
  tiltless?: boolean;
  /**
   * Sigue también al dedo.
   *
   * Por defecto NO, y con razón: en una rejilla el gesto que empieza sobre una
   * carta es desplazar la página. Sólo se activa donde la carta ES la pantalla
   * —el visor holográfico— y ya se ha renunciado al desplazamiento con
   * `touch-action: none`; ahí arrastrar el dedo por la carta es exactamente lo
   * que se espera que la incline.
   */
  touch?: boolean;
}

/**
 * Inclinación 3D y foil siguiendo al puntero.
 *
 * Escribe `--px`, `--py` y `--holo` directamente en el nodo en lugar de
 * guardarlos en estado: un puntero fino dispara más de cien eventos por
 * segundo y cada uno provocaría un render de React entero. Así no provoca
 * ninguno — es el mismo trato que reciben los sprites arrastrables de la
 * ficha y la carta ampliada de la galería.
 */
export function useHoloTilt<T extends HTMLElement = HTMLDivElement>({
  max = 18,
  tiltless = false,
  touch = false,
}: HoloTiltOptions = {}) {
  const ref = useRef<T>(null);
  const frame = useRef(0);
  const next = useRef({ px: 0.5, py: 0.5 });

  const flush = useCallback(() => {
    frame.current = 0;
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--px", String(next.current.px));
    el.style.setProperty("--py", String(next.current.py));
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      // Un dedo no sobrevuela: en táctil el gesto que empieza encima de una
      // carta es desplazar la página, y seguirlo aquí robaría ese scroll. En
      // táctil la carta se queda con su brillo de reposo y ya está — salvo
      // donde quien llama ya ha renunciado a ese desplazamiento.
      if (event.pointerType === "touch" && !touch) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      next.current = {
        px: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
        py: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
      };
      el.style.setProperty("--holo", "1");
      // El navegador sólo puede pintar sesenta veces por segundo: agrupar en
      // rAF deja como mucho una escritura por fotograma.
      if (!frame.current) frame.current = requestAnimationFrame(flush);
    },
    [flush, touch],
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    }
    el.style.setProperty("--px", "0.5");
    el.style.setProperty("--py", "0.5");
    el.style.setProperty("--holo", "0");
  }, []);

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );

  return {
    ref,
    /** Se extiende sobre el nodo inclinable. */
    tiltProps: { onPointerMove, onPointerLeave },
    /** `.holo-tilt` sólo gira lo que diga esta variable. */
    tiltStyle: { "--tilt-max": tiltless ? "0deg" : `${max}deg` } as React.CSSProperties,
  };
}
