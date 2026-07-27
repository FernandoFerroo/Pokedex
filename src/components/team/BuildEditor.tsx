"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpNarrowWide,
  Disc3,
  Layers,
  RotateCcw,
  Search,
  Sparkles,
  Swords,
  Wand2,
  X,
} from "lucide-react";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { isKnownAt, type SelectableMethod } from "@/lib/battle/learnset";
import { MOVE_PRESETS, type MovePreset } from "@/lib/battle/move-presets";
import type { Dict } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import type { Lang } from "@/lib/i18n/config";
import {
  artworkUrl,
  formatDexNumber,
  formatName,
  typeAura,
  typeLabel,
} from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";
import {
  DEFAULT_LEVEL,
  type BuildOptionsResponse,
  type MemberBuild,
  type MoveCoachResponse,
  type MoveOption,
  type TeamMember,
} from "@/types/team";
import { useTeam } from "./TeamProvider";
import type { CSSProperties } from "react";

type TeamDict = Dict["team"];

const DAMAGE_CLASS_TONE: Record<string, string> = {
  physical: "text-orange-300",
  special: "text-sky-300",
  status: "text-slate-400",
};

/** White label text with the soft outline the Switch games use. Pinned white:
 * it always sits on a type-colored pill, identical in both themes. */
const outlined =
  "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.5)]";

/** SwSh-style move pill chrome, shared with the battle HUD's MoveMenu: type
 * gradient with a glossy top edge and the lopsided rounded corners of the
 * games' battle buttons. */
function movePillStyle(aura: string): CSSProperties {
  return {
    background: `linear-gradient(180deg, color-mix(in srgb, ${aura} 80%, #fff 12%), ${aura} 45%, color-mix(in srgb, ${aura} 55%, #000))`,
    boxShadow: `inset 0 2px 0 rgba(255,255,255,0.3), 0 3px 10px rgba(0,0,0,0.4), 0 0 18px -6px ${aura}`,
  };
}

/* ------------------------------------------------------------------ */
/* Options catalogue: fetched once per species, shared by all editors. */
/* ------------------------------------------------------------------ */

const optionsCache = new Map<string, Promise<BuildOptionsResponse>>();

/** Keyed by `${lang}:${species}` so switching language refetches localized
 * labels; the route reads the lang cookie sent with the request. */
function loadBuildOptions(
  species: string,
  lang: Lang,
): Promise<BuildOptionsResponse> {
  const key = `${lang}:${species}`;
  let promise = optionsCache.get(key);
  if (!promise) {
    promise = fetch(`/api/battle/build-options?species=${species}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: BuildOptionsResponse) => data)
      .catch((err) => {
        optionsCache.delete(key); // Allow a retry on the next open.
        throw err;
      });
    optionsCache.set(key, promise);
  }
  return promise;
}

/** Accent-insensitive lowercase, so "latigo" finds «Látigo Cepa». */
function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** "Nv. 24" / "Inicial" / "MT/MO" / "Huevo" / "Tutor" — how it is learned. */
function learnTag(move: MoveOption, t: TeamDict): string {
  if (move.method === "machine") return t.learnMachine;
  if (move.method === "egg") return t.learnEgg;
  if (move.method === "tutor") return t.learnTutor;
  return move.learnLevel && move.learnLevel > 1
    ? t.learnLevel(move.learnLevel)
    : t.learnStart;
}

/** One-line hover summary: how it's learned · type · category · power · acc. */
function moveTitle(move: MoveOption, t: TeamDict, lang: Lang): string {
  return [
    learnTag(move, t),
    typeLabel(move.type, lang),
    t.damageClass[move.damageClass],
    t.movePower(move.power ?? "—"),
    t.moveAccuracy(move.accuracy ?? "—"),
    t.movePp(move.pp ?? "—"),
  ].join(" · ");
}

/** Compact data cluster shared by the selected chips and the list rows. */
function MoveStats({ move }: { move: MoveOption }) {
  const t = useI18n().dict.team;
  return (
    // Misma ficha del movimiento que en escritorio — categoría, potencia,
    // precisión y PP —; en el móvil encoge, no se recorta.
    <span className="flex shrink-0 items-center gap-2 max-sm:gap-1">
      <TypeBadge type={move.type} />
      <span
        className={cn(
          "w-14 font-mono text-xs max-sm:w-9 max-sm:text-[9px]",
          DAMAGE_CLASS_TONE[move.damageClass] ?? "text-slate-500",
        )}
      >
        {t.damageClass[move.damageClass] ?? "—"}
      </span>
      <span className="font-mono text-xs whitespace-nowrap text-slate-400 max-sm:text-[9px]">
        {t.movePowerAbbr(move.power ?? "—")}{" "}
        {t.moveAccuracyAbbr(move.accuracy ?? "—")}
        {" · "}
        {t.movePp(move.pp ?? "—")}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* The 4 chosen moves, in pick order.                                  */
/* ------------------------------------------------------------------ */

function SelectedMoves({
  slugs,
  moveBySlug,
  onRemove,
}: {
  slugs: string[];
  moveBySlug: Map<string, MoveOption>;
  onRemove: (slug: string) => void;
}) {
  const { lang, dict } = useI18n();
  const t = dict.team;
  // 2×2 grid like the games' battle menu; each pick wears its type color.
  return (
    <div className="grid grid-cols-2 gap-2.5 max-sm:gap-1.5">
      {Array.from({ length: 4 }, (_, i) => {
        const slug = slugs[i];
        if (!slug) {
          return (
            <div
              key={`empty-${i}`}
              className="flex h-16 items-center gap-2.5 rounded-[16px_6px_16px_6px] border-2 border-dashed border-slate-700/70 bg-black/20 px-3"
            >
              {/* Chapa de ranura: el hueco se lee como una casilla numerada
                  del menú de combate, no como una caja rota. */}
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-black/40 font-pixel text-[10px] text-slate-500">
                {i + 1}
              </span>
              <span className="min-w-0 truncate font-mono text-xs text-slate-500">
                {t.emptyMoveSlot}
              </span>
            </div>
          );
        }
        const info = moveBySlug.get(slug);
        const aura = typeAura(info?.type);
        return (
          <div
            key={slug}
            style={movePillStyle(aura)}
            className="relative flex h-16 flex-col justify-center rounded-[16px_6px_16px_6px] border-2 border-white/30 py-1.5 pr-9 pl-11"
            title={info ? moveTitle(info, t, lang) : undefined}
          >
            {/* Número de ranura, grabado sobre la pastilla de color. */}
            <span
              aria-hidden
              className="absolute top-1/2 left-2.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#000000]/30 font-pixel text-[10px] text-white/85"
            >
              {i + 1}
            </span>
            <span
              className={cn(outlined, "truncate text-sm font-bold tracking-wide")}
            >
              {info?.label ?? formatName(slug)}
            </span>
            <span className="mt-0.5 flex items-center justify-between gap-2">
              {/* Pinned #000: the chip must stay dark on the colored pill in
                  both themes (bg-black flips to white in light mode). */}
              <span className="rounded-sm bg-[#000000]/35 px-1.5 py-px text-[10px] font-bold tracking-widest text-white uppercase">
                {info ? typeLabel(info.type, lang) : "—"}
              </span>
              {info && (
                <span className={cn(outlined, "text-[11px] font-semibold")}>
                  {t.movePp(info.pp ?? "—")}
                  <span className="ml-2 text-[#e2e8f0]/85">
                    {t.movePowerAbbr(info.power ?? "—")}
                  </span>
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => onRemove(slug)}
              aria-label={t.removeMoveAria(info?.label ?? formatName(slug))}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-[#000000]/25 p-1 text-white/80 transition hover:bg-[#000000]/50 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The modal itself.                                                   */
/* ------------------------------------------------------------------ */

/**
 * Bloque del editor: cristal con su propia cabecera de icono, título y un
 * contador a la derecha. Las tres secciones (habilidad, movimientos
 * elegidos y catálogo) comparten chapa, así el diálogo se lee como una
 * ficha de tres pisos en vez de como una lista larga.
 */
function Section({
  icon: Icon,
  title,
  meta,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-700/60 bg-hud-1/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-3.5">
      <header className="mb-3 flex items-center gap-2 border-b border-slate-700/50 pb-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-emerald-400/40 bg-emerald-400/10 text-emerald-300">
          <Icon size={13} />
        </span>
        <h4 className="font-mono text-xs tracking-[0.2em] text-slate-200 uppercase">
          {title}
        </h4>
        {meta !== undefined && (
          <span className="ml-auto shrink-0 font-mono text-[11px] text-slate-500">
            {meta}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

/**
 * «Configuración de Combate» de una ranura del equipo: nivel, habilidad y 4
 * movimientos elegidos del repertorio que la especie conoce A ESE NIVEL (los
 * de nivel superior aparecen bloqueados con su requisito; MT/MO, huevo y
 * tutor no piden nivel, como en los juegos). Todo es opcional — las ranuras
 * vacías se autocompletan en el servidor con los mejores movimientos por
 * nivel y la habilidad principal al preparar el combate.
 */
export function BuildEditor({
  member,
  onClose,
}: {
  member: TeamMember;
  onClose: () => void;
}) {
  const { setBuild, setLevel } = useTeam();
  const { lang, dict } = useI18n();
  const t = dict.team;
  const level = member.level ?? DEFAULT_LEVEL;
  const [options, setOptions] = useState<BuildOptionsResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [ability, setAbility] = useState(member.build?.ability ?? "");
  /** Chosen move slugs, in pick order (max 4). */
  const [moves, setMoves] = useState<string[]>(
    () => member.build?.moves?.slice(0, 4) ?? [],
  );
  /** Hide what the Pokémon can't know yet; off shows the whole learnset. */
  const [onlyKnown, setOnlyKnown] = useState(true);
  /** Which shelf the catalogue is showing: level-up moves or TMs. */
  const [source, setSource] = useState<SelectableMethod>("level-up");
  const [query, setQuery] = useState("");
  /** Free-text wish for the AI coach; the preset chips don't go through it. */
  const [coachPrompt, setCoachPrompt] = useState("");
  /** Which coach request is in flight: a preset chip, the text box, or none. */
  const [coachBusy, setCoachBusy] = useState<MovePreset | "custom" | null>(null);
  const [coachError, setCoachError] = useState<string | null>(null);
  /** What the coach said about the set it just applied. */
  const [coachNote, setCoachNote] = useState<{
    motivo: string;
    toppedUp: boolean;
  } | null>(null);
  /** Only the newest ask may write: a slow first answer must not land on top
      of a second, faster one the user has already seen applied. */
  const coachSeq = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  /** Toda la ficha se viste del tipo principal de la especie. */
  const aura = typeAura(member.types[0]);

  useScrollLock();
  useEffect(() => {
    let alive = true;
    loadBuildOptions(member.name, lang)
      .then((o) => alive && setOptions(o))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [member.name, lang]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const moveBySlug = useMemo(
    () => new Map((options?.moves ?? []).map((m) => [m.slug, m])),
    [options],
  );

  /** A pick only counts while the Pokémon can actually know it. */
  const knows = (slug: string) => {
    const info = moveBySlug.get(slug);
    return !info || isKnownAt(info, level);
  };

  // The level decides which picks are real: lowering it parks the moves the
  // Pokémon no longer knows (raising it again brings them back) and only the
  // legal ones are shown, counted against the 4 slots and saved.
  const kept = useMemo(
    () => moves.filter(knows),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [moves, moveBySlug, level],
  );
  const parked = useMemo(
    () =>
      moves
        .filter((slug) => !knows(slug))
        .map((slug) => moveBySlug.get(slug)?.label ?? formatName(slug)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [moves, moveBySlug, level],
  );

  /** The catalogue split by shelf, so each tab can show its own count. */
  const bySource = useMemo(() => {
    const all = options?.moves ?? [];
    return {
      "level-up": all.filter((m) => m.method === "level-up"),
      machine: all.filter((m) => m.method === "machine"),
    } satisfies Record<SelectableMethod, MoveOption[]>;
  }, [options]);

  const results = useMemo(() => {
    const shelf = bySource[source];
    const q = fold(query.trim());
    const byName = q
      ? shelf.filter((m) => fold(m.label).includes(q) || m.slug.includes(q))
      : shelf;
    // TMs carry no level requirement, so the level filter only means
    // something on the level-up shelf.
    return onlyKnown && source === "level-up"
      ? byName.filter((m) => isKnownAt(m, level))
      : byName;
  }, [bySource, source, query, onlyKnown, level]);

  const toggle = (slug: string) => {
    if (!knows(slug)) return;
    setMoves((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      // Adding also commits the parked picks away: what you see in the 2×2
      // grid is exactly what the Pokémon will carry. Derived from `prev`
      // rather than the rendered `kept` so two picks in the same batch both
      // land — the four slots fill from either shelf.
      const current = prev.filter(knows);
      return current.length < 4 ? [...current, slug] : prev;
    });
  };

  /**
   * Hands the wish to the coach and drops the four moves it answers with
   * straight into the slots.
   *
   * The server picks only from this species' real repertoire at this level —
   * the same two shelves listed below — so whatever comes back is something
   * the catalogue would have let you tick by hand. Nothing here needs to
   * re-check that; `kept` still parks anything the level stops allowing, which
   * is what covers a level edit made while the request was in flight.
   */
  const askCoach = async (ask: { preset?: MovePreset; prompt?: string }) => {
    const text = ask.prompt?.trim() ?? "";
    if (!ask.preset && !text) {
      setCoachError(t.coachMoveErrEmpty);
      return;
    }
    const seq = ++coachSeq.current;
    setCoachBusy(ask.preset ?? "custom");
    setCoachError(null);
    setCoachNote(null);
    try {
      const res = await fetch("/api/battle/move-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          species: member.name,
          level,
          preset: ask.preset,
          prompt: text,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | (MoveCoachResponse & { error?: string })
        | null;
      if (seq !== coachSeq.current) return;
      if (!res.ok || !data || data.error || !data.moves?.length) {
        setCoachError(data?.error ?? t.coachMoveErrFailed);
        return;
      }
      setMoves(data.moves.slice(0, 4));
      setCoachNote({ motivo: data.motivo, toppedUp: data.toppedUp });
    } catch {
      if (seq === coachSeq.current) setCoachError(t.coachMoveErrFailed);
    } finally {
      if (seq === coachSeq.current) setCoachBusy(null);
    }
  };

  const save = () => {
    const build: MemberBuild | undefined =
      ability || kept.length > 0
        ? {
            ability: ability || undefined,
            moves: kept.length > 0 ? kept : undefined,
          }
        : undefined;
    setBuild(member.id, build);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t.buildCloseAria}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-label={t.buildDialogAria(formatName(member.name))}
        style={{ "--aura": aura, "--edge": aura } as CSSProperties}
        className="lobby-panel relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[color-mix(in_srgb,var(--aura)_45%,transparent)] bg-hud-3 shadow-[0_0_48px_rgba(0,0,0,0.8),0_0_40px_-14px_var(--aura)] sm:max-h-[85vh] sm:rounded-2xl"
      >
        {/* Cabecera-retrato: la especie sobre su pedestal holográfico, teñida
            por su tipo, con la placa de nivel a la derecha. Es lo primero que
            se ve, así que dice de quién es esta build antes que nada. */}
        <header className="relative shrink-0 overflow-hidden border-b border-[color-mix(in_srgb,var(--aura)_35%,transparent)] px-4 py-3 sm:px-5 sm:py-3.5">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_150%_at_8%_0%,color-mix(in_srgb,var(--aura)_26%,transparent),transparent_68%)]"
          />
          <div className="relative flex items-center gap-3 sm:gap-4">
            <span className="relative flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20">
              <span className="holo-pedestal bottom-0 h-5 w-[85%]" />
              <Image
                src={artworkUrl(member.id)}
                alt=""
                aria-hidden
                width={96}
                height={96}
                className="sprite-float relative h-full w-full object-contain drop-shadow-[0_0_14px_var(--aura)]"
              />
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] tracking-[0.24em] text-slate-400 uppercase">
                {t.buildTitle}
              </p>
              <h3 className="flex min-w-0 items-baseline gap-2">
                <span className="shrink-0 font-pixel text-[10px] text-slate-500">
                  {formatDexNumber(member.id)}
                </span>
                <span className="neon-value truncate font-display text-lg font-bold tracking-wide text-[var(--aura)] sm:text-xl">
                  {formatName(member.name)}
                </span>
              </h3>
              <span className="mt-1.5 flex flex-wrap gap-1">
                {member.types.map((type) => (
                  <TypeBadge key={type} type={type} />
                ))}
              </span>
            </div>

            {/* El nivel vive aquí porque decide qué movimientos hay
                disponibles: cambiarlo reordena el catálogo al instante. */}
            <label className="flex shrink-0 flex-col items-center gap-0.5 rounded-xl border border-[color-mix(in_srgb,var(--aura)_45%,transparent)] bg-black/40 px-2.5 py-1.5 shadow-[inset_0_0_22px_-12px_var(--aura)]">
              <span className="font-mono text-[9px] tracking-[0.2em] text-slate-400 uppercase">
                {t.buildLevel}
              </span>
              <input
                type="number"
                min={1}
                max={100}
                value={level}
                onChange={(e) => {
                  const value = e.target.valueAsNumber;
                  if (!Number.isNaN(value)) setLevel(member.id, value);
                }}
                aria-label={t.buildLevelAria(formatName(member.name))}
                className="neon-value h-7 w-12 rounded bg-transparent text-center font-display text-lg font-bold text-[var(--aura)] outline-none"
              />
            </label>

            <button
              type="button"
              onClick={onClose}
              aria-label={t.buildCloseAria}
              className="shrink-0 self-start rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3.5 overscroll-contain overflow-y-auto px-4 py-4 sm:px-5">
          {failed && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-400">
              {t.buildOptionsError}
            </p>
          )}

          {/* Ability: selectable chips instead of a native dropdown, so the
              choice reads like the games' option cards. */}
          <Section icon={Sparkles} title={t.ability}>
            <div
              role="radiogroup"
              aria-label={t.ability}
              className="flex flex-wrap gap-2"
            >
              {[
                { slug: "", label: t.abilityAuto, isHidden: false },
                ...(options?.abilities ?? []),
              ].map((a) => {
                const selected = ability === a.slug;
                return (
                  <button
                    key={a.slug || "auto"}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={!options}
                    onClick={() => setAbility(a.slug)}
                    className={cn(
                      "inline-flex h-11 items-center gap-2 rounded-lg border px-3.5 font-mono text-sm transition disabled:opacity-50",
                      selected
                        ? "border-emerald-400/80 bg-emerald-400/15 text-emerald-300 shadow-[inset_0_0_14px_-6px_rgba(16,185,129,0.7),0_0_14px_-4px_rgba(16,185,129,0.5)]"
                        : "border-slate-700/80 bg-hud-1/70 text-slate-300 hover:border-emerald-400/50 hover:text-emerald-300",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-2 w-2 rounded-full transition",
                        selected
                          ? "bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.9)]"
                          : "bg-slate-600",
                      )}
                    />
                    {a.label}
                    {a.isHidden && (
                      <span className="rounded-sm border border-fuchsia-400/50 bg-fuchsia-500/15 px-1.5 py-px text-[10px] font-bold tracking-widest text-fuchsia-300 uppercase">
                        {t.abilityHiddenBadge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Chosen moves */}
          <Section
            icon={Swords}
            title={t.movesHeading(kept.length)}
            meta={
              // Marcador de rombos, como el del vestíbulo: uno encendido por
              // movimiento confirmado.
              <span aria-hidden className="flex items-center gap-1.5">
                {Array.from({ length: 4 }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-2 w-2 rotate-45 rounded-[1px] transition duration-300",
                      i < kept.length
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                        : "bg-slate-700",
                    )}
                  />
                ))}
              </span>
            }
          >
            <SelectedMoves
              slugs={kept}
              moveBySlug={moveBySlug}
              onRemove={toggle}
            />
            {parked.length > 0 && (
              // Amber on purpose: this is a caution about moves dropped at this
              // level, so it must not read as part of the team livery.
              <p className="mt-2.5 rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 font-mono text-xs leading-relaxed text-amber-300">
                {t.prunedByLevel(parked.join(", "), level)}
              </p>
            )}
            <p className="mt-2.5 font-mono text-xs leading-relaxed text-slate-500">
              {t.movesHelpLevel(level)}
            </p>
          </Section>

          {/* Entrenador IA: el atajo al catálogo. Va justo ENCIMA de las dos
              estanterías porque es la vía rápida a lo mismo — pides un set y
              te lo rellena — y quien prefiera elegir a mano lo tiene debajo,
              donde siempre estuvo. Lo que propone sale del mismo repertorio
              legal a este nivel, así que nunca aparece un movimiento que la
              lista de abajo no dejaría marcar. */}
          <Section icon={Wand2} title={t.coachMoveTitle}>
            <p className="font-mono text-xs leading-relaxed text-slate-500">
              {t.coachMoveHint(level)}
            </p>

            {/* Sugerencias por defecto: un toque y el set está puesto, sin
                tener que saber qué escribir. */}
            <p className="mt-3 font-mono text-[10px] tracking-[0.2em] text-slate-400 uppercase">
              {t.coachMovePresets}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {MOVE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={!options || coachBusy !== null}
                  onClick={() => void askCoach({ preset })}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 font-mono text-xs transition disabled:opacity-50",
                    coachBusy === preset
                      ? "border-fuchsia-400/80 bg-fuchsia-400/15 text-fuchsia-200"
                      : "border-slate-700/80 bg-hud-1/70 text-slate-300 hover:border-fuchsia-400/60 hover:text-fuchsia-200",
                  )}
                >
                  {coachBusy === preset && (
                    <Sparkles size={12} className="animate-pulse" />
                  )}
                  {t.coachMovePreset[preset]}
                </button>
              ))}
            </div>

            {/* Petición libre, para lo que las sugerencias no cubren. */}
            <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Wand2
                  size={15}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={coachPrompt}
                  disabled={!options || coachBusy !== null}
                  onChange={(e) => setCoachPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void askCoach({ prompt: coachPrompt });
                    }
                  }}
                  maxLength={300}
                  placeholder={t.coachMovePlaceholder}
                  aria-label={t.coachMoveAria}
                  className="h-11 w-full rounded-lg border border-slate-700/80 bg-hud-1/90 pr-3 pl-9 font-mono text-sm text-slate-200 outline-none transition focus:border-fuchsia-400/70 focus:shadow-[0_0_16px_-2px_rgba(217,70,239,0.55)] disabled:opacity-50"
                />
              </label>
              <button
                type="button"
                disabled={!options || coachBusy !== null}
                onClick={() => void askCoach({ prompt: coachPrompt })}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-fuchsia-400/60 bg-fuchsia-400/15 px-5 font-mono text-sm font-bold tracking-wider text-fuchsia-200 uppercase transition hover:bg-fuchsia-400/25 hover:shadow-[0_0_22px_-4px_rgba(217,70,239,0.75)] disabled:opacity-50 disabled:shadow-none"
              >
                <Sparkles
                  size={14}
                  className={cn(coachBusy !== null && "animate-pulse")}
                />
                {coachBusy !== null ? t.coachMoveRunning : t.coachMoveRun}
              </button>
            </div>

            {coachError && (
              <p className="mt-2.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-400">
                {coachError}
              </p>
            )}
            {coachNote?.motivo && (
              <p className="mt-2.5 rounded-md border border-fuchsia-400/30 bg-fuchsia-400/8 px-3 py-2 font-mono text-xs leading-relaxed text-fuchsia-100/90">
                {coachNote.motivo}
              </p>
            )}
            {coachNote?.toppedUp && (
              // Ámbar: los huecos los ha puesto el servidor, no la respuesta a
              // lo que se pidió, y eso hay que decirlo.
              <p className="mt-2 rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 font-mono text-xs leading-relaxed text-amber-300">
                {t.coachMoveToppedUp}
              </p>
            )}
          </Section>

          {/* Catalogue, split in the two shelves a build may draw from. */}
          <Section
            icon={Layers}
            title={source === "level-up" ? t.sourceLevel : t.sourceMachine}
            meta={
              options
                ? t.allMovesCount(results.length, bySource[source].length)
                : ""
            }
          >
            {/* Shelf picker: level-up moves on one side, TMs on the other. */}
            <div
              role="tablist"
              aria-label={t.moveSourceAria}
              className="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-700/70 bg-black/30 p-1"
            >
              {(
                [
                  { key: "level-up", label: t.sourceLevel, Icon: ArrowUpNarrowWide },
                  { key: "machine", label: t.sourceMachine, Icon: Disc3 },
                ] as const
              ).map(({ key, label, Icon }) => {
                const active = source === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    disabled={!options}
                    onClick={() => setSource(key)}
                    className={cn(
                      "inline-flex h-10 items-center justify-center gap-2 rounded-md font-mono text-xs tracking-wider uppercase transition disabled:opacity-50",
                      active
                        ? "bg-emerald-400/15 text-emerald-300 shadow-[inset_0_0_14px_-6px_rgba(16,185,129,0.8),0_0_16px_-6px_rgba(16,185,129,0.8)]"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                    )}
                  >
                    <Icon size={15} />
                    {label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-px font-mono text-[11px]",
                        active
                          ? "bg-emerald-400/20 text-emerald-300"
                          : "bg-black/30 text-slate-500",
                      )}
                    >
                      {bySource[key].length}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <p className="min-w-0 flex-1 font-mono text-xs leading-relaxed text-slate-500">
                {source === "level-up"
                  ? t.sourceLevelHint(level)
                  : t.sourceMachineHint}
              </p>
              {/* Only the level shelf has anything to filter by level. */}
              {source === "level-up" && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={onlyKnown}
                  disabled={!options}
                  onClick={() => setOnlyKnown((on) => !on)}
                  title={t.onlyKnownTitle(level)}
                  className={cn(
                    "ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-mono text-xs transition disabled:opacity-50",
                    onlyKnown
                      ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
                      : "border-slate-700/80 bg-hud-1/70 text-slate-400 hover:text-slate-200",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "h-2 w-2 rounded-full transition",
                      onlyKnown
                        ? "bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                        : "bg-slate-600",
                    )}
                  />
                  {t.onlyKnown(level)}
                </button>
              )}
            </div>
            <label className="relative mt-2.5 block">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-500"
              />
              <input
                type="search"
                value={query}
                disabled={!options}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.movesFilterPlaceholder}
                aria-label={t.movesFilterAria}
                className="h-11 w-full rounded-lg border border-slate-700/80 bg-hud-1/90 pr-3 pl-9 font-mono text-sm text-slate-200 outline-none transition focus:border-emerald-400/70 focus:shadow-[0_0_16px_-2px_rgba(16,185,129,0.55)] disabled:opacity-50"
              />
            </label>
            {!options && !failed && (
              <p className="mt-2.5 font-mono text-sm text-slate-500">
                {t.loadingMoves}
              </p>
            )}
            {options && results.length === 0 && (
              <p className="mt-2.5 font-mono text-sm text-slate-500">
                {t.moveNoResults(query.trim())}
              </p>
            )}
            <ul className="mt-2 flex flex-col gap-1">
              {results.map((move) => {
                const selected = moves.includes(move.slug);
                const locked = !isKnownAt(move, level);
                const full = !selected && kept.length >= 4;
                const disabled = locked || full;
                return (
                  <li key={move.slug}>
                    <button
                      type="button"
                      disabled={disabled}
                      aria-pressed={selected}
                      onClick={() => toggle(move.slug)}
                      title={
                        locked
                          ? t.notYetTitle(move.learnLevel ?? level)
                          : full
                            ? t.movesFullTitle
                            : moveTitle(move, t, lang)
                      }
                      style={{ "--aura": typeAura(move.type) } as CSSProperties}
                      className={cn(
                        "relative flex w-full items-center gap-2 overflow-hidden rounded-lg border py-2 pr-2.5 pl-3.5 text-left transition",
                        // Each row glows in its own type color, like the
                        // games' move lists.
                        selected
                          ? "border-[color-mix(in_srgb,var(--aura)_70%,transparent)] bg-[color-mix(in_srgb,var(--aura)_18%,transparent)] shadow-[inset_0_0_16px_-8px_var(--aura)]"
                          : "border-slate-800/70 bg-black/20",
                        disabled
                          ? "cursor-not-allowed opacity-40"
                          : !selected &&
                              "hover:border-[color-mix(in_srgb,var(--aura)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--aura)_10%,transparent)]",
                      )}
                    >
                      {/* Lomo del color del tipo: recorre el lateral de cada
                          fila, así el catálogo se escanea por color. */}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-y-1 left-0 w-1 rounded-full bg-[var(--aura)] transition",
                          selected
                            ? "opacity-100 shadow-[0_0_10px_var(--aura)]"
                            : "opacity-45",
                        )}
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] transition",
                          selected
                            ? "bg-[var(--aura)] font-bold text-[#0b0f1a] shadow-[0_0_8px_var(--aura)]"
                            : "border border-slate-700/80 text-slate-500",
                        )}
                      >
                        {selected ? "✓" : locked ? "🔒" : "+"}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate font-mono text-sm",
                          selected ? "font-semibold text-slate-50" : "text-slate-100",
                        )}
                      >
                        {move.label}
                      </span>
                      {/* Cómo lo aprende: es lo que decide si está disponible
                          a este nivel, así que va antes que los datos. */}
                      <span
                        className={cn(
                          "shrink-0 rounded-sm border px-1.5 py-px font-mono text-[10px] tracking-wider whitespace-nowrap uppercase",
                          locked
                            ? "border-red-500/50 bg-red-500/10 text-red-300"
                            : "border-slate-700/80 bg-black/30 text-slate-400",
                        )}
                      >
                        {learnTag(move, t)}
                      </span>
                      <MoveStats move={move} />
                    </button>
                  </li>
                );
              })}
            </ul>
            {options && (
              <p className="mt-3 border-t border-slate-800/70 pt-2.5 font-mono text-xs leading-relaxed text-slate-500">
                {t.catalogueNote}
              </p>
            )}
          </Section>
        </div>

        {/* Barra de acciones: el resumen de la build a la izquierda, guardar
            a la derecha, sobre un velo que separa del catálogo. */}
        <div className="flex shrink-0 items-center gap-3 border-t border-slate-700/60 bg-gradient-to-t from-black/40 to-transparent px-4 py-3 sm:px-5 sm:py-3.5">
          <button
            type="button"
            onClick={() => {
              setAbility("");
              setMoves([]);
            }}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-slate-700/70 bg-black/30 px-3 font-mono text-xs tracking-wider text-slate-400 uppercase transition hover:border-red-500/60 hover:text-red-400"
          >
            <RotateCcw size={13} /> {t.reset}
          </button>
          <p className="hidden min-w-0 flex-1 truncate font-mono text-xs text-slate-500 sm:block">
            {t.movesHeading(kept.length)}
          </p>
          <button
            type="button"
            onClick={save}
            className="ml-auto inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-400/60 bg-emerald-400/15 px-6 font-mono text-sm font-bold tracking-wider text-emerald-300 uppercase transition hover:-translate-y-0.5 hover:bg-emerald-400/25 hover:shadow-[0_0_22px_-2px_rgba(16,185,129,0.75)] active:translate-y-0"
          >
            <Swords size={15} />
            {t.saveBuild}
          </button>
        </div>
      </div>
    </div>
  );
}
