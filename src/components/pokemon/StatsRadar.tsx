import { typeAccent } from "@/lib/pokemon-meta";

const STAT_LABELS: Record<string, string> = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. Esp.",
  "special-defense": "Def. Esp.",
  speed: "Velocidad",
};

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

const CX = 170;
const CY = 155;
const RADIUS = 105;

/** Rings drawn at these fractions of the full scale. */
const RING_STEPS = [0.25, 0.5, 0.75, 1];

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

interface StatsRadarProps {
  stats: Array<{ name: string; value: number }>;
  /** Primary type slug — drives the polygon's accent color. */
  type: string;
}

export function StatsRadar({ stats, type }: StatsRadarProps) {
  const byName = new Map(stats.map((s) => [s.name, s.value]));
  const axes = AXIS_ORDER.map((name, i) => {
    const value = byName.get(name) ?? 0;
    return {
      name,
      label: STAT_LABELS[name] ?? name,
      value,
      point: vertex(i, Math.min(1, value / MAX_BASE_STAT)),
      labelPoint: vertex(i, 1.22),
    };
  });
  const total = stats.reduce((sum, stat) => sum + stat.value, 0);
  const polygon = axes.map((a) => a.point.join(",")).join(" ");

  return (
    <section aria-label="Estadísticas base">
      <h2 className="mb-1 font-pixel text-[10px] text-slate-400">
        <span aria-hidden className="mr-1.5 text-red-500">
          ►
        </span>
        Estadísticas base
      </h2>
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
            className="[filter:drop-shadow(0_0_6px_currentColor)]"
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
            className="fill-slate-500 text-[11px] dark:fill-slate-400"
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
      <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
        Total{" "}
        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
          {total}
        </span>
      </p>
    </section>
  );
}
