"use client";

import { useId, useRef, useState } from "react";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** One learnable move, already localized and flattened by the detail page. */
export interface MoveRow {
  slug: string;
  /** Localized move name (formatted slug as fallback). */
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

const DAMAGE_CLASS_TONE: Record<string, string> = {
  physical: "text-orange-300",
  special: "text-sky-300",
  status: "text-slate-400",
};

const TAB_KEYS: Array<keyof MoveGroups> = ["levelUp", "machine", "egg", "tutor"];

/**
 * Full learnset of the species in its most recent game, split by learn
 * method into tabs. This is where "Látigo Cepa, Drenadoras…" live — the
 * "Habilidades" panel above lists abilities, which are a different thing.
 */
export function MovesPanel({
  games,
  groups,
}: {
  /** Localized titles of the games this learnset belongs to. */
  games: string;
  groups: MoveGroups;
}) {
  const d = useT().detail;
  const tabLabels: Record<keyof MoveGroups, string> = {
    levelUp: d.tabLevelUp,
    machine: d.tabMachine,
    egg: d.tabEgg,
    tutor: d.tabTutor,
  };
  const damageLabels: Record<string, string> = {
    physical: d.damagePhysical,
    special: d.damageSpecial,
    status: d.damageStatus,
  };
  const available = TAB_KEYS.filter((key) => groups[key].length > 0);
  const [active, setActive] = useState<keyof MoveGroups>(
    available[0] ?? "levelUp",
  );
  const tabsRef = useRef<Partial<Record<keyof MoveGroups, HTMLButtonElement | null>>>(
    {},
  );
  // The detail sheet renders this panel twice (one layout per breakpoint), so
  // hard-coded ids would collide and `aria-controls` would point at whichever
  // copy the browser found first.
  const uid = useId();
  if (available.length === 0) return null;

  const rows = groups[active] ?? [];

  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-xs text-slate-500">
        {d.learnsetPrefix}
        <span className="text-slate-300">{games}</span>
        {d.learnsetSuffix}
      </p>

      {/*
        A real tab widget (WAI-ARIA APG): each tab owns its panel via
        `aria-controls`, only the selected one is in the Tab order, and the
        arrow keys move between them — previously they were buttons wearing
        `role="tab"`, which promised those semantics without providing them.
      */}
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label={d.learnMethodAria}
        onKeyDown={(e) => {
          const step =
            e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (step === 0) return;
          e.preventDefault();
          const index = available.indexOf(active);
          const next =
            available[(index + step + available.length) % available.length];
          setActive(next);
          tabsRef.current[next]?.focus();
        }}
      >
        {available.map((key) => (
          <button
            key={key}
            ref={(el) => {
              tabsRef.current[key] = el;
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${key}`}
            aria-selected={active === key}
            aria-controls={`${uid}-panel`}
            tabIndex={active === key ? 0 : -1}
            onClick={() => setActive(key)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 font-mono text-sm transition",
              active === key
                ? "border-slate-500 bg-slate-400/10 text-slate-100"
                : "border-slate-700/80 bg-hud-1/90 text-slate-400 hover:text-slate-200",
            )}
          >
            {tabLabels[key]}
            <span className="font-mono text-xs text-slate-500">
              {groups[key].length}
            </span>
          </button>
        ))}
      </div>

      <ul
        id={`${uid}-panel`}
        role="tabpanel"
        aria-labelledby={`${uid}-tab-${active}`}
        tabIndex={0}
        className="flex flex-col divide-y divide-slate-800/60 focus-visible:outline-none"
      >
        {rows.map((row, i) => (
          <li
            key={`${row.slug}-${row.level ?? i}`}
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 first:pt-0 last:pb-0"
          >
            {active === "levelUp" && (
              <span className="w-12 shrink-0 font-pixel text-[10px] whitespace-nowrap text-slate-400">
                {row.level ? d.levelShort(row.level) : d.evolveShort}
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
                {(row.damageClass && damageLabels[row.damageClass]) ?? "—"}
              </span>
              <span className="font-mono text-xs whitespace-nowrap text-slate-400">
                {d.moveMeta(
                  `${row.power ?? "—"}`,
                  `${row.accuracy ?? "—"}`,
                  `${row.pp ?? "—"}`,
                )}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
