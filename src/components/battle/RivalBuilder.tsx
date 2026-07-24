"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Dices, Plus, Search, Swords, X } from "lucide-react";
import {
  EntryButton,
  filterEntries,
  useTeamIndex,
} from "@/components/team/TeamDrawer";
import { TEAM_SIZE } from "@/components/team/TeamProvider";
import { TypeBadge } from "@/components/ui/TypeBadge";
import {
  artworkUrl,
  formatDexNumber,
  formatName,
  typeAura,
} from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";
import {
  DEFAULT_LEVEL,
  type TeamMember,
  type TeamSuggestResponse,
} from "@/types/team";
import type { CSSProperties } from "react";

function clampLevel(level: number): number {
  return Math.min(100, Math.max(1, Math.round(level)));
}

/**
 * Selector a pantalla completa para una ranura rival: caja de búsqueda y el
 * índice completo, clonando el TeamPicker de «Mi Equipo».
 */
function RivalPicker({
  slot,
  has,
  isFull,
  onAdd,
  onClose,
}: {
  slot: number;
  has: (id: number) => boolean;
  isFull: boolean;
  onAdd: (member: TeamMember) => void;
  onClose: () => void;
}) {
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

  const pick = (entry: TeamMember) => {
    onAdd(entry);
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
        aria-label={`Elegir Pokémon rival para la ranura ${slot + 1}`}
        className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-700/70 bg-[#050810] shadow-[0_0_48px_rgba(0,0,0,0.8)] sm:rounded-2xl"
      >
        <div className="flex items-center gap-3 border-b border-slate-700/60 px-5 py-3.5">
          <Search size={18} className="text-red-400" />
          <h3 className="font-display text-base font-bold tracking-wide text-slate-100">
            ELIGE UN POKÉMON RIVAL
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
            className="h-11 w-full rounded-lg border border-slate-700/80 bg-[#0a101d]/90 px-4 font-mono text-sm text-slate-200 outline-none transition focus:border-red-500/70 focus:shadow-[0_0_16px_-2px_rgba(239,68,68,0.55)]"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
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

/** Una ranura rival: tarjeta del miembro o «+» que abre el selector. */
function RivalSlot({
  index,
  member,
  onOpenPicker,
  onRemove,
  onSetLevel,
}: {
  index: number;
  member: TeamMember | undefined;
  onOpenPicker: (slot: number) => void;
  onRemove: (id: number) => void;
  onSetLevel: (id: number, level: number) => void;
}) {
  if (!member) {
    return (
      <button
        type="button"
        onClick={() => onOpenPicker(index)}
        aria-label={`Elegir Pokémon rival para la ranura ${index + 1}`}
        title="Elegir Pokémon rival"
        className="flex aspect-[5/6] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-red-500/25 bg-black/30 text-slate-500 transition hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-300 hover:shadow-[0_0_24px_-2px_rgba(239,68,68,0.8)]"
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
        onClick={() => onRemove(member.id)}
        aria-label={`Quitar a ${formatName(member.name)} del equipo rival`}
        className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-red-500/60 bg-[#0a101d] text-red-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20 focus-visible:opacity-100 max-sm:opacity-100"
      >
        <X size={15} />
      </button>
      <p className="font-pixel text-[10px] text-slate-500">
        {formatDexNumber(member.id)}
      </p>
      <span className="relative min-h-0 w-full flex-1">
        <Image
          src={artworkUrl(member.id)}
          alt={formatName(member.name)}
          fill
          sizes="160px"
          className="object-contain drop-shadow-[0_0_10px_var(--aura)]"
        />
      </span>
      <p className="w-full truncate text-center font-mono text-sm font-semibold tracking-wide text-slate-100">
        {formatName(member.name)}
      </p>
      <div className="flex flex-wrap justify-center gap-1">
        {member.types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>
      <label className="flex items-center gap-1 font-mono text-[11px] tracking-wider text-slate-400 uppercase">
        Nv.
        <input
          type="number"
          min={1}
          max={100}
          value={member.level ?? DEFAULT_LEVEL}
          onChange={(e) => {
            const value = e.target.valueAsNumber;
            if (!Number.isNaN(value)) onSetLevel(member.id, value);
          }}
          aria-label={`Nivel de ${formatName(member.name)}`}
          className="h-6 w-12 rounded border border-slate-700/80 bg-black/40 px-1 text-center font-mono text-xs text-slate-100 outline-none transition focus:border-[var(--aura)]"
        />
      </label>
    </div>
  );
}

interface RivalBuilderProps {
  /** Arranca el combate con el equipo elegido a mano o por mensaje. */
  onFight: (members: TeamMember[]) => void;
  /** Modo aleatorio: la IA inventa rival y equipo, como siempre. */
  onRandom: () => void;
}

/**
 * Pantalla previa al combate: el equipo del RIVAL con exactamente la misma
 * interfaz que «Mi Equipo» (ranuras con selector, búsqueda, niveles y
 * generador por mensaje), más el modo aleatorio de siempre.
 */
export function RivalBuilder({ onFight, onRandom }: RivalBuilderProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const { entries, failed } = useTeamIndex();
  const [query, setQuery] = useState("");

  // Generador por mensaje, calcado del de «Mi Equipo».
  const [wish, setWish] = useState("");
  const [genPending, setGenPending] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genNote, setGenNote] = useState<string | null>(null);

  const has = (id: number) => members.some((m) => m.id === id);
  const isFull = members.length >= TEAM_SIZE;

  const add = (member: TeamMember) => {
    setMembers((prev) =>
      prev.length >= TEAM_SIZE || prev.some((m) => m.id === member.id)
        ? prev
        : [...prev, { ...member, level: member.level ?? DEFAULT_LEVEL }],
    );
  };

  const remove = (id: number) =>
    setMembers((prev) => prev.filter((m) => m.id !== id));

  const setLevel = (id: number, level: number) =>
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, level: clampLevel(level) } : m)),
    );

  const results = useMemo(() => {
    if (!entries || query.trim().length < 2) return [];
    return filterEntries(entries, query).slice(0, 12);
  }, [entries, query]);

  const generate = async () => {
    if (genPending || !wish.trim()) return;
    setGenPending(true);
    setGenError(null);
    try {
      const res = await fetch("/api/team-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: wish }),
      });
      const data = (await res.json().catch(() => null)) as
        | (TeamSuggestResponse & { error?: string })
        | null;
      if (!res.ok || !Array.isArray(data?.team) || data.team.length === 0) {
        setGenError(
          data?.error ?? "El Coach Bot no responde. Inténtalo de nuevo.",
        );
        return;
      }
      setMembers(data.team.slice(0, TEAM_SIZE));
      setGenNote(data.motivo);
      setWish("");
    } catch {
      setGenError("Sin conexión con el Coach Bot…");
    } finally {
      setGenPending(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-2xl border border-red-500/40 bg-[#050810]/95 px-6 py-5 shadow-[0_0_48px_rgba(0,0,0,0.7),0_0_32px_-8px_rgba(239,68,68,0.35)]">
      {/* Cabecera, gemela de la de «Mi Equipo» pero en rojo rival. */}
      <div className="flex flex-wrap items-center gap-3 border-b border-red-500/20 pb-4">
        <Swords size={22} className="text-red-400" />
        <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-wide">
          <span className="neon-red">EQUIPO RIVAL</span>
          <span className="font-mono text-sm font-normal text-red-300">
            {members.length}/{TEAM_SIZE}
          </span>
        </h2>
        {members.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setMembers([]);
              setGenNote(null);
            }}
            className="font-mono text-sm text-slate-500 transition hover:text-red-400"
          >
            Vaciar
          </button>
        )}
        <div className="ml-auto flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onRandom}
            title="La IA inventa un entrenador y su equipo, a tu altura"
            className="inline-flex h-11 items-center gap-2 rounded-md border border-cyan-400/50 bg-cyan-400/10 px-5 font-mono text-sm tracking-wider text-cyan-300 uppercase transition hover:bg-cyan-400/20 hover:shadow-[0_0_20px_-2px_rgba(34,211,238,0.7)]"
          >
            <Dices size={17} />
            Rival aleatorio
          </button>
          <button
            type="button"
            disabled={members.length === 0}
            onClick={() => onFight(members)}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-red-500/70 bg-red-500/15 px-6 font-display text-sm font-bold tracking-widest text-red-300 uppercase transition enabled:hover:bg-red-500/30 enabled:hover:shadow-[0_0_24px_-4px_rgba(239,68,68,0.9)] disabled:opacity-40"
          >
            <Swords size={17} />
            ¡Al combate!
          </button>
        </div>
      </div>

      {/* Ranuras */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
        {Array.from({ length: TEAM_SIZE }, (_, i) => (
          <RivalSlot
            key={members[i]?.id ?? `empty-${i}`}
            index={i}
            member={members[i]}
            onOpenPicker={setPickerSlot}
            onRemove={remove}
            onSetLevel={setLevel}
          />
        ))}
      </div>

      {/* Motivo del último equipo generado por mensaje. */}
      {genNote && members.length > 0 && (
        <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/[0.04] p-4">
          <p className="mb-1.5 font-mono text-xs tracking-[0.2em] text-cyan-300 uppercase">
            Equipo rival generado por el Coach Bot
          </p>
          <p className="text-sm leading-relaxed text-slate-200">{genNote}</p>
        </div>
      )}

      {/* Generador por mensaje, visible mientras el rival esté vacío. */}
      {members.length === 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-cyan-400/30 bg-cyan-400/[0.04] p-4">
          <p className="flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-cyan-300 uppercase">
            <Bot size={15} /> ¿Sin rival? Pídeselo a la IA por mensaje
          </p>
          <p className="text-sm leading-relaxed text-slate-300">
            Describe el equipo rival que quieres y el Coach Bot montará uno de
            6 Pokémon.
          </p>
          <textarea
            value={wish}
            onChange={(e) => setWish(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Ej.: un equipo de dragones legendarios, o los seis iniciales de Kanto…"
            aria-label="Describe el equipo rival que quieres generar"
            className="w-full resize-none rounded-lg border border-slate-700/80 bg-[#0a101d]/90 px-4 py-3 font-mono text-sm text-slate-200 outline-none transition focus:border-cyan-400/70 focus:shadow-[0_0_16px_-2px_rgba(34,211,238,0.55)]"
          />
          <button
            type="button"
            onClick={() => void generate()}
            disabled={genPending || !wish.trim()}
            className="inline-flex h-12 items-center justify-center gap-2.5 self-start rounded-md border border-cyan-400/50 bg-cyan-400/10 px-6 font-mono text-base tracking-wider text-cyan-300 uppercase transition enabled:hover:bg-cyan-400/20 enabled:hover:shadow-[0_0_20px_-2px_rgba(34,211,238,0.7)] disabled:opacity-50"
          >
            <Bot size={19} className={cn(genPending && "animate-pulse")} />
            {genPending ? "Montando rival…" : "✨ Generar rival con IA"}
          </button>
          {genError && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-400">
              {genError}
            </p>
          )}
        </div>
      )}

      {/* Buscador inline, igual que en «Mi Equipo». */}
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
            placeholder="Busca cualquier Pokémon para el rival (ej. mewtwo)…"
            aria-label="Buscar Pokémon para añadir al equipo rival"
            className="h-12 w-full rounded-lg border border-slate-700/80 bg-[#0a101d]/90 pr-4 pl-11 font-mono text-sm text-slate-200 outline-none transition focus:border-red-500/70 focus:shadow-[0_0_16px_-2px_rgba(239,68,68,0.55)]"
          />
        </label>

        {failed && (
          <p className="mt-2 font-mono text-xs text-red-400">
            No se pudo cargar el índice de especies. Recarga e inténtalo de
            nuevo.
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

      {members.length === 0 && (
        <p className="pb-1 text-center font-mono text-base text-slate-500">
          Pulsa «+» en una ranura, busca arriba, pídelo por mensaje… o lanza un
          rival aleatorio.
        </p>
      )}

      {pickerSlot !== null && (
        <RivalPicker
          slot={pickerSlot}
          has={has}
          isFull={isFull}
          onAdd={add}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </div>
  );
}
