import { TypeBadge } from "@/components/ui/TypeBadge";
import type { DefensiveMatchups } from "@/lib/matchups";
import { STAT_LABELS_ES, statRange, totalRank } from "@/lib/stats";

interface ProInsightsProps {
  stats: Array<{ name: string; value: number; effort: number }>;
  matchups: DefensiveMatchups;
}

function Cell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-800 bg-black/40 px-3 py-2.5">
      <p className="font-mono text-xs tracking-widest text-slate-400 uppercase">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/**
 * Competitive at-a-glance band: BST, star stat, real speed range, EV yield
 * and the danger/immunity chips — the numbers a tournament player checks
 * first, without scrolling into the detailed panels below.
 */
export function ProInsights({ stats, matchups }: ProInsightsProps) {
  const total = stats.reduce((sum, s) => sum + s.value, 0);
  const rank = totalRank(total);
  const best = stats.reduce((a, b) => (b.value > a.value ? b : a));
  const speed = stats.find((s) => s.name === "speed")?.value ?? 0;
  const speed100 = statRange("speed", speed, 100);
  const evYield = stats
    .filter((s) => s.effort > 0)
    .map((s) => `+${s.effort} ${STAT_LABELS_ES[s.name] ?? s.name}`)
    .join(" · ");
  /** ×4 first; if there are none, the plain ×2 list is the danger row. */
  const dangers = matchups.x4.length > 0 ? matchups.x4 : matchups.x2;
  const dangerFactor = matchups.x4.length > 0 ? "×4" : "×2";

  return (
    <section
      aria-label="Lectura competitiva"
      className="mt-8 rounded-xl border border-slate-800/60 bg-[#070b14]/80 p-5"
    >
      <h2 className="mb-4 font-mono text-xs tracking-[0.25em] text-slate-500 uppercase">
        <span aria-hidden className="mr-1.5 text-slate-600">
          ►
        </span>
        Lectura competitiva
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Cell label="Total base">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xl font-bold text-white tabular-nums">
              {total}
            </span>
            <span
              className={`rounded border px-1.5 py-0.5 font-mono text-xs tracking-widest uppercase ${rank.className}`}
            >
              {rank.label}
            </span>
          </p>
        </Cell>

        <Cell label="Stat estrella">
          <p className="font-mono text-sm font-semibold text-slate-100">
            {STAT_LABELS_ES[best.name] ?? best.name}{" "}
            <span className="text-lg font-bold tabular-nums">{best.value}</span>
          </p>
        </Cell>

        <Cell label="Velocidad · Nv. 100">
          <p className="font-mono text-sm text-slate-200">
            <span className="font-bold text-white tabular-nums">
              {speed100.min}–{speed100.max}
            </span>
            <span className="ml-1.5 text-xs text-slate-400">
              (base {speed})
            </span>
          </p>
        </Cell>

        <Cell label="EV al derrotarlo">
          <p className="font-mono text-sm font-semibold text-slate-200">
            {evYield || "—"}
          </p>
        </Cell>

        <Cell label={`Peligro ${dangerFactor}`}>
          {dangers.length === 0 ? (
            <p className="font-mono text-sm text-emerald-300">Sin debilidades</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {dangers.map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
          )}
        </Cell>

        <Cell label="Inmunidades">
          {matchups.x0.length === 0 ? (
            <p className="font-mono text-sm text-slate-500">Ninguna</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {matchups.x0.map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
          )}
        </Cell>
      </div>
    </section>
  );
}
