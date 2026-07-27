"use client";

import { type CSSProperties } from "react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { Battler } from "@/types/battle";

/**
 * Caja de estado oficial: el panel hexagonal recortado que los juegos
 * modernos cuelgan sobre la arena.
 *
 * The frame is one SVG polygon (angled leading edge, notched trailing one),
 * so the silhouette stays crisp at any size instead of leaning on stacked
 * border radii. Everything inside is plain markup over it: name, gender,
 * level, the health gauge and — for your own Pokémon — the numeric HP and
 * the experience strip.
 */

/** Cut-corner outline of the panel, mirrored for the player's side. */
const SHAPE_ENEMY = "M6,0 H236 L252,26 V54 L236,72 H22 L6,52 Z";
const SHAPE_PLAYER = "M22,0 H246 L252,20 V54 L236,72 H16 L0,46 V18 Z";

/** The three health tiers; the fill crossfades between them as HP drops. */
const HP_GREEN = "linear-gradient(180deg,#9dfab4,#2fd66a 52%,#12a94e)";
const HP_AMBER = "linear-gradient(180deg,#ffe9a3,#f7b32b 52%,#d98a08)";
const HP_RED = "linear-gradient(180deg,#ffb0b0,#f2452f 52%,#c81f18)";

/** Smooth 0→1 ramp between two percentages (no hard color snap). */
const ramp = (pct: number, from: number, to: number) =>
  Math.min(1, Math.max(0, (pct - from) / (to - from)));

/** Neon halo matching the tier the gauge is currently showing. */
const hpGlow = (pct: number) =>
  pct > 50 ? "#2fd66a" : pct > 20 ? "#f7b32b" : "#f2452f";

/** Venus / Mars glyph, in the pink and blue the games use. */
function GenderMark({ gender }: { gender: Battler["gender"] }) {
  const a11y = useT().a11y;
  if (!gender) return null;
  const male = gender === "male";
  return (
    <span
      role="img"
      aria-label={male ? a11y.genderMale : a11y.genderFemale}
      className={cn(
        "shrink-0 text-[13px] leading-none font-bold",
        male ? "text-[#7dc6ff]" : "text-[#ff8fc4]",
      )}
      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.85)" }}
    >
      {male ? "♂" : "♀"}
    </span>
  );
}

/** The gauge itself: track, crossfading fill, drain trail and gloss. */
function Gauge({
  pct,
  label,
  valueText,
  name,
  className,
}: {
  pct: number;
  /** "PS" / "HP" chip printed at the left of the track. */
  label: string;
  valueText: string;
  name: string;
  className?: string;
}) {
  const a11y = useT().a11y;
  const critical = pct > 0 && pct <= 20;
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        aria-hidden
        className="rounded-[3px] bg-gradient-to-b from-[#ffd257] to-[#e0961b] px-1.5 py-0.5 font-display text-[11px] leading-none font-black text-[#2a1a02] italic max-sm:px-1 max-sm:py-px max-sm:text-[9px]"
      >
        {label}
      </span>
      <div
        role="progressbar"
        aria-label={a11y.hpBarAria(name)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-valuetext={valueText}
        style={{ "--hp-glow": hpGlow(pct) } as CSSProperties}
        className={cn(
          "relative h-3.5 flex-1 overflow-hidden rounded-full border-2 border-black/80 bg-[#080e18] max-sm:h-2.5",
          "shadow-[inset_0_1px_2px_rgba(0,0,0,0.95),0_0_10px_-3px_var(--hp-glow)]",
          critical && "hp-critical",
        )}
      >
        {/* Pale trail draining behind the bar, the SuMo-style HP loss. */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/40 transition-[width] duration-1000 ease-out delay-300"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        >
          <span className="absolute inset-0" style={{ background: HP_RED }} />
          <span
            className="absolute inset-0 transition-opacity duration-700"
            style={{ background: HP_AMBER, opacity: ramp(pct, 12, 30) }}
          />
          <span
            className="absolute inset-0 transition-opacity duration-700"
            style={{ background: HP_GREEN, opacity: ramp(pct, 35, 55) }}
          />
          <span className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </div>
    </div>
  );
}

export function StatusBox({
  battler,
  side,
  team,
}: {
  battler: Battler;
  side: "player" | "enemy";
  /** Full roster, for the Poké Ball row of remaining Pokémon. */
  team: Battler[];
}) {
  const { battle: t, a11y } = useT();
  const pct = Math.max(0, Math.min(100, (battler.hp / battler.maxHp) * 100));
  const isPlayer = side === "player";
  // Pinned hexes: the panel floats over the illustration and must keep its
  // exact accent in both themes.
  const neon = isPlayer ? "#67e8f9" : "#ff7a7a";
  const alive = team.filter((b) => b.hp > 0).length;

  return (
    <div
      role="group"
      aria-label={a11y.databoxAria(battler.label, side)}
      style={{ "--neon": neon } as CSSProperties}
      className="relative w-[13.5rem] max-w-[54vw] drop-shadow-[0_8px_18px_rgba(0,0,0,0.7)] sm:w-[21rem] sm:min-w-[280px] sm:max-w-[52vw]"
    >
      {/* Frame. `preserveAspectRatio: none` lets one polygon stretch to the
          box's real size, so the notches always land on the corners. */}
      <svg
        aria-hidden
        viewBox="0 0 252 72"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id={`sb-${side}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22354f" stopOpacity="0.99" />
            <stop offset="55%" stopColor="#101b2c" stopOpacity="0.99" />
            <stop offset="100%" stopColor="#070d18" stopOpacity="0.99" />
          </linearGradient>
        </defs>
        <path
          d={isPlayer ? SHAPE_PLAYER : SHAPE_ENEMY}
          fill={`url(#sb-${side})`}
          stroke={neon}
          strokeOpacity={0.9}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        {/* Inner hairline: the double edge the official boxes have. */}
        <path
          d={isPlayer ? SHAPE_PLAYER : SHAPE_ENEMY}
          fill="none"
          stroke="#ffffff"
          strokeOpacity={0.12}
          strokeWidth={3}
          vectorEffect="non-scaling-stroke"
          transform="translate(0 2) scale(1 0.94)"
        />
      </svg>

      {/* Neon leading edge, pointing at the Pokémon it belongs to. */}
      <span
        aria-hidden
        className={cn(
          "absolute top-2 h-[calc(100%-1rem)] w-[3px] rounded-full",
          isPlayer ? "right-1.5" : "left-1.5",
        )}
        style={{
          background: `linear-gradient(180deg, transparent, ${neon}, transparent)`,
          boxShadow: `0 0 10px 1px ${neon}`,
        }}
      />

      <div
        className={cn(
          "relative px-5 py-3 max-sm:px-2 max-sm:py-1.5",
          isPlayer ? "pr-5 pl-4 max-sm:pr-3 max-sm:pl-2" : "pr-4 pl-5 max-sm:pr-2 max-sm:pl-3",
        )}
      >
        <div className="flex items-baseline gap-1.5">
          <p
            className="min-w-0 flex-1 truncate font-display text-[20px] font-bold tracking-wide text-white max-sm:text-[13px]"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
          >
            {battler.label}
          </p>
          <GenderMark gender={battler.gender} />
          <p
            className="shrink-0 font-display text-[17px] font-bold text-white max-sm:text-[12px]"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
          >
            <span className="mr-0.5 text-[11px] text-[#cbd7e6] italic">
              {t.lvShort}
            </span>
            {battler.level}
          </p>
        </div>

        <Gauge
          className="mt-1"
          pct={pct}
          label={t.hp}
          name={battler.label}
          valueText={a11y.hpValueText(Math.max(0, battler.hp), battler.maxHp)}
        />

        <div className="mt-1 flex items-center justify-between gap-2">
          {/* Poké Ball row: a picture of a number, so it is spoken as one. */}
          <div
            role="img"
            aria-label={a11y.teamPipsAria(alive, team.length)}
            className="flex gap-1.5"
          >
            {team.map((b) => (
              <span
                key={b.id}
                aria-hidden
                title={b.label}
                className={cn(
                  "h-3 w-3 rounded-full border max-sm:h-2 max-sm:w-2",
                  b.hp > 0
                    ? "border-black/70 bg-gradient-to-b from-[#ff5a5a] from-50% to-[#f4f7fb] to-50% shadow-[0_0_4px_rgba(255,90,90,0.7)]"
                    : "border-[#3f4b60] bg-[#28323f]",
                )}
              />
            ))}
          </div>
          {isPlayer && (
            <p
              className="font-display text-[17px] font-black text-white tabular-nums max-sm:text-[11px]"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
            >
              {Math.max(0, battler.hp)}
              <span className="text-[#cbd7e6]">/{battler.maxHp}</span>
            </p>
          )}
        </div>

        {/* Experience strip, decorative like in the games (fills with level). */}
        {isPlayer && (
          <div className="mt-1 flex items-center gap-1.5">
            <span
              aria-hidden
              className="text-[10px] font-black tracking-widest text-[#7fd8ff] italic"
            >
              EXP
            </span>
            <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-[#080e18] shadow-[inset_0_1px_2px_rgba(0,0,0,0.95)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#818cf8] shadow-[0_0_6px_rgba(56,189,248,0.8)]"
                style={{ width: `${battler.level}%` }}
              />
            </div>
          </div>
        )}

        {/* The ability sits under the player's box, where the games print the
            held item — it is the one thing a custom build changes. */}
        {isPlayer && battler.ability && (
          <p
            className="mt-1 truncate text-[11px] font-semibold text-[#cbd7e6] max-sm:hidden"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
          >
            {t.abilityShort} {battler.ability.label}
          </p>
        )}
      </div>
    </div>
  );
}
