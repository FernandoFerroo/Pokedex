"use client";

import { type CSSProperties } from "react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { Side } from "@/types/battle";

/**
 * Lo que un golpe deja ver en el mismo fotograma en que conecta: cuánto ha
 * quitado, y cuántos llevas encadenados.
 *
 * Hasta aquí el impacto se veía (respingo, destello, temblor) y se oía, pero
 * la CIFRA llegaba medio segundo tarde — la barra tarda eso en vaciarse — y el
 * premio por encadenar aciertos no llegaba nunca. Son las dos piezas que
 * convierten una sucesión de turnos correctos en una racha que apetece
 * mantener.
 *
 * Las dos van `aria-hidden`: la caja de mensajes ya canta el daño y la
 * eficacia por su `role="status"`, y duplicarlo haría que un lector de
 * pantalla leyera cada golpe dos veces.
 */

/* ------------------------------------------------------------------ */
/* Cifra de daño                                                       */
/* ------------------------------------------------------------------ */

/**
 * Dónde sale el número: sobre el Pokémon que lo ha recibido, en el mismo punto
 * en el que la escena lo dibuja — el rival al fondo a la derecha, el tuyo
 * delante a la izquierda.
 *
 * Los dos derivan hacia la derecha mientras suben, que es la única dirección
 * libre en las dos posiciones: el del rival se aleja del rótulo de eficacia
 * que sube por el centro, y el tuyo se aparta del marcador de racha, que vive
 * pegado al canto izquierdo.
 */
const ORIGIN: Record<Side, { left: string; top: string; dx: string }> = {
  rival: { left: "63%", top: "26%", dx: "16%" },
  player: { left: "19%", top: "56%", dx: "18%" },
};

export function DamageNumber({
  amount,
  side,
  effectiveness,
  crit,
}: {
  /** PS quitados por el golpe. */
  amount: number;
  /** Quién lo ha recibido. */
  side: Side;
  effectiveness: number;
  crit: boolean;
}) {
  const origin = ORIGIN[side];
  // El tamaño lleva la fuerza del golpe: un crítico supereficaz sale a lo
  // grande y en oro, un resistido sale pequeño y apagado. Es la misma
  // jerarquía que ya sigue el rótulo de eficacia, en cifra.
  const big = crit || effectiveness > 1;
  const tone = crit
    ? "text-[#fde047] [text-shadow:0_3px_0_#7f1d1d,0_0_26px_rgba(253,224,71,0.9)]"
    : effectiveness > 1
      ? "text-[#fb923c] [text-shadow:0_3px_0_#7c2d12,0_0_22px_rgba(251,146,60,0.85)]"
      : effectiveness < 1
        ? "text-[#cbd5e1] [text-shadow:0_2px_0_#1e293b,0_0_14px_rgba(203,213,225,0.5)]"
        : "text-white [text-shadow:0_2px_0_#0f172a,0_0_16px_rgba(255,255,255,0.6)]";

  return (
    <span
      aria-hidden
      style={
        {
          left: origin.left,
          top: origin.top,
          "--dx": origin.dx,
        } as CSSProperties
      }
      className="pointer-events-none absolute z-10 -translate-x-1/2"
    >
      <span
        className={cn(
          "fx-dmg block font-display font-black tabular-nums",
          big ? "text-4xl sm:text-6xl" : "text-2xl sm:text-4xl",
          tone,
        )}
      >
        −{amount}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Marcador de racha                                                   */
/* ------------------------------------------------------------------ */

/**
 * El color de la racha sube con ella: ámbar al segundo golpe, naranja al
 * tercero, rojo al cuarto y violeta a partir del quinto. Que el número suba lo
 * dice todo, pero que además CAMBIE DE COLOR es lo que hace que se mire.
 */
const COMBO_EDGE = ["#fbbf24", "#fb923c", "#f43f5e", "#a855f7"];

export function ComboMeter({ count }: { count: number }) {
  const t = useT().battle;
  if (count < 2) return null;
  const edge = COMBO_EDGE[Math.min(count - 2, COMBO_EDGE.length - 1)];
  return (
    <span
      aria-hidden
      style={{ "--combo": edge, "--edge": edge } as CSSProperties}
      // Pegado al canto izquierdo y a media altura, como los contadores de
      // combo de los juegos de lucha. Es el único hueco del campo que no se
      // disputa con nada: las fichas viven en las esquinas, el bocadillo del
      // rival arriba a la derecha y la caja de texto abajo.
      className="pointer-events-none absolute top-1/2 left-1.5 z-10 -translate-y-1/2 sm:left-3"
    >
      <span
        key={count}
        className="fx-combo flex items-center gap-1.5 rounded-full border-2 border-[var(--combo)] bg-black/75 px-3 py-1 backdrop-blur-sm sm:gap-2 sm:px-4 sm:py-1.5"
      >
        <span className="font-pixel text-[8px] tracking-[0.3em] text-[var(--combo)] uppercase sm:text-[10px]">
          {t.comboLabel}
        </span>
        <span
          className="font-display text-xl leading-none font-black text-white tabular-nums sm:text-3xl"
          style={{ textShadow: `0 0 14px ${edge}, 0 2px 0 rgba(0,0,0,0.9)` }}
        >
          ×{count}
        </span>
      </span>
    </span>
  );
}
