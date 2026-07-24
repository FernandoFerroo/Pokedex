import { typeAccent } from "@/lib/pokemon-meta";
import { STAT_LABELS_ES as STAT_LABELS, statRange, totalRank } from "@/lib/stats";

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

const CX = 170;
const CY = 155;
const RADIUS = 105;

/** Rings drawn at these fractions of the full scale. */
const RING_STEPS = [0.25, 0.5, 0.75, 1];

/** Color tier per stat value, mirroring how fan dex sites grade stats. */
function statTone(value: number): { bar: string; text: string } {
  if (value < 40) return { bar: "bg-red-400", text: "text-red-300" };
  if (value < 70) return { bar: "bg-orange-400", text: "text-orange-300" };
  if (value < 100) return { bar: "bg-yellow-300", text: "text-yellow-200" };
  if (value < 130) return { bar: "bg-emerald-400", text: "text-emerald-300" };
  return { bar: "bg-cyan-300", text: "text-cyan-200" };
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
}

export function StatsDashboard({ stats, type }: StatsDashboardProps) {
  const byName = new Map(stats.map((s) => [s.name, s]));
  const axes = AXIS_ORDER.map((name, i) => {
    const value = byName.get(name)?.value ?? 0;
    return {
      name,
      label: STAT_LABELS[name] ?? name,
      value,
      point: vertex(i, Math.min(1, value / MAX_BASE_STAT)),
      labelPoint: vertex(i, 1.22),
    };
  });
  const total = stats.reduce((sum, stat) => sum + stat.value, 0);
  const best = Math.max(...axes.map((a) => a.value));
  const polygon = axes.map((a) => a.point.join(",")).join(" ");
  const rank = totalRank(total);
  const evYield = AXIS_ORDER.map((name) => byName.get(name))
    .filter((s): s is NonNullable<typeof s> => Boolean(s && s.effort > 0))
    .map((s) => `+${s.effort} ${STAT_LABELS[s.name] ?? s.name}`)
    .join(" · ");

  return (
    <div className="grid items-center gap-6 md:grid-cols-[minmax(0,340px)_1fr]">
      <svg
        viewBox="0 0 340 310"
        role="img"
        aria-label={`Estadísticas base: ${axes
          .map((a) => `${a.label} ${a.value}`)
          .join(", ")}. Total ${total}.`}
        className="mx-auto w-full max-w-90"
      >
        {/* Recessive grid: concentric hexagons + spokes */}
        <g className="stroke-slate-200 dark:stroke-slate-800" fill="none">
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
            fillOpacity={0.14}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {axes.map((axis) => (
            <circle
              key={axis.name}
              cx={axis.point[0]}
              cy={axis.point[1]}
              r={3.5}
              fill="currentColor"
              strokeWidth={2}
              className="stroke-white dark:stroke-slate-900"
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
            className="fill-slate-500 text-[13px] dark:fill-slate-400"
          >
            <tspan x={axis.labelPoint[0]} dy="-0.2em">
              {axis.label}
            </tspan>
            <tspan
              x={axis.labelPoint[0]}
              dy="1.25em"
              className="fill-slate-900 font-mono text-xs font-semibold dark:fill-slate-100"
            >
              {axis.value}
            </tspan>
          </text>
        ))}
      </svg>

      <div>
        <dl className="flex flex-col gap-2.5">
          {axes.map((axis) => {
            const tone = statTone(axis.value);
            return (
              <div
                key={axis.name}
                className="grid grid-cols-[6.5rem_2.5rem_1fr] items-center gap-3 text-sm"
              >
                <dt className="font-mono text-xs tracking-wider text-slate-400 uppercase">
                  {axis.label}
                  {axis.value === best && (
                    <span
                      aria-label="Mejor estadística"
                      title="Mejor estadística"
                      className="ml-1 text-amber-300"
                    >
                      ★
                    </span>
                  )}
                </dt>
                <dd
                  className={`text-right font-mono text-sm font-bold tabular-nums ${tone.text}`}
                >
                  {axis.value}
                </dd>
                <dd
                  className="h-2 overflow-hidden rounded-full bg-slate-800"
                  role="presentation"
                >
                  <div
                    className={`h-full rounded-full ${tone.bar} motion-safe:animate-[bar-grow_600ms_ease-out]`}
                    style={{
                      width: `${Math.min(100, (axis.value / BAR_SCALE) * 100)}%`,
                    }}
                  />
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-800 pt-3">
          <p className="font-mono text-sm text-slate-300">
            Total{" "}
            <span className="text-lg font-bold text-white tabular-nums">
              {total}
            </span>
          </p>
          <span
            className={`rounded border px-1.5 py-0.5 font-mono text-xs tracking-widest uppercase ${rank.className}`}
          >
            {rank.label}
          </span>
          {evYield && (
            <p className="font-mono text-xs text-slate-400">
              <span className="tracking-widest uppercase">EV al derrotarlo</span>{" "}
              <span className="font-semibold text-slate-200">{evYield}</span>
            </p>
          )}
        </div>

        {/* Real reachable stats: what these bases translate to in-game. */}
        <div className="mt-4 border-t border-slate-800 pt-3">
          <p className="font-mono text-xs tracking-widest text-slate-400 uppercase">
            Rangos reales{" "}
            <span className="tracking-normal text-slate-500 normal-case">
              (IV 0–31 · EV 0–252 · naturaleza incluida)
            </span>
          </p>
          <div className="mt-2 grid grid-cols-[minmax(5rem,6.5rem)_1fr_1fr] gap-x-3 gap-y-1.5 font-mono text-xs">
            <span aria-hidden />
            <span className="text-right tracking-widest text-slate-500 uppercase">
              Nv. 50
            </span>
            <span className="text-right tracking-widest text-slate-500 uppercase">
              Nv. 100
            </span>
            {axes.map((axis) => {
              const at50 = statRange(axis.name, axis.value, 50);
              const at100 = statRange(axis.name, axis.value, 100);
              return (
                <div key={axis.name} className="col-span-3 grid grid-cols-subgrid">
                  <span className="tracking-wider text-slate-400 uppercase">
                    {axis.label}
                  </span>
                  <span className="text-right text-slate-300 tabular-nums">
                    {at50.min}–
                    <span className="font-semibold text-slate-100">
                      {at50.max}
                    </span>
                  </span>
                  <span className="text-right text-slate-300 tabular-nums">
                    {at100.min}–
                    <span className="font-semibold text-slate-100">
                      {at100.max}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
