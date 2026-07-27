"use client";

import Image from "next/image";
import { Check, Crown, Lock, Swords } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { artworkUrl } from "@/lib/pokemon-meta";
import { RIVAL_ROSTER_SIZE, roundKey } from "@/lib/tournament/config";
import { cn } from "@/lib/utils";
import type { TournamentTrainer } from "@/types/tournament";

/** "Dieciseisavos", "Octavos", "Cuartos", "Semifinal", "Final" or the number. */
export function useRoundLabel() {
  const t = useT().tournament;
  return (round: number, total: number) => {
    switch (roundKey(round, total)) {
      case "final":
        return t.roundFinal;
      case "semi":
        return t.roundSemi;
      case "quarter":
        return t.roundQuarter;
      case "round16":
        return t.roundRound16;
      case "round32":
        return t.roundRound32;
      default:
        return t.roundPlain(round);
    }
  };
}

/**
 * Una Poké Ball dorada del marcador 6v6. Es puro adorno — la fila entera se
 * anuncia con un texto, así que cada bola queda fuera del árbol accesible.
 */
function GoldBall({ index }: { index: number }) {
  return (
    <span
      aria-hidden
      className="cup-ball"
      style={{ animationDelay: `${index * 140}ms` }}
    >
      <svg viewBox="0 0 32 32" className="h-full w-full">
        <circle cx="16" cy="16" r="15" fill="#78350f" />
        <path d="M1 16a15 15 0 0 1 30 0Z" fill="#fcd34d" />
        <path d="M31 16a15 15 0 0 1-30 0Z" fill="#b45309" />
        <path d="M1 16h30" stroke="#451a03" strokeWidth="2.5" />
        <circle cx="16" cy="16" r="5" fill="#451a03" />
        <circle cx="16" cy="16" r="3.4" fill="#fffbeb" />
      </svg>
    </span>
  );
}

/** Los seis cartuchos dorados: el contrato 6v6 de cada ronda. */
export function BallRow({ className }: { className?: string }) {
  const t = useT().tournament;
  return (
    <p
      className={cn(
        "cup-note flex flex-wrap items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] text-amber-200/80 uppercase",
        className,
      )}
    >
      {Array.from({ length: RIVAL_ROSTER_SIZE }, (_, i) => (
        <GoldBall key={i} index={i} />
      ))}
      <span className="ml-1">{t.sixVsSix}</span>
    </p>
  );
}

interface BracketProps {
  trainers: TournamentTrainer[];
  /** Round about to be fought, 1-based. */
  current: number;
  /** Rounds already won. */
  wins: number;
  /** Which round the player is inspecting; defaults to the current one. */
  selected: number;
  onSelect: (round: number) => void;
}

/**
 * El cuadro como árbol de llaves: cada ronda es un enfrentamiento (tú arriba,
 * el rival abajo) cerrado por la horquilla que lo une con la siguiente, y la
 * última desemboca en la copa.
 *
 * Las rondas ganadas encienden su horquilla en verde y la línea que sale de
 * ellas fluye hacia la derecha, así el camino ya recorrido empuja la vista
 * hacia la final; la ronda en juego late en ámbar y lo que viene después se
 * queda a trazos, sin nombre, hasta que el jugador llegue.
 */
export function Bracket({
  trainers,
  current,
  wins,
  selected,
  onSelect,
}: BracketProps) {
  const t = useT().tournament;
  const label = useRoundLabel();
  const total = trainers.length;

  return (
    <div
      className="flex w-full items-stretch gap-0 overflow-x-auto pb-2"
      aria-label={t.bracketAria}
    >
      {trainers.map((trainer, i) => {
        const round = i + 1;
        const won = round <= wins;
        const now = round === current;
        const locked = round > current;
        const edge = won ? "#34d399" : now ? "#fbbf24" : "#475569";
        return (
          <div key={round} className="flex shrink-0 items-stretch">
            <button
              type="button"
              onClick={() => onSelect(round)}
              disabled={locked}
              aria-current={now ? "step" : undefined}
              style={{ "--edge": edge } as React.CSSProperties}
              className={cn(
                "flex w-[9.5rem] flex-col justify-center gap-1.5 rounded-l-xl border border-r-0 px-2.5 py-2.5 text-left transition sm:w-44",
                won && "border-emerald-400/50 bg-emerald-400/10",
                now &&
                  "bracket-now border-amber-300/70 bg-amber-400/12 backdrop-blur-md",
                locked && "border-dashed border-slate-700/80 bg-black/25",
                selected === round &&
                  !locked &&
                  "ring-1 ring-amber-200/70 ring-offset-1 ring-offset-hud-0",
              )}
            >
              <span className="flex items-center justify-between gap-1 font-mono text-[10px] tracking-[0.16em] text-slate-400 uppercase">
                {label(round, total)}
                {won ? (
                  <Check size={12} className="text-emerald-300" />
                ) : locked ? (
                  <Lock size={12} className="text-slate-600" />
                ) : (
                  <Swords size={12} className="text-amber-300" />
                )}
              </span>

              {/* Tú, siempre en la llave de arriba. */}
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-1.5 py-1",
                  now
                    ? "bracket-you border-cyan-300/70 bg-cyan-400/15 text-cyan-100 shadow-[0_0_16px_-6px_#22d3ee]"
                    : "border-slate-700/70 bg-black/40 text-slate-300",
                )}
              >
                <span aria-hidden className="text-sm">
                  🎮
                </span>
                <span className="font-display text-sm font-bold tracking-wide">
                  {t.bracketYou}
                </span>
              </span>

              {/* El rival de esa llave, oculto mientras siga bloqueado. */}
              <span className="flex items-center gap-1.5 rounded-md border border-slate-700/70 bg-black/40 px-1.5 py-1">
                <span aria-hidden className="text-sm">
                  {locked ? "❔" : trainer.emoji}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate font-display text-sm font-bold",
                      locked ? "text-slate-500" : "text-slate-100",
                    )}
                  >
                    {locked ? t.bracketUnknown : trainer.name}
                  </span>
                  {!locked && (
                    <span className="block truncate font-mono text-[9px] text-slate-400 uppercase">
                      {trainer.trainerClass}
                    </span>
                  )}
                </span>
              </span>
            </button>

            {/* Horquilla de la llave y línea hacia la ronda siguiente. */}
            <span aria-hidden className="flex shrink-0 items-center">
              <span
                className={cn(
                  "h-full w-3 rounded-r-xl border-y border-r",
                  won
                    ? "border-emerald-400/50"
                    : now
                      ? "border-amber-300/70"
                      : "border-dashed border-slate-700/80",
                )}
              />
              <span
                className={cn(
                  "h-px w-4 sm:w-6",
                  won
                    ? "bracket-flow bg-emerald-400/70"
                    : now
                      ? "bg-amber-300/70"
                      : "bg-slate-700",
                )}
              />
            </span>
          </div>
        );
      })}

      {/* La copa cierra el árbol. */}
      <div
        className={cn(
          "flex w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3",
          wins >= total
            ? "border-amber-300/80 bg-amber-400/20 shadow-[0_0_26px_-4px_rgba(251,191,36,0.9)]"
            : "border-dashed border-amber-300/30 bg-black/30",
        )}
      >
        <Crown
          size={24}
          className={wins >= total ? "text-amber-200" : "text-amber-300/40"}
        />
        <span className="font-mono text-[10px] tracking-[0.18em] text-amber-200/80 uppercase">
          {t.trophyLabel}
        </span>
      </div>
    </div>
  );
}

/**
 * Ficha del rival de la ronda: retrato generado, nombre y clase, cómo juega
 * su categoría, los seis cartuchos dorados del 6v6 y su equipo al completo.
 */
export function TrainerCard({
  trainer,
  total,
  avatar,
}: {
  trainer: TournamentTrainer;
  total: number;
  avatar?: string | null;
}) {
  const t = useT().tournament;
  const label = useRoundLabel();
  return (
    <div className="lobby-panel lobby-bracket relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-amber-300/35 bg-hud-3/50 px-4 py-4 text-left backdrop-blur-md sm:px-5 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-24 w-24 shrink-0 items-center justify-center self-center overflow-hidden rounded-2xl border-2 border-amber-300/60 bg-hud-1 text-4xl shadow-[0_0_28px_-6px_rgba(251,191,36,0.9)] sm:h-28 sm:w-28">
          {avatar ? (
            // Generated portrait of this round's trainer; the emoji badge is
            // what shows while the image is still being drawn.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden>{trainer.emoji}</span>
          )}
        </span>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="font-mono text-[10px] tracking-[0.2em] text-amber-300/80 uppercase">
            {label(trainer.round, total)} · {t.tierLabel[trainer.tier]}
          </p>
          <p className="premium-text font-display text-2xl font-bold tracking-wide sm:text-3xl">
            {trainer.trainerClass} {trainer.name}
          </p>
          <p className="mt-0.5 text-sm text-amber-100/70 italic">
            {t.tierHint[trainer.tier]}
          </p>
          <BallRow className="mt-2.5 justify-center sm:justify-start" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[10px] tracking-[0.2em] text-slate-400 uppercase">
          {t.rivalRosterLabel}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {trainer.species.map((s) => (
            <span
              key={s.id}
              className="relative h-12 w-12 rounded-lg border border-amber-300/20 bg-black/40 sm:h-14 sm:w-14"
            >
              <Image
                src={artworkUrl(s.id)}
                alt=""
                fill
                sizes="56px"
                className="object-contain p-0.5 opacity-90"
              />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
