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
  Swords,
  X,
} from "lucide-react";
import { TypeBadge } from "@/components/ui/TypeBadge";
import {
  artworkUrl,
  formatDexNumber,
  formatName,
  typeAura,
  typeLabel,
} from "@/lib/pokemon-meta";
import { analyzeTeam, PRESSURE_THRESHOLD } from "@/lib/team-analysis";
import { cn } from "@/lib/utils";
import type { CoachReport, CoachResponse, TeamMember } from "@/types/team";
import { TEAM_SIZE, useTeam } from "./TeamProvider";
import type { CSSProperties } from "react";

/** Slim index entry served by /api/team-index. */
type SearchEntry = TeamMember;

/* ------------------------------------------------------------------ */
/* Species index: fetched once per session, shared by search + picker. */
/* ------------------------------------------------------------------ */

let indexCache: SearchEntry[] | null = null;
let indexPromise: Promise<SearchEntry[]> | null = null;

function loadTeamIndex(): Promise<SearchEntry[]> {
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

function useTeamIndex() {
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

/** startsWith matches first, then contains; empty query returns everything. */
function filterEntries(entries: SearchEntry[], query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  const starts = entries.filter((e) => e.name.startsWith(q));
  const contains = entries.filter(
    (e) => !e.name.startsWith(q) && e.name.includes(q),
  );
  return [...starts, ...contains];
}

/** Row-style result button shared by the picker grid and the search list. */
function EntryButton({
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
  const disabled = inTeam || isFull;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAdd(entry)}
      title={
        inTeam
          ? "Ya está en el equipo"
          : isFull
            ? "Equipo completo (6/6)"
            : `Añadir a ${formatName(entry.name)}`
      }
      style={{ "--aura": typeAura(entry.types[0]) } as CSSProperties}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border border-slate-700/70 bg-black/40 p-2 text-left transition",
        disabled
          ? "opacity-45"
          : "hover:border-[color-mix(in_srgb,var(--aura)_55%,transparent)] hover:bg-[#0a101d] hover:shadow-[0_0_16px_-6px_var(--aura)]",
      )}
    >
      <span className="relative h-12 w-12 shrink-0">
        <Image
          src={artworkUrl(entry.id)}
          alt=""
          fill
          sizes="48px"
          className="object-contain"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-sm font-semibold text-slate-100">
          {formatName(entry.name)}
        </span>
        <span className="block truncate font-mono text-xs text-slate-400">
          {entry.types.map(typeLabel).join(" / ")}
        </span>
      </span>
      <span
        aria-hidden
        className={cn("shrink-0", inTeam ? "text-emerald-400" : "text-slate-500")}
      >
        {inTeam ? "✓" : <Plus size={18} />}
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

  const pick = (entry: SearchEntry) => {
    add(entry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cerrar selector"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-label={`Elegir Pokémon para la ranura ${slot + 1}`}
        className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-700/70 bg-[#050810] shadow-[0_0_48px_rgba(0,0,0,0.8)] sm:rounded-2xl"
      >
        <div className="flex items-center gap-3 border-b border-slate-700/60 px-5 py-3.5">
          <Search size={18} className="text-amber-300" />
          <h3 className="font-display text-base font-bold tracking-wide text-slate-100">
            ELIGE UN POKÉMON
            <span className="ml-2 font-mono text-xs font-normal text-slate-500">
              Ranura {slot + 1}
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector"
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
            placeholder="Filtra por nombre (ej. pikachu)…"
            aria-label="Filtrar Pokémon por nombre"
            className="h-11 w-full rounded-lg border border-slate-700/80 bg-[#0a101d]/90 px-4 font-mono text-sm text-slate-200 outline-none transition focus:border-amber-400/70 focus:shadow-[0_0_16px_-2px_rgba(251,191,36,0.55)]"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* The species on screen right now gets a fast lane at the top. */}
          {current && !query && (
            <div className="mb-3 border-b border-slate-800 pb-3">
              <p className="mb-1.5 font-mono text-xs tracking-widest text-emerald-400/90 uppercase">
                En pantalla ahora
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
              No se pudo cargar el índice de especies. Cierra y vuelve a
              intentarlo.
            </p>
          )}
          {!entries && !failed && (
            <p className="font-mono text-sm text-slate-500">
              Cargando especies…
            </p>
          )}
          {entries && results.length === 0 && (
            <p className="font-mono text-sm text-slate-500">
              Sin resultados para «{query.trim()}» (los nombres van en inglés).
            </p>
          )}
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
}: {
  index: number;
  onOpenPicker: (slot: number) => void;
}) {
  const { team, remove } = useTeam();
  const member = team[index];

  if (!member) {
    return (
      <button
        type="button"
        onClick={() => onOpenPicker(index)}
        aria-label={`Elegir Pokémon para la ranura ${index + 1}`}
        title="Elegir Pokémon"
        className="flex aspect-[5/6] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-400/25 bg-black/30 text-slate-500 transition hover:border-amber-400/60 hover:bg-amber-400/10 hover:text-amber-300 hover:shadow-[0_0_24px_-2px_rgba(251,191,36,0.8)]"
      >
        <Plus size={34} />
        <span className="font-mono text-xs tracking-wider uppercase">
          Elegir
        </span>
        <span className="font-pixel text-[10px] text-slate-600">
          {index + 1}
        </span>
      </button>
    );
  }

  return (
    <div
      style={{ "--aura": typeAura(member.types[0]) } as CSSProperties}
      className="group relative flex aspect-[5/6] flex-col items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--aura)_45%,transparent)] bg-gradient-to-b from-[#0a101d] to-[#050810] p-3 shadow-[0_0_22px_-6px_var(--aura)]"
    >
      <button
        type="button"
        onClick={() => remove(member.id)}
        aria-label={`Quitar a ${formatName(member.name)} del equipo`}
        className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-red-500/60 bg-[#0a101d] text-red-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20 focus-visible:opacity-100 max-sm:opacity-100"
      >
        <X size={15} />
      </button>
      <p className="font-pixel text-[10px] text-slate-500">
        {formatDexNumber(member.id)}
      </p>
      <Link
        href={`/pokemon/${member.name}`}
        className="relative min-h-0 w-full flex-1"
      >
        <Image
          src={artworkUrl(member.id)}
          alt={formatName(member.name)}
          fill
          sizes="160px"
          className="object-contain drop-shadow-[0_0_10px_var(--aura)]"
        />
      </Link>
      <p className="w-full truncate text-center font-mono text-sm font-semibold tracking-wide text-slate-100">
        {formatName(member.name)}
      </p>
      <div className="flex flex-wrap justify-center gap-1">
        {member.types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>
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
          placeholder="Busca cualquier Pokémon para ficharlo (ej. pikachu)…"
          aria-label="Buscar Pokémon para añadir al equipo"
          className="h-12 w-full rounded-lg border border-slate-700/80 bg-[#0a101d]/90 pr-4 pl-11 font-mono text-sm text-slate-200 outline-none transition focus:border-amber-400/70 focus:shadow-[0_0_16px_-2px_rgba(251,191,36,0.55)]"
        />
      </label>

      {failed && (
        <p className="mt-2 font-mono text-xs text-red-400">
          No se pudo cargar el índice de especies. Recarga e inténtalo de nuevo.
        </p>
      )}
      {query.trim().length >= 2 && entries && results.length === 0 && (
        <p className="mt-2 font-mono text-xs text-slate-500">
          Sin resultados para «{query.trim()}» (los nombres van en inglés).
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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

function CoachReportView({ report }: { report: CoachReport }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-cyan-400/30 bg-cyan-400/[0.04] p-4">
      <p className="font-mono text-xs tracking-[0.2em] text-cyan-300 uppercase">
        Informe del Coach Bot
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
          <p className="mb-2 font-mono text-xs tracking-widest text-amber-300 uppercase">
            Cambios sugeridos
          </p>
          <ul className="flex flex-col gap-2 text-sm text-slate-300">
            {report.sustituciones.map((s, i) => (
              <li key={i}>
                <span className="text-red-300">{s.sale}</span>
                <span aria-hidden className="mx-1.5 text-slate-500">
                  →
                </span>
                <span className="text-emerald-300">{s.entra}</span>
                <span className="text-slate-400"> · {s.motivo}</span>
              </li>
            ))}
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
  const { team, clear, drawerOpen: open, setDrawerOpen } = useTeam();
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [report, setReport] = useState<CoachReport | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(data?.error ?? "El Coach Bot no responde. Inténtalo de nuevo.");
        return;
      }
      setReport(data.report);
      setReportFor(rosterKey);
    } catch {
      setError("Sin conexión con el Coach Bot…");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {/* Backdrop, so the sheet reads as the front-most layer. */}
      {open && (
        <button
          type="button"
          aria-label="Cerrar el equipo"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px]"
        />
      )}

      {/* Bottom sheet. */}
      <section
        aria-label="Creador de equipos"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 mx-auto flex max-h-[88vh] w-full max-w-7xl flex-col overflow-hidden rounded-t-2xl border-x border-t border-amber-400/40 bg-[#050810]/95 shadow-[0_-12px_48px_rgba(0,0,0,0.7),0_-2px_32px_-8px_rgba(251,191,36,0.35)] backdrop-blur transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full",
        )}
      >
        {/* Gold hairline crowning the sheet: the premium seal of the section. */}
        <div
          aria-hidden
          className="h-[3px] w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent"
        />
        <div className="flex items-center gap-3 border-b border-amber-400/20 bg-gradient-to-b from-amber-400/[0.06] to-transparent px-6 py-4">
          <Crown size={22} className="text-amber-300" />
          <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-wide">
            <span className="premium-text">MI EQUIPO</span>
            <span className="font-mono text-sm font-normal text-amber-300">
              {team.length}/{TEAM_SIZE}
            </span>
            <span className="rounded-sm border border-amber-400/60 bg-amber-400/15 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] text-amber-300">
              PRO
            </span>
          </h2>
          {team.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clear();
                setReport(null);
                setReportFor(null);
              }}
              className="font-mono text-sm text-slate-500 transition hover:text-red-400"
            >
              Vaciar
            </button>
          )}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar el equipo"
            className="ml-auto rounded-md p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <ChevronDown size={22} />
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5">
          {/* Slots */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
            {Array.from({ length: TEAM_SIZE }, (_, i) => (
              <TeamSlot
                key={team[i]?.id ?? `empty-${i}`}
                index={i}
                onOpenPicker={setPickerSlot}
              />
            ))}
          </div>

          {/* Search picker */}
          <TeamSearch />

          {/* Coverage analysis */}
          {team.length > 0 && (
            <div className="grid gap-5 lg:grid-cols-3">
              <div>
                <h3 className="mb-2.5 flex items-center gap-1.5 font-mono text-sm tracking-widest text-red-400 uppercase">
                  <Swords size={15} /> Debilidades críticas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.criticalWeaknesses.length === 0 ? (
                    <p className="font-mono text-sm text-slate-500">
                      Ninguna: ningún tipo golpea a {PRESSURE_THRESHOLD}+
                      miembros.
                    </p>
                  ) : (
                    analysis.criticalWeaknesses.map((p) => (
                      <AnalysisChip key={p.type} tone="danger">
                        ⚠️ {typeLabel(p.type)} · {p.weakCount} de {team.length}
                      </AnalysisChip>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="mb-2.5 flex items-center gap-1.5 font-mono text-sm tracking-widest text-emerald-400 uppercase">
                  <Shield size={15} /> Resistencias fuertes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.strongResistances.length === 0 ? (
                    <p className="font-mono text-sm text-slate-500">
                      Aún ninguna resistencia compartida por{" "}
                      {PRESSURE_THRESHOLD}+ miembros.
                    </p>
                  ) : (
                    analysis.strongResistances.map((p) => (
                      <AnalysisChip key={p.type} tone="good">
                        {typeLabel(p.type)} · {p.resistCount} de {team.length}
                      </AnalysisChip>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="mb-2.5 font-mono text-sm tracking-widest text-amber-400 uppercase">
                  Sin cobertura ofensiva
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingCoverage.length === 0 ? (
                    <p className="font-mono text-sm text-slate-500">
                      Tu STAB golpea con eficacia a los 18 tipos.
                    </p>
                  ) : (
                    analysis.missingCoverage.map((type) => (
                      <AnalysisChip key={type} tone="warn">
                        {typeLabel(type)}
                      </AnalysisChip>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI coach */}
          {team.length > 0 && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={askCoach}
                disabled={pending}
                className="inline-flex h-12 items-center justify-center gap-2.5 self-start rounded-md border border-cyan-400/50 bg-cyan-400/10 px-6 font-mono text-base tracking-wider text-cyan-300 uppercase transition enabled:hover:bg-cyan-400/20 enabled:hover:shadow-[0_0_20px_-2px_rgba(34,211,238,0.7)] disabled:opacity-50"
              >
                <Bot size={19} className={cn(pending && "animate-pulse")} />
                {pending
                  ? "Analizando…"
                  : reportFor === rosterKey
                    ? "🤖 Volver a analizar"
                    : "🤖 Analizar con IA"}
              </button>
              {error && (
                <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-400">
                  {error}
                </p>
              )}
              {report && (
                <>
                  {reportFor !== rosterKey && (
                    <p className="font-mono text-sm text-amber-400/90">
                      El equipo cambió desde este informe: vuelve a analizar.
                    </p>
                  )}
                  <CoachReportView report={report} />
                </>
              )}
            </div>
          )}

          {team.length === 0 && (
            <p className="pb-2 text-center font-mono text-base text-slate-500">
              Pulsa «+» en una ranura para elegir un Pokémon, busca arriba, o
              ficha desde cualquier tarjeta del listado.
            </p>
          )}
        </div>
      </section>

      {pickerSlot !== null && (
        <TeamPicker slot={pickerSlot} onClose={() => setPickerSlot(null)} />
      )}
    </>
  );
}
