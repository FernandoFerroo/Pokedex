"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutGrid, Search, X } from "lucide-react";
import { filterEntries, useTeamIndex } from "@/components/team/TeamDrawer";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { useI18n } from "@/lib/i18n/client";
import {
  artworkUrl,
  formatDexNumber,
  formatName,
  typeAura,
} from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";
import type { TeamMember } from "@/types/team";

/**
 * Visual species picker for one corner of the comparator: the whole Pokédex
 * as a scrollable grid of artwork, so a duel can be set up by recognising the
 * Pokémon instead of knowing how to spell it. Same bottom-sheet-on-mobile,
 * centred-dialog-on-desktop chrome as the team drawer's picker; the search box
 * stays on top because 1025 cards are a lot to scroll past.
 */
export function SpeciesGridPicker({
  sideLabel,
  accent,
  selected,
  onSelect,
  onClose,
}: {
  /** Localized side label, e.g. "Pokémon A". */
  sideLabel: string;
  /** Side colour, so the grid reads as belonging to that corner. */
  accent: string;
  /** Slug already chosen for this side, marked with a tick. */
  selected: string | null;
  onSelect: (entry: TeamMember) => void;
  onClose: () => void;
}) {
  const t = useI18n().dict.compare;
  const { entries, failed } = useTeamIndex();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(
    () => (entries ? filterEntries(entries, query) : []),
    [entries, query],
  );

  return (
    <div
      style={{ "--side": accent } as CSSProperties}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <button
        type="button"
        aria-label={t.gridCloseAria}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.chooseAria(sideLabel)}
        className="relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-[color-mix(in_srgb,var(--side)_45%,transparent)] bg-hud-3 shadow-[0_0_48px_rgba(0,0,0,0.8)] sm:max-h-[85vh] sm:rounded-2xl"
      >
        <div className="flex items-center gap-3 border-b border-slate-700/60 px-5 py-3.5">
          <LayoutGrid size={18} className="text-[var(--side)]" />
          <h3 className="font-display text-base font-bold tracking-wide text-slate-100">
            {t.gridTitle}
            <span className="ml-2 font-mono text-xs font-normal text-[var(--side)]">
              {sideLabel}
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.gridCloseAria}
            className="ml-auto rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-slate-700/60 px-5 py-3">
          <label className="relative block flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.gridFilterPlaceholder}
              aria-label={t.gridFilterAria}
              className="h-11 w-full rounded-lg border border-slate-700/80 bg-hud-1/90 pr-4 pl-10 font-mono text-sm text-slate-200 outline-none transition focus:border-[color-mix(in_srgb,var(--side)_70%,transparent)] focus:shadow-[0_0_16px_-2px_var(--side)]"
            />
          </label>
          {entries && (
            <span className="shrink-0 font-mono text-xs text-slate-500">
              {t.gridCount(results.length, entries.length)}
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {failed && (
            <p className="font-mono text-sm text-red-400">{t.indexFailed}</p>
          )}
          {!entries && !failed && (
            <p className="font-mono text-sm text-slate-500">{t.loadingIndex}</p>
          )}
          {entries && results.length === 0 && (
            <p className="font-mono text-sm text-slate-500">
              {t.noResults(query.trim())}
            </p>
          )}

          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-5 lg:grid-cols-6">
            {results.map((entry) => {
              const isSelected = entry.name === selected;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(entry)}
                    aria-pressed={isSelected}
                    style={{ "--aura": typeAura(entry.types[0]) } as CSSProperties}
                    // Off-screen cards skip layout and paint: the grid holds
                    // the whole Pokédex, so without this the modal would cost
                    // a thousand image layouts to open.
                    className={cn(
                      "flex w-full flex-col items-center gap-1 rounded-xl border p-2 transition [contain-intrinsic-size:auto_150px] [content-visibility:auto]",
                      isSelected
                        ? "border-[var(--side)] bg-[color-mix(in_srgb,var(--side)_14%,transparent)] shadow-[0_0_20px_-6px_var(--side)]"
                        : "border-slate-700/70 bg-black/30 hover:border-[color-mix(in_srgb,var(--aura)_60%,transparent)] hover:bg-[color-mix(in_srgb,var(--aura)_10%,transparent)] hover:shadow-[0_0_18px_-6px_var(--aura)]",
                    )}
                  >
                    <span className="flex w-full items-center justify-between">
                      <span className="font-pixel text-[12px] text-slate-500">
                        {formatDexNumber(entry.id)}
                      </span>
                      {isSelected && (
                        <span
                          aria-hidden
                          className="font-mono text-xs text-[var(--side)]"
                        >
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="relative aspect-square w-full max-w-[88px]">
                      <Image
                        src={artworkUrl(entry.id)}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 28vw, 96px"
                        className="object-contain drop-shadow-[0_0_8px_var(--aura)]"
                      />
                    </span>
                    <span className="w-full truncate text-center font-mono text-xs font-semibold text-slate-100">
                      {formatName(entry.name)}
                    </span>
                    <span className="flex flex-wrap justify-center gap-1">
                      {entry.types.map((type) => (
                        <TypeBadge key={type} type={type} />
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
