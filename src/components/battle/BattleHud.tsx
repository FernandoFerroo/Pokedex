"use client";

import Image from "next/image";
import {
  useCallback,
  useId,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  Atom,
  Brain,
  Bug,
  Circle,
  Cog,
  Droplets,
  Feather,
  Flame,
  FlaskRound,
  Flower,
  Gem,
  Ghost,
  Hand,
  Leaf,
  Moon,
  Mountain,
  Shield,
  Skull,
  Snowflake,
  Sparkles,
  Swords,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useSfx } from "@/components/audio/SfxProvider";
import { CommandDial } from "./hud/CommandDial";
import { StatusBox } from "./hud/StatusBox";
import {
  BAG_ITEM_IDS,
  BAG_ITEMS,
  bagCount,
  isItemUseless,
  type Bag,
  type BagItemId,
} from "@/lib/battle/items";
import { effectiveness } from "@/lib/battle/type-chart";
import { useI18n, useT } from "@/lib/i18n/client";
import type { Dict } from "@/lib/i18n";
import {
  artworkUrl,
  typeAura,
  typeLabel,
  typeSurface,
} from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";
import type { BattleMove, Battler } from "@/types/battle";

/* ------------------------------------------------------------------ */
/* Shared chrome: Sun/Moon-style dark glass panels with angular cuts   */
/* ------------------------------------------------------------------ */

/** Dark glass panel, like the SuMo databoxes floating over the field.
 *  Radius is set per use so each box can keep one sharp, angular corner. */
const glass =
  "border border-white/15 bg-gradient-to-b from-[#1b2c44]/95 to-[#0c1626]/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_18px_rgba(0,0,0,0.5)] backdrop-blur-sm";

/** White label text with the soft outline the Switch games use. */
const outlined =
  "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.5)]";

/* ------------------------------------------------------------------ */
/* Keyboard navigation                                                 */
/* ------------------------------------------------------------------ */

/** Both the arrow cluster and WASD drive the menus, like a console D-pad. */
const PREV_KEYS = new Set(["ArrowUp", "ArrowLeft", "w", "W", "a", "A"]);
const NEXT_KEYS = new Set(["ArrowDown", "ArrowRight", "s", "S", "d", "D"]);

/**
 * D-pad navigation over a group of command buttons: arrows (or WASD) walk the
 * enabled options and wrap around at the ends, Home/End jump to the extremes.
 *
 * Enter and Space are deliberately left alone — a native `<button>` already
 * activates on both, and not intercepting them is exactly what keeps the menu
 * working under a screen reader, which synthesizes clicks rather than keys.
 * Every option also stays in the Tab order, so the arrows are an addition to
 * the standard traversal, never a replacement for it.
 */
function useDpadNav() {
  return useCallback((event: ReactKeyboardEvent<HTMLElement>) => {
    const { key } = event;
    const step = PREV_KEYS.has(key) ? -1 : NEXT_KEYS.has(key) ? 1 : 0;
    if (step === 0 && key !== "Home" && key !== "End") return;

    const options = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        "button:not([disabled])",
      ),
    );
    if (options.length === 0) return;
    event.preventDefault();

    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      key === "Home"
        ? 0
        : key === "End"
          ? options.length - 1
          : current === -1
            ? step === 1
              ? 0
              : options.length - 1
            : (current + step + options.length) % options.length;
    options[next]?.focus();
  }, []);
}

/**
 * Moves the keyboard onto the first enabled option as soon as a menu opens.
 * Without it a keyboard user would have to Tab back in from the top of the
 * arena every single turn, since the menus mount and unmount with the phase.
 */
function useAutoFocusFirst<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current
      ?.querySelector<HTMLButtonElement>("button:not([disabled])")
      ?.focus();
  }, []);
  return ref;
}

/** Spoken-only hint, read out as part of each menu's group description. */
function KeyboardHint() {
  const a11y = useT().a11y;
  return <p className="sr-only">{a11y.keyboardHint}</p>;
}

/* ------------------------------------------------------------------ */
/* HP bar                                                             */
/* ------------------------------------------------------------------ */

/** The three health tiers, stacked so the bar crossfades between them. */
const HP_GREEN = "linear-gradient(180deg, #86efac, #22c55e 55%, #16a34a)";
const HP_AMBER = "linear-gradient(180deg, #fde68a, #f59e0b 55%, #d97706)";
const HP_RED = "linear-gradient(180deg, #fca5a5, #ef4444 55%, #dc2626)";

/** Smooth 0→1 ramp between two percentages (no hard color snap). */
const ramp = (pct: number, from: number, to: number) =>
  Math.min(1, Math.max(0, (pct - from) / (to - from)));

/** Neon halo color matching the tier the bar is currently showing. */
function hpGlow(pct: number): string {
  if (pct > 50) return "#22c55e";
  if (pct > 20) return "#f59e0b";
  return "#ef4444";
}

/**
 * HP gauge. The bar itself carries `role="progressbar"` with the raw HP
 * values (not the percentage), so a screen reader announces "Garchomp,
 * 45 of 120 PS" instead of an abstract "38%".
 */
export function HpBar({
  hp,
  maxHp,
  name,
}: {
  hp: number;
  maxHp: number;
  /** Battler this gauge belongs to, for the accessible name. */
  name: string;
}) {
  const { battle, a11y } = useT();
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  // Below a fifth of its health the gauge pulses, mirroring the alarm beep
  // the soundboard starts at exactly the same threshold.
  const critical = hp > 0 && pct <= 20;
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className="rounded-sm bg-[#f59e0b] px-1 py-px font-display text-[9px] leading-none font-bold text-[#1c1204]"
      >
        {battle.hp}
      </span>
      <div
        role="progressbar"
        aria-label={a11y.hpBarAria(name)}
        aria-valuemin={0}
        aria-valuemax={maxHp}
        aria-valuenow={Math.max(0, hp)}
        aria-valuetext={a11y.hpValueText(Math.max(0, hp), maxHp)}
        style={{ "--hp-glow": hpGlow(pct) } as CSSProperties}
        className={cn(
          "relative h-2.5 flex-1 overflow-hidden rounded-full border border-white/20 bg-[#0a1220]/90 shadow-[inset_0_1px_3px_rgba(0,0,0,0.9),0_0_10px_-2px_var(--hp-glow)] backdrop-blur-sm transition-shadow duration-500",
          critical && "hp-critical",
        )}
      >
        {/* Pale trail draining behind the bar: the SuMo-style fluid HP loss. */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/45 transition-[width] duration-1000 ease-out delay-300"
          style={{ width: `${pct}%` }}
        />
        {/* Fill: red underneath, amber and green fading out over it as the
            health drops, so the color slides instead of snapping tiers. */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        >
          <span className="absolute inset-0" style={{ background: HP_RED }} />
          <span
            className="absolute inset-0 transition-opacity duration-700"
            style={{ background: HP_AMBER, opacity: ramp(pct, 12, 30) }}
          />
          <span
            className="absolute inset-0 transition-opacity duration-700"
            style={{ background: HP_GREEN, opacity: ramp(pct, 35, 55) }}
          />
          {/* Glass highlight riding the top of the fill. */}
          <span className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-gradient-to-b from-white/45 to-transparent" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Databoxes (enemy: no numbers · player: numbers + EXP strip)         */
/* ------------------------------------------------------------------ */

/**
 * Caja de estado del combatiente. El panel hexagonal vive en `hud/StatusBox`;
 * este envoltorio conserva el nombre que usa la arena.
 */
export const Databox = StatusBox;

/** Cifra de daño y marcador de racha, los dos rótulos que van sobre el campo. */
export { ComboMeter, DamageNumber } from "./hud/HitFx";

/** Row of mini Poké Balls: one per team member, grayed out when fainted. */
export function TeamPips({
  team,
  className,
}: {
  team: Battler[];
  className?: string;
}) {
  const a11y = useT().a11y;
  const alive = team.filter((b) => b.hp > 0).length;
  return (
    // The pips are a picture of a number: give assistive tech the number and
    // hide the decorative balls, instead of reading six unlabeled dots.
    <div
      role="img"
      aria-label={a11y.teamPipsAria(alive, team.length)}
      className={cn("flex gap-1", className)}
    >
      {team.map((b) => (
        <span
          key={b.id}
          aria-hidden
          title={b.label}
          className={cn(
            "h-2.5 w-2.5 rounded-full border",
            b.hp > 0
              ? "border-black/60 bg-gradient-to-b from-[#ef4444] from-50% to-[#f8fafc] to-50% shadow-[0_0_4px_rgba(239,68,68,0.6)]"
              : "border-[#475569] bg-[#334155]",
          )}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Message bar with typewriter text (bottom strip, like the Switch)    */
/* ------------------------------------------------------------------ */

/**
 * The battle log. Visually it is the Switch-style text window with its
 * typewriter reveal; for assistive tech it is a polite live region.
 *
 * The two are deliberately separated: announcing the animating slice would
 * make a screen reader stutter its way through "Ga… Garch… Garchomp usó…" as
 * every tick re-fires the region. So the typed text is hidden from the
 * accessibility tree and the *whole* line is mirrored in an off-screen
 * `role="status"`, which announces each event once, complete, and without
 * stealing focus mid-turn.
 */
export function MessageBox({
  text,
  speed = 1,
}: {
  text: string;
  /**
   * A qué velocidad se teclea, respecto al compás normal. Tiene que ser el
   * MISMO multiplicador con el que la arena acorta sus pausas: el compás de
   * cada frase está calculado sobre este ritmo de tecleo, así que ir más
   * despacio aquí significa que la siguiente línea pisa a la anterior a medio
   * escribir.
   */
  speed?: number;
}) {
  const a11y = useT().a11y;
  // Render-phase reset: a new message restarts the typewriter from zero.
  const [typed, setTyped] = useState({ text, count: text.length });
  if (typed.text !== text) setTyped({ text, count: 0 });
  const count = typed.text === text ? typed.count : 0;

  useEffect(() => {
    // Reduced motion reveals the full line on the first tick.
    // Se acelera con MÁS letras por tic, no con un intervalo más corto: por
    // debajo de los 10 ms el navegador impone su propio suelo a setInterval y
    // el texto sale a tirones en vez de más rápido.
    const step = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? Number.MAX_SAFE_INTEGER
      : Math.max(1, Math.round(2 * speed));
    const id = window.setInterval(() => {
      setTyped((t) => {
        if (t.text !== text || t.count >= text.length) {
          clearInterval(id);
          return t;
        }
        return { text, count: Math.min(text.length, t.count + step) };
      });
    }, 18);
    return () => clearInterval(id);
  }, [text, speed]);

  return (
    // Console text window: angled glass panel with a lit leading edge, cut
    // from the same shape language as the status boxes.
    <div
      className={cn(
        "relative flex min-h-[5rem] items-center px-7 py-4",
        "max-sm:min-h-[3.4rem] max-sm:px-3 max-sm:py-2.5",
        "[clip-path:polygon(0_14%,1.4%_0,100%_0,100%_86%,98.6%_100%,0_100%)]",
        // Ventana de diálogo de consola: casi opaca y con el filo encendido.
        // Translúcida sobre un estadio iluminado, la línea que cuenta el
        // combate competía con el graderío y se perdía.
        "border-y-2 border-[#22d3ee]/70 bg-gradient-to-b from-[#0d1b30]/97 to-[#05090f]/98 backdrop-blur-md",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_-3px_26px_rgba(0,0,0,0.8),0_0_30px_-12px_#22d3ee]",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gradient-to-b from-transparent via-[#ff7a7a] to-transparent shadow-[0_0_10px_1px_#ff7a7a]"
      />
      <p
        aria-hidden
        className={cn(
          outlined,
          // La línea que cuenta el combate: tipografía de titular, como el resto
          // de la web, y con cuerpo suficiente para leerse de un vistazo
          // mientras la animación sigue corriendo.
          "font-display text-xl leading-snug font-bold tracking-wide text-[#fdfbf3]",
          "max-sm:text-[15px] sm:text-[27px]",
        )}
      >
        {text.slice(0, count)}
        {count < text.length && (
          <span className="cursor-blink ml-1.5 text-[#ff7a7a]">▼</span>
        )}
      </p>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={a11y.battleLogAria}
        className="sr-only"
      >
        {text}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rótulo de impacto (supereficaz, crítico)                            */
/* ------------------------------------------------------------------ */

/** Qué tan fuerte suena el rótulo, que decide su color y su tamaño. */
export type StingerKind = "super" | "crit" | "resist" | "immune" | "ko";

/**
 * El grito del golpe: «¡ES SUPEREFICAZ!» en grande, sobre el campo.
 *
 * En los juegos esa línea llega en la caja de texto y además con su propio
 * sonido, y es la información que más decide el turno siguiente. Aquí llegaba
 * sólo como una línea más del registro, del mismo tamaño que «Pikachu usó
 * Impactrueno», así que se perdía justo cuando importaba.
 *
 * Va `aria-hidden` a propósito: la caja de mensajes ya anuncia exactamente
 * este mismo texto por su `role="status"`, y una segunda región viva haría que
 * un lector de pantalla dijera cada golpe dos veces.
 */
export function Stinger({ kind, text }: { kind: StingerKind; text: string }) {
  const tone: Record<StingerKind, string> = {
    // Colores fijados a mano: el rótulo se dibuja sobre el campo, que mantiene
    // su noche en los dos temas, así que no deben remapearse con el claro.
    super: "text-[#fde047] [text-shadow:0_2px_0_#7c2d12,0_0_24px_rgba(253,224,71,0.75)]",
    crit: "text-[#fca5a5] [text-shadow:0_2px_0_#7f1d1d,0_0_24px_rgba(248,113,113,0.75)]",
    resist: "text-[#bae6fd] [text-shadow:0_2px_0_#0c4a6e,0_0_18px_rgba(186,230,253,0.6)]",
    immune: "text-[#e2e8f0] [text-shadow:0_2px_0_#1e293b,0_0_18px_rgba(226,232,240,0.5)]",
    // El K.O. es el único rótulo con contorno propio: se dibuja encima del
    // Pokémon que se está desplomando y necesita ganarle al desorden de abajo.
    ko: "text-[#fff1f2] [text-shadow:0_0_2px_#000,0_4px_0_#7f1d1d,0_0_38px_rgba(244,63,94,0.95)]",
  };
  const isKo = kind === "ko";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-[34%] z-10 flex justify-center"
    >
      <span
        className={cn(
          "font-display font-black tracking-[0.06em] uppercase",
          isKo ? "fx-ko" : "fx-stinger",
          isKo ? "text-5xl sm:text-8xl" : "text-2xl sm:text-5xl",
          kind === "resist" || kind === "immune" ? "text-xl sm:text-3xl" : "",
          tone[kind],
        )}
      >
        {text}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Command pills (the SwSh bottom-right column)                        */
/* ------------------------------------------------------------------ */

export function ActionMenu({
  onFight,
  onBag,
  onSwitch,
  onFlee,
  bag,
  canSwitch,
}: {
  onFight: () => void;
  onBag: () => void;
  onSwitch: () => void;
  onFlee: () => void;
  bag: Bag;
  canSwitch: boolean;
}) {
  const onKeyDown = useDpadNav();
  const ref = useAutoFocusFirst<HTMLDivElement>();
  // The four commands are neon-glass keys with their own drawn glyphs; the
  // group keeps the D-pad navigation and the autofocus the menus rely on.
  return (
    <CommandDial
      groupRef={ref}
      onKeyDown={onKeyDown}
      onFight={onFight}
      onSwitch={onSwitch}
      onBag={onBag}
      onFlee={onFlee}
      canSwitch={canSwitch}
      canUseBag={bagCount(bag) > 0}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Move pills (type-colored, with PP and the effectiveness hint)       */
/* ------------------------------------------------------------------ */

/** Symbol per type: the move pill is recognizable before reading it. */
const TYPE_ICON: Record<string, LucideIcon> = {
  normal: Circle,
  fire: Flame,
  water: Droplets,
  electric: Zap,
  grass: Leaf,
  ice: Snowflake,
  fighting: Hand,
  poison: Skull,
  ground: Mountain,
  flying: Feather,
  psychic: Brain,
  bug: Bug,
  rock: Gem,
  ghost: Ghost,
  dragon: Atom,
  dark: Moon,
  steel: Cog,
  fairy: Flower,
};

/** Damage class glyph: blades for physical, sparks for special, a shield for
 *  status — the same three categories the games print on the move sheet. */
const CLASS_ICON: Record<BattleMove["damageClass"], LucideIcon> = {
  physical: Swords,
  special: Sparkles,
  status: Shield,
};

/**
 * La eficacia de cada ataque, al lado de cada ataque, como en los juegos desde
 * la sexta generación.
 *
 * El TEXTO es quien lleva el significado, y esa decisión no se toca. La
 * etiqueta llegó a estar coloreada y hubo que quitarle el color por dos cosas
 * distintas, que conviene no confundir:
 *
 * · apoyaba el sentido SÓLO en el color (WCAG 1.4.1) — eso sigue prohibido, y
 *   por eso aquí van siempre las tres capas: palabra, glifo y tinta, y la
 *   palabra basta por sí sola;
 * · la tinta salía sobre la pastilla del tipo, o sea sobre dieciocho fondos
 *   distintos, y no llegaba al 4.5:1 en varios. Eso lo arregló el chip de
 *   fondo fijo: hoy la etiqueta se lee sobre negro al 70 %, un único fondo
 *   medible, y ahí el color vuelve a caber — como REFUERZO del texto, nunca
 *   en su lugar.
 *
 * Verde para lo que castiga, ámbar para lo que rebota, pizarra para lo que no
 * llega; el neutro se queda en blanco, que es la ausencia de aviso.
 */
interface Hint {
  text: string;
  glyph: string;
  strong: boolean;
  /** Tinta del chip, medida sobre negro al 70 %: refuerzo, no significado. */
  tone: string;
}

function effectivenessHint(mult: number, t: Dict["battle"]): Hint {
  if (mult === 0)
    return {
      text: t.hintNoEffect,
      glyph: "✕",
      strong: false,
      tone: "text-[#cbd5e1]",
    };
  if (mult >= 4)
    return {
      text: t.hintSuper,
      glyph: "▲▲",
      strong: true,
      tone: "text-[#86efac]",
    };
  if (mult > 1)
    return {
      text: t.hintSuper,
      glyph: "▲",
      strong: true,
      tone: "text-[#86efac]",
    };
  if (mult <= 0.25)
    return {
      text: t.hintNotVery,
      glyph: "▼▼",
      strong: false,
      tone: "text-[#fdba74]",
    };
  if (mult < 1)
    return {
      text: t.hintNotVery,
      glyph: "▼",
      strong: false,
      tone: "text-[#fdba74]",
    };
  // Neutro. Antes no dibujaba nada, y el hueco se leía como «todavía no lo ha
  // calculado» en vez de como «ni bien ni mal»: con cuatro ataques delante, la
  // pregunta es por los cuatro, no sólo por los que destacan.
  return { text: t.hintNeutral, glyph: "●", strong: false, tone: "text-white" };
}

export function MoveMenu({
  moves,
  targetTypes,
  onPick,
  onBack,
}: {
  moves: BattleMove[];
  /** Types of the enemy's active Pokémon, for the SwSh effectiveness tag. */
  targetTypes: string[];
  onPick: (move: BattleMove) => void;
  onBack: () => void;
}) {
  const { lang, dict } = useI18n();
  const a11y = dict.a11y;
  const sfx = useSfx();
  const onKeyDown = useDpadNav();
  const ref = useAutoFocusFirst<HTMLDivElement>();
  return (
    // Arrows / WASD walk the four moves (and the back pill) and wrap around;
    // Enter and Space confirm, natively. Focus lands on the first usable move
    // the moment the menu opens, so a turn never needs the mouse.
    <div
      ref={ref}
      role="group"
      aria-label={a11y.movesMenuAria}
      onKeyDown={onKeyDown}
      // Rejilla 2x2, como en los juegos: los cuatro ataques ocupan el cuadrante
      // inferior derecho y «Volver» cruza debajo. En columna medían el doble de
      // alto y empujaban tu ficha hasta la mitad del campo, encima del Pokémon
      // rival — que es exactamente donde no tiene que estar.
      className="grid grid-cols-2 gap-1.5 sm:gap-2"
    >
      <KeyboardHint />
      {moves.map((move) => {
        const aura = typeAura(move.type);
        const { ink, base, inkShadow } = typeSurface(move.type);
        const TypeIcon = TYPE_ICON[move.type] ?? Circle;
        const ClassIcon = CLASS_ICON[move.damageClass];
        const category =
          move.damageClass === "physical"
            ? dict.battle.classPhysical
            : move.damageClass === "special"
              ? dict.battle.classSpecial
              : dict.battle.classStatus;
        // La tabla de tipos no se aplica a un movimiento de estado, así que no
        // lleva etiqueta: cualquier palabra ahí — «eficaz», «estado» — se lee
        // como un veredicto de eficacia que nadie ha calculado. Su categoría
        // ya la dice el escudo de la derecha.
        const hint =
          move.damageClass === "status"
            ? null
            : effectivenessHint(
                effectiveness(move.type, targetTypes),
                dict.battle,
              );
        const type = typeLabel(move.type, lang);
        return (
          <button
            key={move.slug}
            type="button"
            disabled={move.pp === 0}
            onClick={() => {
              sfx.play("confirm");
              onPick(move);
            }}
            onPointerEnter={() => move.pp > 0 && sfx.play("menu")}
            // The pill's own layout (name / tag / "PP 12/15") reads as
            // disconnected fragments out loud, so the whole option gets one
            // spoken sentence instead.
            // Category and power ride along with the spoken option so the
            // pill's new chips are not sighted-only information.
            aria-label={`${a11y.moveOptionAria(
              move.label,
              type,
              move.pp,
              move.maxPp,
              move.pp === 0 ? a11y.moveNoPp : (hint?.text ?? null),
            )} ${category}${
              move.damageClass === "status" || move.power === null
                ? ""
                : `, ${dict.battle.powerShort} ${move.power}`
            }.`}
            style={
              {
                // The light stop stays inside the top third, where the gloss
                // sits and no glyph reaches; from 34% down the pill is a flat
                // `base`, the surface `typeSurface` measured `ink` against.
                background: `linear-gradient(180deg, color-mix(in srgb, ${base} 84%, #fff) 0%, ${base} 34%, ${base} 100%)`,
                boxShadow: `inset 0 2px 0 rgba(255,255,255,0.3), 0 3px 10px rgba(0,0,0,0.5), 0 0 20px -5px ${aura}`,
                color: ink,
                textShadow: inkShadow,
              } as CSSProperties
            }
            className={cn(
              "w-full rounded-[16px_6px_16px_6px] border-2 border-white/30 px-4 py-1.5 text-left transition",
              "max-sm:h-full max-sm:rounded-[12px_5px_12px_5px] max-sm:border max-sm:px-2 max-sm:py-1",
              "enabled:hover:scale-[1.03] enabled:hover:brightness-110 enabled:active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50",
            )}
          >
            {/* El nombre, para él solo y a línea completa. Compartiendo fila
                con la etiqueta de eficacia se quedaba en «Lanz…», y el nombre
                del movimiento es lo primero que se lee. */}
            <span
              aria-hidden
              className="block truncate font-display text-base font-bold tracking-wide max-sm:text-[13px] sm:text-lg"
            >
              {move.label}
            </span>
            <span
              aria-hidden
              className="mt-0.5 flex items-center justify-between gap-1.5"
            >
              {/* Pinned #000 at 65%: the chip must stay dark on the colored
                  pill in both themes (bg-black flips to white in light mode),
                  and 65% is what keeps its white label above 4.5:1 even on
                  the brightest auras (eléctrico, hielo). */}
              <span className="flex min-w-0 items-center gap-1 rounded-sm bg-[#000000]/65 px-1.5 py-px text-[11px] font-bold tracking-widest text-white uppercase [text-shadow:0_1px_2px_rgba(0,0,0,0.9)] max-sm:px-1 max-sm:text-[9px] max-sm:tracking-normal">
                <TypeIcon size={11} className="shrink-0" />
                <span className="truncate">{type}</span>
              </span>
              {/* Category glyph + base power, the two numbers that decide the
                  turn, next to the PP counter. */}
              <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-semibold max-sm:gap-1 max-sm:text-[10px]">
                <span
                  title={category}
                  className="flex items-center gap-0.5 opacity-95"
                >
                  <ClassIcon size={12} />
                  {move.damageClass !== "status" && (
                    <span className="tabular-nums">{move.power ?? "—"}</span>
                  )}
                </span>
                <span className="tabular-nums">
                  PP {move.pp}
                  <span className="opacity-80">/{move.maxPp}</span>
                </span>
              </span>
            </span>
            {hint && (
              // La eficacia, a línea completa y para ella sola.
              //
              // Compartía sitio con la chapa de tipo, y era el peor sitio
              // posible: en la rejilla de dos columnas el hueco daba para una
              // de las dos, así que «Poco eficaz» se quedaba en «Poco…» —
              // justo la parte que no dice nada— y en móvil desaparecía. Es la
              // respuesta a la única pregunta que se hace en este menú, así
              // que ocupa su propio renglón y no compite con nada.
              //
              // Chip de fondo FIJO, no derivado del tipo: así hay UN par de
              // contrastes que verificar en vez de dieciocho, y la etiqueta se
              // despega de la pastilla de color en lugar de fundirse con ella.
              // Glifo y color acompañan al texto; ninguno lo sustituye.
              <span
                aria-hidden
                // Ni versalitas ni interletraje: la columna de ataques mide dos
                // pastillas de ancho, y en mayúsculas «¡Súper eficaz!» se
                // quedaba en «¡SÚPER E…». Se lee en caja baja, que ocupa un
                // tercio menos, y si aun así no cabe parte la línea en vez de
                // cortar la palabra — una etiqueta a medias no informa de nada.
                className={cn(
                  "mt-1 flex w-full items-start gap-1 rounded-sm bg-[#000000]/70 px-1.5 py-0.5",
                  "text-[11px] leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]",
                  "max-sm:mt-0.5 max-sm:px-1 max-sm:text-[9px]",
                  hint.tone,
                  hint.strong ? "font-extrabold" : "font-semibold",
                )}
              >
                <span className="shrink-0">{hint.glyph}</span>
                <span className="min-w-0">{hint.text}</span>
              </span>
            )}
          </button>
        );
      })}
      <span className="max-sm:col-span-2">
        <BackPill onClick={onBack} />
      </span>
    </div>
  );
}

/** Dark "back" pill closing a submenu, like the B-button hint. */
function BackPill({ onClick }: { onClick: () => void }) {
  const t = useT();
  const sfx = useSfx();
  return (
    <button
      type="button"
      onClick={() => {
        sfx.play("cancel");
        onClick();
      }}
      onPointerEnter={() => sfx.play("menu")}
      className={cn(
        glass,
        outlined,
        "h-9 w-full rounded-[14px_6px_14px_6px] text-xs font-bold tracking-widest uppercase transition hover:brightness-125",
      )}
    >
      {t.battle.back}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Bag                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Lo que el jugador metió en la mochila antes del combate. Solo se listan los
 * objetos que quedan; los que ahora mismo no harían nada (una Poción a PS
 * llenos, Revivir sin nadie debilitado) se muestran apagados con el motivo.
 *
 * En rejilla 2x2 y con el alto atado al hueco de mandos, por la misma razón que
 * los ataques y por una peor: el hueco mide 12,5 rem y está pegado ABAJO, así
 * que una lista en columna crece HACIA ARRIBA. Seis objetos medían el triple
 * que el hueco, se subían por encima de tu ficha y se salían del marco de la
 * arena — que recorta (`overflow-hidden`) —, y lo primero en irse era la fila
 * de arriba: la Poción, que es la que abre `BAG_ITEM_IDS`. O sea que el objeto
 * más usado del juego era literalmente el único imposible de pulsar.
 */
export function BagMenu({
  bag,
  active,
  hasFaintedAlly,
  onUse,
  onBack,
}: {
  bag: Bag;
  /** Battler the item would act on, to grey out what wouldn't do anything. */
  active: Battler;
  hasFaintedAlly: boolean;
  onUse: (item: BagItemId) => void;
  onBack: () => void;
}) {
  const { bag: t, a11y } = useT();
  const sfx = useSfx();
  const onKeyDown = useDpadNav();
  const ref = useAutoFocusFirst<HTMLDivElement>();
  const carried = BAG_ITEM_IDS.filter((id) => (bag[id] ?? 0) > 0);
  return (
    <div
      ref={ref}
      role="group"
      aria-label={a11y.bagMenuAria}
      onKeyDown={onKeyDown}
      // `max-h-full` y no `60vh`: el 60vh se mide contra la VENTANA, que no
      // sabe nada del hueco de mandos, así que no lo contenía. Atado al hueco,
      // seis objetos caben en tres filas; y si algún día no cupieran, el
      // desbordamiento se resuelve dentro con barra en vez de saliéndose del
      // marco. En el teléfono el carril ya es una franja que rueda entera y el
      // hueco no tiene alto fijo, así que ahí manda el 60vh de siempre.
      className="grid max-h-[60vh] grid-cols-2 gap-1.5 overflow-y-auto sm:max-h-full sm:gap-2"
    >
      <KeyboardHint />
      {carried.length === 0 && (
        <p className={cn(glass, outlined, "col-span-2 rounded-lg px-3 py-2 text-xs")}>
          {t.noneLeft}
        </p>
      )}
      {carried.map((id) => {
        const count = bag[id] ?? 0;
        const useless = isItemUseless(id, active, hasFaintedAlly);
        const tint = BAG_ITEMS[id].tint;
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              sfx.play("confirm");
              onUse(id);
            }}
            onPointerEnter={() => !useless && sfx.play("menu")}
            disabled={useless}
            title={useless ? t.useless : undefined}
            aria-label={`${t.itemName[id]} ×${count}. ${t.itemDesc[id]} ${
              useless ? t.useless : t.turnCost
            }`}
            style={
              {
                // Gradiente en el color del objeto, con la parada clara
                // confinada al 34% superior para que el texto blanco mantenga
                // contraste, igual que los mandos del menú principal.
                background: `linear-gradient(180deg, ${tint} 0%, color-mix(in srgb, ${tint} 45%, #000) 34%, color-mix(in srgb, ${tint} 25%, #000) 100%)`,
                boxShadow: `inset 0 2px 0 rgba(255,255,255,0.3), 0 3px 10px rgba(0,0,0,0.5), 0 0 20px -5px ${tint}`,
              } as CSSProperties
            }
            className={cn(
              "w-full rounded-[18px_6px_18px_6px] border-2 border-white/30 px-3 py-1.5 text-left transition",
              "enabled:hover:scale-[1.02] enabled:hover:brightness-110 enabled:active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50",
            )}
          >
            <span
              className={cn(
                outlined,
                "flex items-center gap-1.5 text-[13px] font-bold",
              )}
            >
              <FlaskRound size={14} className="shrink-0" />
              <span className="truncate">{t.itemName[id]}</span>
              <span className="ml-auto shrink-0">×{count}</span>
            </span>
            {/* A media columna la descripción es un recordatorio, no la ficha
                del objeto: se queda en una línea. Quien la necesite entera la
                tiene en el nombre accesible del botón, que ya la lleva. */}
            <span
              className={cn(
                outlined,
                "mt-px block truncate text-[10px] font-medium",
              )}
            >
              {t.itemDesc[id]}
            </span>
          </button>
        );
      })}
      {/* «Volver» cruza las dos columnas, igual que bajo los ataques. */}
      <div className="col-span-2">
        <BackPill onClick={onBack} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Party screen (the SwSh "Pokémon" list, as a full overlay)           */
/* ------------------------------------------------------------------ */

export function SwitchMenu({
  team,
  active,
  forced,
  mode = "switch",
  onPick,
  onBack,
}: {
  team: Battler[];
  active: number;
  /** Forced replacement after a faint: no back button. */
  forced: boolean;
  /** "revive" flips the selection: only fainted members can be picked. */
  mode?: "switch" | "revive";
  onPick: (index: number) => void;
  onBack: () => void;
}) {
  const { battle: t, bag: tBag, a11y } = useT();
  const sfx = useSfx();
  const onKeyDown = useDpadNav();
  const ref = useAutoFocusFirst<HTMLDivElement>();
  const reviving = mode === "revive";
  const titleId = useId();
  const title = reviving
    ? tBag.whichPokemon
    : forced
      ? t.whichSwitch
      : t.choosePokemon;
  return (
    // A forced replacement has no way out, so it is a modal dialog: it covers
    // the arena and the battle cannot continue until a Pokémon is chosen.
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      className="absolute inset-0 z-30 flex flex-col gap-3 overflow-y-auto bg-[#07101d]/90 p-4 backdrop-blur-sm sm:p-6"
    >
      <h2
        id={titleId}
        className={cn(outlined, "text-base font-bold tracking-wide")}
      >
        {title}
      </h2>
      <KeyboardHint />
      <div
        role="group"
        aria-label={a11y.partyMenuAria}
        className="grid flex-1 grid-cols-2 content-start gap-2 max-sm:gap-1"
      >
        {team.map((b, i) => {
          const fainted = b.hp <= 0;
          const disabled = reviving ? !fainted : fainted || i === active;
          const aura = typeAura(b.types[0]);
          const status = fainted
            ? t.statusFainted
            : i === active
              ? t.statusActive
              : null;
          return (
            <button
              key={b.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                sfx.play("confirm");
                onPick(i);
              }}
              onPointerEnter={() => !disabled && sfx.play("menu")}
              // Name, level, HP and status as one sentence — the visual row
              // is four separate fragments plus a gauge.
              aria-label={[
                b.label,
                `${t.lvShort} ${b.level}`,
                a11y.hpValueText(Math.max(0, b.hp), b.maxHp),
                status,
              ]
                .filter(Boolean)
                .join(", ")}
              style={{ "--aura": aura } as CSSProperties}
              className={cn(
                "flex items-center gap-3 rounded-full border-2 bg-gradient-to-r from-[#18293f]/95 to-[#101c2e]/95 py-1.5 pr-4 pl-2 text-left transition",
                i === active
                  ? "border-[#67e8f9]/70 shadow-[0_0_16px_-4px_rgba(103,232,249,0.7)]"
                  : "border-white/15",
                !disabled &&
                  "hover:scale-[1.015] hover:border-[color-mix(in_srgb,var(--aura)_70%,white)] hover:shadow-[0_0_18px_-4px_var(--aura)]",
                fainted && "opacity-60 saturate-0",
                disabled && "cursor-not-allowed",
              )}
            >
              {/* The row is spoken through the button's aria-label above, so
                  its pieces (including the nested HP gauge, which would
                  otherwise be announced as a second progressbar) stay out of
                  the accessibility tree. */}
              <span
                aria-hidden
                className="relative h-12 w-12 shrink-0 rounded-full border border-white/20 bg-black/40"
              >
                <Image
                  src={artworkUrl(b.id)}
                  alt=""
                  fill
                  sizes="48px"
                  className={cn("object-contain p-0.5", fainted && "grayscale")}
                />
              </span>
              <span aria-hidden className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={cn(outlined, "truncate text-sm font-bold")}>
                    {b.label}
                  </span>
                  <span className={cn(outlined, "shrink-0 text-xs font-semibold")}>
                    <span className="mr-0.5 text-[10px] text-[#cbd5e1]">
                      {t.lvShort}
                    </span>
                    {b.level}
                  </span>
                </span>
                <HpBar hp={b.hp} maxHp={b.maxHp} name={b.label} />
                <span className="mt-0.5 flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-widest uppercase",
                      // Pinned hexes: the party overlay keeps its dark glass
                      // in both themes, so the status colors must not remap.
                      fainted
                        ? "text-[#f87171]"
                        : i === active
                          ? "text-[#67e8f9]"
                          : "text-transparent",
                    )}
                  >
                    {status ?? "—"}
                  </span>
                  <span className={cn(outlined, "text-[11px] font-semibold")}>
                    {b.hp}
                    <span className="text-[#cbd5e1]">/{b.maxHp}</span>
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {!forced && (
        <div className="w-48 self-end">
          <BackPill onClick={onBack} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rival trainer speech bubble                                         */
/* ------------------------------------------------------------------ */

export function DialogueBubble({
  avatar,
  name,
  text,
  pixel = false,
}: {
  avatar: string | null;
  name: string;
  text: string;
  /**
   * El retrato es un sprite de Entrenador (80×80 de pixel art) y no un busto
   * pintado: se acerca a la cara, que en esos sprites vive en el tercio de
   * arriba, y se escala sin suavizar.
   */
  pixel?: boolean;
}) {
  const a11y = useT().a11y;
  return (
    // A labelled group, not a live region: the rival's banter is flavour and
    // would fight the battle log for the announcement queue every turn.
    <div
      role="group"
      aria-label={a11y.dialogueAria(name)}
      className="fx-bubble-pop pointer-events-none flex max-w-md items-start gap-2.5"
    >
      <span
        aria-hidden
        className="relative mt-1 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-[#101c2e] shadow-[0_2px_8px_rgba(0,0,0,0.6)] max-sm:h-10 max-sm:w-10"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            className={cn(
              "h-full w-full",
              pixel
                ? "origin-top scale-[2.1] object-contain object-top"
                : "object-cover",
            )}
            style={pixel ? { imageRendering: "pixelated" } : undefined}
          />
        ) : (
          <span className="font-display text-base font-bold text-[#f87171]">
            {name.charAt(0)}
          </span>
        )}
      </span>
      <div className={cn(glass, "rounded-2xl rounded-tl-sm px-3.5 py-2")}>
        <p className="font-display text-[13px] font-bold tracking-[0.14em] text-[#fca5a5] uppercase max-sm:text-[11px]">
          {name}
        </p>
        <p className={cn(outlined, "mt-1 text-base leading-snug font-semibold max-sm:text-[13px]")}>
          {text}
        </p>
      </div>
    </div>
  );
}
