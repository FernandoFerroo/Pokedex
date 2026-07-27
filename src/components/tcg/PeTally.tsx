"use client";

import { useEffect, useRef, useState } from "react";
import { Coins } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** Lo que tarda el contador en recorrer un salto, sea de uno o de noventa. */
const COUNT_MS = 520;

/**
 * La cifra subiendo hasta su destino.
 *
 * Duración fija y no un paso por punto: una común sube uno y una Hyper Rara
 * noventa, y a paso constante la primera sería un parpadeo y la segunda una
 * espera. Con el tiempo fijo las dos duran lo mismo y lo que cambia es la
 * VELOCIDAD del rodillo, que es exactamente lo que se quiere oír contar.
 */
function useCountUp(target: number, instant: boolean): number {
  // Arranca en cero y no en el destino, aunque el destino ya se sepa: un
  // contador que aparece con la cifra puesta no ha contado nada. Es lo que
  // hace que el recuento del final también suba, y no sólo la hucha que se fue
  // llenando carta a carta.
  const [shown, setShown] = useState(0);
  // El punto de partida se lee de una referencia y no del estado: dentro del
  // fotograma haría falta el valor recién pintado, y el estado que ve el
  // efecto es el del render en el que se montó.
  const at = useRef(0);

  useEffect(() => {
    at.current = shown;
  }, [shown]);

  useEffect(() => {
    const from = at.current;
    if (instant || from === target) {
      setShown(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const step = Math.min(1, (now - start) / COUNT_MS);
      // Desacelera al final: el último punto se ve llegar.
      const eased = 1 - Math.pow(1 - step, 3);
      setShown(Math.round(from + (target - from) * eased));
      if (step < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, instant]);

  return shown;
}

interface PeTallyProps {
  /** PE acumulados. Al cambiar, la cifra sube hasta el nuevo valor. */
  value: number;
  /** Da formato a la cifra en curso: «+12 PE», «+12 PE por repetidas»… */
  format: (pe: number) => string;
  /** Lo que se lee en voz alta antes de la cifra. */
  srLabel: string;
  /** Falso mientras no haya nada que enseñar: la hucha está, pero apagada. */
  shown: boolean;
}

/**
 * La hucha de las repetidas: el contador al que van a parar las motas.
 *
 * Se pinta SIEMPRE, aunque esté vacía y apagada, y ahí está la gracia: el
 * chorro de polvo necesita medir dónde cae antes de salir, y un nodo que
 * aparece en el mismo instante en que se le pide su posición no tiene ninguna.
 * Apagada es invisible pero medible — y no reserva ni un salto de altura
 * cuando por fin se enciende.
 */
export function PeTally({ value, format, srLabel, shown }: PeTallyProps) {
  const reducedMotion = useReducedMotion();
  const count = useCountUp(value, reducedMotion);

  return (
    <span className="pe-tally" data-shown={shown} aria-hidden={!shown}>
      <Coins size={12} aria-hidden className="pe-tally__coin" />
      <span className="sr-only">{srLabel}: </span>
      {/* La clave remonta el nodo en cada punto, y remontar es lo que vuelve a
          disparar el latido: una animación no se reinicia sola. */}
      <span key={value} className="pe-tally__figure">
        {format(count)}
      </span>
    </span>
  );
}
