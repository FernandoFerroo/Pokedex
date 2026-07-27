/**
 * El plantel de Entrenadores: quién está al otro lado del campo y quién eres
 * tú.
 *
 * No se inventan. Son los Líderes de Gimnasio de Kanto y el Campeón, con sus
 * nombres y sus sprites de los juegos, bajados por `scripts/fetch-trainers.mjs`
 * a `public/trainers/`. Un Entrenador generado quedaba siempre a medio camino:
 * bien dibujado, con su propia luz, y de ningún juego en particular. Estos ya
 * están en el imaginario del jugador antes de que empiece el combate, que es
 * lo que hace que la escalera signifique algo.
 *
 * Son pixel art de 80×80, la misma librería de sprites que sirve a los
 * combatientes animados de la arena: Entrenadores y Pokémon comparten paleta y
 * resolución, y nada queda «pegado encima» del otro.
 */

/**
 * Las clases de Entrenador llevan género en los idiomas que lo marcan —
 * «Líder de Gimnasio» no, pero «Campeona» sí —, así que la clave elegida tiene
 * que concordar con la cara que hay pintada.
 */
export type TrainerClassKey =
  | "youngster"
  | "bugCatcher"
  | "lass"
  | "camper"
  | "coolTrainer"
  | "veteran"
  | "ace"
  | "blackBelt"
  | "gymLeader"
  | "gymLeaderF"
  | "champion"
  | "championF"
  | "eliteFour"
  | "scientist";

export interface OfficialTrainer {
  /** Slug del sprite: `public/trainers/<slug>.png`. Es el de Showdown. */
  slug: string;
  /** Nombre propio; igual en todos los idiomas, como el resto del plantel. */
  name: string;
  /** Clase, traducida en la UI a partir de esta clave. */
  classKey: TrainerClassKey;
  emoji: string;
  /**
   * Filas transparentes que el sprite deja BAJO los pies, de sus 80 px.
   *
   * Los sprites de la librería no están alineados al suelo: cada pose se
   * centró en su caja, y Brock —agachado— deja quince píxeles de aire debajo.
   * Al escalar la figura ese aire se multiplica, y el Entrenador se queda
   * flotando un palmo sobre el césped. La escena baja la imagen justo esto
   * para que los pies caigan en el punto de contacto.
   *
   * Medido sobre los PNG que hay en `public/trainers/`: si se vuelven a
   * bajar, se vuelve a medir.
   */
  foot: number;
  /**
   * Cómo juega, si tiene una manera propia de jugar.
   *
   * Es una CLAVE, no la personalidad: los perfiles del cerebro viven en
   * `src/lib/battle/ai/profiles.ts` y este archivo se queda siendo lo que es,
   * datos del plantel. Quien no tenga la suya cae en el perfil genérico, que
   * juega bien y sin manías.
   */
  brain?: "brock" | "misty" | "ltsurge" | "sabrina" | "lance";
}

/** Ruta del sprite ya bajado de un Entrenador. */
export function trainerArt(slug: string): string {
  return `/trainers/${slug}.png`;
}

/**
 * Tú. En el campo se te ve desde el lado del jugador, en primer plano y de
 * espaldas al público, como en los juegos.
 */
export const PLAYER_TRAINER: OfficialTrainer = {
  slug: "red",
  name: "Red",
  classKey: "champion",
  emoji: "🧢",
  foot: 3,
};

/**
 * Los ocho Líderes de Kanto en orden de medalla, y Lance cerrando. El orden es
 * el del circuito original, así que la escalera del torneo sube exactamente
 * como sube el juego: Brock enseña a pelear y Giovanni te espera en Ciudad
 * Verde con el Gimnasio cerrado.
 */
export const GYM_LEADERS: OfficialTrainer[] = [
  { slug: "brock", name: "Brock", classKey: "gymLeader", emoji: "🪨", foot: 15 , brain: "brock" },
  { slug: "misty", name: "Misty", classKey: "gymLeaderF", emoji: "💧", foot: 3 , brain: "misty" },
  { slug: "ltsurge", name: "Lt. Surge", classKey: "gymLeader", emoji: "⚡", foot: 0 , brain: "ltsurge" },
  { slug: "erika", name: "Erika", classKey: "gymLeaderF", emoji: "🌿", foot: 1 },
  { slug: "koga", name: "Koga", classKey: "gymLeader", emoji: "☠️", foot: 8 },
  { slug: "sabrina", name: "Sabrina", classKey: "gymLeaderF", emoji: "🔮", foot: 1 , brain: "sabrina" },
  { slug: "blaine", name: "Blaine", classKey: "gymLeader", emoji: "🔥", foot: 0 },
  { slug: "giovanni", name: "Giovanni", classKey: "gymLeader", emoji: "👑", foot: 0 },
];

/** El Campeón y el rival de siempre, para lo que no es la escalera. */
export const LANCE: OfficialTrainer = {
  slug: "lance",
  name: "Lance",
  classKey: "champion",
  emoji: "🐉",
  foot: 2,
  brain: "lance",
};
export const BLUE: OfficialTrainer = {
  slug: "blue",
  name: "Blue",
  classKey: "champion",
  emoji: "🕶️",
  foot: 1,
};

/**
 * EL RIVAL DEL MODO COMBATE. Uno solo, siempre el mismo: Colress, el
 * científico del Equipo Plasma de Blanco 2 y Negro 2.
 *
 * El Modo Combate se llama Combate IA y su rival lo escribe un modelo, así que
 * quien se planta enfrente tiene que parecer eso: no un Líder de Gimnasio con
 * su medalla, sino el que estudia el combate con máquinas. Colress es
 * exactamente ese personaje en los juegos — bata blanca, gafas y un cacharro
 * para sacarle a un Pokémon toda su fuerza —, y viene con su sprite oficial,
 * como todo el plantel.
 *
 * Antes se elegía uno del plantel de Kanto a partir del nombre que hubiera
 * inventado el modelo, así que el Modo Combate tenía once rivales distintos
 * sin que ninguno significara nada: te podía tocar Misty con nombre de
 * cazarrecompensas. Un rival fijo le da cara a la sección, y es la misma
 * decisión que ya hace bueno al torneo: el que sale es alguien que el jugador
 * reconoce.
 */
export const AI_TRAINER: OfficialTrainer = {
  slug: "colress",
  name: "Colress",
  classKey: "scientist",
  emoji: "🔬",
  foot: 0,
};

/** Todo el que tiene sprite bajado en `public/trainers/`. */
export const ALL_TRAINERS: OfficialTrainer[] = [
  ...GYM_LEADERS,
  LANCE,
  BLUE,
  AI_TRAINER,
];
