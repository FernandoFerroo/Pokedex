/**
 * Los cinco Entrenadores de la escalera, como cinco maneras de jugar.
 *
 * Hay UN cerebro. Lo que cambia de uno a otro no es cuánto sabe de Pokémon,
 * sino qué prioriza y cuánto se equivoca — que es exactamente lo que distingue
 * a un jugador de otro en una mesa de verdad. Un rival «fácil» que elige al
 * azar no se lee como novato, se lee como roto; uno que elige el segundo mejor
 * movimiento, o el más vistoso, sí.
 *
 * El eje de IDENTIDAD vive aquí. El de DIFICULTAD lo sigue poniendo
 * `tierForRound` a partir de la copa, y los dos se componen en `brainFor`: el
 * mismo Brock aprieta más en la Copa Maestra que en la Relámpago sin dejar de
 * ser Brock.
 */
import type { RivalTier } from "@/types/tournament";
import type { BattleMove, Battler } from "@/types/battle";
import type { Knowledge } from "./threat";

export type AiProfileKey =
  | "brock"
  | "misty"
  | "ltsurge"
  | "sabrina"
  | "lance"
  /** El rival del Modo Combate, que no es de la escalera: juego impecable. */
  | "ace";

/** Contexto que ve una firma personal al puntuar un movimiento. */
export interface SignatureContext {
  me: Battler;
  foe: Battler;
  /** Fracción de PS que le queda al que ataca, 0-1. */
  myHp: number;
  foeHp: number;
}

export interface AiProfile {
  key: AiProfileKey;
  /** 0 = sólo este turno · 1 = cuenta la respuesta · 2 = un turno más. */
  depth: 0 | 1 | 2;
  /** Cuántos candidatos sobreviven para mirarlos en profundidad. */
  breadth: number;
  /** Temperatura del softmax. 0 = siempre la mejor jugada. */
  temperature: number;
  /** Probabilidad de soltar directamente una mala jugada. */
  blunderRate: number;
  knowledge: Knowledge;
  /** Peso del daño propio frente a conservar los PS. */
  aggression: number;
  /** Ganas de cambiar de Pokémon. */
  switchiness: number;
  /** Ganas de dejar caer al que ya está sentenciado para entrar gratis. */
  sacrifice: number;
  /** Ganas de subirse los números en vez de pegar. */
  setupAppetite: number;
  /** Ganas de dejar al rival dormido, quemado o paralizado. */
  statusAppetite: number;
  /** Cabeza para la mochila: 1 = usa la poción cuando toca, y sólo entonces. */
  itemDiscipline: number;
  /** Su manía. Devuelve un extra (o un castigo) en fracción de PS. */
  signature: (move: BattleMove, ctx: SignatureContext) => number;
}

const NO_SIGNATURE = () => 0;

/** Movimientos que pegan más cuanto menos vida le queda al que los usa. */
const LAST_STAND = new Set(["flail", "reversal"]);

export const PROFILES: Record<AiProfileKey, AiProfile> = {
  /**
   * Brock. El primer Gimnasio: enseña a pelear. Aguanta en el sitio, no se
   * mueve del Pokémon que tiene delante y va de frente. Falla, y se le nota.
   */
  brock: {
    key: "brock",
    depth: 0,
    breadth: 4,
    temperature: 0.2,
    blunderRate: 0.05,
    knowledge: "revealed",
    aggression: 1.15,
    switchiness: 0.1,
    sacrifice: 0,
    setupAppetite: 0.3,
    statusAppetite: 0.5,
    itemDiscipline: 0.6,
    // Defiende: prefiere el golpe físico, que es su terreno.
    signature: (move) => (move.damageClass === "physical" ? 0.05 : 0),
  },

  /**
   * Misty. Va a por el K.O. desde el primer turno y no se guarda nada: el
   * ataque más fuerte que tenga, otra vez, y otra.
   */
  misty: {
    key: "misty",
    depth: 1,
    breadth: 4,
    temperature: 0.14,
    blunderRate: 0.02,
    knowledge: "revealed",
    aggression: 1.4,
    switchiness: 0.25,
    sacrifice: 0,
    setupAppetite: 0.2,
    statusAppetite: 0.4,
    itemDiscipline: 0.75,
    // El movimiento gordo, aunque no sea el más eficiente.
    signature: (move) => ((move.power ?? 0) >= 90 ? 0.1 : 0),
  },

  /**
   * Lt. Surge. Pega primero y deja al rival sin poder moverse. Su idea del
   * combate es que el otro no llegue a jugar su turno.
   */
  ltsurge: {
    key: "ltsurge",
    depth: 1,
    breadth: 5,
    temperature: 0.09,
    blunderRate: 0,
    knowledge: "revealed",
    aggression: 1.25,
    switchiness: 0.5,
    sacrifice: 0.3,
    setupAppetite: 0.5,
    // La parálisis es media victoria, y él lo sabe.
    statusAppetite: 1.5,
    itemDiscipline: 0.9,
    signature: (move) =>
      move.effects?.ailment === "paralysis" ? 0.18 : 0,
  },

  /**
   * Sabrina. Te ve venir: es la única de la escalera que razona con el equipo
   * del jugador entero a la vista, y usa esa ventaja para colocarse antes de
   * pegar. Contra ella no sirve guardarse una sorpresa.
   */
  sabrina: {
    key: "sabrina",
    depth: 1,
    breadth: 6,
    temperature: 0.05,
    blunderRate: 0,
    knowledge: "full",
    aggression: 0.95,
    switchiness: 1,
    sacrifice: 0.8,
    setupAppetite: 1.6,
    statusAppetite: 1.3,
    itemDiscipline: 1,
    // Dormir al rival es su jugada: un rival dormido no responde.
    signature: (move) => (move.effects?.ailment === "sleep" ? 0.2 : 0),
  },

  /**
   * Lance. El Campeón. No tiene manías porque no las necesita: mira un turno
   * más allá que nadie y sencillamente no regala nada.
   */
  lance: {
    key: "lance",
    depth: 2,
    breadth: 6,
    temperature: 0.015,
    blunderRate: 0,
    knowledge: "full",
    aggression: 1,
    switchiness: 0.8,
    sacrifice: 1.2,
    setupAppetite: 1,
    statusAppetite: 1,
    itemDiscipline: 1.2,
    signature: NO_SIGNATURE,
  },

  /**
   * El rival del Modo Combate. No es un personaje, así que juega el cerebro
   * limpio, con una pizca de sal para que dos combates seguidos contra el
   * mismo equipo no sean el mismo combate.
   */
  ace: {
    key: "ace",
    depth: 2,
    breadth: 6,
    temperature: 0.03,
    blunderRate: 0,
    knowledge: "revealed",
    aggression: 1,
    switchiness: 0.8,
    sacrifice: 1,
    setupAppetite: 1,
    statusAppetite: 1,
    itemDiscipline: 1.1,
    signature: (move, ctx) =>
      LAST_STAND.has(move.slug) && ctx.myHp < 0.35 ? 0.15 : 0,
  },
};

/**
 * Cómo aprieta la copa. El tier es el eje de dificultad: recorta cuánto mira
 * el cerebro hacia delante y cuánto ruido mete en la elección, sin tocar la
 * personalidad.
 */
const TIER_SCALING: Record<
  RivalTier,
  { depthCap: 0 | 1 | 2; temperature: number; blunder: number; knowledge?: Knowledge }
> = {
  rookie: { depthCap: 0, temperature: 1.6, blunder: 1.5, knowledge: "revealed" },
  veteran: { depthCap: 1, temperature: 1, blunder: 0.4 },
  champion: { depthCap: 2, temperature: 0.3, blunder: 0 },
};

/** La personalidad de un Entrenador, apretada por el tier de la ronda. */
export function scaleProfile(profile: AiProfile, tier: RivalTier): AiProfile {
  const scale = TIER_SCALING[tier];
  return {
    ...profile,
    depth: Math.min(profile.depth, scale.depthCap) as 0 | 1 | 2,
    temperature: profile.temperature * scale.temperature,
    blunderRate: profile.blunderRate * scale.blunder,
    knowledge: scale.knowledge ?? profile.knowledge,
  };
}

/** Perfil por clave, con el as de reserva si la clave no existe. */
export function profileFor(key: AiProfileKey | undefined): AiProfile {
  return PROFILES[key ?? "ace"] ?? PROFILES.ace;
}
