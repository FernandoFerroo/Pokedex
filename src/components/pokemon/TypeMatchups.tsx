import { TypeBadge } from "@/components/ui/TypeBadge";
import type { DefensiveMatchups } from "@/lib/matchups";

interface TypeMatchupsProps {
  matchups: DefensiveMatchups;
}

const ROWS: Array<{
  key: keyof DefensiveMatchups;
  label: string;
  factor: string;
  factorClass: string;
}> = [
  { key: "x4", label: "Debilidad crítica", factor: "×4", factorClass: "text-red-400" },
  { key: "x2", label: "Debilidad", factor: "×2", factorClass: "text-orange-400" },
  { key: "x05", label: "Resistencia", factor: "×½", factorClass: "text-emerald-400" },
  { key: "x025", label: "Gran resistencia", factor: "×¼", factorClass: "text-emerald-300" },
  { key: "x0", label: "Inmunidad", factor: "×0", factorClass: "text-cyan-300" },
];

/** Defensive type chart, grouped by multiplier the way competitive fans read it. */
export function TypeMatchups({ matchups }: TypeMatchupsProps) {
  const rows = ROWS.filter((row) => matchups[row.key].length > 0);

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.key}>
          <p className="font-mono text-xs tracking-widest text-slate-400 uppercase">
            <span className={`mr-1.5 font-semibold ${row.factorClass}`}>
              {row.factor}
            </span>
            {row.label}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {matchups[row.key].map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="font-mono text-xs text-slate-400">Sin datos de tipos.</p>
      )}
    </div>
  );
}
