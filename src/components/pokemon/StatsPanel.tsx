import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n";
import { STAT_LABELS } from "@/lib/stats";

/** Practical max for a base stat (Blissey's HP is 255). */
const MAX_BASE_STAT = 255;

interface StatsPanelProps {
  stats: Array<{ name: string; value: number }>;
  lang?: Lang;
}

export function StatsPanel({ stats, lang = DEFAULT_LANG }: StatsPanelProps) {
  const d = getDict(lang).detail;
  const statLabels = STAT_LABELS[lang];
  const total = stats.reduce((sum, stat) => sum + stat.value, 0);

  return (
    <section aria-label={d.baseStats}>
      <h2 className="mb-3 text-xs font-semibold tracking-wider text-slate-300 uppercase dark:text-slate-400">
        {d.baseStats}
      </h2>
      <dl className="flex flex-col gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="grid grid-cols-[7.5rem_2.5rem_1fr] items-center gap-2 text-sm"
          >
            <dt className="text-slate-400 dark:text-slate-300">
              {statLabels[stat.name] ?? stat.name}
            </dt>
            <dd className="text-right font-mono text-[13px] font-semibold tabular-nums">
              {stat.value}
            </dd>
            <dd
              className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
              role="presentation"
            >
              <div
                className="h-full rounded-full bg-slate-800 motion-safe:animate-[bar-grow_600ms_ease-out] dark:bg-slate-200"
                style={{
                  width: `${Math.min(100, (stat.value / MAX_BASE_STAT) * 100)}%`,
                }}
              />
            </dd>
          </div>
        ))}
        <div className="grid grid-cols-[7.5rem_2.5rem_1fr] items-center gap-2 border-t border-slate-200 pt-2 text-sm dark:border-slate-800">
          <dt className="font-medium">{d.total}</dt>
          <dd className="text-right font-mono text-[13px] font-bold tabular-nums">
            {total}
          </dd>
          <dd />
        </div>
      </dl>
    </section>
  );
}
