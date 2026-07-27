"use client";

import { ChevronRight, Crown, Swords } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import {
  CUP_EDGE,
  ladderArt,
  ladderTrainer,
  tierForRound,
} from "@/lib/tournament/config";
import { cn } from "@/lib/utils";
import { difficultyOf, type TournamentFormat } from "@/types/tournament";
import { useRoundLabel } from "./Bracket";
import type { CSSProperties } from "react";

/**
 * A QUIÉN TE VAS A ENFRENTAR — la escalera entera, con cara y nombre, antes de
 * inscribirte.
 *
 * El vestíbulo pedía elegir copa a ciegas: tres tarjetas que decían cuántas
 * rondas duraba cada una y nada sobre quién esperaba dentro. Un torneo no se
 * elige por su duración, se elige por su cartel — y el plantel son los Líderes
 * de Kanto, gente que el jugador ya conoce. Enseñarlos en fila, de Brock al
 * Campeón, convierte «5 rondas» en «hay que pasar por encima de Sabrina y
 * después está Lance», que es lo que da ganas de entrar.
 *
 * La fila se saca de la misma `LADDER` que después reparte los combates, así
 * que lo que se promete aquí es exactamente lo que va a salir al campo. El
 * último peldaño se dibuja como lo que es: el jefe final, más grande, coronado
 * y con el aro latiendo.
 */

/** El tono de cada peldaño: la veteranía se ve antes de leerse. */
const TIER_EDGE = {
  rookie: "#38bdf8",
  veteran: "#fbbf24",
  champion: "#f43f5e",
} as const;

export function Gauntlet({ format }: { format: TournamentFormat }) {
  const t = useT().tournament;
  const roundLabel = useRoundLabel();
  const difficulty = difficultyOf(format);
  const rounds = Array.from({ length: format }, (_, i) => i + 1);

  return (
    <section
      style={{ "--cup": CUP_EDGE[format] } as CSSProperties}
      className="lobby-panel lobby-bracket relative flex flex-col gap-2.5 overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--cup)_38%,transparent)] bg-hud-3/50 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-mono text-[11px] tracking-[0.2em] text-[var(--cup)] uppercase">
          {t.gauntletLabel}
        </h2>
        <p className="font-mono text-[11px] text-slate-400">
          {t.gauntletHint(format)}
        </p>
      </header>

      {/* En fila y con desplazamiento lateral: la escalera se lee de
          izquierda a derecha como un camino, también en el teléfono. Partirla
          en dos líneas la convertiría en una lista. */}
      <ol className="flex items-stretch gap-0 overflow-x-auto pb-1.5">
        {rounds.map((round) => {
          const trainer = ladderTrainer(round);
          const tier = tierForRound(round, format, difficulty);
          const boss = round === format;
          const edge = TIER_EDGE[tier];
          return (
            <li
              key={round}
              style={
                {
                  "--edge": edge,
                  animationDelay: `${(round - 1) * 70}ms`,
                } as CSSProperties
              }
              className="fx-gauntlet-step flex min-w-0 flex-1 basis-0 items-stretch"
            >
              <div
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center sm:px-2 sm:py-2.5",
                  boss
                    ? "gauntlet-boss border-[var(--edge)] bg-[color-mix(in_srgb,var(--edge)_14%,var(--color-hud-3))]"
                    : "border-[color-mix(in_srgb,var(--edge)_35%,transparent)] bg-hud-3/55",
                )}
              >
                <span className="flex items-center gap-1 font-mono text-[8px] tracking-[0.14em] text-slate-400 uppercase sm:text-[9px]">
                  {boss ? (
                    <Crown size={10} className="shrink-0 text-[var(--edge)]" />
                  ) : (
                    <Swords size={9} className="shrink-0 text-slate-500" />
                  )}
                  <span className="truncate">{roundLabel(round, format)}</span>
                </span>

                {/* Sprite oficial, sin suavizar: es pixel art de 80×80 y la
                    chapa es cuadrada, así que entra tal cual. */}
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-hud-1",
                    boss
                      ? "h-14 w-14 border-[var(--edge)] sm:h-[5.5rem] sm:w-[5.5rem]"
                      : "h-11 w-11 border-[color-mix(in_srgb,var(--edge)_45%,transparent)] sm:h-16 sm:w-16",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ladderArt(round)}
                    alt=""
                    className="h-full w-full object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </span>

                <span className="min-w-0 max-w-full">
                  <span
                    className={cn(
                      "block truncate font-display leading-tight font-bold text-slate-100",
                      boss ? "text-xs sm:text-base" : "text-[11px] sm:text-sm",
                    )}
                  >
                    {trainer.name}
                  </span>
                  <span className="block truncate font-mono text-[8px] text-slate-400 uppercase sm:text-[9px]">
                    {boss ? t.gauntletBoss : t.trainerClass[trainer.classKey]}
                  </span>
                </span>

                <span className="max-w-full truncate rounded-full border border-[color-mix(in_srgb,var(--edge)_55%,transparent)] bg-[color-mix(in_srgb,var(--edge)_16%,transparent)] px-1.5 py-px font-mono text-[8px] tracking-[0.1em] text-[var(--edge)] uppercase sm:text-[9px]">
                  {t.tierLabel[tier]}
                </span>
              </div>

              {/* La flecha que une un peldaño con el siguiente: sin ella, la
                  fila se lee como cuatro fichas sueltas y no como un camino
                  que hay que recorrer entero. */}
              {!boss && (
                <span
                  aria-hidden
                  className="flex shrink-0 items-center px-0.5 text-[color-mix(in_srgb,var(--cup)_75%,transparent)] sm:px-1"
                >
                  <ChevronRight size={14} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * La misma escalera reducida a caras, para la tarjeta de cada copa: lo que
 * distingue la Relámpago de la Maestra no es el número de rondas, es que en
 * una acaba Lt. Surge y en la otra te espera Lance.
 */
export function GauntletFaces({ format }: { format: TournamentFormat }) {
  const rounds = Array.from({ length: format }, (_, i) => i + 1);
  return (
    <span aria-hidden className="flex items-center gap-0.5 sm:gap-1">
      {rounds.map((round) => {
        const boss = round === format;
        return (
          <span
            key={round}
            className={cn(
              "flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-black/45",
              // Cinco caras tienen que caber en una tarjeta de ~105px: en el
              // móvil el retrato encoge en vez de desbordar la copa.
              boss
                ? "h-7 w-7 border-[var(--edge)] shadow-[0_0_12px_-3px_var(--edge)] max-sm:h-[18px] max-sm:w-[18px] sm:h-9 sm:w-9"
                : "h-6 w-6 border-[color-mix(in_srgb,var(--edge)_40%,transparent)] max-sm:h-3.5 max-sm:w-3.5 sm:h-8 sm:w-8",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ladderArt(round)}
              alt=""
              className="h-full w-full object-contain"
              style={{ imageRendering: "pixelated" }}
            />
          </span>
        );
      })}
    </span>
  );
}
