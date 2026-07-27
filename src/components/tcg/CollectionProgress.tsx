"use client";

import { Check } from "lucide-react";
import type { CSSProperties } from "react";
import type { PackInventory, PackType } from "@/types/tcg";
import { MILESTONES, nextMilestone } from "@/lib/tcg/milestones";
import { ALBUM_SIZE } from "@/lib/tcg/totals";
import { useT } from "@/lib/i18n/client";

/**
 * La cabecera del álbum: el título, y debajo la barra que dice cuánto queda.
 *
 * La barra lleva marcados los hitos porque «1,5 %» no es una meta: es una cifra
 * que no invita a nada. Con las muescas encima, la misma barra pasa a decir
 * cuánto falta para el siguiente sobre gratis — que es lo que hace volver.
 *
 * Los premios los reparte la colección al abrir un sobre (`TcgProvider`); aquí
 * sólo se pintan, y el estado «cobrado» sale de lo que ella ha guardado. Nada
 * de contar hitos en dos sitios: la barra prometería lo que el otro no paga.
 */
export function CollectionProgress({
  owned,
  cards,
  hydrated,
  claimed,
}: {
  owned: number;
  cards: number;
  hydrated: boolean;
  /** Porcentajes de hito ya cobrados. */
  claimed: readonly number[];
}) {
  const t = useT().tcg;
  const pct = ALBUM_SIZE ? ((owned / ALBUM_SIZE) * 100).toFixed(1) : "0.0";

  /** «Sobre Maestro ×3», «Sobre Especial ex»… lo que paga cada hito. */
  const rewardName = (packs: PackInventory) =>
    (Object.entries(packs) as Array<[PackType, number]>)
      .map(([type, count]) =>
        count > 1 ? `${t.packName[type]} ×${count}` : t.packName[type],
      )
      .join(" + ");

  const next = hydrated ? nextMilestone(owned) : null;

  return (
    <>
      {/* La portada, recortada a lo justo. Antes el rótulo a 5xl, el subtítulo
          y la barra sumaban tanto que el archivador arrancaba por debajo del
          pliegue: se entraba al álbum y no se veía ni una carta. El título
          sigue siendo el título —brillo y todo—, sólo que ya no hace falta
          desplazar para llegar a lo que viene a mirarse. */}
      <header className="text-center">
        <p className="album-eyebrow">{t.ctaBadge}</p>
        {/* El rótulo sigue siendo el rótulo —mismo metal, mismo brillo— pero en
            el teléfono a 2xl se comía dos líneas y con ellas la primera fila de
            sobres. */}
        <h1 className="album-title mt-1 font-display text-2xl font-black tracking-[0.08em] uppercase max-sm:mt-0.5 max-sm:text-[1.35rem] max-sm:tracking-[0.05em] sm:text-4xl">
          {t.albumTitle}
        </h1>
        <p className="mx-auto mt-1 max-w-2xl text-xs text-slate-400 max-sm:mt-0.5 max-sm:text-[0.72rem]/[1.3] sm:text-sm">
          {t.albumSubtitle}
        </p>
      </header>

      {/* Hasta hidratar se enseña un guion y la barra a cero: el conteo sale
          del almacenamiento, así que pintar «0 / 1025» en el servidor daría un
          parpadeo Y un desajuste de hidratación en el texto. */}
      <section
        className="mx-auto mt-3 max-w-3xl max-sm:mt-1.5"
        role="progressbar"
        aria-label={t.progressAria}
        aria-valuemin={0}
        aria-valuemax={ALBUM_SIZE}
        aria-valuenow={hydrated ? owned : undefined}
        aria-valuetext={
          hydrated ? t.progressLabel(owned, ALBUM_SIZE, pct) : t.progressLoading
        }
        aria-busy={!hydrated}
      >
        <div className="flex items-baseline justify-between gap-3 font-mono text-xs max-sm:gap-2 max-sm:text-[0.7rem]">
          <span className="text-slate-300">
            {hydrated
              ? t.progressLabel(owned, ALBUM_SIZE, pct)
              : `— / ${ALBUM_SIZE}`}
          </span>
          <span className="shrink-0 text-slate-500">
            {hydrated ? t.progressCards(cards) : ""}
          </span>
        </div>

        {/* El carril sobresale por los lados para que la muesca del 100 % no
            se corte a la mitad contra el borde. */}
        <div className="mt-2 px-2 max-sm:mt-1.5">
          <div className="album-rail">
            <div
              className="album-rail__fill"
              style={{ width: hydrated ? `${(owned / ALBUM_SIZE) * 100}%` : "0%" }}
            />
            {MILESTONES.map((milestone) => {
              const done = hydrated && claimed.includes(milestone.pct);
              const reward = rewardName(milestone.packs);
              return (
                <span
                  key={milestone.pct}
                  aria-hidden
                  data-done={done || undefined}
                  title={
                    done
                      ? t.milestoneDone(milestone.pct, reward)
                      : t.milestoneLocked(milestone.pct, reward)
                  }
                  className="album-mark"
                  style={{ "--at": `${milestone.pct}%` } as CSSProperties}
                >
                  {done && <Check size={9} strokeWidth={4} aria-hidden />}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* Fuera del progressbar a propósito: sus descendientes son
          presentacionales para ARIA, así que aquí dentro no se leerían. */}
      <p className="mx-auto mt-1.5 max-w-3xl px-2 text-center font-mono text-xs text-slate-400 max-sm:mt-1 max-sm:text-[0.7rem]/[1.3]">
        {next
          ? t.milestoneNext(next.pct, rewardName(next.packs))
          : hydrated
            ? t.milestoneAllDone
            : " "}
      </p>

      <ul className="sr-only">
        <li>{t.milestoneAria}</li>
        {MILESTONES.map((milestone) => {
          const reward = rewardName(milestone.packs);
          return (
            <li key={milestone.pct}>
              {hydrated && claimed.includes(milestone.pct)
                ? t.milestoneDone(milestone.pct, reward)
                : t.milestoneLocked(milestone.pct, reward)}
            </li>
          );
        })}
      </ul>
    </>
  );
}
