"use client";

import { Crown, Gift, ShieldHalf, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { CUP_EDGE, ladderTrainer, roundKey } from "@/lib/tournament/config";
import { PackArt } from "@/components/tcg/PackArt";
import { useT } from "@/lib/i18n/client";
import { titlePeFor, TITLE_PACKS } from "@/lib/tcg/rewards";
import { PACK_EDGE } from "@/lib/tcg/style";
import { cn } from "@/lib/utils";
import type { PackType } from "@/types/tcg";
import {
  drawSize,
  type TournamentDifficulty,
  type TournamentFormat,
  type TournamentPace,
} from "@/types/tournament";
import { GauntletFaces } from "./Gauntlet";
import type { CSSProperties } from "react";

/**
 * Identity of each cup: the glyph carries the difficulty. El color lo pone
 * `CUP_EDGE`, que es el mismo que usan el cartel de Entrenadores y el botón de
 * entrada — tres copias del mismo verde se desincronizan a la primera.
 */
const CUP_STYLE: Record<
  TournamentDifficulty,
  { dot: string; Icon: LucideIcon }
> = {
  easy: { dot: "🟢", Icon: Zap },
  medium: { dot: "🟡", Icon: ShieldHalf },
  hard: { dot: "🔴", Icon: Crown },
};

/**
 * One selectable cup in the tournament lobby: smoked glass framed in the
 * cup's neon, the round count as the headline number, and the exact road to
 * the final spelled out underneath so the size of the draw is never a
 * mystery. The chosen one burns bright; the others step back.
 */
export function CupCard({
  format,
  difficulty,
  pace,
  selected,
  onSelect,
}: {
  format: TournamentFormat;
  difficulty: TournamentDifficulty;
  /** Ritmo elegido arriba: es la otra mitad de los PE que promete la tarjeta. */
  pace: TournamentPace;
  selected: boolean;
  onSelect: () => void;
}) {
  const dict = useT();
  const t = dict.tournament;
  const ttcg = dict.tcg;
  const { dot, Icon } = CUP_STYLE[difficulty];
  const edge = CUP_EDGE[format];
  const name = t.cupName[format];

  // El premio, dicho antes de inscribirse. Sale de la misma tabla que lo paga
  // al levantar la copa, así que la promesa y la ceremonia no pueden discrepar.
  const prize = Object.entries(TITLE_PACKS[format]) as Array<[PackType, number]>;
  const titlePe = titlePeFor(format, pace);

  // The road to the final: one label per round, straight from the bracket's
  // own arithmetic, so "3 rondas" always reads as Cuartos → Semifinal → Final.
  const path = Array.from({ length: format }, (_, i) => {
    switch (roundKey(i + 1, format)) {
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
        return t.roundPlain(i + 1);
    }
  });

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={t.cupSelectAria(name)}
      style={{ "--edge": edge } as CSSProperties}
      className={cn(
        "lobby-panel lobby-bracket relative flex h-full flex-col gap-3 overflow-hidden rounded-3xl border p-5 text-left backdrop-blur-md transition duration-200 max-sm:gap-1.5 max-sm:rounded-2xl max-sm:p-2",
        selected
          ? "border-[var(--edge)] bg-[color-mix(in_srgb,var(--edge)_10%,var(--color-hud-3))] opacity-100 shadow-[0_0_34px_-8px_var(--edge)] ring-2 ring-[var(--edge)] ring-offset-2 ring-offset-hud-0"
          : "border-[color-mix(in_srgb,var(--edge)_28%,transparent)] bg-hud-3/55 opacity-70 hover:-translate-y-0.5 hover:opacity-100 hover:shadow-[0_0_26px_-10px_var(--edge)]",
      )}
    >
      {/* Dificultad: emoji + palabra, para no dejar el dato solo en el color. */}
      <span className="flex items-center gap-2 max-sm:gap-1">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--edge)_50%,transparent)] bg-[color-mix(in_srgb,var(--edge)_14%,transparent)] px-2.5 py-1 font-mono text-[11px] font-bold tracking-[0.18em] text-[var(--edge)] uppercase max-sm:gap-0.5 max-sm:px-1 max-sm:py-0.5 max-sm:text-[8px] max-sm:tracking-normal">
          <span aria-hidden>{dot}</span>
          {t.difficultyBadge[difficulty]}
        </span>
        {selected && (
          <span className="ml-auto min-w-0 truncate font-mono text-[10px] tracking-[0.2em] text-[var(--edge)] uppercase max-sm:text-[6px] max-sm:tracking-normal">
            ✓ {t.cupSelected}
          </span>
        )}
      </span>

      <span className="flex items-center gap-3 max-sm:gap-1.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl max-sm:h-7 max-sm:w-7 max-sm:rounded-lg border border-[color-mix(in_srgb,var(--edge)_45%,transparent)] bg-[color-mix(in_srgb,var(--edge)_16%,transparent)] text-[var(--edge)] shadow-[0_0_18px_-6px_var(--edge)]">
          <Icon size={26} className="max-sm:h-4 max-sm:w-4" />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-lg font-bold tracking-wide break-words text-slate-100 max-sm:text-[10px] max-sm:leading-tight">
            {name}
          </span>
          <span className="block font-mono text-xs text-slate-400 max-sm:text-[8px]">
            {t.cupTrainers(drawSize(format))}
          </span>
        </span>
      </span>

      {/* El número de rondas es el dato que decide: tipografía de titular. */}
      <span className="flex items-baseline gap-2 border-y border-[color-mix(in_srgb,var(--edge)_22%,transparent)] py-2">
        <span className="font-display text-5xl leading-none font-black text-[var(--edge)] max-sm:text-2xl drop-shadow-[0_0_14px_color-mix(in_srgb,var(--edge)_60%,transparent)]">
          {format}
        </span>
        <span className="font-mono text-sm font-bold tracking-[0.22em] text-slate-300 uppercase max-sm:text-[8px] max-sm:tracking-[0.1em]">
          {t.roundsWord}
        </span>
      </span>

      {/* Las caras de la copa. Es el dato que de verdad separa una de otra —
          la Relámpago acaba en Lt. Surge, la Maestra en el Campeón — y el
          único que se entiende de un vistazo, así que también en el teléfono,
          donde el texto del recorrido no cabe. El nombre del último se dice
          debajo: la cara sola no basta para quien no lo reconozca. */}
      <span className="flex flex-col gap-1">
        <GauntletFaces format={format} />
        <span className="truncate font-mono text-[9px] tracking-[0.1em] text-[var(--edge)] uppercase max-sm:text-[7px]">
          {t.cupBossLine(ladderTrainer(format).name)}
        </span>
      </span>

      {/* Descripción y recorrido: la misma ficha que en escritorio también en
          el teléfono — ahí encogen, que es lo que las hace caber. */}
      <span className="block text-sm leading-relaxed text-slate-300 max-sm:text-[8px] max-sm:leading-snug">
        {t.cupDesc[format]}
      </span>

      {/* El premio, entre la descripción y el recorrido: lo que se juega, antes
          de por dónde hay que pasar para conseguirlo.

          Dos cosas y en este orden: la experiencia en tipografía de titular
          —es la cifra que se compara entre copas y entre ritmos, así que se
          lee de lejos— y debajo los sobres, en su propio envoltorio. Un sobre
          se reconoce por su lámina y su protagonista mucho antes que por su
          nombre escrito, y la chapa del ×2 dice cuántos caen sin gastar una
          línea de texto. */}
      <span className="block rounded-xl border border-[color-mix(in_srgb,var(--edge)_30%,transparent)] bg-black/40 px-2 py-1.5 max-sm:rounded-md max-sm:px-1 max-sm:py-1">
        <span className="mb-1 flex items-center gap-1 font-mono text-[10px] tracking-[0.16em] text-slate-400 uppercase max-sm:mb-0.5 max-sm:gap-0.5 max-sm:text-[6px] max-sm:tracking-normal">
          <Gift size={11} aria-hidden className="shrink-0 text-[var(--edge)] max-sm:h-2 max-sm:w-2" />
          {ttcg.rewardPreviewLabel}
        </span>

        {/* La experiencia, en ámbar de tienda: es donde se gasta. */}
        <span className="flex items-center justify-center gap-1.5 max-sm:gap-0.5">
          <Sparkles
            size={16}
            aria-hidden
            className="shrink-0 text-amber-300 max-sm:h-2.5 max-sm:w-2.5"
          />
          <span className="font-display text-3xl leading-none font-black tracking-tight text-amber-200 drop-shadow-[0_0_16px_rgba(251,191,36,0.55)] max-sm:text-sm">
            {ttcg.rewardPe(titlePe)}
          </span>
        </span>

        <span className="mt-1.5 flex flex-wrap items-start justify-center gap-2 max-sm:mt-1 max-sm:gap-1">
          {prize.map(([type, amount]) => (
            <span
              key={type}
              style={{ "--edge": PACK_EDGE[type] } as CSSProperties}
              className="cup-prize"
            >
              <PackArt type={type} as="span" tilt={0} />
              {amount > 1 && (
                <span aria-hidden className="cup-prize__count">
                  {ttcg.packCount(amount)}
                </span>
              )}
              {/* La chapa es decorativa: el premio entero, en texto, para quien
                  no vea la lámina. */}
              <span className="sr-only">
                {ttcg.packName[type]} {ttcg.packCount(amount)}
              </span>
            </span>
          ))}
        </span>
      </span>

      <span className="mt-auto block">
        <span className="mb-1 block font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase max-sm:mb-0.5 max-sm:text-[7px] max-sm:tracking-normal">
          {t.cupPathLabel}
        </span>
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[11px] text-slate-400 max-sm:gap-x-1 max-sm:gap-y-0.5 max-sm:text-[7px]">
          {path.map((label, i) => (
            <span key={label} className="inline-flex items-center gap-1.5 max-sm:gap-0.5">
              {i > 0 && (
                <span aria-hidden className="text-[var(--edge)]/70">
                  →
                </span>
              )}
              <span className={i === path.length - 1 ? "text-[var(--edge)]" : ""}>
                {label}
              </span>
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}
