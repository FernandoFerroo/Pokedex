/**
 * Qué se lleva el jugador de una carrera de torneo.
 *
 * Puro y sin efectos: quien lo llama decide cuándo se cobra. Eso importa más
 * de lo que parece — los PE de ronda se pagan **al terminar** la carrera, no
 * ronda a ronda, para que «gano la primera, guardo y salgo, y vuelvo a
 * empezar» no sea una máquina de fabricar puntos.
 */
import type { TournamentFormat, TournamentPace } from "@/types/tournament";
import type { PackInventory } from "@/types/tcg";

/**
 * Lo que multiplica el RITMO a todo lo que paga una carrera.
 *
 * La copa decide QUÉ sobre se lleva; el ritmo, cuánta experiencia. Y el reparto
 * no puede salir de la duración a secas: una Clásica dura unos veinte minutos y
 * una Relámpago unos tres, así que pagar por tiempo dejaría la partida corta
 * como una forma tonta de perder PE, y pagar lo mismo dejaría la larga sin
 * ninguna razón de ser.
 *
 * Con este 1 / 1,35 / 1,8 el Relámpago sigue siendo con diferencia el mejor PE
 * por minuto —que es lo que mantiene viva la puerta corta— y el Clásico sigue
 * siendo el que más paga de una sentada, que es lo que se siente al terminarlo.
 *
 * La referencia para leer los números de abajo es la tienda: 60 PE el Sobre
 * Relámpago, 110 el Élite, 190 el Maestro y 560 el Especial ex. Una Copa
 * Relámpago ganada al ritmo corto (96 PE) paga sobre y medio de los baratos; una
 * Maestra clásica (585 PE) paga el Especial ex justo, con 25 PE de vuelta, que
 * es exactamente lo que tiene que sentirse al ganar la copa larga entera: la
 * copa más dura compra el mejor sobre de la tienda, y ni uno de más. Al tocar
 * cualquiera de las dos tablas hay que volver a mirar la otra.
 */
export const PACE_PE_MULT: Record<TournamentPace, number> = {
  blitz: 1,
  turbo: 1.35,
  classic: 1.8,
};

/** PE por cada ronda ganada, según la copa. */
export const PE_PER_ROUND: Record<TournamentFormat, number> = {
  3: 12,
  4: 18,
  5: 25,
};

/** PE extra por levantar la copa. */
export const PE_TITLE: Record<TournamentFormat, number> = {
  3: 60,
  4: 110,
  5: 200,
};

/** PE extra por ganarla sin una sola baja. */
export const PE_FLAWLESS: Record<TournamentFormat, number> = {
  3: 30,
  4: 60,
  5: 120,
};

/** Premio de consolación al caer eliminado. Huir no cuenta. */
export const PE_CONSOLATION = 10;

/** Sobres por levantar cada copa. */
export const TITLE_PACKS: Record<TournamentFormat, PackInventory> = {
  3: { bolt: 2 },
  4: { elite: 2 },
  5: { master: 3, special: 1 },
};

export interface RunReward {
  pe: number;
  /** Desglose para la ceremonia: rondas, título, sin bajas, consolación. */
  peByReason: {
    round: number;
    title: number;
    flawless: number;
    consolation: number;
  };
  packs: PackInventory;
  /** La copa se levantó sin que cayera ni un Pokémon en ninguna ronda. */
  flawless: boolean;
  /** Copa Maestra impecable: se lleva además el Sobre Divino. */
  godPack: boolean;
}

export interface RunOutcome {
  format: TournamentFormat;
  /** Ritmo al que se jugó: multiplica los PE, no los sobres. */
  pace: TournamentPace;
  /** Rondas ganadas en la carrera. */
  wins: number;
  won: boolean;
  fled: boolean;
  flawless: boolean;
}

export function rewardForRun({
  format,
  pace,
  wins,
  won,
  fled,
  flawless,
}: RunOutcome): RunReward {
  const isFlawless = won && flawless;
  // El ritmo se aplica concepto a concepto y no al total, para que la línea
  // del historial cuadre con lo que se sumó: un redondeo al final dejaría un
  // punto suelto sin dueño en la tienda.
  const mult = PACE_PE_MULT[pace];
  const paid = (amount: number) => Math.round(amount * mult);
  const peByReason = {
    round: paid(PE_PER_ROUND[format] * Math.max(0, wins)),
    title: won ? paid(PE_TITLE[format]) : 0,
    flawless: isFlawless ? paid(PE_FLAWLESS[format]) : 0,
    // Huir del torneo no es caer luchando, así que no paga.
    consolation: !won && !fled ? paid(PE_CONSOLATION) : 0,
  };
  const packs: PackInventory = won ? { ...TITLE_PACKS[format] } : {};
  // El Sobre Divino es la única recompensa que dice «has hecho algo difícil»:
  // la copa más dura, entera, sin perder a nadie. Por eso tampoco se vende.
  const godPack = isFlawless && format === 5;
  if (godPack) packs.god = (packs.god ?? 0) + 1;

  return {
    pe:
      peByReason.round +
      peByReason.title +
      peByReason.flawless +
      peByReason.consolation,
    peByReason,
    packs,
    flawless: isFlawless,
    godPack,
  };
}

/**
 * Los PE de levantar la copa: rondas ganadas más título, sin extras.
 *
 * Es lo que anuncia el vestíbulo antes de inscribirse, y sale de `rewardForRun`
 * en vez de de una tabla aparte a propósito — una segunda tabla se desincroniza
 * el día que alguien toque la primera, y entonces la pantalla promete una cifra
 * y la ceremonia paga otra.
 *
 * Deja fuera el extra por acabar sin bajas: es una promesa que no se puede
 * hacer al entrar.
 */
export function titlePeFor(
  format: TournamentFormat,
  pace: TournamentPace,
): number {
  return rewardForRun({
    format,
    pace,
    wins: format,
    won: true,
    fled: false,
    flawless: false,
  }).pe;
}
