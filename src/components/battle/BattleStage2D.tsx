"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  choreographyFor,
  signatureFor,
  type Choreography,
} from "@/lib/battle/move-fx";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { ChargeStance, Side } from "@/types/battle";
import { Platform2D } from "./scene/Platform2D";
import { Scenery } from "./scene/Scenery";
import { TrainerFigure, type TrainerStance } from "./scene/TrainerFigure";
import { PALETTES, type ScenarioKey, type Weather } from "./scene/palettes";

export type { ScenarioKey } from "./scene/palettes";
export type { TrainerStance } from "./scene/TrainerFigure";

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
  /**
   * Alto real de la especie en metros: es lo que decide a qué tamaño se dibuja
   * la criatura, igual en los dos lados del campo. Opcional porque un equipo
   * rehidratado de `localStorage` de antes de esto no lo trae; sin él la
   * figura se dibuja a tamaño medio en vez de desaparecer.
   */
  height?: number;
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
  /** Vuelo del frasco desde la mano hasta el Pokémon. */
  itemThrow: 460,
  /** Destello y aura del objeto, contados DESDE que el frasco aterriza. */
  item: 900,
} as const;

/** What an item does on screen: green sparkle for HP, amber rush for X items. */
export type ItemFxKind = "heal" | "boost";

/**
 * Reloj de una animación de movimiento, en milisegundos desde que arranca.
 *
 * `impactAt` es el fotograma en el que el ataque CONECTA: la arena espera
 * exactamente eso antes de reproducir el daño, y así respingo, barra de PS y
 * estallido caen juntos igual que en los juegos.
 */
export interface AttackTiming {
  impactAt: number;
  duration: number;
}

export interface StageHandle {
  /** Attacker lunges; the move plays its own animation on the defender.
      The `slug` is what picks the choreography (beam, orb, quake…), so pass
      the real move — the type and category are only the fallback.
      `release` pops the sprite back from its two-turn stance first.
      Returns when the blow lands, for the caller to sync the damage to. */
  attack(
    side: Side,
    move: {
      slug: string;
      type: string;
      damageClass: string;
      release?: boolean;
      /** Status move aimed at the user (Swords Dance) instead of the foe. */
      selfTarget?: boolean;
      /** Potencia base listada; de ahí sale el TAMAÑO del golpe en pantalla,
          que es lo que separa a Ascuas de Llamarada. `null` (potencia
          variable) se anima con peso normal. */
      power?: number | null;
    },
  ): AttackTiming;
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

/**
 * Verde de curación, el único color que NO sale del tipo.
 *
 * Recuperación es Normal, Descanso Psíquico y Síntesis Planta, y las tres se
 * curan en verde en los juegos: el color aquí no dice de qué tipo es el
 * movimiento, dice que la barra sube.
 */
const HEAL_FX: TypeFx = {
  colors: ["#15803d", "#4ade80", "#dcfce7"],
  shape: "star",
};

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
/* Move choreographies                                                 */
/* ------------------------------------------------------------------ */

/**
 * Cuándo GOLPEA cada coreografía, contado desde que arranca la animación.
 *
 * Es el contrato con la arena: `attack()` devuelve este número y el guion del
 * combate espera justo eso antes de reproducir el daño, así el respingo del
 * que lo recibe, la barra vaciándose y el estallido caen en el MISMO
 * fotograma — que es lo que hace que un golpe se sienta como un golpe. Si se
 * retoca el retardo del `Impact` de una coreografía, este número va detrás.
 *
 * Qué movimiento usa cuál se decide en `@/lib/battle/move-fx`, que es donde
 * están curados los 937 de PokéAPI uno a uno.
 */
const IMPACT_AT: Record<Choreography, number> = {
  beam: 340,
  pulse: 460,
  orb: 480,
  barrage: 560,
  bolt: 130,
  meteor: 520,
  gleam: 300,
  contact: 150,
  slash: 190,
  punch: 160,
  kick: 200,
  bite: 260,
  pierce: 300,
  spin: 240,
  slam: 210,
  dive: 380,
  quake: 220,
  wave: 620,
  swirl: 430,
  spire: 330,
  weather: 420,
  terrain: 400,
  hazard: 520,
  warp: 380,
  sound: 300,
  nuke: 520,
  explode: 420,
  drain: 480,
  psylift: 420,
  hex: 400,
  venom: 380,
  powder: 520,
  trap: 400,
  buff: 300,
  debuff: 330,
  dance: 420,
  heal: 380,
  screen: 320,
  shield: 260,
};

/**
 * Qué hace el CUERPO del que ataca mientras corre la animación.
 *
 * En los juegos solo se echa encima quien pega de cerca; el que dispara un
 * haz se recoge y suelta desde su sitio, y el que se potencia o cambia el
 * campo se queda quieto brillando. Que un Lanzallamas hiciera embestir es lo
 * que rompería la ilusión, así que esto va coreografía a coreografía igual
 * que el catálogo.
 *
 *   lunge — sale disparado contra el rival
 *   brace — se recoge y dispara desde su plataforma
 *   glow  — se queda quieto, envuelto en su propia luz
 */
const STANCE_OF: Record<Choreography, "lunge" | "brace" | "glow"> = {
  beam: "brace",
  pulse: "brace",
  orb: "brace",
  barrage: "brace",
  bolt: "brace",
  meteor: "brace",
  gleam: "glow",
  contact: "lunge",
  slash: "lunge",
  punch: "lunge",
  kick: "lunge",
  bite: "lunge",
  pierce: "lunge",
  spin: "lunge",
  slam: "lunge",
  dive: "lunge",
  quake: "lunge",
  wave: "brace",
  swirl: "brace",
  spire: "brace",
  weather: "glow",
  terrain: "glow",
  hazard: "brace",
  warp: "glow",
  sound: "brace",
  nuke: "brace",
  explode: "glow",
  drain: "brace",
  psylift: "glow",
  hex: "glow",
  venom: "brace",
  powder: "brace",
  trap: "brace",
  buff: "glow",
  debuff: "glow",
  dance: "glow",
  heal: "glow",
  screen: "glow",
  shield: "glow",
};

/**
 * Puntos de apoyo en el suelo dibujado, medidos desde abajo de la capa del
 * plano del suelo (la que reconstruye el recorte del decorado, más abajo).
 *
 * El fondo tiene su horizonte en y=470 de un lienzo de 1600×900, o sea al
 * 52.2% desde arriba: lo que se apoye por encima de esa línea no está en el
 * campo, está flotando sobre el graderío. En `bottom`, esa frontera es el
 * 47.8%: por encima de esa cifra no se pisa hierba. Estos cuatro valores son
 * los únicos que deciden dónde se apoya cada figura.
 */
const GROUND: Record<
  "player" | "rival" | "playerTrainer" | "rivalTrainer",
  string
> = {
  // Tu lado, cerca del borde delantero del campo (y=762).
  player: "15.3%",
  // El rival, bien DENTRO del campo (y=590), con unos 120 px de césped por
  // detrás. Antes se apoyaba en el 44.4% (y=500), a treinta píxeles escasos
  // del horizonte: eso no es el fondo del campo, es el borde donde la hierba
  // muere contra el muro, y un disco de neón ahí se lee pegado al graderío.
  rival: "34.5%",
  // Tú, un paso por delante de tu propio Pokémon (y=795): es desde ahí desde
  // donde se lanza la bola. No más abajo — la caja de texto se come el borde
  // inferior de la arena, y ahí es donde acabarían los pies.
  playerTrainer: "11.5%",
  // El Entrenador rival, DETRÁS de su Pokémon (y=553) pero con hierba bajo los
  // pies. Estaba en el 47.6%, o sea en y=472 — dos píxeles por debajo del
  // horizonte, que en el decorado es exactamente el muro perimetral: no
  // flotaba por un fallo de sombra, es que estaba plantado sobre el graderío.
  // En un campo con fuga central «detrás» no es sólo más arriba: es también
  // más cerca del centro y más pequeño, y por eso su sitio no cae a plomo
  // sobre el de su criatura (ver el bloque de la figura).
  rivalTrainer: "38.5%",
};

/**
 * Cuánto encoge cada lado por el escalón de profundidad al que está. Es el
 * ÚNICO motivo por el que dos criaturas de la misma especie no se dibujan
 * exactamente igual: el rival está más lejos, y punto.
 *
 * El 0.85 es una mentira deliberada, la misma que cuentan los juegos. La
 * perspectiva honrada del decorado —el tamaño va con la distancia al
 * horizonte— pediría un 0.4 largo, y con eso el rival se queda en un juguete
 * al fondo del campo. Un escalón corto se lee como distancia sin romper el
 * duelo, que es de lo que va la pantalla.
 *
 * Va emparejado con el ancho del bloque rival (25% contra el 30% tuyo): si se
 * toca aquí, se toca allí, o la criatura deja de casar con su plataforma.
 */
const depthOf = (side: Side) => (side === "player" ? 1 : 0.85);

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
  // El 31 es el centro del bloque del jugador (16% + la mitad de su 30%): se
  // movió con él cuando su plataforma se separó del Entrenador.
  player: { x: 31, y: 70 },
  rival: { x: 64, y: 51 },
};

interface ActiveFx {
  seq: number;
  attacker: Side;
  type: string;
  archetype: Choreography;
  /** Paleta ya resuelta: la del tipo, o la propia del movimiento si la tiene. */
  conf: TypeFx;
  /** Peso del golpe, ~0.7 (Ascuas) a ~1.8 (Llamarada). */
  weight: number;
  /** Golpes visibles de un multigolpe; sin dato, la coreografía decide. */
  hits?: number;
  /** Ritmo: <1 más seco (prioridad), >1 más pesado (remates y cargas). */
  tempo: number;
  /** Release turn of a two-turn move: everything waits one beat while the
      attacker resurfaces (Dig, Fly, Dive…). */
  release?: boolean;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Deterministic 0-1 hash: SSR and client must draw the same fan. */
function fxRnd(i: number, salt: number): number {
  const x = Math.sin(i * 91.7 + salt * 47.3) * 43758.5453;
  return x - Math.floor(x);
}

/* --- Shared impact vocabulary ------------------------------------- */

/**
 * Peso del movimiento que se está animando, en torno a 1.
 *
 * Va por contexto y no por parámetro a propósito: lo consumen las piezas
 * sueltas del impacto (fogonazo, onda, metralla, chispas), que es por donde
 * se cuela en las 39 coreografías a la vez. Así Ascuas y Llamarada comparten
 * coreografía pero NO tamaño, sin que ninguna de las 39 tenga que enterarse
 * de que existe la potencia.
 */
const FxWeight = createContext(1);

const useWeight = () => useContext(FxWeight);

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
  const w = useWeight();
  return (
    <span
      aria-hidden
      className="pk-bloom"
      style={
        {
          ...spotStyle(at),
          "--c": color,
          "--s": `${size * w}cqw`,
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
  const w = useWeight();
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
              "--s": `${size * w}cqw`,
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
  // La metralla escala con la potencia del movimiento en las dos cosas que
  // se notan: cuánto salta y cuántos trozos saltan.
  const w = useWeight();
  const reach = power * w;
  const pieces = Math.round(count * clamp(w, 0.7, 1.6));
  return (
    <>
      {Array.from({ length: pieces }, (_, i) => {
        const angle = (i / pieces) * Math.PI * 2 + fxRnd(i, 3) * 0.6;
        const dist = (5 + fxRnd(i, 7) * 6) * reach;
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
                "--fall": `${(4 + fxRnd(i, 11) * 5) * reach}cqw`,
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
  const w = useWeight();
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + 0.3;
        const dist = reach * w * (0.6 + fxRnd(i, 17) * 0.7);
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

/**
 * Ráfaga: proyectiles encadenados, cada uno con su golpecito.
 *
 * `shots` son los golpes REALES del movimiento (Doble Patada 2, Triple Axel
 * 3, Bomba Población 10): en los juegos se cuentan, y contar cinco cuando el
 * texto dice «¡Golpeó 2 veces!» es de las cosas que más cantan.
 */
function BarrageFx({
  from,
  to,
  conf,
  t0,
  shots = 5,
}: {
  from: Spot;
  to: Spot;
  conf: TypeFx;
  t0: number;
  shots?: number;
}) {
  // Con muchos golpes la ráfaga se aprieta para que quepa en la misma
  // ventana de animación en vez de desbordarla.
  const gap = shots > 5 ? 60 : 110;
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
        const delay = t0 + 120 + i * gap;
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
      <Debris
        at={to}
        conf={conf}
        count={10}
        power={1}
        delay={t0 + 120 + shots * gap}
      />
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

/**
 * Ola: una pared de agua que entra por el lado del atacante y barre el campo
 * hasta salir por el otro, con la espuma saltando al pasar por el rival.
 * Surf, Salpicadura Lodosa, Salpicar. No apunta — inunda.
 */
function WaveFx({
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
  // Barre en el sentido atacante → rival, entrando y saliendo de plano.
  const leftToRight = from.x < to.x;
  return (
    <>
      <span
        aria-hidden
        className="pk-wave"
        style={
          {
            left: "50%",
            top: `${(from.y + to.y) / 2 + 6}%`,
            marginLeft: "-26cqw",
            "--x0": leftToRight ? "-95cqw" : "95cqw",
            "--x1": leftToRight ? "95cqw" : "-95cqw",
            "--c": conf.colors[1],
            "--c2": conf.colors[2],
            animationDelay: `${t0 + 60}ms`,
          } as CSSProperties
        }
      />
      {/* Espuma en el momento en que la ola llega al rival. */}
      <Sparks at={to} color={conf.colors[2]} count={14} delay={t0 + 560} reach={16} />
      <Shockwave at={to} color={conf.colors[1]} size={22} delay={t0 + 600} count={2} />
      <Debris at={to} conf={conf} count={9} power={1.1} delay={t0 + 600} />
    </>
  );
}

/**
 * Vórtice: tres aros que giran cerrándose sobre el objetivo mientras las
 * motas del tipo orbitan con ellos. Ciclón, Fuego Fatuo, Tormenta de Hojas.
 */
function SwirlFx({ to, conf, t0 }: { to: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="pk-swirl"
          style={
            {
              ...spotStyle(to),
              "--c": conf.colors[1],
              "--c2": conf.colors[2],
              "--s": `${16 + i * 6}cqw`,
              animationDelay: `${t0 + i * 120}ms`,
            } as CSSProperties
          }
        />
      ))}
      {/* Lo que el remolino arrastra: hojas, ascuas, copos… según el tipo. */}
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={`m${i}`}
          aria-hidden
          className={cn("pk-mote", `pk-shape-${conf.shape}`)}
          style={
            {
              ...spotStyle({
                x: to.x + (fxRnd(i, 17) * 2 - 1) * 8,
                y: to.y + 4,
              }),
              "--rise": `${7 + fxRnd(i, 19) * 7}cqw`,
              background:
                conf.shape === "ring" ? "transparent" : conf.colors[i % 3],
              borderColor: conf.colors[i % 3],
              animationDelay: `${t0 + fxRnd(i, 23) * 420}ms`,
            } as CSSProperties
          }
        />
      ))}
      <Impact at={to} conf={conf} delay={t0 + 430} power={1.1} />
    </>
  );
}

/**
 * Picado: la estela cae en vertical sobre el rival y descarga a sus pies.
 * Vuelo, Ataque Aéreo, Pájaro Osado — el remate del que atacó desde el aire.
 */
function DiveFx({ to, conf, t0 }: { to: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      <span
        aria-hidden
        className="pk-dive"
        style={
          {
            ...spotStyle({ x: to.x, y: to.y - 4 }),
            "--c": conf.colors[1],
            "--c2": conf.colors[2],
            animationDelay: `${t0 + 40}ms`,
          } as CSSProperties
        }
      />
      <Bloom at={to} color={conf.colors[2]} size={17} delay={t0 + 370} />
      <Shockwave at={to} color={conf.colors[1]} size={20} delay={t0 + 400} count={2} />
      <Debris at={to} conf={conf} count={12} power={1.25} delay={t0 + 390} />
      {/* Polvareda del aterrizaje, a los pies del que lo recibe. */}
      <span
        aria-hidden
        className="pk-dust"
        style={
          {
            ...spotStyle({ x: to.x, y: to.y + 7 }),
            "--c": conf.colors[0],
            animationDelay: `${t0 + 400}ms`,
          } as CSSProperties
        }
      />
    </>
  );
}

/**
 * Fogonazo total: el haz llega, y con él la pantalla se va a blanco desde el
 * punto de impacto. Es lo que los juegos guardan para Hiperrayo, Explosión y
 * los movimientos que cierran un combate.
 */
function NukeFx({
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
  return (
    <>
      <BeamFx from={from} to={to} conf={conf} t0={t0} />
      <span
        aria-hidden
        className="pk-whiteout"
        style={
          {
            "--fx": `${to.x}%`,
            "--fy": `${to.y}%`,
            "--c": conf.colors[1],
            animationDelay: `${t0 + 460}ms`,
          } as CSSProperties
        }
      />
      <Shockwave at={to} color={conf.colors[2]} size={34} delay={t0 + 500} count={3} />
      <Debris at={to} conf={conf} count={18} power={1.7} delay={t0 + 520} />
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
 * Esferas concéntricas que viajan pulsando, no un cuerpo sólido: lo que
 * distingue a Esfera Aural o Pulso Dragón de una simple bola es que se ve
 * LATIR por el camino. Cada anillo sale un poco después que el anterior.
 */
function PulseFx({
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
  const path = {
    "--x0": `${from.x}%`,
    "--y0": `${from.y}%`,
    "--x1": `${to.x}%`,
    "--y1": `${to.y}%`,
  } as CSSProperties;
  return (
    <>
      <Bloom at={from} color={conf.colors[2]} size={11} delay={t0} />
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden
          className="pk-pulse-ring"
          style={
            {
              ...path,
              "--c": conf.colors[i === 0 ? 2 : 1],
              "--s": `${6 + i * 1.6}cqw`,
              animationDelay: `${t0 + 120 + i * 90}ms`,
            } as CSSProperties
          }
        />
      ))}
      <Impact at={to} conf={conf} delay={t0 + 460} power={1.2} />
    </>
  );
}

/**
 * Lluvia desde arriba: cuerpos que caen fuera de plano y revientan uno tras
 * otro alrededor del objetivo. Cometa Draco, Avalancha, Pedrada Lunar.
 */
function MeteorFx({ to, conf, t0 }: { to: Spot; conf: TypeFx; t0: number }) {
  const shots = 7;
  return (
    <>
      {Array.from({ length: shots }, (_, i) => {
        // Cada cuerpo entra por su propio punto: si todos caen sobre el mismo
        // sitio la lluvia se lee como un único proyectil repetido.
        const at = {
          x: to.x + (fxRnd(i, 53) * 2 - 1) * 13,
          y: to.y + (fxRnd(i, 59) * 2 - 1) * 5,
        };
        const delay = t0 + 60 + i * 85;
        return (
          <span key={i} aria-hidden>
            <span
              className={cn("pk-meteor", `pk-shape-${conf.shape}`)}
              style={
                {
                  ...spotStyle(at),
                  "--lean": `${(fxRnd(i, 61) * 2 - 1) * 22}deg`,
                  background: conf.colors[1],
                  borderColor: conf.colors[1],
                  boxShadow: `0 0 10px 2px ${conf.colors[2]}`,
                  animationDelay: `${delay}ms`,
                } as CSSProperties
              }
            />
            <Bloom at={at} color={conf.colors[2]} size={13} delay={delay + 320} />
            <Debris at={at} conf={conf} count={6} power={0.9} delay={delay + 330} />
          </span>
        );
      })}
      <Shockwave at={to} color={conf.colors[1]} size={24} delay={t0 + 520} count={2} />
    </>
  );
}

/**
 * Fogonazo de luz que baña el campo entero, sin proyectil que seguir: en los
 * juegos Brillo Mágico y Destello no VIAJAN, encienden la pantalla.
 */
function GleamFx({ at, conf, t0 }: { at: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      <span
        aria-hidden
        className="pk-gleam"
        style={
          {
            "--fx": `${at.x}%`,
            "--fy": `${at.y}%`,
            "--c": conf.colors[1],
            "--c2": conf.colors[2],
            animationDelay: `${t0 + 80}ms`,
          } as CSSProperties
        }
      />
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn("pk-mote", `pk-shape-${conf.shape}`)}
          style={
            {
              ...spotStyle({
                x: at.x + (fxRnd(i, 67) * 2 - 1) * 16,
                y: at.y + (fxRnd(i, 71) * 2 - 1) * 8,
              }),
              "--rise": `${6 + fxRnd(i, 73) * 8}cqw`,
              background: conf.shape === "ring" ? "transparent" : conf.colors[2],
              borderColor: conf.colors[2],
              animationDelay: `${t0 + fxRnd(i, 79) * 320}ms`,
            } as CSSProperties
          }
        />
      ))}
      <Bloom at={at} color={conf.colors[2]} size={22} delay={t0 + 220} />
    </>
  );
}

/** Ángulos de los filos, cruzándose como en los juegos. */
const BLADES = [-52, 46, -14];

/**
 * Filos limpios: medias lunas que se cruzan sobre el objetivo y nada más.
 * Corte, Tajo Umbrío, Tijera X. Sin polvareda ni cascotes a propósito — lo
 * que hace que un tajo se lea como un tajo y no como un porrazo es que el
 * campo queda LIMPIO detrás.
 */
function SlashFx({
  to,
  conf,
  t0,
  hits,
}: {
  to: Spot;
  conf: TypeFx;
  t0: number;
  /** Tajos reales, si el movimiento los cuenta: Golpe Doble 2, Garra Doble 2.
      Sin dato se trazan tres, que es el aspa clásica del corte. */
  hits?: number;
}) {
  const blades = hits ? BLADES.slice(0, Math.min(hits, BLADES.length)) : BLADES;
  return (
    <>
      {blades.map((angle, i) => (
        <span
          key={i}
          aria-hidden
          className="pk-crescent"
          style={
            {
              ...spotStyle(to),
              "--rot": `${angle}deg`,
              "--c": conf.colors[i === 2 ? 2 : 1],
              "--s": `${20 - i * 2}cqw`,
              animationDelay: `${t0 + 90 + i * 95}ms`,
            } as CSSProperties
          }
        />
      ))}
      <Bloom at={to} color={conf.colors[2]} size={12} delay={t0 + 180} />
      <Sparks at={to} color={conf.colors[2]} count={10} delay={t0 + 170} reach={16} />
    </>
  );
}

/**
 * Puñetazo: el nudillo entra, y lo que se ve del golpe son los anillos secos
 * que salen del punto de contacto. Puño Fuego, Puño Certero, Puño Meteoro.
 */
function PunchFx({
  from,
  to,
  conf,
  t0,
  hits = 1,
}: {
  from: Spot;
  to: Spot;
  conf: TypeFx;
  t0: number;
  /** Puñetazos que da de verdad: Puño Cometa 5, Puño Bala 1. */
  hits?: number;
}) {
  const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  const gap = hits > 3 ? 95 : 150;
  return (
    <>
      {Array.from({ length: hits }, (_, i) => {
        // Cada puñetazo entra por un punto un pelo distinto: repetidos sobre
        // el mismo píxel se leen como un parpadeo, no como una tanda.
        const at = {
          x: to.x + (fxRnd(i, 197) * 2 - 1) * 3.5,
          y: to.y + (fxRnd(i, 199) * 2 - 1) * 3.5,
        };
        const d = t0 + i * gap;
        return (
          <span key={i} aria-hidden>
            <span
              className="pk-knuckle"
              style={
                {
                  ...spotStyle(at),
                  "--rot": `${angle}deg`,
                  "--c": conf.colors[1],
                  "--c2": conf.colors[2],
                  animationDelay: `${d + 60}ms`,
                } as CSSProperties
              }
            />
            <Bloom at={at} color={conf.colors[2]} size={15} delay={d + 150} />
            <Shockwave
              at={at}
              color={conf.colors[1]}
              size={13}
              delay={d + 160}
              count={hits > 1 ? 1 : 3}
            />
            <Sparks at={at} color={conf.colors[2]} count={11} delay={d + 160} reach={13} />
          </span>
        );
      })}
      <Debris at={to} conf={conf} count={8} power={1} delay={t0 + 170 + (hits - 1) * gap} />
    </>
  );
}

/**
 * Patada: el arco del pie barre desde arriba y descarga ABAJO, a la altura
 * de las piernas, con la polvareda saliendo del suelo. Patada Baja,
 * Patada Ígnea, Triple Patada.
 */
function KickFx({
  to,
  conf,
  t0,
  hits = 1,
}: {
  to: Spot;
  conf: TypeFx;
  t0: number;
  /** Patadas reales: Doble Patada 2, Triple Patada y Triple Axel 3. */
  hits?: number;
}) {
  const low = { x: to.x, y: to.y + 4 };
  const gap = 170;
  return (
    <>
      {Array.from({ length: hits }, (_, i) => {
        const at = { x: low.x + (fxRnd(i, 211) * 2 - 1) * 3, y: low.y };
        const d = t0 + i * gap;
        return (
          <span key={i} aria-hidden>
            <span
              className="pk-kick-arc"
              style={
                {
                  ...spotStyle(at),
                  "--c": conf.colors[1],
                  "--c2": conf.colors[2],
                  animationDelay: `${d + 50}ms`,
                } as CSSProperties
              }
            />
            <Bloom at={at} color={conf.colors[2]} size={16} delay={d + 190} />
            <Shockwave at={at} color={conf.colors[1]} size={17} delay={d + 210} count={2} />
            <Debris at={at} conf={conf} count={11} power={1.2} delay={d + 200} />
          </span>
        );
      })}
      <span
        aria-hidden
        className="pk-dust"
        style={
          {
            ...spotStyle({ x: to.x, y: to.y + 8 }),
            "--c": conf.colors[0],
            animationDelay: `${t0 + 220 + (hits - 1) * gap}ms`,
          } as CSSProperties
        }
      />
    </>
  );
}

/**
 * Fauces: dos mitades que entran por arriba y por abajo y se cierran de
 * golpe sobre el objetivo. Mordisco, Triturar, Colmillo Ígneo.
 */
function BiteFx({ to, conf, t0 }: { to: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      {[1, -1].map((dir) => (
        <span
          key={dir}
          aria-hidden
          className="pk-jaw"
          style={
            {
              ...spotStyle(to),
              "--dir": dir,
              "--c": conf.colors[1],
              "--c2": conf.colors[2],
              animationDelay: `${t0 + 40}ms`,
            } as CSSProperties
          }
        />
      ))}
      {/* El chasquido: todo cae en el fotograma en que las fauces juntan. */}
      <Bloom at={to} color={conf.colors[2]} size={14} delay={t0 + 250} />
      <Sparks at={to} color={conf.colors[2]} count={10} delay={t0 + 260} reach={11} />
      <Debris at={to} conf={conf} count={8} power={0.9} delay={t0 + 270} />
    </>
  );
}

/**
 * Punta que taladra: la broca gira mientras avanza y se clava, y de ahí
 * salen las chispas. Pico Taladro, Cornada, Picotazo Venenoso.
 */
function PierceFx({
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
  const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  return (
    <>
      <span
        aria-hidden
        className="pk-drill"
        style={
          {
            ...spotStyle(to),
            "--rot": `${angle}deg`,
            "--c": conf.colors[1],
            "--c2": conf.colors[2],
            animationDelay: `${t0 + 40}ms`,
          } as CSSProperties
        }
      />
      {/* Chispas del taladro mordiendo, antes del reventón final. */}
      <Sparks at={to} color={conf.colors[2]} count={8} delay={t0 + 170} reach={8} />
      <Sparks at={to} color={conf.colors[2]} count={10} delay={t0 + 290} reach={14} />
      <Bloom at={to} color={conf.colors[2]} size={13} delay={t0 + 300} />
      <Debris at={to} conf={conf} count={9} power={1} delay={t0 + 310} />
    </>
  );
}

/**
 * El propio Pokémon convertido en rueda: un disco que gira sobre el objetivo
 * con su estela. Desenrollar, Giro Bola, Giro Rápido.
 */
function SpinFx({ to, conf, t0 }: { to: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="pk-spin-disc"
          style={
            {
              ...spotStyle(to),
              "--c": conf.colors[1],
              "--c2": conf.colors[2],
              "--s": `${13 + i * 5}cqw`,
              animationDelay: `${t0 + i * 70}ms`,
            } as CSSProperties
          }
        />
      ))}
      <Bloom at={to} color={conf.colors[2]} size={14} delay={t0 + 230} />
      <Debris at={to} conf={conf} count={10} power={1.05} delay={t0 + 240} />
      <span
        aria-hidden
        className="pk-dust"
        style={
          {
            ...spotStyle({ x: to.x, y: to.y + 7 }),
            "--c": conf.colors[0],
            animationDelay: `${t0 + 250}ms`,
          } as CSSProperties
        }
      />
    </>
  );
}

/**
 * Golpe pesado: no corta ni pincha, APLASTA. El objetivo se hunde bajo una
 * elipse que se achata, el suelo se agrieta y salta todo. Golpe Cuerpo,
 * Cola Férrea, Derribo.
 */
function SlamFx({ to, conf, t0 }: { to: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      <span
        aria-hidden
        className="pk-slam-flat"
        style={
          {
            ...spotStyle(to),
            "--c": conf.colors[1],
            "--c2": conf.colors[2],
            animationDelay: `${t0 + 60}ms`,
          } as CSSProperties
        }
      />
      <Bloom at={to} color={conf.colors[2]} size={19} delay={t0 + 200} />
      <Shockwave at={to} color={conf.colors[1]} size={21} delay={t0 + 220} count={3} />
      <Debris at={to} conf={conf} count={14} power={1.35} delay={t0 + 210} />
      {/* Dos polvaredas a los pies: el peso descarga contra el suelo. */}
      {[-4, 4].map((dx) => (
        <span
          key={dx}
          aria-hidden
          className="pk-dust"
          style={
            {
              ...spotStyle({ x: to.x + dx, y: to.y + 7 }),
              "--c": conf.colors[0],
              animationDelay: `${t0 + 240}ms`,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}

/** Dónde brotan las púas alrededor del objetivo, en % sobre su ancla. */
const SPIRES = [-11, -5.5, 0, 5.5, 11];

/**
 * Púas que se levantan del suelo bajo los pies del rival, en abanico y de
 * fuera hacia dentro. Roca Afilada, Filo del Abismo, Lanza Glacial.
 */
function SpireFx({ to, conf, t0 }: { to: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      <FxCanvas>
        {SPIRES.map((dx, i) => {
          const x = to.x + dx;
          const base = to.y + 7;
          const h = 13 + fxRnd(i, 83) * 9;
          const lean = (fxRnd(i, 89) * 2 - 1) * 2.5;
          return (
            <polygon
              key={i}
              points={`${x - 1.9} ${base} ${x + 1.9} ${base} ${x + lean} ${base - h}`}
              fill={conf.colors[i % 2 === 0 ? 0 : 1]}
              stroke={conf.colors[2]}
              strokeWidth={0.25}
              className="pk-spire"
              style={{ animationDelay: `${t0 + 60 + Math.abs(dx) * 9}ms` }}
            />
          );
        })}
      </FxCanvas>
      <Bloom at={to} color={conf.colors[2]} size={15} delay={t0 + 320} />
      <Debris at={to} conf={conf} count={12} power={1.2} delay={t0 + 330} />
      <span
        aria-hidden
        className="pk-dust pk-dust-tall"
        style={
          {
            ...spotStyle({ x: to.x, y: to.y + 6 }),
            "--c": conf.colors[0],
            animationDelay: `${t0 + 120}ms`,
          } as CSSProperties
        }
      />
    </>
  );
}

/**
 * El cielo entero cambia: la arena se tiñe y cae (o sube) lo que traiga el
 * tiempo. Día Soleado, Danza Lluvia, Tormenta de Arena, Granizo.
 */
function WeatherFx({ conf, t0 }: { conf: TypeFx; t0: number }) {
  return (
    <>
      <span
        aria-hidden
        className="pk-sky-wash"
        style={
          {
            "--c": conf.colors[1],
            "--c2": conf.colors[2],
            animationDelay: `${t0}ms`,
          } as CSSProperties
        }
      />
      {/* Barrido de partículas por TODA la arena, no sobre un combatiente:
          es un efecto de campo y tiene que leerse como tal. */}
      {Array.from({ length: 26 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn("pk-sky-mote", `pk-shape-${conf.shape}`)}
          style={
            {
              left: `${fxRnd(i, 97) * 100}%`,
              top: `${20 + fxRnd(i, 101) * 60}%`,
              "--drift": `${(fxRnd(i, 103) * 2 - 1) * 14}cqw`,
              background: conf.shape === "ring" ? "transparent" : conf.colors[i % 3],
              borderColor: conf.colors[i % 3],
              animationDelay: `${t0 + fxRnd(i, 107) * 520}ms`,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}

/** Líneas de la rejilla del terreno, en % del ancho de la arena. */
const GRID = [8, 22, 36, 50, 64, 78, 92];

/**
 * El suelo se enciende: una rejilla en fuga que corre del fondo hacia la
 * cámara. Campo Eléctrico, Campo de Hierba, Campo Psíquico.
 */
function TerrainFx({ conf, t0 }: { conf: TypeFx; t0: number }) {
  return (
    <>
      <FxCanvas>
        {GRID.map((x, i) => (
          <line
            key={`v${i}`}
            x1={50 + (x - 50) * 0.35}
            y1={56}
            x2={x}
            y2={100}
            stroke={conf.colors[1]}
            strokeWidth={0.5}
            className="pk-grid-line"
            style={{ animationDelay: `${t0 + i * 45}ms` }}
          />
        ))}
        {[62, 72, 84, 97].map((y, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={y}
            x2={100}
            y2={y}
            stroke={conf.colors[2]}
            strokeWidth={0.4}
            className="pk-grid-line"
            style={{ animationDelay: `${t0 + 120 + i * 70}ms` }}
          />
        ))}
      </FxCanvas>
      <span
        aria-hidden
        className="pk-ground-glow"
        style={
          {
            "--c": conf.colors[1],
            animationDelay: `${t0 + 60}ms`,
          } as CSSProperties
        }
      />
    </>
  );
}

/**
 * Trampa sembrada: las piezas salen del que la usa, cruzan el campo y se
 * QUEDAN en el suelo del rival. Púas, Trampa Rocas, Red Viscosa.
 */
function HazardFx({
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
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => {
        const land = {
          x: to.x + (fxRnd(i, 109) * 2 - 1) * 14,
          y: to.y + 6 + fxRnd(i, 113) * 4,
        };
        return (
          <span
            key={i}
            aria-hidden
            className={cn("pk-hazard", `pk-shape-${conf.shape}`)}
            style={
              {
                ...spotStyle(land),
                "--x0": `${from.x - land.x}cqw`,
                "--y0": `${(from.y - land.y) * 0.6}cqw`,
                background: conf.shape === "ring" ? "transparent" : conf.colors[i % 3],
                borderColor: conf.colors[i % 3],
                animationDelay: `${t0 + 60 + i * 55}ms`,
              } as CSSProperties
            }
          />
        );
      })}
      <Sparks at={to} color={conf.colors[2]} count={7} delay={t0 + 520} reach={9} />
    </>
  );
}

/**
 * El espacio se retuerce: aros de distorsión y una rejilla que se dobla.
 * Espacio Raro, Gravedad, Teletransporte, Intercambio.
 */
function WarpFx({ at, conf, t0 }: { at: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden
          className="pk-warp-ring"
          style={
            {
              ...spotStyle(at),
              "--c": conf.colors[1],
              "--c2": conf.colors[2],
              "--s": `${10 + i * 7}cqw`,
              animationDelay: `${t0 + i * 110}ms`,
            } as CSSProperties
          }
        />
      ))}
      <span
        aria-hidden
        className="pk-warp-veil"
        style={
          {
            "--fx": `${at.x}%`,
            "--fy": `${at.y}%`,
            "--c": conf.colors[0],
            animationDelay: `${t0 + 80}ms`,
          } as CSSProperties
        }
      />
    </>
  );
}

/**
 * Sonido: aros anchos y planos que salen de quien lo usa y cruzan la arena.
 * Vozarrón, Canto, Chirrido, Vozestruendo. No hay proyectil — hay ONDA.
 */
function SoundFx({ from, conf, t0 }: { from: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          aria-hidden
          className="pk-sound-ring"
          style={
            {
              ...spotStyle(from),
              "--c": conf.colors[i % 2 === 0 ? 1 : 2],
              animationDelay: `${t0 + i * 105}ms`,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}

/**
 * Estallido centrado en quien lo usa, sin haz que lo preceda: Explosión y
 * Autodestrucción se llevan por delante al que las lanza, y eso se ve en que
 * la pantalla se abre DESDE ÉL.
 */
function ExplodeFx({ at, conf, t0 }: { at: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      <Bloom at={at} color={conf.colors[2]} size={30} delay={t0 + 120} />
      <span
        aria-hidden
        className="pk-whiteout"
        style={
          {
            "--fx": `${at.x}%`,
            "--fy": `${at.y}%`,
            "--c": conf.colors[1],
            animationDelay: `${t0 + 240}ms`,
          } as CSSProperties
        }
      />
      <Shockwave at={at} color={conf.colors[2]} size={40} delay={t0 + 260} count={4} />
      <Debris at={at} conf={conf} count={22} power={2} delay={t0 + 250} />
      <Sparks at={at} color={conf.colors[2]} count={18} delay={t0 + 250} reach={26} />
    </>
  );
}

/**
 * Robo de energía: zarcillos que agarran al rival y motas que vuelven por
 * ellos hasta quien atacó, que se cura al final. Absorber, Gigadrenado,
 * Puño Drenaje.
 */
function DrainFx({
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
  const tendrils = 5;
  return (
    <>
      <FxCanvas>
        {Array.from({ length: tendrils }, (_, i) => {
          // Cada zarcillo se comba por su lado, para que el manojo no se lea
          // como una sola línea gruesa.
          const bow = (i - (tendrils - 1) / 2) * 4.5;
          const mx = (from.x + to.x) / 2 + bow;
          const my = (from.y + to.y) / 2 + bow * 0.5 - 4;
          return (
            <path
              key={i}
              d={`M${from.x} ${from.y} Q${mx} ${my} ${to.x} ${to.y}`}
              fill="none"
              stroke={conf.colors[i % 2 === 0 ? 1 : 0]}
              strokeWidth={0.9}
              strokeLinecap="round"
              className="pk-tendril"
              style={{ animationDelay: `${t0 + 60 + i * 60}ms` }}
            />
          );
        })}
      </FxCanvas>
      {/* La energía volviendo: mismo camino, sentido contrario. */}
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={`s${i}`}
          aria-hidden
          className="pk-siphon"
          style={
            {
              "--x0": `${to.x}%`,
              "--y0": `${to.y}%`,
              "--x1": `${from.x}%`,
              "--y1": `${from.y}%`,
              "--c": conf.colors[2],
              animationDelay: `${t0 + 420 + i * 70}ms`,
            } as CSSProperties
          }
        />
      ))}
      <Bloom at={to} color={conf.colors[2]} size={13} delay={t0 + 470} />
      {/* El que drena se ilumina cuando le llega lo robado. */}
      <Bloom at={from} color={HEAL_FX.colors[2]} size={16} delay={t0 + 880} />
    </>
  );
}

/**
 * Levitación psíquica: el rival sube, se le cierran encima aros deformados y
 * cae. El sprite lo levanta la arena (`pk-psylift`); aquí va lo que se ve
 * alrededor. Psíquico, Confusión, Psicocorte.
 */
function PsyliftFx({ to, conf, t0 }: { to: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="pk-psy-ring"
          style={
            {
              ...spotStyle({ x: to.x, y: to.y - 5 }),
              "--c": conf.colors[1],
              "--c2": conf.colors[2],
              "--s": `${22 - i * 5}cqw`,
              animationDelay: `${t0 + 120 + i * 130}ms`,
            } as CSSProperties
          }
        />
      ))}
      {/* Motas orbitando mientras está suspendido. */}
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={`m${i}`}
          aria-hidden
          className={cn("pk-mote", `pk-shape-${conf.shape}`)}
          style={
            {
              ...spotStyle({
                x: to.x + (fxRnd(i, 127) * 2 - 1) * 9,
                y: to.y + 3,
              }),
              "--rise": `${9 + fxRnd(i, 131) * 6}cqw`,
              background: conf.shape === "ring" ? "transparent" : conf.colors[i % 3],
              borderColor: conf.colors[i % 3],
              animationDelay: `${t0 + fxRnd(i, 137) * 380}ms`,
            } as CSSProperties
          }
        />
      ))}
      <Impact at={to} conf={conf} delay={t0 + 420} power={1.15} />
    </>
  );
}

/**
 * Espectros que suben desde debajo del rival, ondulando. Tinieblas,
 * Lengüetazo, Pesadilla, Buenas Noches.
 */
function HexFx({ to, conf, t0 }: { to: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="pk-wisp"
          style={
            {
              ...spotStyle({
                x: to.x + (i - 2.5) * 4.4,
                y: to.y + 6,
              }),
              "--sway": `${(fxRnd(i, 139) * 2 - 1) * 5}cqw`,
              "--c": conf.colors[1],
              "--c2": conf.colors[2],
              animationDelay: `${t0 + 60 + i * 70}ms`,
            } as CSSProperties
          }
        />
      ))}
      <span
        aria-hidden
        className="pk-gloom"
        style={
          {
            ...spotStyle(to),
            "--c": conf.colors[0],
            animationDelay: `${t0 + 100}ms`,
          } as CSSProperties
        }
      />
      <Bloom at={to} color={conf.colors[2]} size={15} delay={t0 + 400} />
      <Sparks at={to} color={conf.colors[2]} count={8} delay={t0 + 410} reach={11} />
    </>
  );
}

/**
 * Burbujeo y gas: burbujas que suben y revientan y una nube que se queda
 * pegada al rival. Tóxico, Ácido, Polución, Gas Venenoso.
 */
function VenomFx({ to, conf, t0 }: { to: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      <span
        aria-hidden
        className="pk-gas"
        style={
          {
            ...spotStyle(to),
            "--c": conf.colors[1],
            "--c2": conf.colors[0],
            animationDelay: `${t0 + 80}ms`,
          } as CSSProperties
        }
      />
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="pk-bubble"
          style={
            {
              ...spotStyle({
                x: to.x + (fxRnd(i, 149) * 2 - 1) * 9,
                y: to.y + 5,
              }),
              "--s": `${1.6 + fxRnd(i, 151) * 2.6}cqw`,
              "--rise": `${7 + fxRnd(i, 157) * 7}cqw`,
              "--c": conf.colors[i % 2 === 0 ? 1 : 2],
              animationDelay: `${t0 + fxRnd(i, 163) * 440}ms`,
            } as CSSProperties
          }
        />
      ))}
      <Bloom at={to} color={conf.colors[2]} size={12} delay={t0 + 380} />
    </>
  );
}

/**
 * Esporas: una nube ancha que cruza desde quien la suelta y se POSA encima
 * del rival, con el polvillo cayendo después. Somnífero, Paralizador,
 * Espora, Polvo Veneno.
 */
function PowderFx({
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
  return (
    <>
      <span
        aria-hidden
        className="pk-powder-cloud"
        style={
          {
            ...spotStyle(to),
            "--x0": `${from.x - to.x}cqw`,
            "--y0": `${(from.y - to.y) * 0.6}cqw`,
            "--c": conf.colors[1],
            "--c2": conf.colors[2],
            animationDelay: `${t0 + 40}ms`,
          } as CSSProperties
        }
      />
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn("pk-mote", "pk-mote-fall", `pk-shape-${conf.shape}`)}
          style={
            {
              ...spotStyle({
                x: to.x + (fxRnd(i, 167) * 2 - 1) * 10,
                y: to.y - 7,
              }),
              "--rise": `${10 + fxRnd(i, 173) * 6}cqw`,
              background: conf.shape === "ring" ? "transparent" : conf.colors[i % 3],
              borderColor: conf.colors[i % 3],
              animationDelay: `${t0 + 320 + fxRnd(i, 179) * 420}ms`,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}

/**
 * Ataduras que se cierran alrededor del rival y tiran. Atadura, Constricción,
 * Infestación, Jaula Eléctrica.
 */
function TrapFx({ to, conf, t0 }: { to: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      {[-5, 0, 5].map((dy, i) => (
        <span
          key={dy}
          aria-hidden
          className="pk-band"
          style={
            {
              ...spotStyle({ x: to.x, y: to.y + dy }),
              "--c": conf.colors[1],
              "--c2": conf.colors[2],
              animationDelay: `${t0 + 80 + i * 110}ms`,
            } as CSSProperties
          }
        />
      ))}
      <Sparks at={to} color={conf.colors[2]} count={8} delay={t0 + 400} reach={9} />
      <Bloom at={to} color={conf.colors[2]} size={11} delay={t0 + 400} />
    </>
  );
}

/**
 * Danza: lo que la baila queda envuelto en piezas que ORBITAN a su
 * alrededor mientras suben. Danza Espada, Danza Dragón, Danza Aleteo.
 */
function DanceFx({ at, conf, t0 }: { at: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="pk-orbit"
          style={
            {
              ...spotStyle(at),
              "--turn": `${(i / 6) * 360}deg`,
              animationDelay: `${t0 + i * 60}ms`,
            } as CSSProperties
          }
        >
          <span
            className={cn("pk-orbit-piece", `pk-shape-${conf.shape}`)}
            style={{
              background: conf.shape === "ring" ? "transparent" : conf.colors[i % 3],
              borderColor: conf.colors[i % 3],
            }}
          />
        </span>
      ))}
      <span
        aria-hidden
        className="pk-pillar"
        style={
          {
            ...spotStyle(at),
            "--c": conf.colors[1],
            animationDelay: `${t0 + 120}ms`,
          } as CSSProperties
        }
      />
      <Shockwave at={at} color={conf.colors[2]} size={15} delay={t0 + 420} count={2} />
    </>
  );
}

/**
 * Curación: chispas que SUBEN y un aro cálido que se cierra. Va en verde
 * pase lo que pase con el tipo —Recuperación es Normal y Descanso Psíquico,
 * y en los juegos las dos curan en verde—, que es como se lee de un vistazo
 * que a alguien le está subiendo la barra en vez de bajarle.
 */
function HealFx({ at, t0 }: { at: Spot; t0: number }) {
  const conf = HEAL_FX;
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="pk-heal-ring"
          style={
            {
              ...spotStyle(at),
              "--c": conf.colors[1],
              animationDelay: `${t0 + i * 180}ms`,
            } as CSSProperties
          }
        />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <span
          key={`m${i}`}
          aria-hidden
          className="pk-mote pk-shape-star"
          style={
            {
              ...spotStyle({
                x: at.x + (fxRnd(i, 181) * 2 - 1) * 7,
                y: at.y + 4,
              }),
              "--rise": `${10 + fxRnd(i, 191) * 7}cqw`,
              background: conf.colors[i % 3],
              borderColor: conf.colors[i % 3],
              animationDelay: `${t0 + fxRnd(i, 193) * 460}ms`,
            } as CSSProperties
          }
        />
      ))}
      <Bloom at={at} color={conf.colors[2]} size={17} delay={t0 + 260} />
    </>
  );
}

/**
 * Panel translúcido que se levanta DELANTE de quien lo pone, con el brillo
 * recorriéndolo. Reflejo, Pantalla de Luz, Velo Aurora.
 */
function ScreenFx({
  at,
  side,
  conf,
  t0,
}: {
  at: Spot;
  /** Hacia dónde mira el panel: se planta entre su dueño y el rival. */
  side: Side;
  conf: TypeFx;
  t0: number;
}) {
  return (
    <>
      <span
        aria-hidden
        className="pk-screen-pane"
        style={
          {
            ...spotStyle({ x: at.x + (side === "player" ? 9 : -9), y: at.y - 4 }),
            "--c": conf.colors[1],
            "--c2": conf.colors[2],
            animationDelay: `${t0}ms`,
          } as CSSProperties
        }
      />
      <Bloom at={at} color={conf.colors[2]} size={12} delay={t0 + 300} />
    </>
  );
}

/**
 * Burbuja hexagonal que se cierra de golpe alrededor de quien se protege y
 * se queda vibrando. Protección, Detección, Escudo Real, Sustituto.
 */
function ShieldFx({ at, conf, t0 }: { at: Spot; conf: TypeFx; t0: number }) {
  return (
    <>
      <span
        aria-hidden
        className="pk-shield-bubble"
        style={
          {
            ...spotStyle({ x: at.x, y: at.y - 3 }),
            "--c": conf.colors[1],
            "--c2": conf.colors[2],
            animationDelay: `${t0}ms`,
          } as CSSProperties
        }
      />
      <Shockwave at={at} color={conf.colors[2]} size={14} delay={t0 + 200} count={1} />
    </>
  );
}

/**
 * La animación completa de un movimiento: la coreografía que le toca por
 * archetipo, vestida con los colores de su tipo.
 */
function MoveFx({ fx }: { fx: ActiveFx }) {
  // La paleta ya viene resuelta desde `attack()`: la de su tipo, o la propia
  // del movimiento cuando en los juegos no coinciden (Hiperrayo es naranja
  // aunque sea Normal, Fuego Fatuo azul aunque sea Fuego).
  const conf = fx.conf;
  const target: Side = fx.attacker === "player" ? "rival" : "player";
  const from = AIM[fx.attacker];
  const to = AIM[target];
  // Al salir de un movimiento de dos turnos todo espera un tiempo: primero
  // el sprite reaparece, y solo entonces ataca.
  const t0 = fx.release ? 380 : 0;
  // Un `switch` y no una tabla de componentes: cada coreografía recibe los
  // argumentos que necesita —unas apuntan, otras se quedan en casa y unas
  // pocas bañan la arena entera—, y eso no cabe en una firma común sin
  // pasarle a todas cosas que no usan.
  const body = (() => {
    switch (fx.archetype) {
      case "beam":
        return <BeamFx from={from} to={to} conf={conf} t0={t0} />;
      case "pulse":
        return <PulseFx from={from} to={to} conf={conf} t0={t0} />;
      case "orb":
        return <OrbFx from={from} to={to} conf={conf} t0={t0} />;
      case "barrage":
        return <BarrageFx from={from} to={to} conf={conf} t0={t0} shots={fx.hits} />;
      case "bolt":
        return <BoltFx to={to} conf={conf} t0={t0} />;
      case "meteor":
        return <MeteorFx to={to} conf={conf} t0={t0} />;
      case "gleam":
        return <GleamFx at={from} conf={conf} t0={t0} />;
      case "contact":
        return <ContactFx to={to} conf={conf} t0={t0} />;
      case "slash":
        return <SlashFx to={to} conf={conf} t0={t0} hits={fx.hits} />;
      case "punch":
        return <PunchFx from={from} to={to} conf={conf} t0={t0} hits={fx.hits ?? 1} />;
      case "kick":
        return <KickFx to={to} conf={conf} t0={t0} hits={fx.hits ?? 1} />;
      case "bite":
        return <BiteFx to={to} conf={conf} t0={t0} />;
      case "pierce":
        return <PierceFx from={from} to={to} conf={conf} t0={t0} />;
      case "spin":
        return <SpinFx to={to} conf={conf} t0={t0} />;
      case "slam":
        return <SlamFx to={to} conf={conf} t0={t0} />;
      case "dive":
        return <DiveFx to={to} conf={conf} t0={t0} />;
      case "quake":
        return <QuakeFx to={to} conf={conf} t0={t0} />;
      case "wave":
        return <WaveFx from={from} to={to} conf={conf} t0={t0} />;
      case "swirl":
        return <SwirlFx to={to} conf={conf} t0={t0} />;
      case "spire":
        return <SpireFx to={to} conf={conf} t0={t0} />;
      case "weather":
        return <WeatherFx conf={conf} t0={t0} />;
      case "terrain":
        return <TerrainFx conf={conf} t0={t0} />;
      case "hazard":
        return <HazardFx from={from} to={to} conf={conf} t0={t0} />;
      case "warp":
        return <WarpFx at={from} conf={conf} t0={t0} />;
      case "sound":
        return <SoundFx from={from} conf={conf} t0={t0} />;
      case "nuke":
        return <NukeFx from={from} to={to} conf={conf} t0={t0} />;
      case "explode":
        return <ExplodeFx at={from} conf={conf} t0={t0} />;
      case "drain":
        return <DrainFx from={from} to={to} conf={conf} t0={t0} />;
      case "psylift":
        return <PsyliftFx to={to} conf={conf} t0={t0} />;
      case "hex":
        return <HexFx to={to} conf={conf} t0={t0} />;
      case "venom":
        return <VenomFx to={to} conf={conf} t0={t0} />;
      case "powder":
        return <PowderFx from={from} to={to} conf={conf} t0={t0} />;
      case "trap":
        return <TrapFx to={to} conf={conf} t0={t0} />;
      case "buff":
        return <BuffFx at={from} conf={conf} t0={t0} />;
      case "debuff":
        return <DebuffFx at={to} conf={conf} t0={t0} />;
      case "dance":
        return <DanceFx at={from} conf={conf} t0={t0} />;
      case "heal":
        return <HealFx at={from} t0={t0} />;
      case "screen":
        return <ScreenFx at={from} side={fx.attacker} conf={conf} t0={t0} />;
      case "shield":
        return <ShieldFx at={from} conf={conf} t0={t0} />;
    }
  })();
  return (
    // `--tempo` multiplica la duración de TODA la hoja de efectos (las reglas
    // lo llevan en un `calc()`), así que un movimiento de prioridad entra y
    // sale de golpe y un remate se toma su tiempo, sin duplicar una sola
    // animación por velocidad.
    <div
      className="pointer-events-none absolute inset-0 z-10"
      style={{ "--tempo": fx.tempo } as CSSProperties}
    >
      <FxWeight.Provider value={fx.weight}>
        {/* Reaparición: tierra o agua saltando bajo el que vuelve. */}
        {fx.release && (
          <>
            <Debris at={from} conf={conf} count={10} power={1.1} delay={0} />
            <Shockwave at={from} color={conf.colors[1]} size={14} delay={40} count={1} />
          </>
        )}
        {body}
      </FxWeight.Provider>
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
  // Which file to draw is DERIVED from the view on every render, never seeded
  // into state: state that outlives the battler it was measured for is what
  // leaves the previous occupant frozen on the platform while the databox and
  // the battle log have already moved on to the next one. The stage does
  // remount this component per combatant (`key={view.key}`), and the image
  // below is keyed on the file itself — but even if either key were lost, the
  // sprite still follows whoever is actually out.
  const [seenKey, setSeenKey] = useState(view.key);
  /** URL that failed to load, so the artwork can stand in for it. */
  const [failed, setFailed] = useState<string | null>(null);
  // Proporción natural del lienzo, leída cuando aterriza el GIF. No decide el
  // tamaño —eso lo pone la especie— pero sí cuánto ancho ocupa ese tamaño, que
  // es lo que impide que un Wailord (171×102) se salga del campo por los lados
  // mientras un Lucario (70×96) se queda corto.
  const [aspect, setAspect] = useState<number | null>(null);
  // Render-phase reset (the same pattern the stage uses for its FX classes):
  // a new occupant starts with no failure and no measurement of its own.
  if (seenKey !== view.key) {
    setSeenKey(view.key);
    setFailed(null);
    setAspect(null);
  }

  const preferred = view.url || view.art || "";
  // A sprite that 404s falls back to the official artwork. With no artwork on
  // file there is nothing better to draw, so it keeps the URL it has: blanking
  // to `src=""` would make the browser re-request the page itself and leave a
  // broken image standing on the platform for the rest of the battle.
  const src = failed === preferred && view.art ? view.art : preferred;
  const artwork = src !== "" && src === view.art;
  // A real back sprite already faces away. Anything else standing in on your
  // side (a front sprite, the artwork) has to be mirrored to face the field.
  const flip = isPlayer && !/\/back\//.test(src);
  const glow = isPlayer
    ? `drop-shadow(0 14px 12px rgba(0,0,0,0.45)) drop-shadow(0 0 22px ${view.aura}33)`
    : `drop-shadow(0 10px 9px rgba(0,0,0,0.4)) drop-shadow(0 0 18px ${view.aura}33)`;

  // Measured through a ref rather than `onLoad` alone: a cached GIF is
  // already complete by the time React attaches its handler, and that load
  // event never fires.
  const measure = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth > 0)
      setAspect(el.naturalWidth / el.naturalHeight);
  }, []);
  // Alto en unidades de contenedor: 1cqw es el 1% del ancho de la arena, así
  // que los combatientes conservan su proporción de un teléfono a un
  // ultrapanorámico.
  //
  // La MISMA fórmula para los dos lados. Antes había un factor por lado (0.105
  // el jugador, 0.25 el rival) apoyado en que las láminas de espalda de la
  // librería estarían dibujadas a casi el doble de resolución que las de
  // frente. No es cierto: medidos los lienzos, la razón alto espalda/frente es
  // ~1.00 de mediana (Charizard 166/140, Pikachu 61/60, Garchomp 106/108,
  // Caterpie 45/45). Aquel 2.4× de diferencia era lo que hacía que el rival
  // saliera siempre bastante más grande que el tuyo.
  //
  // Quien manda es el ALTO REAL DE LA ESPECIE, que es igual mires el bicho de
  // frente o de espaldas: por eso un Charizard mide lo mismo lo saque quien lo
  // saque, y lo único que separa a los dos lados es el escalón de distancia.
  //
  // La curva es compresiva a propósito. De Joltik (0.1 m) a Wailord (14.5 m)
  // hay 145×, y ni el campo ni los juegos dibujan eso: elevado a 0.32, ese
  // abanico se queda en un 3× largo, que es lo que se ve en la consola —
  // se nota de sobra quién es grande y aun así los dos caben en su plataforma.
  const size = (() => {
    if (artwork || aspect === null) return undefined;
    // 13.5 cqw es el alto de una especie de 1.5 m; de ahí sale todo lo demás.
    let h = 13.5 * Math.pow(Math.max(view.height ?? 1.5, 0.1) / 1.5, 0.32);
    // Techo por ANCHO: Wailord es bajo y larguísimo, y sin esto ocuparía
    // media arena de lado a lado para llegar a su alto.
    h = Math.min(h, 24 / aspect);
    // Cotas: sin suelo un Joltik desaparece sobre una plataforma enorme, sin
    // techo un Steelix se sale del campo.
    h = Math.min(Math.max(h, 7.5), 20);
    return `${(h * depthOf(side)).toFixed(2)}cqw`;
  })();

  const image = (opacity?: number, extra?: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      // Identity of the file being drawn: swapping combatants (or falling back
      // to the artwork) tears the element down and mounts a new one, so the
      // browser decodes the new GIF from its first frame instead of holding
      // the previous occupant's last one until the swap finishes downloading.
      key={src}
      src={src}
      alt={
        opacity !== undefined
          ? "" // Trail ghosts are decoration; the fighter below is named.
          : artwork
            ? a11y.artOf(view.label)
            : a11y.battleSpriteOf(view.label, isPlayer ? "back" : "front")
      }
      aria-hidden={opacity !== undefined}
      onError={() => setFailed(preferred)}
      // Only the fighter itself measures; its trail ghosts are clones.
      ref={opacity === undefined ? measure : undefined}
      onLoad={(e) => {
        if (opacity === undefined)
          setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight);
      }}
      className={cn(
        "block origin-bottom",
        // La lámina se mide por ALTO —es lo que compara el ojo entre dos
        // criaturas—, así que el ancho lo pone el propio dibujo. La ilustración
        // oficial, que es cuadrada y con mucho aire, sigue llenando su bloque:
        // el del rival ya es el del jugador por el mismo escalón de distancia,
        // así que tampoco desempareja.
        artwork
          ? "h-auto w-full object-contain"
          : "w-auto max-w-none [image-rendering:pixelated]",
        // Showdown ships these at sprite resolution and the arena blows them
        // up ~2.5×: nearest-neighbour keeps them crisp, the way the handheld
        // games look on a modern screen. The artwork must stay smooth.
      )}
      style={{
        height: size,
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

/**
 * Dibujo de la Poké Ball, del tamaño que le pase la escena.
 *
 * Ya no es un SVG plano. La bola de los juegos es una ESFERA de plástico
 * pulido: tiene el brillo especular arriba a la izquierda, la carne roja
 * apagándose hacia el borde, el rebote de luz del suelo por debajo y la banda
 * negra curvándose con el volumen. Todo eso son capas de gradiente, y en CSS se
 * escriben una vez y valen para las dos mitades —que la apertura recorta con
 * `clip-path`— sin duplicar `<defs>` ni repetir identificadores por el
 * documento, que es lo que pasaba al pintar cuatro copias del mismo SVG.
 *
 * Todas las medidas cuelgan de `--ball`, el diámetro que pone la escena, así
 * que la bola del jugador y la del rival —que no miden lo mismo— salen con el
 * mismo dibujo y no con dos aproximaciones parecidas.
 */
function PokeBallGfx() {
  return (
    <span aria-hidden className="pk-ball">
      <span className="pk-ball__band" />
      <span className="pk-ball__btn" />
      <span className="pk-ball__gloss" />
    </span>
  );
}

/** Chispas que salta la bola al abrirse, en grados. Fijas: un abanico al azar
    cambiaría en cada render y el estallido dejaría de repetirse igual. */
const SEND_SPARKS = [-150, -108, -66, -24, 24, 66, 108, 150];

/** De dónde sale la bola de cada lado: la tuya desde tu mano —15cqw a la
    izquierda del centro de tu plataforma, o sea justo donde estás plantado, y
    por debajo del encuadre—; la del rival, desde donde está su entrenador. */
const BALL_ORIGIN: Record<Side, CSSProperties> = {
  player: { "--from-x": "-15cqw", "--from-y": "13cqw", "--peak-y": "-7cqw" },
  rival: { "--from-x": "-17cqw", "--from-y": "5cqw", "--peak-y": "-6cqw" },
} as unknown as Record<Side, CSSProperties>;

type BallMode = "throw" | "open" | "recall";

/**
 * La bola sobre la plataforma.
 *
 * Es la cinemática que más veces se ve en un combate —una por Pokémon que sale
 * y otra por cada relevo—, así que va coreografiada como en los juegos y no
 * resuelta en un fotograma:
 *
 *   · VUELO (`throw`) — la bola describe su parábola girando sobre sí misma
 *     (traslación horizontal y vertical en elementos anidados, que es como se
 *     dibuja un arco sin JavaScript), y bajo ella corre su propia sombra, que
 *     se encoge cuando sube y se abre cuando baja. Esa sombra es la que dice a
 *     qué altura va la bola: sin ella el arco es un dibujo moviéndose por la
 *     pantalla, con ella es un objeto volando sobre un campo.
 *   · APERTURA (`open`) — la bola se aplasta al tocar el suelo, rebota, se
 *     PARTE EN DOS —la tapa sale girando hacia arriba y la base cae hacia
 *     abajo— y de en medio salen el núcleo blanco, la columna de luz de la que
 *     se forma el Pokémon, la onda de choque sobre la hierba, el abanico de
 *     rayos y las chispas.
 *   · RETIRADA (`recall`) — el anillo rojo que recoge al Pokémon.
 */
function BallFx({ side, mode }: { side: Side; mode: BallMode }) {
  // Diámetro de la bola. Va como variable y no como `width` suelto porque de
  // él cuelgan también la sombra, el núcleo, la onda y las chispas.
  const root = {
    "--ball": side === "player" ? "4.4cqw" : "3.4cqw",
  } as CSSProperties;

  if (mode === "recall") {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
        style={root}
      >
        <span className="pk-ball-box relative block">
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

  if (mode === "open") {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
        style={root}
      >
        <span className="pk-ball-box relative block">
          {/* Las dos mitades. Cada una es la bola entera recortada por su
              lado, así que el corte cae exactamente en la banda negra. */}
          <span className="pk-ball-lid">
            <PokeBallGfx />
          </span>
          <span className="pk-ball-base">
            <PokeBallGfx />
          </span>
          {/* Lo que la bola llevaba dentro: el núcleo, la columna de luz de la
              que se forma el Pokémon y el abanico que la corona. */}
          <span className="pk-ball-core" />
          <span className="pk-ball-beam" />
          <span className="pk-ball-rays" />
          {/* Y sobre la hierba, la onda de choque de la apertura. */}
          <span className="pk-ball-ring" />
          {SEND_SPARKS.map((angle, i) => (
            <span
              key={angle}
              className="pk-ball-spark"
              style={
                {
                  "--angle": `${angle}deg`,
                  "--spark": `${i * 22}ms`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
      style={root}
    >
      <span className="pk-ball-x relative block" style={BALL_ORIGIN[side]}>
        {/* La sombra vive en el carril HORIZONTAL: acompaña a la bola por el
            campo pero no sube con ella, que es justo lo que hace una sombra. */}
        <span className="pk-ball-drop" />
        {/* `block`: la vertical del arco es un `transform`, y un `transform`
            no se aplica a una caja en línea. Sin él la bola cruzaba en
            horizontal, sin arco. */}
        <span className="pk-ball-y block">
          <span className="pk-ball-spin pk-ball-box relative block">
            <PokeBallGfx />
          </span>
        </span>
      </span>
    </span>
  );
}

/** Chispas del objeto, en abanico fijo para que el bucle no se note. */
const SPARKS = [-38, -22, -8, 6, 20, 34];

/** De dónde viene el frasco: de tu mano por abajo, del Entrenador rival por
    detrás. Mismo truco de parábola que la bola, con su propio arco: un frasco
    no se lanza tan alto ni tan lejos como una Poké Ball. */
const ITEM_ORIGIN: Record<Side, CSSProperties> = {
  player: { "--from-x": "-13cqw", "--from-y": "11cqw", "--peak-y": "-9cqw" },
  rival: { "--from-x": "-12cqw", "--from-y": "4cqw", "--peak-y": "-7cqw" },
} as unknown as Record<Side, CSSProperties>;

/**
 * Objeto usado: el frasco vuela hasta el Pokémon, se rompe en un destello y
 * el efecto sube envolviéndolo — verde si cura, ámbar si sube una
 * característica.
 *
 * Las tres capas van en elementos ANIDADOS y de nivel bloque a propósito: el
 * arco es traslación horizontal por fuera y vertical por dentro (la parábola
 * de siempre), y un `transform` no se aplica a una caja en línea. Con los
 * `span` en línea que había aquí, el frasco no volaba: aparecía plantado a los
 * pies del Pokémon y se quedaba quieto hasta desaparecer.
 */
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
  // El destello y el aura arrancan cuando el frasco TOCA al Pokémon, no antes:
  // el efecto es consecuencia del objeto, y ese compás es lo que lo cuenta.
  const landing = `${GEN7.itemThrow}ms`;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
    >
      <span className="relative block" style={{ width: size, height: size }}>
        {/* Aura que envuelve al Pokémon mientras el objeto hace efecto. */}
        <span
          className="pk-item-aura absolute -inset-[300%] rounded-full"
          style={{
            background: `radial-gradient(circle, ${tint}55 0%, ${tint}22 45%, transparent 70%)`,
            animationDelay: landing,
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
                animationDelay: `calc(${landing} + ${i * 80}ms)`,
              } as CSSProperties
            }
          />
        ))}
        {sprite && (
          <span
            className="pk-item-x absolute inset-0 block"
            style={ITEM_ORIGIN[side]}
          >
            {/* El halo va en el padre: el destello de aterrizaje anima el
                `filter` del frasco, y los dos en el mismo elemento se pisan. */}
            <span
              className="pk-item-y block h-full w-full"
              style={{ filter: `drop-shadow(0 0 8px ${tint})` }}
            >
              {/* Sprite oficial del objeto: es el mismo que la mochila
                  enseña, así que el jugador reconoce lo que acaba de usar.
                  Al aterrizar se agranda, se pone al blanco y se deshace. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sprite}
                alt=""
                className="pk-item-pop block h-full w-full object-contain [image-rendering:pixelated]"
                style={{ animationDelay: landing }}
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

/** Un Entrenador de pie en el campo, junto a su Pokémon. */
export interface StageTrainer {
  /** Sprite oficial ya bajado a `public/trainers/`. */
  sprite: string;
  name: string;
  /** Aire transparente bajo sus pies, de los 80 px del sprite. */
  foot: number;
}

/**
 * Los dos Entrenadores y en qué momento de la apertura está cada uno.
 *
 * Van juntos porque la secuencia es una sola: se plantan los dos, lanzan los
 * dos y se marchan los dos, cada uno por su lado del encuadre. Quien lo dirige
 * es el guion del combate (`BattleArena` / `BattleScreen`), que es quien sabe
 * cuándo se ha terminado de escribir el mensaje de la caja de texto.
 */
export interface StageTrainers {
  /** Omitido en combates salvajes, donde no hay nadie enfrente. */
  player?: StageTrainer | null;
  rival?: StageTrainer | null;
  stance: Record<Side, TrainerStance>;
}

interface StageProps {
  player: SpriteView | null;
  enemy: SpriteView | null;
  scenario: ScenarioKey;
  trainers?: StageTrainers | null;
}

/**
 * Carril por el que un Entrenador entra y sale del encuadre.
 *
 * Ocupa el plano del suelo entero, así que su `translateX(±100%)` es el ancho
 * de la arena: la figura sale de cuadro por su lado a cualquier tamaño de
 * pantalla, sin depender de lo ancho que sea el sprite. Dentro, la figura se
 * coloca en % del propio plano, como el resto de la escena.
 */
function TrainerLane({
  side,
  stance,
  children,
}: {
  side: Side;
  stance: TrainerStance;
  children: ReactNode;
}) {
  return (
    <div
      className="pk-trainer-lane pointer-events-none absolute inset-0"
      style={{
        transform:
          stance === "off"
            ? `translateX(${side === "player" ? "-100%" : "100%"})`
            : "translateX(0)",
      }}
    >
      {children}
    </div>
  );
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
  function BattleStage2D({ player, enemy, scenario, trainers }, ref) {
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
          const archetype = choreographyFor(
            move.slug,
            move.type,
            move.damageClass,
            move.selfTarget ?? false,
          );
          const sig = signatureFor(move.slug);
          const baseConf = TYPE_FX[move.type] ?? TYPE_FX.normal;
          // El peso sale de la potencia listada, con la mediana de los
          // movimientos del juego (80) como golpe «normal». Los de potencia
          // variable y los de estado se quedan en 1 — no hay número del que
          // deducir nada, y un Danza Espada gigante no significaría nada.
          const weight =
            sig.power ??
            (move.power ? clamp(move.power / 80, 0.7, 1.8) : 1);
          const tempo = sig.tempo ?? 1;
          // Pose del ataque y lo que dura antes de devolver el sprite a su
          // sitio: embestida, recogimiento de disparo o brillo de estado.
          const stance = STANCE_OF[archetype];
          const pose =
            stance === "lunge"
              ? side === "player"
                ? "pk-lunge-p"
                : "pk-lunge-e"
              : stance === "glow"
                ? "pk-charge-glow"
                : "pk-brace";
          const hold = stance === "lunge" ? 450 : stance === "glow" ? 900 : 520;
          const strike = () => {
            setSprite(side, pose);
            later(hold, () =>
              setSpriteFx((f) => (f[side] === pose ? { ...f, [side]: "" } : f)),
            );
            // Los movimientos psíquicos LEVANTAN al rival: el sprite del que
            // lo recibe también actúa, no solo el que ataca. Un rival oculto
            // (bajo tierra, en el aire) se queda como está.
            if (archetype === "psylift") {
              const foe: Side = side === "player" ? "rival" : "player";
              setSpriteFx((f) =>
                isHidden(f[foe]) ? f : { ...f, [foe]: "pk-psylift" },
              );
              later(900, () =>
                setSpriteFx((f) =>
                  f[foe] === "pk-psylift" ? { ...f, [foe]: "" } : f,
                ),
              );
            }
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
            conf: sig.tint
              ? { colors: [...sig.tint] as TypeFx["colors"], shape: baseConf.shape }
              : baseConf,
            weight,
            hits: sig.hits,
            tempo,
            release: move.release,
          });
          const t0 = move.release ? 400 : 0;
          later(Math.round((move.release ? 1900 : 1500) * tempo), () =>
            setFx((f) => (f?.seq === seq ? null : f)),
          );
          // El guion del combate necesita saber cuándo golpea esto para
          // reproducir el daño justo entonces. Va escalado por el ritmo: si la
          // animación se alarga y este número no, el respingo se adelanta al
          // golpe y se ve el daño antes de que llegue nada.
          return {
            impactAt: Math.round(t0 + IMPACT_AT[archetype] * tempo),
            duration: Math.round((t0 + 1100) * tempo),
          };
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
          // +680, no +460: la apertura ya no es un fogonazo, es rebote, corte,
          // columna de luz y chispas escalonadas. Con el margen viejo el
          // desmontaje se llevaba por delante la última chispa y la onda a
          // media expansión.
          later(GEN7.ballFlight + 680, () =>
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
          // +420: la última chispa del abanico sale escalonada, y sin ese
          // margen se la llevaba por delante el desmontaje.
          later(GEN7.itemThrow + GEN7.item + 420, () =>
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
          {/* Entrenador rival, plantado justo detrás de la plataforma de su
              Pokémon: comparte con él plano de profundidad y lado del campo,
              como en los juegos, y por eso se dibuja ANTES que el bloque del
              rival — cuando el Pokémon aterriza, lo tapa.

              Vive fuera de ese bloque a propósito, para que embestidas e
              impactos sacudan a la criatura y no a quien le da las órdenes. */}
          {trainers?.rival && (
            <TrainerLane side="rival" stance={trainers.stance.rival}>
              <TrainerFigure
                sprite={trainers.rival.sprite}
                name={trainers.rival.name}
                foot={trainers.rival.foot}
                side="rival"
                stance={trainers.stance.rival}
                // Detrás y hacia la fuga: lo que se aleja tira hacia el centro
                // del encuadre, y más pequeño que tú (13% contra 18%), que es
                // lo que pone la distancia. Ese 13% va con el escalón al que
                // ahora pisa: al 10% de antes le sobraba lejanía para un sitio
                // que ya no está al fondo del campo.
                //
                // No cae a plomo sobre la plataforma: el Pokémon rival ocupa
                // hasta 24% de ancho centrado en el 64.5%, o sea desde el 52%,
                // y cualquier cosa a partir de ahí se la come. Un Entrenador al
                // que le tapa la cara su propio Pokémon no está en la escena,
                // está debajo de ella.
                className="left-[38%] w-[13%]"
                style={{ bottom: GROUND.rivalTrainer }}
                light={palette.lightPool}
                bounce={palette.ground[1]}
                far
              />
            </TrainerLane>
          )}

          {/* Rival: al fondo a la derecha, de frente y algo más pequeño por la
              distancia, con los pies sobre el centro de su plataforma. El
              bloque no tiene alto propio: es la línea de contacto contra la
              que se alinean disco y criatura. */}
          <div
            className="absolute"
            style={{ left: "52%", bottom: GROUND.rival, width: "25%" }}
          >
            <Platform2D
              id={`e-${scenario}`}
              kind={palette.platform}
              // El disco crece y se aplasta menos con la criatura que sostiene:
              // 25% es el 30% del jugador por el mismo 0.85 de distancia que
              // encoge al Pokémon rival (ver `depthOf`). Si se cambia uno hay
              // que cambiar el otro, o la criatura deja de casar con su suelo.
              className={cn(
                "absolute inset-x-0 bottom-0 aspect-[3.4/1] w-full",
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

          {/* Jugador: delante a la izquierda, más grande por la cercanía y
              girado hacia el rival.

              El 16% es la misma regla que sitúa al Pokémon rival respecto de
              su Entrenador, aplicada de este lado: tú te plantas en el borde
              izquierdo (caja del 1% al 19%), así que tu plataforma empieza
              donde acaba tu caja. Un combatiente ocupa como mucho 24% de
              ancho centrado en el 31%, o sea desde el 19%, y con eso NUNCA
              hay nadie encima de tu Entrenador ni tu Entrenador encima del
              disco — que es lo que pasaba con el 4% de antes: la criatura
              nacía a cuatro puntos de tus pies y compartíais plataforma. Al
              lado y con aire por medio, como enfrente y como en los juegos.

              Si se toca esta cifra hay que tocar `AIM.player`: es el mismo
              punto, una vez para dibujar y otra para apuntar. */}
          <div
            className="absolute"
            style={{ left: "16%", bottom: GROUND.player, width: "30%" }}
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

          {/* Tú, en la esquina inferior izquierda y de espaldas, el encuadre
              de los juegos. Al revés que el rival, se dibuja DESPUÉS de tu
              bloque: estás en el escalón más cercano a la cámara, así que tu
              propio Pokémon aparece por detrás de ti. */}
          {trainers?.player && (
            <TrainerLane side="player" stance={trainers.stance.player}>
              <TrainerFigure
                sprite={trainers.player.sprite}
                name={trainers.player.name}
                foot={trainers.player.foot}
                side="player"
                stance={trainers.stance.player}
                // Primer plano, pegado al borde izquierdo y por delante de
                // tu propio Pokémon: eres quien está más cerca de la cámara.
                className="left-[1%] w-[18%]"
                style={{ bottom: GROUND.playerTrainer }}
                light={palette.lightPool}
                // El suelo que pisa le devuelve su color. Es el tono medio de
                // la rampa del escenario: el césped iluminado del estadio, o el
                // suelo de rejilla cian de la cámara de simulación.
                bounce={palette.ground[1]}
              />
            </TrainerLane>
          )}

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
