"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Dices,
  Repeat,
  Search,
  Swords,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import {
  EntryButton,
  filterEntries,
  useTeamIndex,
} from "@/components/team/TeamDrawer";
import { TEAM_SIZE } from "@/components/team/TeamProvider";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { useT } from "@/lib/i18n/client";
import {
  artworkUrl,
  formatDexNumber,
  formatName,
  spriteUrl,
  typeAura,
} from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";
import {
  DEFAULT_LEVEL,
  type TeamMember,
  type TeamSuggestResponse,
} from "@/types/team";
import type { CSSProperties } from "react";

/** Rival livery: every red glow in the lobby reads `--edge`. */
const RIVAL_EDGE = "#f87171";

/**
 * Silhouettes for the empty slots, one fixed species per position — the
 * "who's that Pokémon?" teaser. They use the pixel sprite (a few KB) rather
 * than the official artwork because they are painted solid black anyway.
 */
const MYSTERY_IDS = [94, 149, 65, 68, 143, 130];

interface Preset {
  id: "champions" | "dragon" | "rain" | "random";
  emoji: string;
  /** Ring/glow colour of the pill. */
  accent: string;
  /**
   * Wish sent to the Coach Bot. Written in Spanish because so is the system
   * prompt of `/api/team-suggest`; the route makes the model answer in the
   * UI language. `null` means the preset is resolved locally instead.
   */
  prompt: string | null;
}

const PRESETS: Preset[] = [
  {
    id: "champions",
    emoji: "👑",
    accent: "#fbbf24",
    prompt:
      "Un equipo al estilo de los Campeones de la Liga Pokémon: seis Pokémon icónicos de campeones y Alto Mando (Lance, Cynthia, Steven, Leon…), a nivel 70, con sus movimientos más característicos.",
  },
  {
    id: "dragon",
    emoji: "🐲",
    accent: "#a78bfa",
    prompt:
      "Un equipo monotipo Dragón: seis Pokémon de tipo Dragón distintos, a nivel 70, con la mejor cobertura ofensiva posible entre ellos.",
  },
  {
    id: "rain",
    emoji: "⚡",
    accent: "#38bdf8",
    prompt:
      "Un equipo de lluvia competitivo: un invocador de lluvia (Pelipper o Politoed) y cinco Pokémon que la aprovechen (Nado Rápido, Chorro de Agua, Trueno), a nivel 70.",
  },
  { id: "random", emoji: "🎲", accent: "#f87171", prompt: null },
];

function clampLevel(level: number): number {
  return Math.min(100, Math.max(1, Math.round(level)));
}

/**
 * Preset «6 aleatorios»: seis especies distintas sacadas del índice ya
 * cargado, sin pasar por la IA. Vive fuera del componente porque sortear es
 * impuro y ahí dentro no tiene sitio.
 */
function randomSix(entries: TeamMember[]): TeamMember[] {
  const picked = new Map<number, TeamMember>();
  for (let guard = 0; picked.size < TEAM_SIZE && guard < 500; guard++) {
    const entry = entries[Math.floor(Math.random() * entries.length)];
    if (!picked.has(entry.id)) {
      picked.set(entry.id, { ...entry, level: DEFAULT_LEVEL });
    }
  }
  return [...picked.values()];
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
  const t = useT().battle.builder;
  const { entries, failed } = useTeamIndex();
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

  const pick = (entry: TeamMember) => {
    onAdd(entry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t.closePickerAria}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-label={t.pickerDialogAria(slot + 1)}
        style={{ "--edge": RIVAL_EDGE } as CSSProperties}
        className="lobby-panel relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-red-500/40 bg-hud-3/95 shadow-[0_0_48px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:rounded-2xl"
      >
        <div className="flex items-center gap-3 border-b border-red-500/20 px-5 py-3.5">
          <Search size={18} className="text-red-400" />
          <h3 className="font-display text-base font-bold tracking-wide text-slate-100">
            {t.pickerTitle}
            <span className="ml-2 font-mono text-xs font-normal text-slate-500">
              {t.pickerSlot(slot + 1)}
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closePickerAria}
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
            placeholder={t.filterPlaceholder}
            aria-label={t.filterAria}
            className="h-11 w-full rounded-lg border border-slate-700/80 bg-hud-1/90 px-4 font-mono text-sm text-slate-200 outline-none transition focus:border-red-500/70 focus:shadow-[0_0_16px_-2px_rgba(239,68,68,0.55)]"
          />
        </div>

        <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-5 py-4">
          {failed && (
            <p className="font-mono text-sm text-red-400">
              {t.indexFailedClose}
            </p>
          )}
          {!entries && !failed && (
            <p className="font-mono text-sm text-slate-500">
              {t.loadingSpecies}
            </p>
          )}
          {entries && results.length === 0 && (
            <p className="font-mono text-sm text-slate-500">
              {t.noResultsFor(query.trim())}
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

/** Índice de la ranura, como en la caja del PC: «01», «02»… */
function SlotIndex({ index }: { index: number }) {
  return (
    <span className="pointer-events-none absolute top-2.5 left-3 font-pixel text-[9px] text-slate-500/80">
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}

/** Ranura vacía: silueta misteriosa sobre pedestal, con «+ elegir» al pasar. */
function EmptySlot({
  index,
  onOpenPicker,
}: {
  index: number;
  onOpenPicker: (slot: number) => void;
}) {
  const t = useT().battle.builder;
  return (
    <button
      type="button"
      onClick={() => onOpenPicker(index)}
      aria-label={t.pickerDialogAria(index + 1)}
      title={t.slotChooseTitle}
      style={{ "--edge": RIVAL_EDGE, "--aura": "#64748b" } as CSSProperties}
      className={cn(
        "lobby-bracket group relative flex aspect-[5/6] flex-col items-center justify-end overflow-hidden rounded-2xl",
        "border border-red-400/25 bg-hud-1/40 backdrop-blur-md transition duration-300",
        "hover:-translate-y-0.5 hover:border-red-400/70 hover:bg-red-500/[0.07] hover:shadow-[0_0_30px_-6px_rgba(248,113,113,0.7)]",
        "focus-visible:border-red-400/80 focus-visible:outline-none",
      )}
    >
      <SlotIndex index={index} />

      {/* Pedestal + silueta: el mismo escenario que una ranura ocupada. */}
      <span className="relative flex min-h-0 w-full flex-1 items-center justify-center">
        <span className="holo-pedestal bottom-1 h-6 w-[72%] opacity-40 transition-opacity duration-300 group-hover:opacity-70" />
        <Image
          src={spriteUrl(MYSTERY_IDS[index % MYSTERY_IDS.length])}
          alt=""
          aria-hidden
          width={96}
          height={96}
          unoptimized
          className="mystery-sil sprite-float relative h-[74%] w-auto object-contain [image-rendering:pixelated] transition-transform duration-300 group-hover:scale-105"
        />
      </span>

      {/* Etiqueta en reposo; al pasar el puntero cede el sitio a la llamada. */}
      <span className="relative z-10 w-full px-2 pb-3 text-center">
        <span className="block font-mono text-xs tracking-[0.18em] text-slate-500 uppercase transition-opacity duration-200 group-hover:opacity-0">
          {t.slotEmpty}
        </span>
        <span className="absolute inset-x-0 bottom-3 block font-mono text-xs font-semibold tracking-[0.14em] text-red-300 uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {t.slotPick}
        </span>
      </span>
    </button>
  );
}

/** Ranura ocupada: el rival sobre su pedestal, con nivel, cambio y descarte. */
function FilledSlot({
  index,
  member,
  onOpenPicker,
  onRemove,
  onSetLevel,
}: {
  index: number;
  member: TeamMember;
  onOpenPicker: (slot: number) => void;
  onRemove: (id: number) => void;
  onSetLevel: (id: number, level: number) => void;
}) {
  const dict = useT();
  const t = dict.battle.builder;
  const aura = typeAura(member.types[0]);
  const label = formatName(member.name);

  return (
    <div
      style={{ "--aura": aura, "--edge": aura } as CSSProperties}
      className={cn(
        "lobby-bracket group relative flex aspect-[5/6] flex-col items-center gap-1 overflow-hidden rounded-2xl p-2.5",
        "border border-[color-mix(in_srgb,var(--aura)_45%,transparent)] bg-hud-1/50 backdrop-blur-md",
        "shadow-[0_0_26px_-10px_var(--aura)] transition duration-300 hover:-translate-y-0.5",
        "hover:shadow-[0_0_34px_-6px_var(--aura)]",
      )}
    >
      <SlotIndex index={index} />

      {/* Cambiar / quitar: siempre visibles en táctil, al pasar en escritorio. */}
      <span className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 max-sm:opacity-100">
        <button
          type="button"
          onClick={() => onOpenPicker(index)}
          aria-label={t.changeAria(label)}
          title={t.changeAria(label)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-600/70 bg-hud-0/80 text-slate-300 transition hover:border-cyan-400/70 hover:text-cyan-300"
        >
          <Repeat size={13} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(member.id)}
          aria-label={t.removeAria(label)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-red-500/60 bg-hud-0/80 text-red-400 transition hover:bg-red-500/20"
        >
          <X size={13} />
        </button>
      </span>

      <p className="font-pixel text-[9px] text-slate-500">
        {formatDexNumber(member.id)}
      </p>

      <span className="relative flex min-h-0 w-full flex-1 items-center justify-center">
        <span className="holo-pedestal bottom-0 h-6 w-[78%]" />
        <Image
          src={artworkUrl(member.id)}
          alt={label}
          fill
          sizes="180px"
          className="sprite-float object-contain drop-shadow-[0_0_12px_var(--aura)]"
        />
      </span>

      <p className="w-full truncate text-center font-display text-sm font-bold tracking-wide text-slate-100">
        {label}
      </p>
      <div className="flex flex-wrap justify-center gap-1">
        {member.types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>
      <label className="flex items-center gap-1.5 rounded-md border border-slate-700/70 bg-black/40 px-2 py-1 font-mono text-[11px] tracking-wider text-slate-400 uppercase">
        {dict.battle.lvShort}
        <input
          type="number"
          min={1}
          max={100}
          value={member.level ?? DEFAULT_LEVEL}
          onChange={(e) => {
            const value = e.target.valueAsNumber;
            if (!Number.isNaN(value)) onSetLevel(member.id, value);
          }}
          aria-label={t.levelAria(label)}
          className="h-5 w-10 rounded bg-transparent text-center font-mono text-xs font-semibold text-[var(--aura)] outline-none"
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
 * Vestíbulo previo al combate: el equipo del RIVAL montado a mano, por
 * presets de un clic o dictado al Coach Bot, con el botón de lanzamiento
 * anclado abajo del todo.
 */
export function RivalBuilder({ onFight, onRandom }: RivalBuilderProps) {
  const dict = useT();
  const t = dict.battle.builder;
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const { entries, failed } = useTeamIndex();
  const [query, setQuery] = useState("");

  // Generador por mensaje, calcado del de «Mi Equipo».
  const [wish, setWish] = useState("");
  const [genPending, setGenPending] = useState<Preset["id"] | "wish" | null>(
    null,
  );
  const [genError, setGenError] = useState<string | null>(null);
  const [genNote, setGenNote] = useState<string | null>(null);
  /**
   * Segundo toque para pelear con menos de seis rivales. Guarda el tamaño de
   * la plantilla con el que se preguntó, así cualquier alta o baja posterior
   * invalida la confirmación sola, sin efectos de por medio.
   */
  const [confirmedAt, setConfirmedAt] = useState<number | null>(null);

  const has = (id: number) => members.some((m) => m.id === id);
  const isFull = members.length >= TEAM_SIZE;
  const ready = members.length === TEAM_SIZE;
  const confirming = confirmedAt === members.length;

  // La pregunta caduca: si no se responde, el botón vuelve a su estado normal.
  useEffect(() => {
    if (confirmedAt === null) return;
    const id = window.setTimeout(() => setConfirmedAt(null), 5000);
    return () => window.clearTimeout(id);
  }, [confirmedAt]);

  const add = (member: TeamMember) => {
    setMembers((prev) =>
      prev.length >= TEAM_SIZE || prev.some((m) => m.id === member.id)
        ? prev
        : [...prev, { ...member, level: member.level ?? DEFAULT_LEVEL }],
    );
  };

  /** Coloca en una ranura concreta: sustituye si estaba ocupada, si no añade. */
  const put = (slot: number, member: TeamMember) => {
    setMembers((prev) => {
      if (prev.some((m, i) => m.id === member.id && i !== slot)) return prev;
      const entry = { ...member, level: member.level ?? DEFAULT_LEVEL };
      if (slot < prev.length) {
        const next = [...prev];
        next[slot] = entry;
        return next;
      }
      return prev.length >= TEAM_SIZE ? prev : [...prev, entry];
    });
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

  const generate = async (prompt: string, source: Preset["id"] | "wish") => {
    if (genPending || !prompt.trim()) return;
    setGenPending(source);
    setGenError(null);
    try {
      const res = await fetch("/api/team-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = (await res.json().catch(() => null)) as
        | (TeamSuggestResponse & { error?: string })
        | null;
      if (!res.ok || !Array.isArray(data?.team) || data.team.length === 0) {
        setGenError(data?.error ?? t.coachFail);
        return;
      }
      setMembers(data.team.slice(0, TEAM_SIZE));
      setGenNote(data.motivo);
      if (source === "wish") setWish("");
    } catch {
      setGenError(t.coachOffline);
    } finally {
      setGenPending(null);
    }
  };

  const rollRandom = () => {
    if (!entries || entries.length === 0) return;
    setMembers(randomSix(entries));
    setGenNote(null);
    setGenError(null);
  };

  const launch = () => {
    if (members.length === 0) return;
    if (!ready && !confirming) {
      setConfirmedAt(members.length);
      return;
    }
    onFight(members);
  };

  // El aviso cuenta cómo está la plantilla; el botón, qué pasa si lo pulsas.
  const launchHint = !members.length
    ? t.launchEmpty
    : ready
      ? t.launchReady
      : t.launchPartial(members.length);

  return (
    <>
      <section
        style={{ "--edge": RIVAL_EDGE } as CSSProperties}
        className="lobby-panel relative mx-auto flex w-full max-w-7xl flex-col gap-5 overflow-hidden rounded-3xl border border-red-500/30 bg-hud-3/80 px-4 py-5 shadow-[0_0_48px_rgba(0,0,0,0.7),0_0_36px_-10px_rgba(239,68,68,0.35)] backdrop-blur-2xl sm:px-6"
      >
        {/* Cabecera: marcador de ranuras y accesos rápidos. */}
        <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-red-500/20 pb-4">
          <Swords size={22} className="shrink-0 text-red-400" />
          <h2 className="font-display text-lg font-bold tracking-wide">
            <span className="neon-red">{t.title}</span>
          </h2>

          {/* Marcador de rombos: uno encendido por rival confirmado. */}
          <span
            aria-hidden
            className="flex items-center gap-1.5 rounded-full border border-red-500/25 bg-black/40 px-2.5 py-1.5"
          >
            {Array.from({ length: TEAM_SIZE }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 w-2 rotate-45 rounded-[1px] transition duration-300",
                  i < members.length
                    ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)]"
                    : "bg-slate-700",
                )}
              />
            ))}
          </span>
          <span className="font-mono text-sm text-red-300">
            {members.length}/{TEAM_SIZE}
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-2.5">
            {members.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMembers([]);
                  setGenNote(null);
                }}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-700/70 bg-black/30 px-3 font-mono text-xs tracking-wider text-slate-400 uppercase transition hover:border-red-500/60 hover:text-red-300"
              >
                <Trash2 size={14} /> {t.clear}
              </button>
            )}
            <button
              type="button"
              onClick={onRandom}
              title={t.randomTitle}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-4 font-mono text-sm tracking-wider text-cyan-300 uppercase transition hover:bg-cyan-400/20 hover:shadow-[0_0_20px_-2px_rgba(34,211,238,0.7)]"
            >
              <Dices size={16} />
              {t.random}
            </button>
          </div>
        </header>

        {/* Las seis ranuras. */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-6">
          {Array.from({ length: TEAM_SIZE }, (_, i) =>
            members[i] ? (
              <FilledSlot
                key={members[i].id}
                index={i}
                member={members[i]}
                onOpenPicker={setPickerSlot}
                onRemove={remove}
                onSetLevel={setLevel}
              />
            ) : (
              <EmptySlot key={`empty-${i}`} index={i} onOpenPicker={setPickerSlot} />
            ),
          )}
        </div>

        {/* Presets de un clic. */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-xs tracking-[0.2em] text-slate-500 uppercase">
            {t.presetsLabel}
          </span>
          {PRESETS.map((preset) => {
            const label =
              preset.id === "champions"
                ? t.presetChampions
                : preset.id === "dragon"
                  ? t.presetDragon
                  : preset.id === "rain"
                    ? t.presetRain
                    : t.presetRandom;
            const local = preset.prompt === null;
            const disabled =
              genPending !== null || (local && (!entries || failed));
            return (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                title={local && !entries ? t.presetIndexLoading : label}
                onClick={() =>
                  local ? rollRandom() : void generate(preset.prompt!, preset.id)
                }
                style={{ "--edge": preset.accent } as CSSProperties}
                className={cn(
                  "lobby-pill inline-flex h-10 items-center gap-2 rounded-full border px-4 font-mono text-sm tracking-wide transition duration-200",
                  "border-[color-mix(in_srgb,var(--edge)_45%,transparent)] bg-[color-mix(in_srgb,var(--edge)_8%,transparent)] text-[var(--edge)]",
                  "enabled:hover:-translate-y-0.5 enabled:hover:bg-[color-mix(in_srgb,var(--edge)_18%,transparent)]",
                  "enabled:hover:shadow-[0_0_22px_-4px_var(--edge)] disabled:opacity-40",
                  genPending === preset.id && "animate-pulse",
                )}
              >
                <span aria-hidden>{preset.emoji}</span>
                {label}
              </button>
            );
          })}
        </div>

        {/* Consola del Coach Bot. */}
        <div
          style={{ "--edge": "#22d3ee" } as CSSProperties}
          className="lobby-console relative overflow-hidden rounded-xl border border-cyan-400/35 bg-hud-1/60 backdrop-blur-md transition focus-within:border-cyan-400/70 focus-within:shadow-[0_0_28px_-8px_rgba(34,211,238,0.8)]"
        >
          <div className="flex items-center gap-2 border-b border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2">
            <Terminal size={14} className="text-cyan-300" />
            <p className="font-mono text-xs tracking-[0.2em] text-cyan-300 uppercase">
              {t.consoleTitle}
            </p>
            <span aria-hidden className="ml-auto flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400/70" />
              <span className="h-2 w-2 rounded-full bg-amber-400/70" />
              <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
            </span>
          </div>

          <div className="relative z-10 flex flex-col gap-3 p-3.5">
            <p className="text-sm leading-relaxed text-slate-300">
              {t.coachAskBody}
            </p>
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute top-3 left-3.5 font-mono text-sm text-cyan-400/80"
              >
                &gt;
              </span>
              <textarea
                value={wish}
                onChange={(e) => setWish(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder={t.wishPlaceholder}
                aria-label={t.wishAria}
                className="w-full resize-none rounded-lg border border-cyan-400/25 bg-black/50 py-2.5 pr-4 pl-8 font-mono text-sm text-cyan-100 caret-cyan-300 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void generate(wish, "wish")}
                disabled={genPending !== null || !wish.trim()}
                className="inline-flex h-11 items-center justify-center gap-2.5 rounded-lg border border-cyan-400/60 bg-cyan-400/10 px-5 font-mono text-sm tracking-wider text-cyan-300 uppercase transition enabled:hover:bg-cyan-400/20 enabled:hover:shadow-[0_0_20px_-2px_rgba(34,211,238,0.7)] disabled:opacity-40"
              >
                <Bot
                  size={17}
                  className={cn(genPending !== null && "animate-pulse")}
                />
                {genPending ? t.generating : t.generateCta}
              </button>
              <span className="font-mono text-xs text-slate-500">
                {wish.length}/500
              </span>
            </div>
            {genError && (
              <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-400">
                {genError}
              </p>
            )}
          </div>
        </div>

        {/* Motivo del último equipo generado por la IA. */}
        {genNote && members.length > 0 && (
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.04] p-4">
            <p className="mb-1.5 font-mono text-xs tracking-[0.2em] text-cyan-300 uppercase">
              {t.coachNote}
            </p>
            <p className="text-sm leading-relaxed text-slate-200">{genNote}</p>
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
              placeholder={t.searchPlaceholder}
              aria-label={t.searchAria}
              className="h-12 w-full rounded-xl border border-slate-700/80 bg-hud-1/70 pr-4 pl-11 font-mono text-sm text-slate-200 outline-none transition focus:border-red-500/70 focus:shadow-[0_0_16px_-2px_rgba(239,68,68,0.55)]"
            />
          </label>

          {failed && (
            <p className="mt-2 font-mono text-xs text-red-400">
              {t.indexFailedReload}
            </p>
          )}
          {query.trim().length >= 2 && entries && results.length === 0 && (
            <p className="mt-2 font-mono text-xs text-slate-500">
              {t.noResultsFor(query.trim())}
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
          <p className="text-center font-mono text-sm text-slate-500">
            {t.emptyHint}
          </p>
        )}
      </section>

      {/* Lanzamiento: anclado abajo y centrado, sobre todo lo demás. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center bg-gradient-to-t from-hud-0 via-hud-0/80 to-transparent px-4 pt-8 pb-[max(0.9rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-slate-700/70 bg-hud-0/85 px-4 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:justify-between">
          <p
            className={cn(
              "font-mono text-xs tracking-wider uppercase",
              ready
                ? "text-emerald-300"
                : confirming
                  ? "text-amber-300"
                  : "text-slate-400",
            )}
          >
            {launchHint}
          </p>
          <button
            type="button"
            onClick={launch}
            disabled={members.length === 0}
            aria-label={`${t.launchCta} — ${launchHint}`}
            style={
              {
                "--edge": ready ? "#4ade80" : confirming ? "#fbbf24" : "#f87171",
              } as CSSProperties
            }
            className={cn(
              "lobby-launch inline-flex h-13 items-center gap-2.5 rounded-xl border px-7 font-display text-base font-bold tracking-widest uppercase transition duration-200",
              "border-[color-mix(in_srgb,var(--edge)_70%,transparent)] bg-[color-mix(in_srgb,var(--edge)_14%,transparent)] text-[var(--edge)]",
              "enabled:hover:bg-[color-mix(in_srgb,var(--edge)_26%,transparent)] enabled:active:scale-[0.97]",
              "disabled:cursor-not-allowed disabled:opacity-40",
              ready && "lobby-ready",
            )}
          >
            <Swords size={19} />
            {confirming ? t.launchConfirm : t.launchCta}
          </button>
        </div>
      </div>

      {pickerSlot !== null && (
        <RivalPicker
          slot={pickerSlot}
          has={has}
          isFull={isFull && pickerSlot >= members.length}
          onAdd={(member) => put(pickerSlot, member)}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </>
  );
}
