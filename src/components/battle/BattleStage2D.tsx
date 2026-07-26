"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { ChargeStance, Side } from "@/types/battle";
import { Platform2D } from "./scene/Platform2D";
import { Scenery } from "./scene/Scenery";
import { TrainerFigure } from "./scene/TrainerFigure";
import { PALETTES, type ScenarioKey, type Weather } from "./scene/palettes";

export type { ScenarioKey } from "./scene/palettes";

/** What the stage needs to draw one combatant. */
export interface SpriteView {
  /**
   * Identity of whoever is on the field: `${side}-${slot}-${id}`. The stage
   * keys the whole `Fighter` on it, so a switch or a replacement mounts a
   * fresh one instead of reusing the previous occupant's image state.
   */
  key: string;
  /** Official artwork, the fallback for species Showdown never animated. */
  art: string | null;
  /** Animated Showdown sprite — back view for your side, front for the
      rival. This is what the arena draws, like the 2D games do. */
  url: string;
  /** Neon accent of the creature's primary type (drop-shadow). */
  aura: string;
  /** Localized species name, for the sprite's alt text. */
  label: string;
}

/** How hard a landed move hits, driving flash, shake and recoil intensity. */
export interface ImpactInfo {
  /** Type multiplier of the move against the defender (0, 0.25… 4). */
  effectiveness: number;
  /** Damage dealt as a fraction of the defender's max HP (0-1). */
  ratio: number;
  crit: boolean;
}

/**
 * Duración de cada cinemática de la 7.ª generación, en milisegundos.
 *
 * La arena espera exactamente estos números entre paso y paso — lanza la
 * bola, aguarda `ballFlight`, revela al Pokémon —, así que son el contrato
 * entre el guion del combate y las animaciones de esta hoja. Cambiar uno aquí
 * lo cambia en los dos sitios; su gemelo en CSS vive en el bloque
 * «CINEMÁTICAS DE LA 7.ª GENERACIÓN» de globals.css.
 */
export const GEN7 = {
  /** Vuelo de la Poké Ball desde la mano hasta la plataforma. */
  ballFlight: 420,
  /** Apertura: el fogonazo del que sale el Pokémon. */
  ballOpen: 260,
  /** Rayo rojo de retirada, hasta que la bola se cierra. */
  recall: 520,
  /** Ventana de habilidad en pantalla, entrada y salida incluidas. */
  ability: 1600,
  /** Objeto cayendo sobre el Pokémon y su destello. */
  item: 900,
} as const;

/** What an item does on screen: green sparkle for HP, amber rush for X items. */
export type ItemFxKind = "heal" | "boost";

export interface StageHandle {
  /** Attacker lunges; the move plays its own animation on the defender.
      The `slug` is what picks the choreography (beam, orb, quake…), so pass
      the real move — the type and category are only the fallback.
      `release` pops the sprite back from its two-turn stance first. */
  attack(
    side: Side,
    move: {
      slug: string;
      type: string;
      damageClass: string;
      release?: boolean;
      /** Status move aimed at the user (Swords Dance) instead of the foe. */
      selfTarget?: boolean;
    },
  ): void;
  /** Defender flashes red/white; the whole screen shakes, harder the more
      the hit took off (and harder still on crits or super-effective). */
  hit(side: Side, impact: ImpactInfo): void;
  faint(side: Side): void;
  /** Turn 1 of a two-turn move: hide (Dig/Fly/Dive…) or glow (Solar Beam).
      The stance class persists until reappear/attack(release)/faint. */
  charge(side: Side, stance: ChargeStance): void;
  /** An interrupted charge: the sprite returns without attacking. */
  reappear(side: Side): void;
  /** Throws the ball onto that platform and opens it. The caller reveals the
      newcomer `GEN7.ballFlight` later, so it steps out of the light. */
  sendOut(side: Side): void;
  /** Pulls whoever is out back into the ball. The shrink class persists (like
      the faint one) until the caller swaps or clears that side's sprite. */
  recall(side: Side): void;
  /** The trainer's item lands on their Pokémon and takes effect. */
  useItem(side: Side, item: { sprite: string | null; kind: ItemFxKind }): void;
  /** Gen-7 ability window, sliding in on that battler's side. */
  ability(side: Side, name: string, ability: string): void;
}

/** Persistent sprite class per two-turn stance (fill-mode keeps the end). */
const STANCE_CLASS: Record<ChargeStance, string> = {
  underground: "pk-hide-under",
  airborne: "pk-hide-air",
  underwater: "pk-hide-water",
  vanished: "pk-hide-vanish",
  charging: "pk-charge-glow",
};

const isHidden = (cls: string) => cls.startsWith("pk-hide-");

/* ------------------------------------------------------------------ */
/* Per-type move FX configuration                                      */
/* ------------------------------------------------------------------ */

type Shape =
  | "spark"
  | "flame"
  | "drop"
  | "bolt"
  | "leaf"
  | "shard"
  | "star"
  | "ring"
  | "rock"
  | "feather"
  | "heart";

/**
 * Livery of a type: three tones, dark → mid → hot. Beams stack the three as
 * concentric strokes (outer haze, body, white-hot core) and every burst
 * paints its debris from the same set, which is what keeps a Fire move
 * reading as fire whichever animation it plays.
 */
interface TypeFx {
  colors: [string, string, string];
  shape: Shape;
}

const TYPE_FX: Record<string, TypeFx> = {
  normal: { colors: ["#a8a29e", "#e7e5e4", "#ffffff"], shape: "star" },
  fire: { colors: ["#c2410c", "#f97316", "#fde68a"], shape: "flame" },
  water: { colors: ["#0369a1", "#38bdf8", "#e0f2fe"], shape: "drop" },
  electric: { colors: ["#ca8a04", "#facc15", "#fefce8"], shape: "bolt" },
  grass: { colors: ["#15803d", "#4ade80", "#ecfccb"], shape: "leaf" },
  ice: { colors: ["#0e7490", "#67e8f9", "#f0f9ff"], shape: "shard" },
  fighting: { colors: ["#b91c1c", "#f87171", "#fee2e2"], shape: "star" },
  poison: { colors: ["#86198f", "#d946ef", "#fae8ff"], shape: "ring" },
  ground: { colors: ["#78350f", "#d97706", "#fde68a"], shape: "rock" },
  flying: { colors: ["#0284c7", "#7dd3fc", "#f0f9ff"], shape: "feather" },
  psychic: { colors: ["#be185d", "#f472b6", "#fce7f3"], shape: "ring" },
  bug: { colors: ["#4d7c0f", "#a3e635", "#f7fee7"], shape: "leaf" },
  rock: { colors: ["#78716c", "#b8a038", "#fef3c7"], shape: "rock" },
  ghost: { colors: ["#4c1d95", "#8b5cf6", "#ede9fe"], shape: "ring" },
  dragon: { colors: ["#4338ca", "#a855f7", "#ede9fe"], shape: "flame" },
  dark: { colors: ["#1e1b4b", "#6d28d9", "#c4b5fd"], shape: "ring" },
  steel: { colors: ["#475569", "#94a3b8", "#f1f5f9"], shape: "shard" },
  fairy: { colors: ["#be185d", "#fb7185", "#ffe4e6"], shape: "heart" },
};

/* ------------------------------------------------------------------ */
/* Move archetypes                                                     */
/* ------------------------------------------------------------------ */

/**
 * Cómo se ANIMA un movimiento, que en los juegos no lo decide el tipo sino
 * el movimiento en sí: Lanzallamas es un chorro sostenido, Bola Sombra un
 * orbe que viaja, Terremoto sacude el campo entero y Danza Espada solo
 * envuelve al que la usa. El tipo pone el color; esto pone la coreografía.
 */
type Archetype =
  | "beam"
  | "bolt"
  | "orb"
  | "barrage"
  | "contact"
  | "quake"
  | "buff"
  | "debuff";

/** Chorro sostenido que sale de la boca del atacante. */
const BEAM_MOVES =
  /beam|flamethrower|hydro-pump|water-gun|bubble|pulse|breath|ember|fire-blast|blizzard|powder-snow|heat-wave|overheat|scald|boomburst|hyper-voice|razor-wind|twister|octazooka|clamp/;

/** Rayo que cae del cielo sobre el objetivo. */
const BOLT_MOVES = /thunder|shock-wave|discharge|zap-cannon|electro-ball|volt-tackle/;

/** Orbe que viaja y revienta al llegar. */
const ORB_MOVES = /ball|bomb|sphere|blast|shuriken|gunk-shot|mud-shot|sludge|acid|moonblast|dazzling|aeroblast/;

/** Ráfaga de proyectiles encadenados. */
const BARRAGE_MOVES =
  /bullet-seed|rock-blast|icicle-spear|pin-missile|spike-cannon|rock-slide|rock-throw|bone-rush|barrage|swift|magical-leaf|leaf-storm|petal-blizzard|fury-attack/;

/** Sacudida de todo el campo. */
const QUAKE_MOVES = /earthquake|magnitude|bulldoze|fissure|stomping-tantrum|land-s-wrath/;

/** Tipos especiales que se leen como aliento y no como proyectil. */
const BREATH_TYPES = new Set(["fire", "water", "ice", "dragon", "normal", "steel"]);

/**
 * Elige la coreografía. El slug manda — es lo que distingue Rayo de Puño
 * Trueno aunque compartan tipo; el tipo y la categoría solo entran cuando
 * el movimiento no está en ninguna lista.
 */
function archetypeFor(
  slug: string,
  type: string,
  damageClass: string,
  selfTarget: boolean,
): Archetype {
  if (damageClass === "status") return selfTarget ? "buff" : "debuff";
  if (QUAKE_MOVES.test(slug)) return "quake";
  if (BARRAGE_MOVES.test(slug)) return "barrage";
  if (BOLT_MOVES.test(slug)) return "bolt";
  if (ORB_MOVES.test(slug)) return "orb";
  if (BEAM_MOVES.test(slug)) return "beam";
  // Sin coincidencia: los físicos entran a dar, y los especiales disparan
  // aliento o proyectil según su tipo.
  if (damageClass === "physical") return "contact";
  if (type === "electric") return "bolt";
  return BREATH_TYPES.has(type) ? "beam" : "orb";
}

/**
 * Puntos de apoyo en el suelo dibujado, medidos desde abajo de la capa del
 * plano del suelo (la que reconstruye el recorte del decorado, más abajo).
 *
 * El fondo tiene su horizonte en y=470 de un lienzo de 1600×900, o sea al
 * 52.2% desde arriba: lo que se apoye por encima de esa línea no está en el
 * campo, está flotando sobre el graderío. Estos tres valores son los únicos
 * que deciden dónde pisa cada figura.
 */
const GROUND: Record<"player" | "rival" | "trainer", string> = {
  // Tu lado, cerca del borde delantero del campo (y=762).
  player: "15.3%",
  // El rival, justo por delante de la línea del horizonte (y=500).
  rival: "44.4%",
  // El entrenador, un paso por detrás de su Pokémon (y=485).
  trainer: "46.1%",
};

/**
 * Cuánto hay que bajar el disco para que su cara superior —la elipse en la
 * que se apoyan los pies, al 55.7% de su propio alto— caiga sobre el punto
 * de contacto en vez de quedar suspendida encima.
 */
const PLATFORM_DROP = "translate-y-[56%]";

/**
 * Anclajes de ambos combatientes en % del plano del suelo: de aquí sale y
 * aquí llega todo lo que se dispara. Si allí se mueve un sprite, estas
 * cifras van detrás.
 */
const AIM: Record<Side, { x: number; y: number }> = {
  player: { x: 19, y: 70 },
  rival: { x: 71, y: 45 },
};

interface ActiveFx {
  seq: number;
  attacker: Side;
  type: string;
  archetype: Archetype;
  /** Release turn of a two-turn move: everything waits one beat while the
      attacker resurfaces (Dig, Fly, Dive…). */
  release?: boolean;
}

/** Deterministic 0-1 hash: SSR and client must draw the same fan. */
function fxRnd(i: number, salt: number): number {
  const x = Math.sin(i * 91.7 + salt * 47.3) * 43758.5453;
  return x - Math.floor(x);
}

/* --- Shared impact vocabulary ------------------------------------- */

interface Spot {
  x: number;
  y: number;
}

/** Posición absoluta de una pieza suelta sobre el anclaje que le toca. */
function spotStyle(at: Spot): CSSProperties {
  return { left: `${at.x}%`, top: `${at.y}%` };
}

/** Núcleo blanco del impacto: el fogonazo que abre cualquier golpe. */
function Bloom({
  at,
  color,
  size,
  delay,
}: {
  at: Spot;
  color: string;
  /** Diámetro en cqw, así el estallido escala con el ancho de la arena. */
  size: number;
  delay: number;
}) {
  return (
    <span
      aria-hidden
      className="pk-bloom"
      style={
        {
          ...spotStyle(at),
          "--c": color,
          "--s": `${size}cqw`,
          animationDelay: `${delay}ms`,
        } as CSSProperties
      }
    />
  );
}

/** Onda expansiva: el aro que sale del punto de contacto. */
function Shockwave({
  at,
  color,
  size,
  delay,
  count = 2,
}: {
  at: Spot;
  color: string;
  size: number;
  delay: number;
  count?: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="pk-shockwave"
          style={
            {
              ...spotStyle(at),
              "--c": color,
              "--s": `${size}cqw`,
              animationDelay: `${delay + i * 130}ms`,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}

/**
 * Metralla del tipo: sale despedida en abanico y cae, porque en los juegos
 * los cascotes tienen peso — no se disuelven flotando.
 */
function Debris({
  at,
  conf,
  count,
  power,
  delay,
}: {
  at: Spot;
  conf: TypeFx;
  count: number;
  /** 1 = golpe normal; sube para los estallidos grandes. */
  power: number;
  delay: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + fxRnd(i, 3) * 0.6;
        const dist = (5 + fxRnd(i, 7) * 6) * power;
        return (
          <span
            key={i}
            aria-hidden
            className={cn("pk-debris", `pk-shape-${conf.shape}`)}
            style={
              {
                ...spotStyle(at),
                "--dx": `${Math.cos(angle) * dist}cqw`,
                "--dy": `${Math.sin(angle) * dist * 0.7}cqw`,
                "--fall": `${(4 + fxRnd(i, 11) * 5) * power}cqw`,
                background:
                  conf.shape === "ring" ? "transparent" : conf.colors[i % 3],
                borderColor: conf.colors[i % 3],
                animationDelay: `${delay + fxRnd(i, 13) * 90}ms`,
              } as CSSProperties
            }
          />
        );
      })}
    </>
  );
}

/** Chispas rectas y rápidas, la capa que hace "crujir" el impacto. */
function Sparks({
  at,
  color,
  count,
  delay,
  reach = 12,
}: {
  at: Spot;
  color: string;
  count: number;
  delay: number;
  reach?: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + 0.3;
        const dist = reach * (0.6 + fxRnd(i, 17) * 0.7);
        return (
          <span
            key={i}
            aria-hidden
            className="pk-spark"
            style={
              {
                ...spotStyle(at),
                "--dx": `${Math.cos(angle) * dist}cqw`,
                "--dy": `${Math.sin(angle) * dist * 0.7}cqw`,
                "--c": color,
                animationDelay: `${delay + fxRnd(i, 19) * 70}ms`,
              } as CSSProperties
            }
          />
        );
      })}
    </>
  );
}

/** Paquete de impacto completo, el que comparten todas las coreografías. */
function Impact({
  at,
  conf,
  delay,
  power = 1,
}: {
  at: Spot;
  conf: TypeFx;
  delay: number;
  power?: number;
}) {
  return (
    <>
      <Bloom at={at} color={conf.colors[2]} size={20 * power} delay={delay} />
      <Shockwave at={at} color={conf.colors[1]} size={16 * power} delay={delay + 40} />
      <Debris at={at} conf={conf} count={12} power={power} delay={delay + 30} />
      <Sparks at={at} color={conf.colors[2]} count={10} delay={delay + 20} />
    </>
  );
}

/* --- Archetypes ---------------------------------------------------- */

/** Lienzo en el que se trazan haces y rayos. `preserveAspectRatio="none"`
 *  es deliberado: así (19,70) y (71,45) caen EXACTAMENTE sobre los dos
 *  combatientes sea cual sea la proporción de la arena. */
function FxCanvas({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {children}
    </svg>
  );
}

/** Chorro sostenido: fogonazo en la boca, haz que se estira hasta el
 *  objetivo, y estallido al final. Lanzallamas, Rayo Hielo, Hiperrayo. */
function BeamFx({
  from,
  to,
  conf,
  t0,
}: {
  from: Spot;
  to: Spot;
  conf: TypeFx;
  t0: number;
}) {
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const stroke = (width: number, color: string, delay: number, blur?: boolean) => (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      className="pk-beam"
      style={
        {
          "--len": len,
          animationDelay: `${delay}ms`,
          filter: blur ? "blur(1.2px)" : undefined,
        } as CSSProperties
      }
    />
  );
  return (
    <>
      <FxCanvas>
        {stroke(5.4, conf.colors[0], t0 + 110, true)}
        {stroke(3, conf.colors[1], t0 + 140)}
        {stroke(1.1, conf.colors[2], t0 + 170)}
      </FxCanvas>
      {/* Fogonazo de salida, antes de que el haz asome. */}
      <Bloom at={from} color={conf.colors[2]} size={10} delay={t0 + 60} />
      <Sparks at={from} color={conf.colors[1]} count={6} delay={t0 + 90} reach={7} />
      <Impact at={to} conf={conf} delay={t0 + 340} power={1.15} />
    </>
  );
}

/** Zigzag del cielo al objetivo, con la última esquina clavada en él. */
function boltPath(to: Spot, seed: number): string {
  const steps = 8;
  const points = [`M${to.x + (fxRnd(seed, 1) * 2 - 1) * 9} -8`];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = to.x + (fxRnd(seed, i + 1) * 2 - 1) * 8 * (1 - t);
    points.push(`L${x} ${-8 + (to.y + 8) * t}`);
  }
  points.push(`L${to.x} ${to.y}`);
  return points.join(" ");
}

/** Rayo: tres descargas encadenadas desde arriba. Rayo, Trueno, Onda Trueno. */
function BoltFx({ to, conf, t0 }: { to: Spot; conf: TypeFx; t0: number }) {
  const strikes = [0, 110, 210];
  return (
    <>
      <FxCanvas>
        {strikes.map((d, i) => (
          <g key={i} className="pk-bolt" style={{ animationDelay: `${t0 + d}ms` }}>
            <path
              d={boltPath(to, i)}
              fill="none"
              stroke={conf.colors[1]}
              strokeWidth={2.6}
              strokeLinejoin="round"
              style={{ filter: "blur(1px)" }}
            />
            <path
              d={boltPath(to, i)}
              fill="none"
              stroke={conf.colors[2]}
              strokeWidth={0.9}
              strokeLinejoin="round"
            />
          </g>
        ))}
      </FxCanvas>
      <Impact at={to} conf={conf} delay={t0 + 120} power={1.2} />
      <Sparks at={to} color={conf.colors[2]} count={12} delay={t0 + 230} reach={15} />
    </>
  );
}

/** Orbe que viaja describiendo un arco y revienta. Bola Sombra, Bomba Lodo. */
function OrbFx({
  from,
  to,
  conf,
  t0,
}: {
  from: Spot;
  to: Spot;
  conf: TypeFx;
  t0: number;
}) {
  // El arco se levanta sobre la recta: un proyectil que va en línea recta
  // se lee como un cursor, no como algo lanzado.
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - 10 };
  const path = {
    "--x0": `${from.x}%`,
    "--y0": `${from.y}%`,
    "--xm": `${mid.x}%`,
    "--ym": `${mid.y}%`,
    "--x1": `${to.x}%`,
    "--y1": `${to.y}%`,
  } as CSSProperties;
  return (
    <>
      {/* Carga en la boca antes de soltarlo. */}
      <Bloom at={from} color={conf.colors[2]} size={9} delay={t0} />
      {/* El orbe y su estela: copias idénticas, cada una un pelo por detrás. */}
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden
          className="pk-orb"
          style={
            {
              ...path,
              "--c": i === 0 ? conf.colors[1] : conf.colors[0],
              "--s": `${(i === 0 ? 5.2 : 4) - i * 0.5}cqw`,
              opacity: i === 0 ? 1 : 0.5 - i * 0.12,
              animationDelay: `${t0 + 140 + i * 42}ms`,
            } as CSSProperties
          }
        />
      ))}
      <Impact at={to} conf={conf} delay={t0 + 480} power={1.25} />
    </>
  );
}

/** Ráfaga: cinco proyectiles encadenados, cada uno con su golpecito. */
function BarrageFx({
  from,
  to,
  conf,
  t0,
}: {
  from: Spot;
  to: Spot;
  conf: TypeFx;
  t0: number;
}) {
  const shots = 5;
  return (
    <>
      {Array.from({ length: shots }, (_, i) => {
        // Cada disparo entra por un punto distinto: si todos siguen la misma
        // línea la ráfaga se lee como un único proyectil parpadeando.
        const jitterY = (fxRnd(i, 23) * 2 - 1) * 5;
        const mid = {
          x: (from.x + to.x) / 2,
          y: (from.y + to.y) / 2 - 6 + jitterY,
        };
        const delay = t0 + 120 + i * 110;
        return (
          <span key={i} aria-hidden>
            <span
              className="pk-orb pk-orb-fast"
              style={
                {
                  "--x0": `${from.x}%`,
                  "--y0": `${from.y}%`,
                  "--xm": `${mid.x}%`,
                  "--ym": `${mid.y}%`,
                  "--x1": `${to.x + (fxRnd(i, 29) * 2 - 1) * 3}%`,
                  "--y1": `${to.y + (fxRnd(i, 31) * 2 - 1) * 3}%`,
                  "--c": conf.colors[1],
                  "--s": "3.2cqw",
                  animationDelay: `${delay}ms`,
                } as CSSProperties
              }
            />
            <Bloom at={to} color={conf.colors[2]} size={11} delay={delay + 300} />
            <Sparks
              at={to}
              color={conf.colors[2]}
              count={5}
              delay={delay + 300}
              reach={7}
            />
          </span>
        );
      })}
      <Debris at={to} conf={conf} count={10} power={1} delay={t0 + 700} />
    </>
  );
}

/** Ángulos de los tajos del golpe físico, en el orden en que se trazan. */
const SLASHES = [-38, 34, -8];

/** Cuerpo a cuerpo: destello, tajos cruzados, onda y cascotes. */
function ContactFx({ to, conf, t0 }: { to: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      {/* Estrella de impacto: el fotograma congelado del golpe. */}
      <span
        aria-hidden
        className="pk-impact-star"
        style={
          {
            ...spotStyle(to),
            "--c": conf.colors[1],
            animationDelay: `${t0 + 140}ms`,
          } as CSSProperties
        }
      />
      {SLASHES.map((angle, i) => (
        <span
          key={i}
          aria-hidden
          className="pk-slash"
          style={
            {
              ...spotStyle(to),
              "--rot": `${angle}deg`,
              "--c": conf.colors[i % 3],
              animationDelay: `${t0 + 120 + i * 90}ms`,
            } as CSSProperties
          }
        />
      ))}
      <Bloom at={to} color={conf.colors[2]} size={16} delay={t0 + 130} />
      <Shockwave at={to} color={conf.colors[1]} size={18} delay={t0 + 170} count={2} />
      <Debris at={to} conf={conf} count={14} power={1.15} delay={t0 + 150} />
      <Sparks at={to} color={conf.colors[2]} count={12} delay={t0 + 140} reach={14} />
      {/* Polvareda a los pies, donde el golpe descarga contra el suelo. */}
      <span
        aria-hidden
        className="pk-dust"
        style={
          {
            ...spotStyle({ x: to.x, y: to.y + 7 }),
            "--c": conf.colors[0],
            animationDelay: `${t0 + 190}ms`,
          } as CSSProperties
        }
      />
    </>
  );
}

/** Grietas del terremoto, abiertas a lo ancho del campo. */
const FISSURES = [18, 38, 55, 72, 88];

/** Terremoto: se raja el suelo y salta tierra por todo el campo. */
function QuakeFx({ to, conf, t0 }: { to: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      <FxCanvas>
        {FISSURES.map((x, i) => {
          // La grieta corre del horizonte hacia la cámara abriéndose, y se
          // dibuja RELLENA en vez de trazada: el lienzo va deformado
          // (preserveAspectRatio="none") y un grosor de línea saldría
          // aplastado, mientras que la geometría escala bien.
          const top = 56 + fxRnd(i, 41) * 5;
          const bottom = 90 + fxRnd(i, 43) * 8;
          const steps = 5;
          const spine = Array.from({ length: steps + 1 }, (_, k) => {
            const t = k / steps;
            return {
              t,
              x: x + (fxRnd(i, k + 5) * 2 - 1) * 7 * t,
              y: top + (bottom - top) * t,
            };
          });
          const half = (t: number) => 0.12 + 1.5 * t * t;
          const left = spine.map((s2) => `L${s2.x - half(s2.t)} ${s2.y}`);
          const right = [...spine]
            .reverse()
            .map((s2) => `L${s2.x + half(s2.t)} ${s2.y}`);
          return (
            <path
              key={i}
              d={`M${spine[0].x} ${spine[0].y} ${left.join(" ")} ${right.join(" ")} Z`}
              fill="#120b06"
              className="pk-fissure"
              style={{ animationDelay: `${t0 + 80 + i * 55}ms` }}
            />
          );
        })}
      </FxCanvas>
      {/* Columnas de polvo saliendo de cada grieta. */}
      {FISSURES.map((x, i) => (
        <span
          key={i}
          aria-hidden
          className="pk-dust pk-dust-tall"
          style={
            {
              ...spotStyle({ x, y: 74 }),
              "--c": conf.colors[1],
              animationDelay: `${t0 + 120 + i * 55}ms`,
            } as CSSProperties
          }
        />
      ))}
      <Debris at={to} conf={conf} count={14} power={1.5} delay={t0 + 220} />
      <Shockwave at={to} color={conf.colors[1]} size={26} delay={t0 + 200} count={3} />
    </>
  );
}

/** Aura del que se potencia: aros que suben y motas que lo envuelven. */
function BuffFx({ at, conf, t0 }: { at: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      {/* Columna de luz, la señal de que el efecto es sobre uno mismo. */}
      <span
        aria-hidden
        className="pk-pillar"
        style={
          {
            ...spotStyle(at),
            "--c": conf.colors[1],
            animationDelay: `${t0}ms`,
          } as CSSProperties
        }
      />
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="pk-aura-ring"
          style={
            {
              ...spotStyle(at),
              "--c": conf.colors[2],
              animationDelay: `${t0 + i * 180}ms`,
            } as CSSProperties
          }
        />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={`m${i}`}
          aria-hidden
          className={cn("pk-mote", `pk-shape-${conf.shape}`)}
          style={
            {
              ...spotStyle({ x: at.x + (fxRnd(i, 3) * 2 - 1) * 5, y: at.y + 2 }),
              "--rise": `${8 + fxRnd(i, 9) * 6}cqw`,
              background:
                conf.shape === "ring" ? "transparent" : conf.colors[i % 3],
              borderColor: conf.colors[i % 3],
              animationDelay: `${t0 + fxRnd(i, 5) * 400}ms`,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}

/** Efecto sobre el rival: los aros se cierran sobre él y cae polvillo. */
function DebuffFx({ at, conf, t0 }: { at: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="pk-hex-ring"
          style={
            {
              ...spotStyle(at),
              "--c": conf.colors[1],
              animationDelay: `${t0 + i * 150}ms`,
            } as CSSProperties
          }
        />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <span
          key={`m${i}`}
          aria-hidden
          className={cn("pk-mote", "pk-mote-fall", `pk-shape-${conf.shape}`)}
          style={
            {
              ...spotStyle({ x: at.x + (fxRnd(i, 7) * 2 - 1) * 6, y: at.y - 9 }),
              "--rise": `${9 + fxRnd(i, 11) * 5}cqw`,
              background:
                conf.shape === "ring" ? "transparent" : conf.colors[i % 3],
              borderColor: conf.colors[i % 3],
              animationDelay: `${t0 + fxRnd(i, 13) * 380}ms`,
            } as CSSProperties
          }
        />
      ))}
      <Bloom at={at} color={conf.colors[2]} size={13} delay={t0 + 320} />
    </>
  );
}

/**
 * La animación completa de un movimiento: la coreografía que le toca por
 * archetipo, vestida con los colores de su tipo.
 */
function MoveFx({ fx }: { fx: ActiveFx }) {
  const conf = TYPE_FX[fx.type] ?? TYPE_FX.normal;
  const target: Side = fx.attacker === "player" ? "rival" : "player";
  const from = AIM[fx.attacker];
  const to = AIM[target];
  // Al salir de un movimiento de dos turnos todo espera un tiempo: primero
  // el sprite reaparece, y solo entonces ataca.
  const t0 = fx.release ? 380 : 0;
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Reaparición: tierra o agua saltando bajo el que vuelve. */}
      {fx.release && (
        <>
          <Debris at={from} conf={conf} count={10} power={1.1} delay={0} />
          <Shockwave at={from} color={conf.colors[1]} size={14} delay={40} count={1} />
        </>
      )}

      {fx.archetype === "beam" && (
        <BeamFx from={from} to={to} conf={conf} t0={t0} />
      )}
      {fx.archetype === "bolt" && <BoltFx to={to} conf={conf} t0={t0} />}
      {fx.archetype === "orb" && (
        <OrbFx from={from} to={to} conf={conf} t0={t0} />
      )}
      {fx.archetype === "barrage" && (
        <BarrageFx from={from} to={to} conf={conf} t0={t0} />
      )}
      {fx.archetype === "contact" && <ContactFx to={to} conf={conf} t0={t0} />}
      {fx.archetype === "quake" && <QuakeFx to={to} conf={conf} t0={t0} />}
      {fx.archetype === "buff" && <BuffFx at={from} conf={conf} t0={t0} />}
      {fx.archetype === "debuff" && <DebuffFx at={to} conf={conf} t0={t0} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ambient weather                                                     */
/* ------------------------------------------------------------------ */

/** Deterministic 0-1 spread from an index: keeps the particle field stable
 *  across renders (no Math.random, so SSR and client agree). */
const spread = (i: number, salt: number) => ((i * 9301 + salt * 49297) % 233) / 233;

/** Per-weather particle count; the stadium throws more than the chamber. */
const WEATHER_COUNT: Record<Exclude<Weather, "none">, number> = {
  confetti: 30,
  stardust: 20,
};

/** Confetti colours: the four banner tones of the stadium. */
const CONFETTI = ["#ef4444", "#22d3ee", "#fbbf24", "#a78bfa", "#ffffff"];

/**
 * Partículas de ambiente del escenario: papelillos cayendo sobre el estadio
 * del torneo y motas de datos subiendo por la cámara de simulación. Cada
 * una arranca con su propio retardo para que el bucle nunca se note.
 */
function WeatherLayer({ kind }: { kind: Weather }) {
  if (kind === "none") return null;
  const count = WEATHER_COUNT[kind];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const left = spread(i, 3) * 100;
        const scale = 0.7 + spread(i, 11) * 0.7;
        const style: CSSProperties = {
          left: `${left}%`,
          animationDelay: `${spread(i, 7) * 8}s`,
          animationDuration: `${9 + spread(i, 13) * 5}s`,
        };
        switch (kind) {
          case "confetti":
            return (
              <span
                key={i}
                className="pk-confetti absolute top-[-6%] h-2.5 w-1.5 rounded-[1px]"
                style={{
                  ...style,
                  background: CONFETTI[i % CONFETTI.length],
                  transform: `scale(${scale})`,
                  opacity: 0.8,
                }}
              />
            );
          case "stardust":
            return (
              <span
                key={i}
                className="pk-stardust absolute bottom-[8%] h-1 w-1 rounded-full bg-white shadow-[0_0_6px_2px_rgba(190,210,255,0.8)]"
                style={{ ...style, transform: `scale(${scale})` }}
              />
            );
        }
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Combatant                                                           */
/* ------------------------------------------------------------------ */

/** Ghost copies trailing the dash, each a beat behind the fighter itself. */
const TRAIL = [
  { delay: 55, opacity: 0.4 },
  { delay: 110, opacity: 0.22 },
];

const isLunging = (cls: string) => cls.startsWith("pk-lunge-");

/**
 * Un combatiente sobre su plataforma: la ilustración de alta resolución con
 * su sombra de contacto, respiración en bucle y, durante una embestida, dos
 * copias fantasma que dejan estela de movimiento.
 *
 * Las animaciones viven en el envoltorio y el espejado en la imagen, para
 * que el `scaleX(-1)` del jugador no invierta la dirección de la embestida.
 */
function Fighter({
  view,
  side,
  fx,
  className,
}: {
  view: SpriteView;
  side: Side;
  /** Current animation class driving the fighter (lunge, hit, faint…). */
  fx: string;
  /** Placement over its platform, decided by the stage's composition. */
  className: string;
}) {
  const a11y = useT().a11y;
  const isPlayer = side === "player";
  // The animated Showdown sprite is the arena's subject: your Pokémon seen
  // from behind, the rival's facing you, both breathing on their own. The
  // official artwork only stands in for the entries Showdown never animated.
  //
  // `src` and `natural` are per-occupant state (the error fallback swaps one,
  // the loaded GIF sets the other), so this component MUST be mounted fresh
  // for every combatant: the stage keys it on `view.key`. Keying anything
  // below this line would leave the old sprite frozen on the field.
  const [src, setSrc] = useState(view.url || view.art || "");
  const artwork = src !== "" && src === view.art;
  // A real back sprite already faces away. Anything else standing in on your
  // side (a front sprite, the artwork) has to be mirrored to face the field.
  const flip = isPlayer && !/\/back\//.test(src);
  const glow = isPlayer
    ? `drop-shadow(0 14px 12px rgba(0,0,0,0.45)) drop-shadow(0 0 22px ${view.aura}33)`
    : `drop-shadow(0 10px 9px rgba(0,0,0,0.4)) drop-shadow(0 0 18px ${view.aura}33)`;

  // Natural sprite size, read once the GIF lands. Showdown encodes species
  // scale in the canvas itself (Joltik 47×31, Wailord 146×81), so drawing
  // every sprite at natural size × a fixed factor keeps a Caterpie small
  // next to a Garchomp instead of stretching both to the same box.
  const [natural, setNatural] = useState<number | null>(null);
  // Measured through a ref rather than `onLoad` alone: a cached GIF is
  // already complete by the time React attaches its handler, and that load
  // event never fires.
  const measure = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth > 0) setNatural(el.naturalWidth);
  }, []);
  // Factor in container-query units: 1cqw is 1% of the arena's width, so the
  // fighters keep their on-screen proportions from a phone to an ultrawide.
  // Calibrated on a ~1255px-wide arena: ~275px tall for your Pokémon,
  // ~200px for the rival, which is the distance between the two platforms.
  const unit = isPlayer ? 0.207 : 0.166;
  const width =
    artwork || natural === null ? undefined : `calc(${natural} * ${unit}cqw)`;

  const image = (opacity?: number, extra?: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={
        opacity !== undefined
          ? "" // Trail ghosts are decoration; the fighter below is named.
          : artwork
            ? a11y.artOf(view.label)
            : a11y.battleSpriteOf(view.label, isPlayer ? "back" : "front")
      }
      aria-hidden={opacity !== undefined}
      onError={() => setSrc(view.art ?? "")}
      // Only the fighter itself measures; its trail ghosts are clones.
      ref={opacity === undefined ? measure : undefined}
      onLoad={(e) => {
        if (opacity === undefined) setNatural(e.currentTarget.naturalWidth);
      }}
      className={cn(
        "block h-auto origin-bottom",
        // Showdown ships these at sprite resolution and the arena blows them
        // up ~2.5×: nearest-neighbour keeps them crisp, the way the handheld
        // games look on a modern screen. The artwork must stay smooth.
        artwork ? "w-full object-contain" : "max-w-none [image-rendering:pixelated]",
      )}
      style={{
        width,
        transform: flip ? "scaleX(-1)" : undefined,
        filter: extra ?? glow,
        opacity,
      }}
    />
  );

  return (
    <div className={cn("pk-send-in absolute", className)}>
      <div
        className={cn(
          "relative flex w-full items-end justify-center",
          isPlayer ? "pk-idle-p" : "pk-idle-e",
        )}
      >
        {/* Estela: misma embestida y silueta, un pelín retrasadas. */}
        {isLunging(fx) &&
          TRAIL.map((ghost) => (
            <div
              key={ghost.delay}
              aria-hidden
              className={cn(
                "absolute inset-x-0 bottom-0 flex justify-center blur-[1px]",
                fx,
              )}
              style={{ animationDelay: `${ghost.delay}ms` }}
            >
              {image(
                ghost.opacity,
                `drop-shadow(0 0 16px ${view.aura}) saturate(1.6) brightness(1.2)`,
              )}
            </div>
          ))}
        <div className={cn("relative", fx)}>{image()}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Poké Ball, objetos y ventana de habilidad (7.ª generación)          */
/* ------------------------------------------------------------------ */

/** Dibujo de la Poké Ball, del tamaño que le pase la escena. */
function PokeBallGfx() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full">
      <circle cx="16" cy="16" r="15" fill="#0f172a" />
      <path d="M1 16a15 15 0 0 1 30 0Z" fill="#ef4444" />
      <path d="M31 16a15 15 0 0 1-30 0Z" fill="#f8fafc" />
      <path d="M1 16h30" stroke="#0f172a" strokeWidth="3" />
      <circle cx="16" cy="16" r="5.4" fill="#0f172a" />
      <circle cx="16" cy="16" r="3.4" fill="#e2e8f0" />
      <circle cx="16" cy="16" r="1.7" fill="#94a3b8" />
    </svg>
  );
}

/** De dónde sale la bola de cada lado: la tuya desde tu mano, fuera de plano
    por abajo a la izquierda; la del rival, desde donde está su entrenador. */
const BALL_ORIGIN: Record<Side, CSSProperties> = {
  player: { "--from-x": "-15cqw", "--from-y": "13cqw", "--peak-y": "-7cqw" },
  rival: { "--from-x": "-17cqw", "--from-y": "5cqw", "--peak-y": "-6cqw" },
} as unknown as Record<Side, CSSProperties>;

type BallMode = "throw" | "open" | "recall";

/**
 * La bola sobre la plataforma: vuela describiendo su arco (traslación
 * horizontal y vertical en elementos anidados, que es como se dibuja una
 * parábola sin JavaScript), se abre en un fogonazo o recoge al Pokémon en un
 * anillo de luz roja.
 */
function BallFx({ side, mode }: { side: Side; mode: BallMode }) {
  const size = side === "player" ? "4.4cqw" : "3.4cqw";
  if (mode === "recall") {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
      >
        <span className="relative" style={{ width: size, height: size }}>
          <PokeBallGfx />
          <span
            className="pk-recall-ring absolute -inset-[220%] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(248,113,113,0) 45%, rgba(248,113,113,0.75) 62%, rgba(248,113,113,0) 72%)",
            }}
          />
        </span>
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
    >
      <span
        className={mode === "throw" ? "pk-ball-x" : undefined}
        style={mode === "throw" ? BALL_ORIGIN[side] : undefined}
      >
        <span className={mode === "throw" ? "pk-ball-y" : undefined}>
          <span
            className={cn(
              "relative block",
              mode === "throw" ? "pk-ball-spin" : "pk-ball-open",
            )}
            style={{ width: size, height: size }}
          >
            <PokeBallGfx />
          </span>
          {/* Fogonazo de apertura: la luz de la que sale el Pokémon. */}
          {mode === "open" && (
            <span
              className="pk-ball-flash absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full"
              style={{
                width: `calc(${size} * 3)`,
                height: `calc(${size} * 3)`,
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(191,219,254,0.65) 35%, rgba(255,255,255,0) 70%)",
              }}
            />
          )}
        </span>
      </span>
    </span>
  );
}

/** Chispas del objeto, en abanico fijo para que el bucle no se note. */
const SPARKS = [-38, -22, -8, 6, 20, 34];

/** El frasco cae sobre el Pokémon y el efecto sube envolviéndolo. */
function ItemFx({
  side,
  sprite,
  kind,
}: {
  side: Side;
  sprite: string | null;
  kind: ItemFxKind;
}) {
  const tint = kind === "heal" ? "#34d399" : "#fbbf24";
  const size = side === "player" ? "4.6cqw" : "3.6cqw";
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
    >
      <span className="relative">
        {/* Aura que envuelve al Pokémon mientras el objeto hace efecto. */}
        <span
          className="pk-item-aura absolute -inset-[300%] rounded-full"
          style={{
            background: `radial-gradient(circle, ${tint}55 0%, ${tint}22 45%, transparent 70%)`,
          }}
        />
        {SPARKS.map((sx, i) => (
          <span
            key={sx}
            className="pk-item-spark absolute bottom-0 left-1/2 block h-1.5 w-1.5 rounded-full"
            style={
              {
                "--sx": `${sx}cqw`,
                background: tint,
                boxShadow: `0 0 10px 2px ${tint}`,
                animationDelay: `${i * 80}ms`,
              } as CSSProperties
            }
          />
        ))}
        {sprite && (
          <span className="pk-ball-x" style={BALL_ORIGIN[side]}>
            <span className="pk-ball-y">
              {/* Sprite oficial del objeto: es el mismo que la mochila
                  enseña, así que el jugador reconoce lo que acaba de usar. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sprite}
                alt=""
                className="block [image-rendering:pixelated]"
                style={{
                  width: size,
                  filter: `drop-shadow(0 0 8px ${tint})`,
                }}
              />
            </span>
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * Ventana de habilidad de Sol y Luna: entra deslizándose por el lado del
 * Pokémon que la activa (la tuya por la izquierda, la del rival por la
 * derecha), con su nombre arriba y la habilidad debajo.
 */
function AbilityWindow({
  side,
  name,
  ability,
}: {
  side: Side;
  name: string;
  ability: string;
}) {
  const isPlayer = side === "player";
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-20 max-w-[46%]",
        isPlayer
          ? "pk-ability-p bottom-[22%] left-0"
          : "pk-ability-e top-[18%] right-0",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-0.5 border-y-2 bg-[#0b1220]/92 py-1.5 pr-4 pl-3 shadow-[0_0_26px_-6px_rgba(0,0,0,0.9)] backdrop-blur-sm",
          isPlayer
            ? "rounded-r-xl border-cyan-300/80 border-r-2 border-l-0"
            : "rounded-l-xl border-red-400/80 border-r-0 border-l-2",
        )}
      >
        <span className="font-mono text-[9px] tracking-[0.22em] whitespace-nowrap text-slate-400 uppercase">
          {name}
        </span>
        <span
          className={cn(
            "font-display text-sm font-bold whitespace-nowrap",
            isPlayer ? "text-cyan-200" : "text-red-200",
          )}
        >
          {ability}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stage                                                               */
/* ------------------------------------------------------------------ */

/** The rival's trainer, standing on the field next to their Pokémon. */
export interface StageTrainer {
  /** Generated cut-out; null falls back to the drawn silhouette. */
  image: string | null;
  name: string;
}

interface StageProps {
  player: SpriteView | null;
  enemy: SpriteView | null;
  scenario: ScenarioKey;
  /** Omitted for wild-style battles, where nobody is standing over there. */
  trainer?: StageTrainer | null;
}

/**
 * Arena de combate 2D ilustrada: fondo vectorial por capas (cielo, luna,
 * cordillera, pueblo con las luces encendidas, arboleda y campo detallado),
 * plataformas dibujadas con grosor y sombra de contacto, y los dos Pokémon
 * en ilustración de alta resolución — el rival de frente arriba a la derecha
 * y el tuyo, más grande, abajo a la izquierda.
 *
 * Sobre esa base van las cinemáticas: embestida con estela, proyectiles y
 * estallidos por tipo, destello de impacto, sacudida de pantalla y caída al
 * debilitarse.
 */
export const BattleStage2D = forwardRef<StageHandle, StageProps>(
  function BattleStage2D({ player, enemy, scenario, trainer }, ref) {
    const [fx, setFx] = useState<ActiveFx | null>(null);
    const [spriteFx, setSpriteFx] = useState<Record<Side, string>>({
      player: "",
      rival: "",
    });
    const [shake, setShake] = useState<"" | "soft" | "hard" | "mega">("");
    /** Poké Ball in flight / opening / recalling, per side. */
    const [balls, setBalls] = useState<
      Partial<Record<Side, { seq: number; mode: BallMode }>>
    >({});
    const [itemFx, setItemFx] = useState<{
      seq: number;
      side: Side;
      sprite: string | null;
      kind: ItemFxKind;
    } | null>(null);
    const [abilityFx, setAbilityFx] = useState<{
      seq: number;
      side: Side;
      name: string;
      ability: string;
    } | null>(null);
    /** Full-stage impact flash, keyed so repeats always replay. */
    const [flash, setFlash] = useState<{ seq: number; hard: boolean } | null>(
      null,
    );
    const seqRef = useRef(0);
    const timers = useRef<number[]>([]);

    const later = (ms: number, fn: () => void) => {
      timers.current.push(window.setTimeout(fn, ms));
    };

    const setSprite = (side: Side, cls: string) =>
      setSpriteFx((f) => ({ ...f, [side]: cls }));

    useImperativeHandle(ref, (): StageHandle => {
      return {
        attack(side, move) {
          const seq = ++seqRef.current;
          const archetype = archetypeFor(
            move.slug,
            move.type,
            move.damageClass,
            move.selfTarget ?? false,
          );
          // Solo se echa encima quien pega de cerca: un haz, un orbe o un
          // aro de estado se lanzan desde el sitio, como en los juegos.
          const lunges = archetype === "contact" || archetype === "quake";
          const aura = archetype === "buff" || archetype === "debuff";
          // Pose del ataque y lo que dura antes de devolver el sprite a su
          // sitio: embestida, recogimiento de disparo o brillo de estado.
          const pose = lunges
            ? side === "player"
              ? "pk-lunge-p"
              : "pk-lunge-e"
            : aura
              ? "pk-charge-glow"
              : "pk-brace";
          const hold = lunges ? 450 : aura ? 900 : 520;
          const strike = () => {
            setSprite(side, pose);
            later(hold, () =>
              setSpriteFx((f) => (f[side] === pose ? { ...f, [side]: "" } : f)),
            );
          };
          if (move.release) {
            // Segundo turno de un movimiento de dos: primero reaparece de
            // donde estuviera (bajo tierra, en el aire) y luego ataca.
            setSprite(side, "pk-reappear");
            later(400, strike);
          } else {
            strike();
          }
          setFx({
            seq,
            attacker: side,
            type: move.type,
            archetype,
            release: move.release,
          });
          later(move.release ? 1900 : 1500, () =>
            setFx((f) => (f?.seq === seq ? null : f)),
          );
        },
        hit(side, impact) {
          // Force of the blow: how much HP it took, bumped by the type
          // multiplier and by a critical, then clamped to 0-1.
          const force = Math.min(
            1,
            impact.ratio * 2.2 * (impact.effectiveness > 1 ? 1.4 : 1) +
              (impact.crit ? 0.2 : 0),
          );
          const hard = force > 0.45;
          const cls = hard ? "pk-hit-hard" : "pk-hit";
          // A hidden sprite (Dig…) keeps its stance: only the screen reacts.
          setSpriteFx((f) => (isHidden(f[side]) ? f : { ...f, [side]: cls }));
          later(540, () =>
            setSpriteFx((f) => (f[side] === cls ? { ...f, [side]: "" } : f)),
          );
          setFlash({ seq: ++seqRef.current, hard });
          // Shake scales with the hit: a scratch nudges, a KO blow rattles.
          const level = force > 0.7 ? "mega" : hard ? "hard" : "soft";
          setShake(level);
          later(level === "mega" ? 620 : level === "hard" ? 500 : 350, () =>
            setShake(""),
          );
        },
        faint(side) {
          // A battler KO'd while hidden resurfaces before collapsing.
          // The class persists until the sprite is replaced (key change).
          setSpriteFx((f) => {
            if (isHidden(f[side])) {
              later(360, () => setSprite(side, "pk-faint"));
              return { ...f, [side]: "pk-reappear" };
            }
            return { ...f, [side]: "pk-faint" };
          });
        },
        charge(side, stance) {
          setSprite(side, STANCE_CLASS[stance]);
        },
        reappear(side) {
          setSprite(side, "pk-reappear");
          later(450, () =>
            setSpriteFx((f) =>
              f[side] === "pk-reappear" ? { ...f, [side]: "" } : f,
            ),
          );
        },
        sendOut(side) {
          const seq = ++seqRef.current;
          const own = (b: typeof balls) => b[side]?.seq === seq;
          setBalls((b) => ({ ...b, [side]: { seq, mode: "throw" } }));
          // The ball lands, opens, and the burst outlives it just long enough
          // for the newcomer to step out of the light.
          later(GEN7.ballFlight, () =>
            setBalls((b) => (own(b) ? { ...b, [side]: { seq, mode: "open" } } : b)),
          );
          later(GEN7.ballFlight + 460, () =>
            setBalls((b) => (own(b) ? { ...b, [side]: undefined } : b)),
          );
        },
        recall(side) {
          const seq = ++seqRef.current;
          // The shrink persists (fill both) until the caller clears or swaps
          // the sprite — same contract as the faint class.
          setSprite(side, "pk-recall");
          setBalls((b) => ({ ...b, [side]: { seq, mode: "recall" } }));
          later(GEN7.recall + 140, () =>
            setBalls((b) => (b[side]?.seq === seq ? { ...b, [side]: undefined } : b)),
          );
        },
        useItem(side, item) {
          const seq = ++seqRef.current;
          setItemFx({ seq, side, sprite: item.sprite, kind: item.kind });
          later(GEN7.item + 500, () =>
            setItemFx((f) => (f?.seq === seq ? null : f)),
          );
        },
        ability(side, name, ability) {
          const seq = ++seqRef.current;
          setAbilityFx({ seq, side, name, ability });
          later(GEN7.ability, () =>
            setAbilityFx((f) => (f?.seq === seq ? null : f)),
          );
        },
      };
    }, []);

    // Clear pending timers if the stage unmounts mid-animation.
    useEffect(() => {
      const pending = timers.current;
      return () => pending.forEach(clearTimeout);
    }, []);

    // Render-phase reset (same pattern as the MessageBox typewriter): a new
    // fighter (switch or replacement) always enters clean, dropping any
    // persistent faint/stance class left by the previous occupant.
    const [seenKeys, setSeenKeys] = useState({
      player: player?.key,
      rival: enemy?.key,
    });
    if (seenKeys.player !== player?.key || seenKeys.rival !== enemy?.key) {
      const playerChanged = seenKeys.player !== player?.key;
      const rivalChanged = seenKeys.rival !== enemy?.key;
      setSeenKeys({ player: player?.key, rival: enemy?.key });
      setSpriteFx((f) => ({
        player: playerChanged ? "" : f.player,
        rival: rivalChanged ? "" : f.rival,
      }));
    }

    const palette = PALETTES[scenario];

    return (
      <div
        className={cn(
          "relative h-full w-full overflow-hidden bg-black",
          shake === "soft" && "fx-screen-shake",
          shake === "hard" && "pk-shake-hard",
          shake === "mega" && "pk-shake-mega",
        )}
        // Query container for the fighters: they size themselves in `cqw`,
        // so the composition holds at any arena width without a resize
        // listener. The stage is already the positioning context.
        style={{ containerType: "inline-size" }}
      >
        {/* Cambiar de escenario funde la ilustración nueva sobre la anterior. */}
        <div key={scenario} className="pk-scene-in absolute inset-0">
          <Scenery scenario={scenario} />
          <WeatherLayer kind={palette.weather} />
        </div>

        {/* Plano del suelo: la misma caja que el SVG del fondo ocupa al
            recortarse con `xMidYMid slice`, reconstruida en CSS.
            `max(100%, 56.25cqw)` es exactamente el alto que toma el decorado
            de 16:9 al cubrir la arena, y centrarlo reproduce el recorte.

            Sin esta capa las figuras se colocan en % de la arena mientras el
            dibujo se recorta para cubrirla: en cuanto la arena deja de ser
            16:9 los dos suelos se separan y los combatientes quedan flotando
            sobre el campo. Dentro de ella, un % vertical es un % del propio
            decorado, así que quien se apoya en el suelo sigue apoyado en
            cualquier pantalla. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2"
          style={{ height: "max(100%, 56.25cqw)" }}
        >
          {/* Rival: al fondo a la derecha, de frente y algo más pequeño por la
              distancia, con los pies sobre el centro de su plataforma. El
              bloque no tiene alto propio: es la línea de contacto contra la
              que se alinean disco y criatura. */}
          <div
            className="absolute"
            style={{ left: "60%", bottom: GROUND.rival, width: "22%" }}
          >
            <Platform2D
              id={`e-${scenario}`}
              kind={palette.platform}
              className={cn(
                "absolute inset-x-0 bottom-0 aspect-[3.6/1] w-full",
                PLATFORM_DROP,
              )}
            />
            {enemy && (
              <Fighter
                // Identity key: the rival that faints is torn down and the
                // replacement mounts clean, image state and all.
                key={enemy.key}
                view={enemy}
                side="rival"
                fx={spriteFx.rival}
                className="inset-x-0 bottom-0"
              />
            )}
            {/* Bola y objetos comparten el punto de apoyo del Pokémon: caen
                justo donde este pisa, como en los juegos. */}
            {balls.rival && (
              <BallFx
                key={balls.rival.seq + balls.rival.mode}
                side="rival"
                mode={balls.rival.mode}
              />
            )}
            {itemFx?.side === "rival" && (
              <ItemFx
                key={itemFx.seq}
                side="rival"
                sprite={itemFx.sprite}
                kind={itemFx.kind}
              />
            )}
          </div>

          {/* Entrenador rival, de pie junto a su Pokémon como en los juegos.
              Va pegado al borde izquierdo de la plataforma rival y pisa un
              paso por detrás de ella, así que comparte plano de profundidad
              con la criatura a la que da órdenes. Ese hueco central es además
              el único que queda libre: la mitad derecha de la arena es de los
              menús, que en «Lucha» suben hasta dos tercios del alto.

              Vive fuera del bloque del rival a propósito, para que embestidas
              e impactos sacudan al Pokémon y no a su entrenador. Las medidas
              van en % del ancho de la arena — que es su contenedor de
              consulta —, así que mantiene su tamaño relativo a los
              combatientes en cualquier pantalla. */}
          {trainer && (
            <TrainerFigure
              image={trainer.image}
              name={trainer.name}
              className="left-[44%] w-[15%]"
              style={{ bottom: GROUND.trainer }}
            />
          )}

          {/* Jugador: delante a la izquierda, más grande por la cercanía y
              girado hacia el rival. */}
          <div
            className="absolute"
            style={{ left: "4%", bottom: GROUND.player, width: "30%" }}
          >
            <Platform2D
              id={`p-${scenario}`}
              kind={palette.platform}
              near
              className={cn(
                "absolute inset-x-0 bottom-0 aspect-[3.2/1] w-full",
                PLATFORM_DROP,
              )}
            />
            {player && (
              <Fighter
                key={player.key}
                view={player}
                side="player"
                fx={spriteFx.player}
                className="inset-x-0 bottom-0"
              />
            )}
            {balls.player && (
              <BallFx
                key={balls.player.seq + balls.player.mode}
                side="player"
                mode={balls.player.mode}
              />
            )}
            {itemFx?.side === "player" && (
              <ItemFx
                key={itemFx.seq}
                side="player"
                sprite={itemFx.sprite}
                kind={itemFx.kind}
              />
            )}
          </div>

          {/* Los efectos comparten el plano del suelo: sus anclajes son los
              mismos puntos de apoyo que acaban de colocarse. */}
          {fx && <MoveFx key={fx.seq} fx={fx} />}
        </div>

        {/* Ventana de habilidad: fuera del plano del suelo, porque se ancla a
            los bordes de la arena y no a la escena. */}
        {abilityFx && (
          <AbilityWindow
            key={abilityFx.seq}
            side={abilityFx.side}
            name={abilityFx.name}
            ability={abilityFx.ability}
          />
        )}

        {/* Destello de impacto sobre toda la arena, más intenso cuanto más
            duro es el golpe. */}
        {flash && (
          <span
            key={flash.seq}
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 z-10",
              flash.hard ? "pk-flash-hard" : "pk-flash",
            )}
          />
        )}
      </div>
    );
  },
);
