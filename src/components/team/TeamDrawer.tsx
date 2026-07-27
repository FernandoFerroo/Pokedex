"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  Crown,
  Plus,
  Search,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  X,
} from "lucide-react";
import { BuildEditor } from "./BuildEditor";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { useI18n, useT } from "@/lib/i18n/client";
import {
  artworkUrl,
  formatDexNumber,
  formatName,
  typeAura,
  typeLabel,
} from "@/lib/pokemon-meta";
import { analyzeTeam, PRESSURE_THRESHOLD } from "@/lib/team-analysis";
import { cn } from "@/lib/utils";
import {
  DEFAULT_LEVEL,
  type CoachReport,
  type CoachResponse,
  type TeamMember,
  type TeamSuggestResponse,
} from "@/types/team";
import { TEAM_SIZE, useTeam } from "./TeamProvider";
import type { CSSProperties } from "react";

/** Slim index entry served by /api/team-index. */
type SearchEntry = TeamMember;

/* ------------------------------------------------------------------ */
/* Species index: fetched once per session, shared by search + picker. */
/* ------------------------------------------------------------------ */

let indexCache: SearchEntry[] | null = null;
let indexPromise: Promise<SearchEntry[]> | null = null;

export function loadTeamIndex(): Promise<SearchEntry[]> {
  if (indexCache) return Promise.resolve(indexCache);
  indexPromise ??= fetch("/api/team-index")
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((data: { entries: SearchEntry[] }) => (indexCache = data.entries))
    .catch((err) => {
      indexPromise = null; // Allow a retry on the next mount.
      throw err;
    });
  return indexPromise;
}

export function useTeamIndex() {
  const [entries, setEntries] = useState<SearchEntry[] | null>(indexCache);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (entries) return;
    let alive = true;
    loadTeamIndex()
      .then((e) => alive && setEntries(e))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [entries]);
  return { entries, failed };
}

/** Loose species matcher shared with the AI routes: lowercase, no accents. */
function normalizeSpecies(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

/** startsWith matches first, then contains; empty query returns everything. */
export function filterEntries(
  entries: SearchEntry[],
  query: string,
): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  const starts = entries.filter((e) => e.name.startsWith(q));
  const contains = entries.filter(
    (e) => !e.name.startsWith(q) && e.name.includes(q),
  );
  return [...starts, ...contains];
}

/** Row-style result button shared by the picker grid and the search list. */
export function EntryButton({
  entry,
  onAdd,
  inTeam,
  isFull,
}: {
  entry: SearchEntry;
  onAdd: (entry: SearchEntry) => void;
  inTeam: boolean;
  isFull: boolean;
}) {
  const { lang, dict } = useI18n();
  const t = dict.team;
  const disabled = inTeam || isFull;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAdd(entry)}
      title={
        inTeam
          ? t.alreadyInTeam
          : isFull
            ? t.teamFull
            : t.addName(formatName(entry.name))
      }
      style={{ "--aura": typeAura(entry.types[0]) } as CSSProperties}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border border-slate-700/70 bg-black/40 p-2 text-left transition max-sm:gap-1 max-sm:p-1",
        disabled
          ? "opacity-45"
          : "hover:border-[color-mix(in_srgb,var(--aura)_55%,transparent)] hover:bg-hud-1 hover:shadow-[0_0_16px_-6px_var(--aura)]",
      )}
    >
      <span className="relative h-12 w-12 shrink-0 max-sm:h-7 max-sm:w-7">
        <Image
          src={artworkUrl(entry.id)}
          alt=""
          fill
          sizes="48px"
          className="object-contain"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-sm font-semibold text-slate-100 max-sm:text-[9px]">
          {formatName(entry.name)}
        </span>
        <span className="block truncate font-mono text-xs text-slate-400 max-sm:text-[8px]">
          {entry.types.map((type) => typeLabel(type, lang)).join(" / ")}
        </span>
      </span>
      <span
        aria-hidden
        className={cn("shrink-0", inTeam ? "text-emerald-400" : "text-slate-500")}
      >
        {inTeam ? "✓" : <Plus size={18} className="max-sm:h-3 max-sm:w-3" />}
      </span>
    </button>
  );
}

/**
 * Full-species picker opened from an empty slot's «+»: search box plus the
 * whole scrollable index, so any Pokémon can be chosen without leaving the
 * drawer. Adding closes it.
 */
function TeamPicker({ slot, onClose }: { slot: number; onClose: () => void }) {
  const { add, has, isFull, current } = useTeam();
  const { entries, failed } = useTeamIndex();
  const t = useT().team;
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useScrollLock();
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

  const pick = (entry: SearchEntry) => {
    add(entry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t.closePicker}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.pickerDialogAria(slot + 1)}
        className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-700/70 bg-hud-3 shadow-[0_0_48px_rgba(0,0,0,0.8)] sm:rounded-2xl"
      >
        <div className="flex items-center gap-3 border-b border-slate-700/60 px-5 py-3.5">
          <Search size={18} className="text-emerald-300" />
          <h3 className="font-display text-base font-bold tracking-wide text-slate-100">
            {t.pickerTitle}
            <span className="ml-2 font-mono text-xs font-normal text-slate-500">
              {t.pickerSlot(slot + 1)}
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closePicker}
            className="ml-auto rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-slate-700/60 px-5 py-3">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.pickerPlaceholder}
            aria-label={t.pickerFilterAria}
            className="h-11 w-full rounded-lg border border-slate-700/80 bg-hud-1/90 px-4 font-mono text-sm text-slate-200 outline-none transition focus:border-emerald-400/70 focus:shadow-[0_0_16px_-2px_rgba(16,185,129,0.55)]"
          />
        </div>

        <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-5 py-4">
          {/* The species on screen right now gets a fast lane at the top. */}
          {current && !query && (
            <div className="mb-3 border-b border-slate-800 pb-3">
              <p className="mb-1.5 font-mono text-xs tracking-widest text-emerald-400/90 uppercase">
                {t.onScreenNow}
              </p>
              <EntryButton
                entry={current}
                onAdd={pick}
                inTeam={has(current.id)}
                isFull={isFull}
              />
            </div>
          )}
          {failed && (
            <p className="font-mono text-sm text-red-400">
              {t.indexErrorRetryClose}
            </p>
          )}
          {!entries && !failed && (
            <p className="font-mono text-sm text-slate-500 max-sm:text-[9px]">
              {t.loadingSpecies}
            </p>
          )}
          {entries && results.length === 0 && (
            <p className="font-mono text-sm text-slate-500 max-sm:text-[9px]">
              {t.noResultsEnglishNames(query.trim())}
            </p>
          )}
          <ul className="grid grid-cols-3 gap-2 max-sm:gap-1">
            {results.map((entry) => (
              <li key={entry.id}>
                <EntryButton
                  entry={entry}
                  onAdd={pick}
                  inTeam={has(entry.id)}
                  isFull={isFull}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** One of the 6 roster slots: a member card, or a «+» that opens the picker. */
function TeamSlot({
  index,
  onOpenPicker,
  onOpenBuild,
}: {
  index: number;
  onOpenPicker: (slot: number) => void;
  /** Opens the «Configuración de Combate» editor for this slot. */
  onOpenBuild: (slot: number) => void;
}) {
  const { team, remove, setLevel } = useTeam();
  const t = useT().team;
  const member = team[index];

  if (!member) {
    return (
      <button
        type="button"
        onClick={() => onOpenPicker(index)}
        aria-label={t.pickerDialogAria(index + 1)}
        title={t.choosePokemon}
        className="flex aspect-[5/6] flex-col items-center max-sm:aspect-[2/5] justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-400/25 bg-black/30 text-slate-500 transition hover:border-emerald-400/60 hover:bg-emerald-400/10 hover:text-emerald-300 hover:shadow-[0_0_24px_-2px_rgba(16,185,129,0.8)] max-sm:gap-0.5 max-sm:rounded-md"
      >
        <Plus size={34} className="max-sm:h-4 max-sm:w-4" />
        <span className="font-mono text-xs tracking-wider uppercase max-sm:text-[7px] max-sm:tracking-normal">
          {t.choose}
        </span>
        <span className="font-pixel text-[10px] text-slate-600 max-sm:text-[6px]">
          {index + 1}
        </span>
      </button>
    );
  }

  return (
    <div
      style={{ "--aura": typeAura(member.types[0]) } as CSSProperties}
      className="group relative flex aspect-[5/6] flex-col items-center max-sm:aspect-[2/5] gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--aura)_45%,transparent)] bg-gradient-to-b from-hud-1 to-hud-3 p-3 shadow-[0_0_22px_-6px_var(--aura)] max-sm:gap-0.5 max-sm:rounded-md max-sm:p-1"
    >
      <button
        type="button"
        onClick={() => remove(member.id)}
        aria-label={t.removeNameFromTeam(formatName(member.name))}
        className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-red-500/60 bg-hud-1 text-red-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20 focus-visible:opacity-100 max-sm:-top-1 max-sm:-right-1 max-sm:h-4 max-sm:w-4 max-sm:opacity-100"
      >
        <X size={15} className="max-sm:h-2.5 max-sm:w-2.5" />
      </button>
      <p className="font-pixel text-[10px] text-slate-500 max-sm:text-[6px]">
        {formatDexNumber(member.id)}
      </p>
      {/* Clicking the Pokémon opens its combat build (ability + 4 moves). */}
      <button
        type="button"
        onClick={() => onOpenBuild(index)}
        aria-label={t.buildChooseForAria(formatName(member.name))}
        title={t.buildChooseTitle}
        className="relative min-h-0 w-full flex-1 transition hover:scale-105"
      >
        <Image
          src={artworkUrl(member.id)}
          alt={formatName(member.name)}
          fill
          sizes="160px"
          className="object-contain drop-shadow-[0_0_10px_var(--aura)]"
        />
      </button>
      <Link
        href={`/pokemon/${member.name}`}
        title={t.viewEntryTitle(formatName(member.name))}
        className="w-full truncate text-center font-mono text-sm font-semibold tracking-wide text-slate-100 transition hover:text-emerald-300 max-sm:text-[8px] max-sm:tracking-normal"
      >
        {formatName(member.name)}
      </Link>
      <div className="flex w-full flex-wrap justify-center gap-1 max-sm:gap-0.5">
        {member.types.map((type) => (
          <TypeBadge key={type} type={type} compactOnMobile />
        ))}
      </div>
      {/* Nivel de combate. */}
      <label className="flex items-center gap-1 font-mono text-[11px] tracking-wider text-slate-400 uppercase max-sm:gap-0.5 max-sm:text-[7px] max-sm:tracking-normal">
        {t.levelAbbr}
        <input
          type="number"
          min={1}
          max={100}
          value={member.level ?? DEFAULT_LEVEL}
          onChange={(e) => {
            const value = e.target.valueAsNumber;
            if (!Number.isNaN(value)) setLevel(member.id, value);
          }}
          aria-label={t.levelOfAria(formatName(member.name))}
          className="h-6 w-12 rounded border border-slate-700/80 bg-black/40 px-1 text-center font-mono text-xs text-slate-100 outline-none transition focus:border-[var(--aura)] max-sm:h-5 max-sm:w-8 max-sm:px-0 max-sm:[appearance:textfield] max-sm:[&::-webkit-inner-spin-button]:appearance-none"
        />
      </label>
      {/* Acceso a la build vestido como función premium: chip de jade macizo
          con corona, sello PRO y el barrido de luz del banner MI EQUIPO.
          Verde literal (no tokens) para que brille igual en el tema claro. */}
      <button
        type="button"
        onClick={() => onOpenBuild(index)}
        aria-label={t.buildConfigureAria(formatName(member.name))}
        title={member.build ? t.buildCustomTitle : t.buildChooseTitle}
        className={cn(
          // Los seis huecos en fila dejan ~52px por chapa en el móvil, así que
          // ahí pierde el espaciado, el margen lateral y la corona: lo que
          // queda es la etiqueta, que es lo que dice para qué sirve.
          "team-sweep relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-md border px-1 py-1.5 font-mono text-[11px] font-bold uppercase transition max-sm:gap-0.5 max-sm:rounded max-sm:px-0 max-sm:py-0.5 max-sm:text-[7px] sm:px-2 sm:tracking-wider",
          member.build
            ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-300 shadow-[inset_0_0_14px_-8px_rgba(16,185,129,0.8)] hover:bg-emerald-400/25 hover:shadow-[0_0_16px_-4px_rgba(16,185,129,0.7)]"
            : "border-emerald-300/80 bg-gradient-to-b from-[#6ee7b7] to-[#059669] text-[#03150f] shadow-[0_0_16px_-4px_rgba(16,185,129,0.7)] hover:from-[#a7f3d0] hover:to-[#34d399] hover:shadow-[0_0_22px_-2px_rgba(16,185,129,0.9)]",
        )}
      >
        <Crown size={13} className="shrink-0 max-sm:hidden" />
        <span className="truncate">
          {member.build ? t.buildEditHint : t.buildChooseHint}
        </span>
        {member.build ? (
          <span aria-hidden className="shrink-0">
            ✓
          </span>
        ) : (
          <span
            aria-hidden
            className="shrink-0 rounded-sm border border-[#03150f]/40 bg-[#03150f]/15 px-1 text-[9px] font-bold tracking-[0.15em] max-sm:hidden"
          >
            PRO
          </span>
        )}
      </button>
    </div>
  );
}

/**
 * Search picker section: same index, inline under the slots, for people who
 * prefer typing to clicking a slot.
 */
function TeamSearch() {
  const { add, has, isFull } = useTeam();
  const { entries, failed } = useTeamIndex();
  const t = useT().team;
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!entries || query.trim().length < 2) return [];
    return filterEntries(entries, query).slice(0, 12);
  }, [entries, query]);

  return (
    <div>
      <label className="relative block">
        <Search
          size={18}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchAria}
          className="h-12 w-full rounded-lg border border-slate-700/80 bg-hud-1/90 pr-4 pl-11 font-mono text-sm text-slate-200 outline-none transition focus:border-emerald-400/70 focus:shadow-[0_0_16px_-2px_rgba(16,185,129,0.55)]"
        />
      </label>

      {failed && (
        <p className="mt-2 font-mono text-xs text-red-400">
          {t.indexErrorRetryReload}
        </p>
      )}
      {query.trim().length >= 2 && entries && results.length === 0 && (
        <p className="mt-2 font-mono text-xs text-slate-500">
          {t.noResultsEnglishNames(query.trim())}
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-3 grid grid-cols-4 gap-2 max-sm:gap-1">
          {results.map((entry) => (
            <li key={entry.id}>
              <EntryButton
                entry={entry}
                onAdd={add}
                inTeam={has(entry.id)}
                isFull={isFull}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Red/emerald/amber chip used across the three analysis lists. */
function AnalysisChip({
  tone,
  children,
}: {
  tone: "danger" | "good" | "warn";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-2 py-1 font-mono text-sm",
        tone === "danger" && "border-red-500/50 bg-red-500/10 text-red-300",
        tone === "good" &&
          "border-emerald-400/50 bg-emerald-400/10 text-emerald-300",
        tone === "warn" && "border-amber-400/50 bg-amber-400/10 text-amber-300",
      )}
    >
      {children}
    </span>
  );
}

type Substitution = CoachReport["sustituciones"][number];
type SubstitutionStatus = "ready" | "applied" | "unavailable";

function CoachReportView({
  report,
  resolveSub,
  onApply,
}: {
  report: CoachReport;
  /** Whether each suggested swap can be applied against the current roster. */
  resolveSub: (sub: Substitution) => SubstitutionStatus;
  onApply: (sub: Substitution) => void;
}) {
  const t = useT().team;
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-cyan-400/30 bg-cyan-400/[0.04] p-4">
      <p className="font-mono text-xs tracking-[0.2em] text-cyan-300 uppercase">
        {t.coachReportTitle}
      </p>
      <p className="text-base leading-relaxed text-slate-100">
        {report.resumen}
      </p>
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-slate-300 marker:font-mono marker:text-cyan-400">
        {report.consejos.map((tip, i) => (
          <li key={i}>{tip}</li>
        ))}
      </ol>
      {report.sustituciones.length > 0 && (
        <div className="border-t border-cyan-400/20 pt-3">
          <p className="mb-2 font-mono text-xs tracking-widest text-emerald-300 uppercase">
            {t.suggestedSwaps}
          </p>
          <ul className="flex flex-col gap-2 text-sm text-slate-300">
            {report.sustituciones.map((s, i) => {
              const status = resolveSub(s);
              return (
                <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>
                    <span className="text-red-300">{formatName(s.sale)}</span>
                    <span aria-hidden className="mx-1.5 text-slate-500">
                      →
                    </span>
                    <span className="text-emerald-300">
                      {formatName(s.entra)}
                    </span>
                    <span className="text-slate-400"> · {s.motivo}</span>
                  </span>
                  {status === "applied" ? (
                    <span className="font-mono text-xs text-emerald-400">
                      {t.swapApplied}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={status === "unavailable"}
                      onClick={() => onApply(s)}
                      title={
                        status === "unavailable"
                          ? t.swapUnavailable
                          : t.swapTitle(formatName(s.sale), formatName(s.entra))
                      }
                      className="rounded border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 font-mono text-xs text-emerald-300 transition enabled:hover:bg-emerald-400/20 disabled:opacity-40"
                    >
                      {t.apply}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Bottom drawer with the 6-slot team, a per-slot species picker, a search
 * box, the live type coverage matrix and the AI coach. A near-fullscreen
 * bottom sheet with no collapsed UI of its own: open/close state lives in
 * TeamProvider, and the TeamCta banner (home) and header chip summon it.
 */
export function TeamDrawer() {
  const {
    team,
    clear,
    replace,
    swap,
    has,
    drawerOpen: open,
    setDrawerOpen,
  } = useTeam();
  const { entries } = useTeamIndex();
  const { lang, dict } = useI18n();
  const t = dict.team;
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  /** Slot whose «Configuración de Combate» editor is open, if any. */
  const [buildSlot, setBuildSlot] = useState<number | null>(null);
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [report, setReport] = useState<CoachReport | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI generator for empty rosters: describe the team, get 6 members back.
  const [wish, setWish] = useState("");
  const [genPending, setGenPending] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genNote, setGenNote] = useState<{ text: string; roster: string } | null>(
    null,
  );

  // Abierto, el cajón cubre la página: la rueda y el arrastre se quedan
  // dentro en vez de mover la portada por debajo.
  useScrollLock(open);

  const analysis = useMemo(() => analyzeTeam(team), [team]);
  /** Cache key: the report belongs to this exact roster. */
  const rosterKey = team.map((m) => m.id).join(",");

  const askCoach = async () => {
    if (pending || team.length === 0) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team }),
      });
      const data = (await res.json().catch(() => null)) as
        | (CoachResponse & { error?: string })
        | null;
      if (!res.ok || !data?.report) {
        setError(data?.error ?? t.coachNoReply);
        return;
      }
      setReport(data.report);
      setReportFor(rosterKey);
    } catch {
      setError(t.coachOffline);
    } finally {
      setPending(false);
    }
  };

  const generateTeam = async () => {
    if (genPending || !wish.trim()) return;
    setGenPending(true);
    setGenError(null);
    try {
      const res = await fetch("/api/team-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: wish, team }),
      });
      const data = (await res.json().catch(() => null)) as
        | (TeamSuggestResponse & { error?: string })
        | null;
      if (!res.ok || !Array.isArray(data?.team) || data.team.length === 0) {
        setGenError(data?.error ?? t.coachNoReply);
        return;
      }
      replace(data.team);
      setGenNote({
        text: data.motivo,
        roster: data.team.map((m) => m.id).join(","),
      });
      setWish("");
    } catch {
      setGenError(t.coachOffline);
    } finally {
      setGenPending(false);
    }
  };

  /** Maps a coach substitution to the real roster/index entries, if possible. */
  const findSubTargets = (sub: Substitution) => {
    const outMember = team.find(
      (m) => normalizeSpecies(m.name) === normalizeSpecies(sub.sale),
    );
    const inEntry = entries?.find(
      (e) => normalizeSpecies(e.name) === normalizeSpecies(sub.entra),
    );
    return { outMember, inEntry };
  };

  const resolveSub = (sub: Substitution): SubstitutionStatus => {
    const { outMember, inEntry } = findSubTargets(sub);
    if (inEntry && has(inEntry.id)) return "applied";
    if (!outMember || !inEntry) return "unavailable";
    return "ready";
  };

  const applySub = (sub: Substitution) => {
    const { outMember, inEntry } = findSubTargets(sub);
    if (!outMember || !inEntry || has(inEntry.id)) return;
    // The newcomer inherits the slot and the level of the member it replaces.
    swap(outMember.id, { ...inEntry, level: outMember.level });
  };

  return (
    <>
      {/* Backdrop, so the sheet reads as the front-most layer. */}
      {open && (
        <button
          type="button"
          aria-label={t.closeTeamAria}
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px]"
        />
      )}

      {/* Bottom sheet. */}
      <section
        aria-label={t.drawerAria}
        // Closed, the sheet is only translated off-screen — it stays in the
        // DOM (so the slide animates) and, until now, in the Tab order: a
        // keyboard user tabbing past the footer fell into ~30 invisible
        // controls. `inert` takes the whole subtree out of focus, hit-testing
        // and the accessibility tree while it is hidden.
        inert={!open}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 mx-auto flex max-h-[88vh] w-full max-w-7xl flex-col overflow-hidden rounded-t-2xl border-x border-t border-emerald-400/40 bg-hud-3/95 shadow-[0_-12px_48px_rgba(0,0,0,0.7),0_-2px_32px_-8px_rgba(16,185,129,0.35)] backdrop-blur transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full",
        )}
      >
        {/* Jade hairline crowning the sheet: the premium seal of the section. */}
        <div
          aria-hidden
          className="h-[3px] w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
        />
        <div className="flex items-center gap-2 border-b border-emerald-400/20 bg-gradient-to-b from-emerald-400/[0.06] to-transparent px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
          <Crown size={22} className="shrink-0 text-emerald-300" />
          <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-wide whitespace-nowrap sm:gap-2.5">
            <span className="team-text">{t.myTeam}</span>
            <span className="font-mono text-sm font-normal text-emerald-300">
              {team.length}/{TEAM_SIZE}
            </span>
            <span className="rounded-sm border border-emerald-400/60 bg-emerald-400/15 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] text-emerald-300 max-sm:hidden">
              PRO
            </span>
          </h2>
          {/* Mismo botón «Vaciar» que el banner de la portada: desde el móvil
              esta es la única forma de vaciar el equipo, porque allí el del
              banner se oculta. */}
          {team.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clear();
                setReport(null);
                setReportFor(null);
                setGenNote(null);
              }}
              aria-label={t.clearAria}
              // Icon-only on phones: the title, the counter and the close
              // chevron already fill a 375px header row. `aria-label` keeps
              // it announced either way.
              className="inline-flex shrink-0 items-center gap-2 rounded-md border border-emerald-400/40 bg-black/30 px-2.5 py-2 font-mono text-sm font-bold tracking-wider text-emerald-200/80 uppercase transition hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-400 sm:px-3"
            >
              <Trash2 size={15} />
              <span className="max-sm:hidden">{t.clear}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label={t.closeTeamAria}
            className="ml-auto shrink-0 rounded-md p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <ChevronDown size={22} />
          </button>
        </div>

        <div className="flex flex-col gap-6 overscroll-contain overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {/* Slots */}
          {/* Los seis huecos en una sola fila, igual que en escritorio: el
              equipo se lee como la caja de combate del juego. */}
          <div className="grid grid-cols-6 gap-3 max-sm:gap-1 sm:gap-4">
            {Array.from({ length: TEAM_SIZE }, (_, i) => (
              <TeamSlot
                key={team[i]?.id ?? `empty-${i}`}
                index={i}
                onOpenPicker={setPickerSlot}
                onOpenBuild={setBuildSlot}
              />
            ))}
          </div>

          {/* Search picker */}
          <TeamSearch />

          {/* Coverage analysis */}
          {team.length > 0 && (
            <div className="grid grid-cols-3 gap-5 max-sm:gap-2">
              <div>
                <h3 className="mb-2.5 flex items-center gap-1.5 font-mono text-sm tracking-widest text-red-400 uppercase max-sm:mb-1 max-sm:gap-1 max-sm:text-[9px] max-sm:tracking-normal">
                  <Swords size={15} className="shrink-0 max-sm:h-2.5 max-sm:w-2.5" /> {t.criticalWeaknesses}
                </h3>
                <div className="flex flex-wrap gap-2 max-sm:gap-1">
                  {analysis.criticalWeaknesses.length === 0 ? (
                    <p className="font-mono text-sm text-slate-500 max-sm:text-[9px]">
                      {t.noCriticalWeaknesses(PRESSURE_THRESHOLD)}
                    </p>
                  ) : (
                    analysis.criticalWeaknesses.map((p) => (
                      <AnalysisChip key={p.type} tone="danger">
                        ⚠️ {typeLabel(p.type, lang)} ·{" "}
                        {t.memberCount(p.weakCount, team.length)}
                      </AnalysisChip>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="mb-2.5 flex items-center gap-1.5 font-mono text-sm tracking-widest text-emerald-400 uppercase max-sm:mb-1 max-sm:gap-1 max-sm:text-[9px] max-sm:tracking-normal">
                  <Shield size={15} className="shrink-0 max-sm:h-2.5 max-sm:w-2.5" /> {t.strongResistances}
                </h3>
                <div className="flex flex-wrap gap-2 max-sm:gap-1">
                  {analysis.strongResistances.length === 0 ? (
                    <p className="font-mono text-sm text-slate-500 max-sm:text-[9px]">
                      {t.noStrongResistances(PRESSURE_THRESHOLD)}
                    </p>
                  ) : (
                    analysis.strongResistances.map((p) => (
                      <AnalysisChip key={p.type} tone="good">
                        {typeLabel(p.type, lang)} ·{" "}
                        {t.memberCount(p.resistCount, team.length)}
                      </AnalysisChip>
                    ))
                  )}
                </div>
              </div>
              <div>
                {/* Amber, like its chips: this column is the "gap" side of the
                    red / green / amber analysis, not the team livery. */}
                <h3 className="mb-2.5 font-mono text-sm tracking-widest text-amber-400 uppercase max-sm:mb-1 max-sm:text-[9px] max-sm:tracking-normal">
                  {t.missingCoverage}
                </h3>
                <div className="flex flex-wrap gap-2 max-sm:gap-1">
                  {analysis.missingCoverage.length === 0 ? (
                    <p className="font-mono text-sm text-slate-500 max-sm:text-[9px]">
                      {t.fullCoverage}
                    </p>
                  ) : (
                    analysis.missingCoverage.map((type) => (
                      <AnalysisChip key={type} tone="warn">
                        {typeLabel(type, lang)}
                      </AnalysisChip>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Coach Bot: un solo panel con las dos acciones de IA. «Analizar»
              devuelve el informe; «Solicitar actualización» reescribe el
              roster (niveles, habilidades y movimientos incluidos) a partir
              del mensaje. */}
          <div className="flex flex-col gap-3 rounded-lg border border-cyan-400/30 bg-cyan-400/[0.04] p-4">
            <p className="flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-cyan-300 uppercase">
              <Sparkles size={15} />{" "}
              {team.length === 0 ? t.aiTitleEmpty : t.aiTitleModify}
            </p>
            <p className="text-sm leading-relaxed text-slate-300">
              {team.length === 0 ? t.aiBodyEmpty : t.aiBodyModify}
            </p>
            <textarea
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={
                team.length === 0 ? t.aiPlaceholderEmpty : t.aiPlaceholderModify
              }
              aria-label={t.aiWishAria}
              className="w-full resize-none rounded-lg border border-slate-700/80 bg-hud-1/90 px-4 py-3 font-mono text-sm text-slate-200 outline-none transition focus:border-cyan-400/70 focus:shadow-[0_0_16px_-2px_rgba(34,211,238,0.55)]"
            />
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={generateTeam}
                disabled={genPending || !wish.trim()}
                className="inline-flex h-12 items-center justify-center gap-2.5 rounded-md border border-cyan-400/50 bg-cyan-400/10 px-6 font-mono text-base tracking-wider text-cyan-300 uppercase transition enabled:hover:bg-cyan-400/20 enabled:hover:shadow-[0_0_20px_-2px_rgba(34,211,238,0.7)] disabled:opacity-50"
              >
                <Sparkles size={19} className={cn(genPending && "animate-pulse")} />
                {genPending
                  ? t.aiBuilding
                  : team.length === 0
                    ? t.aiGenerate
                    : t.aiRequestUpdate}
              </button>
              {team.length > 0 && (
                <button
                  type="button"
                  onClick={askCoach}
                  disabled={pending}
                  className="inline-flex h-12 items-center justify-center gap-2.5 rounded-md border border-cyan-400/50 bg-cyan-400/10 px-6 font-mono text-base tracking-wider text-cyan-300 uppercase transition enabled:hover:bg-cyan-400/20 enabled:hover:shadow-[0_0_20px_-2px_rgba(34,211,238,0.7)] disabled:opacity-50"
                >
                  <Bot size={19} className={cn(pending && "animate-pulse")} />
                  {pending
                    ? t.analyzing
                    : reportFor === rosterKey
                      ? t.analyzeAgain
                      : t.analyzeWithAi}
                </button>
              )}
            </div>

            {genError && (
              <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-400">
                {genError}
              </p>
            )}
            {error && (
              <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-400">
                {error}
              </p>
            )}

            {/* Rationale of the last AI-generated roster, while it's intact. */}
            {genNote && genNote.roster === rosterKey && team.length > 0 && (
              <div className="border-t border-cyan-400/20 pt-3">
                <p className="mb-1.5 font-mono text-xs tracking-[0.2em] text-cyan-300 uppercase">
                  {t.generatedByCoach}
                </p>
                <p className="text-sm leading-relaxed text-slate-200">
                  {genNote.text}
                </p>
              </div>
            )}

            {report && (
              <>
                {reportFor !== rosterKey && (
                  // Stays amber: it warns the report no longer matches the team.
                  <p className="font-mono text-sm text-amber-400/90">
                    {t.staleReport}
                  </p>
                )}
                <CoachReportView
                  report={report}
                  resolveSub={resolveSub}
                  onApply={applySub}
                />
              </>
            )}
          </div>

          {team.length === 0 && (
            <p className="pb-2 text-center font-mono text-base text-slate-500">
              {t.emptyTeamHint}
            </p>
          )}
        </div>
      </section>

      {pickerSlot !== null && (
        <TeamPicker slot={pickerSlot} onClose={() => setPickerSlot(null)} />
      )}

      {buildSlot !== null && team[buildSlot] && (
        <BuildEditor
          member={team[buildSlot]}
          onClose={() => setBuildSlot(null)}
        />
      )}
    </>
  );
}
