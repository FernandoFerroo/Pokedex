import { TypeBadge } from "@/components/ui/TypeBadge";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";
import { getDict, type Dict } from "@/lib/i18n";
import type { DefensiveMatchups } from "@/lib/matchups";

interface TypeMatchupsProps {
  matchups: DefensiveMatchups;
  lang?: Lang;
}

const ROWS: Array<{
  key: keyof DefensiveMatchups;
  label: (d: Dict["detail"]) => string;
  factor: string;
  node: string;
}> = [
  {
    key: "x4",
    label: (d) => d.matchupX4,
    factor: "×4",
    node: "border-red-500/60 text-red-400",
  },
  {
    key: "x2",
    label: (d) => d.matchupX2,
    factor: "×2",
    node: "border-orange-400/50 text-orange-400",
  },
  {
    key: "x05",
    label: (d) => d.matchupX05,
    factor: "×½",
    node: "border-emerald-500/50 text-emerald-400",
  },
  {
    key: "x025",
    label: (d) => d.matchupX025,
    factor: "×¼",
    node: "border-emerald-400/50 text-emerald-300",
  },
  {
    key: "x0",
    label: (d) => d.matchupX0,
    factor: "×0",
    node: "border-cyan-400/50 text-cyan-300",
  },
];

/**
 * Defensive type chart drawn as a threat scale: glowing multiplier nodes on a
 * vertical danger-to-immunity rail, chips grouped the way competitive fans
 * read it.
 */
export function TypeMatchups({
  matchups,
  lang = DEFAULT_LANG,
}: TypeMatchupsProps) {
  const d = getDict(lang).detail;
  const rows = ROWS.filter((row) => matchups[row.key].length > 0);

  if (rows.length === 0) {
    return <p className="font-mono text-xs text-slate-400">{d.noTypeData}</p>;
  }

  return (
    <div className="relative flex flex-col">
      {rows.length > 1 && (
        <span
          aria-hidden
          className="absolute top-5 bottom-5 left-[1.375rem] w-px -translate-x-1/2 bg-gradient-to-b from-red-500/50 via-orange-400/25 to-cyan-300/30"
        />
      )}
      {rows.map((row) => (
        <div
          key={row.key}
          className="relative grid grid-cols-[2.75rem_1fr] items-center gap-x-3.5 py-2.5 first:pt-0 last:pb-0"
        >
          <span
            className={`flex size-11 items-center justify-center rounded-full border bg-hud-2 font-mono text-sm font-bold ${row.node}`}
          >
            {row.factor}
          </span>
          <div>
            <p className="font-mono text-xs tracking-widest text-slate-400 uppercase">
              {row.label(d)}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {matchups[row.key].map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
