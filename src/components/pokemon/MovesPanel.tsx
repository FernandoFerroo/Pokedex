"use client";

import { useState } from "react";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { cn } from "@/lib/utils";

/** One learnable move, already localized and flattened by the detail page. */
export interface MoveRow {
  slug: string;
  /** Spanish move name (English formatted as fallback). */
  label: string;
  /** Type slug, e.g. "grass". */
  type: string;
  /** "physical" | "special" | "status" (null for missing data). */
  damageClass: string | null;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  /** Only for level-up moves; 0 means "al evolucionar / recordar". */
  level?: number;
}

export interface MoveGroups {
  levelUp: MoveRow[];
  machine: MoveRow[];
  egg: MoveRow[];
  tutor: MoveRow[];
}

const DAMAGE_CLASS_ES: Record<string, string> = {
  physical: "Físico",
  special: "Especial",
  status: "Estado",
};

const DAMAGE_CLASS_TONE: Record<string, string> = {
  physical: "text-orange-300",
  special: "text-sky-300",
  status: "text-slate-400",
};

const TABS: Array<{ key: keyof MoveGroups; label: string }> = [
  { key: "levelUp", label: "Por nivel" },
  { key: "machine", label: "MT/MO" },
  { key: "egg", label: "Huevo" },
  { key: "tutor", label: "Tutor" },
];

/**
 * Full learnset of the species in its most recent game, split by learn
 * method into tabs. This is where "Látigo Cepa, Drenadoras…" live — the
 * "Habilidades" panel above lists abilities, which are a different thing.
 */
export function MovesPanel({
  games,
  groups,
}: {
  /** Spanish titles of the games this learnset belongs to. */
  games: string;
  groups: MoveGroups;
}) {
  const available = TABS.filter((tab) => groups[tab.key].length > 0);
  const [active, setActive] = useState<keyof MoveGroups>(
    available[0]?.key ?? "levelUp",
  );
  if (available.length === 0) return null;

  const rows = groups[active] ?? [];

  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-xs text-slate-500">
        Repertorio completo en <span className="text-slate-300">{games}</span>.
      </p>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Método de aprendizaje">
        {available.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 font-mono text-sm transition",
              active === tab.key
                ? "border-slate-500 bg-slate-400/10 text-slate-100"
                : "border-slate-700/80 bg-[#0a101d]/90 text-slate-400 hover:text-slate-200",
            )}
          >
            {tab.label}
            <span className="font-mono text-xs text-slate-500">
              {groups[tab.key].length}
            </span>
          </button>
        ))}
      </div>

      <ul className="flex flex-col divide-y divide-slate-800/60">
        {rows.map((row, i) => (
          <li
            key={`${row.slug}-${row.level ?? i}`}
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 first:pt-0 last:pb-0"
          >
            {active === "levelUp" && (
              <span className="w-12 shrink-0 font-pixel text-[10px] whitespace-nowrap text-slate-400">
                {row.level ? `Nv. ${row.level}` : "Evol."}
              </span>
            )}
            {/* basis-44 lets long names claim the line; the data cluster wraps below on phones. */}
            <span className="min-w-0 flex-1 basis-44 truncate font-mono text-sm font-semibold text-slate-100">
              {row.label}
            </span>
            <span className="flex shrink-0 items-center gap-2.5">
              <TypeBadge type={row.type} />
              <span
                className={cn(
                  "w-14 font-mono text-xs",
                  (row.damageClass && DAMAGE_CLASS_TONE[row.damageClass]) ??
                    "text-slate-500",
                )}
              >
                {(row.damageClass && DAMAGE_CLASS_ES[row.damageClass]) ?? "—"}
              </span>
              <span className="font-mono text-xs whitespace-nowrap text-slate-400">
                Pot. {row.power ?? "—"} · Prec. {row.accuracy ?? "—"} · PP{" "}
                {row.pp ?? "—"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
