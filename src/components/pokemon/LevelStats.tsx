"use client";

import { useId, useState, type CSSProperties } from "react";
import { useI18n } from "@/lib/i18n/client";
import {
  MAX_LEVEL,
  MIN_LEVEL,
  STAT_LABELS,
  clampLevel,
  statRange,
} from "@/lib/stats";

/** Competitive default: the level VGC and most sims play at. */
const DEFAULT_LEVEL = 50;

/** One-tap levels: caught fresh, competitive, and endgame. */
const PRESETS = [5, 50, 100];

interface LevelStatsProps {
  /** Base stats in the order they should be listed. */
  stats: Array<{ name: string; value: number }>;
}

/**
 * Real stats at a level the user chooses. Same main-series formula as the
 * old fixed Lv50/Lv100 table, but driven by a slider + number box, so the
 * ficha answers "what does this Pokémon hit at level N?" for any N.
 * The range stays two-sided because the true value depends on IVs, EVs and
 * nature; the max is the one typeset as the headline.
 */
export function LevelStats({ stats }: LevelStatsProps) {
  const { lang, dict } = useI18n();
  const d = dict.detail;
  const statLabels = STAT_LABELS[lang];
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const inputId = useId();

  const rows = stats.map((stat) => ({
    name: stat.name,
    label: statLabels[stat.name] ?? stat.name,
    ...statRange(stat.name, stat.value, level),
  }));
  // Bars are scaled to the best stat at this level, so the silhouette stays
  // readable whether the user is looking at level 5 or level 100.
  const scale = Math.max(...rows.map((row) => row.max), 1);
  const totalMin = rows.reduce((sum, row) => sum + row.min, 0);
  const totalMax = rows.reduce((sum, row) => sum + row.max, 0);

  return (
    <div className="mt-4 border-t border-slate-800 pt-4">
      <p className="font-mono text-xs tracking-widest text-slate-400 uppercase">
        {d.realRanges}{" "}
        <span className="tracking-normal text-slate-500 normal-case">
          {d.realRangesNote}
        </span>
      </p>

      {/* Level control: type it, drag it, or jump to a classic milestone. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <label
          htmlFor={inputId}
          className="font-mono text-[11px] tracking-wider text-slate-400 uppercase"
        >
          {d.levelLabel}
        </label>
        <input
          id={inputId}
          type="number"
          min={MIN_LEVEL}
          max={MAX_LEVEL}
          value={level}
          onChange={(e) => {
            const value = e.target.valueAsNumber;
            if (!Number.isNaN(value)) setLevel(clampLevel(value));
          }}
          className="h-7 w-14 rounded border border-slate-700/80 bg-black/40 px-1 text-center font-mono text-sm font-semibold text-slate-100 outline-none transition focus:border-[var(--aura)]"
        />
        <input
          type="range"
          min={MIN_LEVEL}
          max={MAX_LEVEL}
          step={1}
          value={level}
          onChange={(e) => setLevel(clampLevel(e.target.valueAsNumber))}
          aria-label={d.levelSliderAria}
          className="h-1 min-w-32 flex-1 cursor-pointer accent-[var(--aura)]"
        />
        <div className="flex gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setLevel(preset)}
              aria-pressed={level === preset}
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] tracking-wider whitespace-nowrap uppercase transition ${
                level === preset
                  ? "border-[var(--aura)] bg-[color-mix(in_srgb,var(--aura)_22%,transparent)] text-slate-100"
                  : "border-slate-700/80 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              {d.levelShort(preset)}
            </button>
          ))}
        </div>
      </div>

      {/* No aria-live here on purpose: dragging the slider would re-announce
          all six rows on every step. The range input reports the level, and
          the table is read on demand. */}
      <div className="mt-3 grid grid-cols-[minmax(4rem,6.5rem)_minmax(2.5rem,1fr)_3rem_3rem] gap-x-3 gap-y-1.5 font-mono text-xs">
        <span aria-hidden />
        <span aria-hidden />
        <span className="text-right tracking-widest text-slate-500 uppercase">
          {d.statMin}
        </span>
        <span className="text-right tracking-widest text-slate-500 uppercase">
          {d.statMax}
        </span>
        {rows.map((row) => (
          <div
            key={row.name}
            className="col-span-4 grid grid-cols-subgrid items-center"
          >
            <span className="tracking-wider text-slate-400 uppercase">
              {row.label}
            </span>
            <span
              className="h-1.5 overflow-hidden rounded-full bg-slate-800/80"
              role="presentation"
            >
              <span
                className="stat-bar block h-full rounded-full ease-out motion-safe:transition-[width] motion-safe:duration-300"
                style={
                  {
                    "--bar-from":
                      "color-mix(in srgb, var(--aura) 35%, transparent)",
                    "--bar-to": "var(--aura)",
                    width: `${(row.max / scale) * 100}%`,
                  } as CSSProperties
                }
              />
            </span>
            <span className="text-right text-slate-300 tabular-nums">
              {row.min}
            </span>
            <span className="text-right font-semibold text-slate-100 tabular-nums">
              {row.max}
            </span>
          </div>
        ))}
        <div className="col-span-4 grid grid-cols-subgrid border-t border-slate-800 pt-1.5">
          <span className="tracking-wider text-slate-400 uppercase">
            {d.total}
          </span>
          <span aria-hidden />
          <span className="text-right text-slate-300 tabular-nums">
            {totalMin}
          </span>
          <span className="text-right font-semibold text-slate-100 tabular-nums">
            {totalMax}
          </span>
        </div>
      </div>
    </div>
  );
}
