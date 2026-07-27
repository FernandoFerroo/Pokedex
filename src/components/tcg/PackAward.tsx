"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { PACK_TYPES, type PackInventory } from "@/types/tcg";
import { PACK_EDGE } from "@/lib/tcg/style";
import { useT } from "@/lib/i18n/client";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { PackArt } from "./PackArt";

/**
 * La entrega del botín, en la ceremonia de campeón.
 *
 * El sobre YA es suyo cuando esto se pinta —lo cobró `applyRunReward` en cuanto
 * cayó el último rival—, así que esto no es una promesa ni un botón que haya
 * que pulsar: es el momento de verlo llegar. Cada sobre sube desde abajo con su
 * fogonazo, uno detrás de otro y en orden de calidad, y los Puntos de
 * Entrenador se cuentan solos al final.
 *
 * Ese orden importa: quien gana la Maestra se lleva tres Maestros y un Especial
 * ex, y verlos aterrizar en fila dice «esto es mucho» mucho mejor que un «×3».
 */

/** Lo que tarda cada sobre en entrar detrás del anterior. */
const STEP_MS = 340;
/**
 * Chispas del aterrizaje, en grados alrededor del sobre. Fijas a propósito: un
 * abanico aleatorio cambiaría en cada render y delataría el truco.
 */
const SPARKS = [-64, -32, -8, 16, 44, 72];
/** Cuánto dura el recuento de PE una vez ha aterrizado el último sobre. */
const COUNT_MS = 900;

/**
 * Cuenta de cero al total.
 *
 * Con movimiento reducido devuelve el total desde el primer render: un número
 * que sube es un efecto, y un efecto que no se puede reproducir no se
 * reproduce a cámara rápida, se salta.
 */
function useCountUp(total: number, delayMs: number, enabled: boolean): number {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const progress = Math.min(1, (now - start) / COUNT_MS);
      // Desaceleración cúbica: arranca disparado y se posa en la cifra final,
      // que es como suena un marcador de recreativa.
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round(total * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    const timer = window.setTimeout(() => {
      frame = requestAnimationFrame(tick);
    }, delayMs);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [total, delayMs, enabled]);

  // Sin cuenta que hacer se devuelve la cifra final tal cual, sin pasar por el
  // estado: así el primer render ya la enseña en lugar de un cero fantasma.
  return enabled ? shown : total;
}

export function PackAward({
  packs,
  pe,
}: {
  packs: PackInventory;
  /** Puntos de Entrenador de la carrera, ya ingresados. */
  pe: number;
}) {
  const t = useT().tcg;
  const reduced = useReducedMotion();
  // En el orden del catálogo, que es el de calidad creciente: el mejor sobre
  // de la copa es siempre el último en aterrizar.
  const won = PACK_TYPES.filter((type) => (packs[type] ?? 0) > 0);
  const peDelay = reduced ? 0 : 260 + won.length * STEP_MS;
  const shownPe = useCountUp(pe, peDelay, !reduced && pe > 0);

  return (
    <div className="pack-award-stage flex flex-col items-center gap-3">
      {/* Cañón de luz sobre la fila entera: el botín se entrega en el centro
          del escenario, no se lista en un renglón. Es lo primero que se pinta
          y lo único que hay detrás de los sobres. */}
      <span aria-hidden className="pack-award__beam" />
      <ul className="pack-award-row flex flex-wrap items-end justify-center gap-4 sm:gap-7">
        {won.map((type, i) => (
          <li
            key={type}
            style={
              {
                "--edge": PACK_EDGE[type],
                "--in": `${260 + i * STEP_MS}ms`,
              } as CSSProperties
            }
            className="pack-award"
          >
            {/* El fogonazo del aterrizaje, detrás del sobre. */}
            <span aria-hidden className="pack-award__flash" />
            <span aria-hidden className="pack-award__rays" />
            {/* Peana de luz: el sobre no queda colgado en el aire, se posa
                sobre un charco de su propio color. */}
            <span aria-hidden className="pack-award__pedestal" />
            {/* Chispas del aterrizaje, en abanico fijo para que no bailen
                entre renders. */}
            {SPARKS.map((angle, s) => (
              <span
                key={angle}
                aria-hidden
                className="pack-award__spark"
                style={
                  {
                    "--angle": `${angle}deg`,
                    "--spark": `${s * 40}ms`,
                  } as CSSProperties
                }
              />
            ))}
            {/* `hero`: la misma portada que se enseña justo antes de rasgar un
                sobre, con la lámina viva y los rayos girando. Un premio de
                copa merece el envoltorio bueno, no la miniatura de la
                estantería. */}
            <span className="pack-award__float">
              <PackArt
                type={type}
                variant="hero"
                className="pack-award__art"
                tilt={0}
              />
            </span>
            {(packs[type] ?? 0) > 1 && (
              <span className="pack-award__count">
                {t.packCount(packs[type] ?? 0)}
              </span>
            )}
            <p className="pack-award__name">{t.packName[type]}</p>
            {/* El número también en texto: la chapa de arriba es decorativa
                para quien no la vea, y «Sobre Maestro ×3» tiene que poder
                leerse entero de una pieza. */}
            <span className="sr-only">
              {t.packName[type]} {t.packCount(packs[type] ?? 0)}
            </span>
          </li>
        ))}
      </ul>

      {pe > 0 && (
        <p
          style={{ "--in": `${peDelay}ms` } as CSSProperties}
          className="pack-award__pe"
        >
          <span className="sr-only">{t.balanceLabel}: </span>
          {t.rewardPe(shownPe)}
        </p>
      )}

      <p className="font-mono text-[11px] tracking-[0.22em] text-emerald-300/90 uppercase">
        {t.rewardStored}
      </p>
    </div>
  );
}
