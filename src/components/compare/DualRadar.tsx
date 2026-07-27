"use client";

import { MAX_BASE_STAT, RADAR_ORDER, statValue } from "@/lib/compare";
import { useI18n } from "@/lib/i18n/client";
import { STAT_LABELS } from "@/lib/stats";
import type { ComparePokemon } from "@/types/compare";

/**
 * Both sides share the hexagon of the detail sheet, drawn twice. The canvas is
 * deliberately much wider than the hexagon: axis labels sit at 1.32× the radius
 * with their value line below, so the margin is what keeps "Def. Esp." and its
 * numbers from colliding with the plot or being clipped at the edges.
 */
const CX = 230;
const CY = 210;
const RADIUS = 126;
const RING_STEPS = [0.25, 0.5, 0.75, 1];

/**
 * Corner colors: sky for A, ember for B. They resolve through the `--vs-*`
 * tokens of globals.css, which step down a couple of notches in the light
 * theme — so SVG marks, bars and text stay readable on both canvases.
 */
export const SIDE_A_COLOR = "var(--vs-a)";
export const SIDE_B_COLOR = "var(--vs-b)";

function vertex(axisIndex: number, fraction: number): [number, number] {
  const angle = (-90 + axisIndex * 60) * (Math.PI / 180);
  return [
    CX + RADIUS * fraction * Math.cos(angle),
    CY + RADIUS * fraction * Math.sin(angle),
  ];
}

function ringPoints(fraction: number): string {
  return RADAR_ORDER.map((_, i) => vertex(i, fraction).join(",")).join(" ");
}

function polygonFor(pokemon: ComparePokemon): string {
  return RADAR_ORDER.map((name, i) =>
    vertex(i, Math.min(1, statValue(pokemon, name) / MAX_BASE_STAT)).join(","),
  ).join(" ");
}

/**
 * Single radar with both Pokémon overlaid, one color each: the fastest read
 * of who owns which corner of the stat hexagon. Values sit next to their
 * axis in the same color as the polygon they belong to.
 */
export function DualRadar({ a, b }: { a: ComparePokemon; b: ComparePokemon }) {
  const { lang, dict } = useI18n();
  const labels = STAT_LABELS[lang];

  return (
    <svg
      viewBox="0 0 460 442"
      role="img"
      aria-label={dict.compare.radarAria(a.label, b.label)}
      className="mx-auto w-full max-w-130"
    >
      {/* Recessive grid: concentric hexagons + spokes. */}
      <g className="stroke-slate-800" fill="none">
        {RING_STEPS.map((step) => (
          <polygon key={step} points={ringPoints(step)} strokeWidth={1} />
        ))}
        {RADAR_ORDER.map((name, i) => {
          const [x, y] = vertex(i, 1);
          return (
            <line key={name} x1={CX} y1={CY} x2={x} y2={y} strokeWidth={1} />
          );
        })}
      </g>

      {/* Both silhouettes. B goes first so A's outline stays on top — the
          left-hand side of the arena reads as the reference. */}
      {[
        { pokemon: b, color: SIDE_B_COLOR },
        { pokemon: a, color: SIDE_A_COLOR },
      ].map(({ pokemon, color }) => (
        <g
          key={color}
          className="motion-safe:animate-[radar-grow_500ms_ease-out]"
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <polygon
            points={polygonFor(pokemon)}
            fill={color}
            fillOpacity={0.16}
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {RADAR_ORDER.map((name, i) => {
            const [x, y] = vertex(
              i,
              Math.min(1, statValue(pokemon, name) / MAX_BASE_STAT),
            );
            return <circle key={name} cx={x} cy={y} r={3} fill={color} />;
          })}
        </g>
      ))}

      {/* Axis labels: stat name plus both values, each in its side's color. */}
      {RADAR_ORDER.map((name, i) => {
        const [x, y] = vertex(i, 1.32);
        return (
          <g key={name} textAnchor="middle">
            <text
              x={x}
              y={y}
              className="fill-slate-300 font-mono text-[15px] font-semibold tracking-wider uppercase"
            >
              {labels[name] ?? name}
            </text>
            <text x={x} y={y + 30} className="font-mono text-[17px] font-bold">
              <tspan fill={SIDE_A_COLOR}>{statValue(a, name)}</tspan>
              <tspan className="fill-slate-500"> · </tspan>
              <tspan fill={SIDE_B_COLOR}>{statValue(b, name)}</tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
}
