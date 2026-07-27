import { LevelStats } from "@/components/pokemon/LevelStats";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n";
import { typeAccent } from "@/lib/pokemon-meta";
import { STAT_LABELS, totalRank } from "@/lib/stats";

/** Hexagon layout in the classic games' order: PS arriba, en sentido horario. */
const AXIS_ORDER = [
  "hp",
  "attack",
  "defense",
  "speed",
  "special-defense",
  "special-attack",
];

/** Practical max for a base stat (Blissey's HP is 255). */
const MAX_BASE_STAT = 255;

/**
 * Scale for the horizontal bars. 180 keeps ordinary stats readable
 * (a 255 outlier simply pins to 100%).
 */
const BAR_SCALE = 180;

const CX = 190;
const CY = 172;
const RADIUS = 128;

/** Rings drawn at these fractions of the full scale. */
const RING_STEPS = [0.25, 0.5, 0.75, 1];

/**
 * Color tier per stat value, mirroring how fan dex sites grade stats.
 * `tier` picks the bar gradient (a `.stat-tier-N` class themed in
 * globals.css) and `text` keeps the number in the same family so the row
 * reads as one signal in both themes.
 */
function statTone(value: number): { tier: number; text: string } {
  if (value < 40) return { tier: 0, text: "text-red-300" };
  if (value < 70) return { tier: 1, text: "text-orange-300" };
  if (value < 100) return { tier: 2, text: "text-yellow-200" };
  if (value < 130) return { tier: 3, text: "text-emerald-300" };
  return { tier: 4, text: "text-cyan-200" };
}

function vertex(axisIndex: number, fraction: number): [number, number] {
  const angle = (-90 + axisIndex * 60) * (Math.PI / 180);
  return [
    CX + RADIUS * fraction * Math.cos(angle),
    CY + RADIUS * fraction * Math.sin(angle),
  ];
}

function ringPoints(fraction: number): string {
  return AXIS_ORDER.map((_, i) => vertex(i, fraction).join(",")).join(" ");
}

interface StatsDashboardProps {
  stats: Array<{ name: string; value: number; effort: number }>;
  /** Primary type slug — drives the accent color. */
  type: string;
  lang?: Lang;
}

export function StatsDashboard({
  stats,
  type,
  lang = DEFAULT_LANG,
}: StatsDashboardProps) {
  const d = getDict(lang).detail;
  const statLabels = STAT_LABELS[lang];
  const byName = new Map(stats.map((s) => [s.name, s]));
  const axes = AXIS_ORDER.map((name, i) => {
    const value = byName.get(name)?.value ?? 0;
    return {
      name,
      label: statLabels[name] ?? name,
      value,
      point: vertex(i, Math.min(1, value / MAX_BASE_STAT)),
      labelPoint: vertex(i, 1.2),
    };
  });
  const total = stats.reduce((sum, stat) => sum + stat.value, 0);
  const best = Math.max(...axes.map((a) => a.value));
  const polygon = axes.map((a) => a.point.join(",")).join(" ");
  const rank = totalRank(total, lang);
  const evYield = AXIS_ORDER.map((name) => byName.get(name))
    .filter((s): s is NonNullable<typeof s> => Boolean(s && s.effort > 0))
    .map((s) => `+${s.effort} ${statLabels[s.name] ?? s.name}`)
    .join(" · ");

  return (
    // Radar y lecturas conviven en dos columnas también en el móvil: es la
    // composición de escritorio, y leer el hexágono junto a sus barras es justo
    // lo que hace útil al panel.
    <div className="grid grid-cols-[minmax(0,44%)_1fr] items-center gap-8 max-sm:gap-2 md:grid-cols-[minmax(0,440px)_1fr]">
      <svg
        viewBox="0 0 380 348"
        role="img"
        aria-label={d.statsAria(
          axes.map((a) => `${a.label} ${a.value}`).join(", "),
          total,
        )}
        className="mx-auto w-full max-w-110"
      >
        {/* Recessive grid: concentric hexagons + spokes. slate-800 flips to a
            pale gray in the light theme via the inverted slate scale. */}
        <g className="stroke-slate-800" fill="none">
          {RING_STEPS.map((step) => (
            <polygon key={step} points={ringPoints(step)} strokeWidth={1} />
          ))}
          {axes.map((axis, i) => {
            const [x, y] = vertex(i, 1);
            return (
              <line key={axis.name} x1={CX} y1={CY} x2={x} y2={y} strokeWidth={1} />
            );
          })}
        </g>

        {/* Data polygon, tinted by the Pokémon's primary type */}
        <g
          className={`${typeAccent(type)} motion-safe:animate-[radar-grow_500ms_ease-out]`}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <polygon
            points={polygon}
            fill="currentColor"
            fillOpacity={0.16}
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 8px currentColor)" }}
          />
          {axes.map((axis) => (
            <circle
              key={axis.name}
              cx={axis.point[0]}
              cy={axis.point[1]}
              r={4}
              fill="currentColor"
              strokeWidth={2}
              className="stroke-hud-1"
            />
          ))}
        </g>

        {/* Direct labels: stat name + value at each axis end */}
        {axes.map((axis) => (
          <text
            key={axis.name}
            x={axis.labelPoint[0]}
            y={axis.labelPoint[1]}
            textAnchor="middle"
            className="fill-slate-400 text-[13px] tracking-wider uppercase"
          >
            <tspan x={axis.labelPoint[0]} dy="-0.2em">
              {axis.label}
            </tspan>
            <tspan
              x={axis.labelPoint[0]}
              dy="1.25em"
              className="fill-slate-100 font-mono text-sm font-bold"
            >
              {axis.value}
            </tspan>
          </text>
        ))}
      </svg>

      <div>
        <dl className="flex flex-col gap-3">
          {axes.map((axis) => {
            const tone = statTone(axis.value);
            return (
              <div
                key={axis.name}
                className="grid grid-cols-[6.5rem_2.75rem_1fr] items-center gap-3 text-sm max-sm:grid-cols-[3.6rem_1.9rem_1fr] max-sm:gap-1.5"
              >
                <dt className="font-mono text-xs tracking-wider text-slate-400 uppercase max-sm:text-[9px] max-sm:tracking-normal">
                  {axis.label}
                  {axis.value === best && (
                    <span
                      aria-label={d.bestStat}
                      title={d.bestStat}
                      className="ml-1 text-amber-300"
                    >
                      ★
                    </span>
                  )}
                </dt>
                <dd
                  className={`neon-value text-right font-mono text-base font-bold tabular-nums ${tone.text}`}
                >
                  {axis.value}
                </dd>
                <dd
                  className="h-2.5 overflow-hidden rounded-full bg-slate-800/80"
                  role="presentation"
                >
                  <div
                    className={`stat-bar stat-tier-${tone.tier} h-full rounded-full motion-safe:animate-[bar-grow_600ms_ease-out]`}
                    style={{
                      width: `${Math.min(100, (axis.value / BAR_SCALE) * 100)}%`,
                    }}
                  />
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-800 pt-4">
          <p className="font-mono text-sm text-slate-300">
            {d.total}{" "}
            <span className="neon-value text-xl font-bold text-slate-50 tabular-nums">
              {total}
            </span>
          </p>
          <span
            className={`rounded-full border px-2.5 py-0.5 font-mono text-xs tracking-widest uppercase ${rank.className}`}
          >
            {rank.label}
          </span>
          {evYield && (
            <p className="font-mono text-xs text-slate-400">
              <span className="tracking-widest uppercase">{d.evYield}</span>{" "}
              <span className="font-semibold text-slate-200">{evYield}</span>
            </p>
          )}
        </div>

        {/* Real reachable stats: what these bases translate to in-game, at
            whatever level the user dials in. */}
        <LevelStats
          stats={axes.map((axis) => ({ name: axis.name, value: axis.value }))}
        />
      </div>
    </div>
  );
}
