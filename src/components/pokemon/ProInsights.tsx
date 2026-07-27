import {
  Gauge,
  ShieldAlert,
  ShieldCheck,
  Star,
  Swords,
  Trophy,
} from "lucide-react";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n";
import type { DefensiveMatchups } from "@/lib/matchups";
import { STAT_LABELS, statRange, totalRank } from "@/lib/stats";

interface ProInsightsProps {
  stats: Array<{ name: string; value: number; effort: number }>;
  matchups: DefensiveMatchups;
  lang?: Lang;
}

function Cell({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="data-pill rounded-2xl px-4 py-3 max-sm:rounded-lg max-sm:px-1.5 max-sm:py-1.5">
      <p className="flex items-center gap-1.5 font-mono text-xs tracking-widest text-slate-400 uppercase max-sm:gap-0.5 max-sm:text-[9px] max-sm:leading-[1.2] max-sm:tracking-normal">
        <span aria-hidden className="shrink-0 text-[var(--aura)]">
          {icon}
        </span>
        {/* Con seis casillas en fila el móvil deja ~52px por etiqueta: el
            rótulo parte por donde haga falta antes que salirse de la casilla. */}
        <span className="min-w-0 max-sm:[overflow-wrap:anywhere]">{label}</span>
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
export function ProInsights({
  stats,
  matchups,
  lang = DEFAULT_LANG,
}: ProInsightsProps) {
  const d = getDict(lang).detail;
  const statLabels = STAT_LABELS[lang];
  const total = stats.reduce((sum, s) => sum + s.value, 0);
  const rank = totalRank(total, lang);
  const best = stats.reduce((a, b) => (b.value > a.value ? b : a));
  const speed = stats.find((s) => s.name === "speed")?.value ?? 0;
  const speed100 = statRange("speed", speed, 100);
  const evYield = stats
    .filter((s) => s.effort > 0)
    .map((s) => `+${s.effort} ${statLabels[s.name] ?? s.name}`)
    .join(" · ");
  /** ×4 first; if there are none, the plain ×2 list is the danger row. */
  const dangers = matchups.x4.length > 0 ? matchups.x4 : matchups.x2;
  const dangerFactor = matchups.x4.length > 0 ? "×4" : "×2";

  return (
    <section aria-label={d.competitiveRead}>
      <h2 className="mb-4 font-display text-sm font-bold tracking-[0.25em] text-slate-300 uppercase max-sm:mb-2 max-sm:tracking-[0.12em]">
        <span aria-hidden className="neon-aura mr-2">
          ▰
        </span>
        {d.competitiveRead}
      </h2>
      <div className="grid grid-cols-6 gap-3 max-sm:gap-1">
        <Cell label={d.baseTotal} icon={<Trophy size={14} className="max-sm:h-2.5 max-sm:w-2.5" />}>
          <p className="flex flex-wrap items-center gap-2 max-sm:gap-0.5">
            <span className="neon-value font-mono text-xl font-bold text-slate-50 tabular-nums max-sm:text-[11px]">
              {total}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-xs tracking-widest uppercase max-sm:px-1 max-sm:text-[8px] max-sm:tracking-normal ${rank.className}`}
            >
              {rank.label}
            </span>
          </p>
        </Cell>

        <Cell label={d.starStat} icon={<Star size={14} className="max-sm:h-2.5 max-sm:w-2.5" />}>
          <p className="font-mono text-sm font-semibold text-slate-100 max-sm:text-[9px] max-sm:leading-snug">
            {statLabels[best.name] ?? best.name}{" "}
            <span className="neon-value text-lg font-bold tabular-nums max-sm:text-[11px]">
              {best.value}
            </span>
          </p>
        </Cell>

        <Cell label={d.speedLv100} icon={<Gauge size={14} className="max-sm:h-2.5 max-sm:w-2.5" />}>
          <p className="font-mono text-sm text-slate-200 max-sm:text-[9px] max-sm:leading-snug">
            <span className="neon-value font-bold text-slate-50 tabular-nums">
              {speed100.min}–{speed100.max}
            </span>
            <span className="ml-1.5 text-xs text-slate-400 max-sm:ml-0 max-sm:block max-sm:text-[8px]">
              {d.baseOf(speed)}
            </span>
          </p>
        </Cell>

        <Cell label={d.evYield} icon={<Swords size={14} className="max-sm:h-2.5 max-sm:w-2.5" />}>
          <p className="font-mono text-sm font-semibold text-slate-200 max-sm:text-[9px] max-sm:leading-snug">
            {evYield || "—"}
          </p>
        </Cell>

        <Cell label={d.danger(dangerFactor)} icon={<ShieldAlert size={14} className="max-sm:h-2.5 max-sm:w-2.5" />}>
          {dangers.length === 0 ? (
            <p className="font-mono text-sm text-emerald-300 max-sm:text-[9px]">
              {d.noWeaknesses}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1 max-sm:gap-0.5">
              {dangers.map((type) => (
                <TypeBadge key={type} type={type} compactOnMobile />
              ))}
            </div>
          )}
        </Cell>

        <Cell label={d.immunities} icon={<ShieldCheck size={14} className="max-sm:h-2.5 max-sm:w-2.5" />}>
          {matchups.x0.length === 0 ? (
            <p className="font-mono text-sm text-slate-500 max-sm:text-[9px]">{d.none}</p>
          ) : (
            <div className="flex flex-wrap gap-1 max-sm:gap-0.5">
              {matchups.x0.map((type) => (
                <TypeBadge key={type} type={type} compactOnMobile />
              ))}
            </div>
          )}
        </Cell>
      </div>
    </section>
  );
}
