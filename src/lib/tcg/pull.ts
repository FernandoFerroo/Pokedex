/**
 * Qué sale al abrir un sobre.
 *
 * Todo lo de aquí es puro: mismas entradas y mismo generador, mismas cartas.
 * Eso es lo que permite que `scripts/tcg-odds.mts` verifique las tablas sin
 * levantar un navegador, y es también la razón de que el motor NO toque el
 * almacenamiento — quien llama abre el sobre, guarda el resultado y sólo
 * entonces lo enseña.
 */
import {
  PACK_TYPES,
  RARITY_ORDER,
  type PackResult,
  type PackType,
  type PulledCard,
  type Rarity,
} from "@/types/tcg";
import { hasCard } from "./encode";
import { cardAt, poolFor } from "./pool";
import type { Rng } from "./rng";

/**
 * Una tirada: pesos por mil. Enteros a propósito — así `assertOdds` puede
 * comprobar que suman mil exactos, y una errata en una tabla de probabilidad
 * no se ve de ninguna otra forma.
 */
type Odds = Partial<Record<Rarity, number>>;

/** Las tres clases de ranura que se sortean. Las demás traen su nivel escrito. */
type RollSlot = "hit" | "premium" | "top";
type Slot = Rarity | RollSlot;

function isRoll(slot: Slot): slot is RollSlot {
  return slot === "hit" || slot === "premium" || slot === "top";
}

/**
 * Cómo se reparten las ranuras de cada sobre. Los niveles fijos salen tal
 * cual; `hit`, `premium` y `top` se sortean con las tablas de `PACK_ODDS`.
 *
 * Aquí está la escalera que promete el modo colección, y se lee en vertical:
 * cinco cartas y una sola garantía en el Relámpago; seis y tres Holo Raras en
 * el Élite; siete, cuatro garantías y una ranura final que no baja de Pokémon
 * ex en el Maestro; ocho en el Especial, de las que cuatro son ex o mejor y la
 * última nunca baja de Ilustración Rara. Ninguno reparte por generaciones:
 * cualquier sobre puede traer cualquier Pokémon de las nueve.
 *
 * Es el SUELO lo que sube de escalón en escalón, no sólo el techo. Un sobre
 * caro cuya mejoría viva entera en la cola de la probabilidad se nota en uno de
 * cada veinte; el suelo se nota en todos.
 *
 * Cambiar una fila obliga a repasar tres cosas: el precio de ese sobre en
 * `PACK_PRICE`, su titular en `PACK_HEADLINE` y la línea que lo describe en el
 * diccionario. Y a volver a pasar `npm run tcg:odds`, que comprueba que la
 * escalera sigue subiendo en todos los niveles.
 */
const PACK_SLOTS = {
  bolt: ["common", "common", "uncommon", "uncommon", "hit"],
  elite: ["common", "uncommon", "uncommon", "holo", "hit", "top"],
  master: ["common", "uncommon", "uncommon", "holo", "holo", "hit", "top"],
  special: [
    "holo",
    "holo",
    "holo",
    "holo",
    "premium",
    "premium",
    "premium",
    "top",
  ],
  god: [
    "premium",
    "premium",
    "premium",
    "premium",
    "premium",
    "premium",
    "premium",
    "top",
  ],
} as const satisfies Record<PackType, readonly Slot[]>;

/** Las ranuras sorteadas que usa un sobre concreto, sacadas de su fila. */
type RollsOf<T extends PackType> = Extract<
  (typeof PACK_SLOTS)[T][number],
  RollSlot
>;

/**
 * Las tablas de las ranuras sorteadas, sobre a sobre.
 *
 * Cada sobre trae las suyas: no hay una tabla compartida que obligue a que dos
 * sobres distintos repartan igual. Del Relámpago al Divino cae el peso de la
 * Holo y suben los tres niveles de arriba, y a la vez cada sobre añade ranuras
 * y cartas — las dos mitades de la misma escalera.
 *
 * El tipo se deriva de `PACK_SLOTS`, así que un sobre no puede declarar una
 * tabla que no usa ni usar una ranura sin tabla: las dos cosas son un error de
 * compilación y no una carta rara que un día sale mal.
 */
const PACK_ODDS: { [T in PackType]: Record<RollsOf<T>, Odds> } = {
  bolt: {
    hit: { holo: 820, ex: 150, fullArt: 25, hyper: 5 },
  },
  elite: {
    hit: { holo: 740, ex: 210, fullArt: 40, hyper: 10 },
    top: { holo: 480, ex: 420, fullArt: 85, hyper: 15 },
  },
  master: {
    hit: { holo: 660, ex: 270, fullArt: 55, hyper: 15 },
    top: { ex: 700, fullArt: 250, hyper: 50 },
  },
  special: {
    premium: { ex: 760, fullArt: 210, hyper: 30 },
    top: { fullArt: 880, hyper: 120 },
  },
  god: {
    premium: { ex: 560, fullArt: 350, hyper: 90 },
    top: { fullArt: 700, hyper: 300 },
  },
};

/**
 * La tabla de una ranura sorteada.
 *
 * El aserto es seguro por construcción: el tipo de `PACK_ODDS` exige a cada
 * sobre exactamente las tablas que nombra su fila de `PACK_SLOTS`. Lo que el
 * compilador no puede seguir es el índice cuando la ranura viene de recorrer la
 * fila, que ahí ya es un `Slot` cualquiera.
 */
function oddsFor(type: PackType, slot: RollSlot): Odds {
  return (PACK_ODDS[type] as Record<RollSlot, Odds>)[slot];
}

/**
 * Cuántas cartas trae cada sobre. Sale de la tabla de ranuras y no de una lista
 * aparte: una segunda lista se desincroniza el día que alguien añada una ranura
 * y el sobre anunciaría cinco cartas mientras reparte seis.
 */
export const PACK_SIZE = Object.fromEntries(
  PACK_TYPES.map((type) => [type, PACK_SLOTS[type].length]),
) as Record<PackType, number>;

/**
 * El titular de cada sobre: cuántas ranuras no bajan de ese nivel.
 *
 * Es lo que se imprime en la portada y lo que se lee de un vistazo en la
 * tienda, así que se escribe a mano —elegir qué contar es una decisión
 * editorial: del Maestro interesa que garantiza cuatro brillantes, no que una
 * de ellas sea ex—, pero `assertOdds` comprueba contra `PACK_SLOTS` que la
 * promesa es verdad. Un sobre no puede prometer lo que no reparte.
 */
export const PACK_HEADLINE: Record<PackType, { count: number; rarity: Rarity }> =
  {
    bolt: { count: 1, rarity: "holo" },
    elite: { count: 3, rarity: "holo" },
    master: { count: 4, rarity: "holo" },
    special: { count: 4, rarity: "ex" },
    god: { count: 8, rarity: "ex" },
  };

/**
 * Probabilidad de que un sobre normal se abra como Divino.
 *
 * Es la pieza que mantiene viva la colección al 100 %: por barato que sea el
 * sobre, siempre puede pasar algo. No se puede comprar y no se anuncia.
 */
export const GOD_PACK_CHANCE = 0.0006;

/** PE que deja una repetida, por nivel. */
export const DUST: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  holo: 6,
  ex: 18,
  fullArt: 40,
  hyper: 90,
};

/**
 * Precio en PE. El Divino no aparece: se gana, no se compra.
 *
 * El precio sube más despacio que el contenido a propósito. Un Especial cuesta
 * nueve Relámpagos y pico y trae algo más de nueve veces su valor en PE de
 * repetidas —144 frente a 15, si todo saliera repetido—: ahorrar para el sobre
 * bueno tiene que seguir siendo la jugada, o la tienda sería una fila de sobres
 * distintos que dan lo mismo. El margen es estrecho a propósito; si alguien
 * sube el Especial por encima de 600 deja de compensar y hay que bajarlo.
 *
 * Los 560 del Especial están puestos contra la copa larga: una Maestra clásica
 * paga 585 PE, justo uno. Ese «gano la copa entera y me llevo el sobre bueno»
 * es la razón del número, así que si `PE_TITLE` o `PACE_PE_MULT` se mueven, este
 * precio se mueve con ellos.
 */
export const PACK_PRICE: Partial<Record<PackType, number>> = {
  bolt: 60,
  elite: 110,
  master: 190,
  special: 560,
};

/** Sobres a la venta en la tienda, del más barato al más caro. */
export const SHOP_PACKS = ["bolt", "elite", "master", "special"] as const;

/**
 * La escalera de sobres, del peor al mejor. El Divino cierra la fila aunque no
 * esté a la venta: es el escalón de arriba y tiene que seguir siéndolo.
 */
export const PACK_LADDER = [...SHOP_PACKS, "god"] as const;

/** El nivel más bajo que puede salir de una tabla: el suelo de esa ranura. */
function floorOf(odds: Odds): Rarity {
  return RARITY_ORDER.find((rarity) => Boolean(odds[rarity])) ?? "common";
}

/** El suelo de una ranura, sorteada o fija. */
function slotFloor(type: PackType, slot: Slot): Rarity {
  return isRoll(slot) ? floorOf(oddsFor(type, slot)) : slot;
}

/**
 * La probabilidad de que una carta cualquiera de ese sobre salga de ese nivel
 * o mejor. Es la cifra con la que se lee la escalera: si un sobre más caro no
 * la sube en todos los niveles, no es un sobre mejor.
 */
export function chanceOfAtLeast(type: PackType, rarity: Rarity): number {
  const floor = RARITY_ORDER.indexOf(rarity);
  const slots = PACK_SLOTS[type];
  let total = 0;
  for (const slot of slots) {
    if (!isRoll(slot)) {
      if (RARITY_ORDER.indexOf(slot) >= floor) total += 1;
      continue;
    }
    const odds = oddsFor(type, slot);
    for (const level of RARITY_ORDER.slice(floor)) {
      total += (odds[level] ?? 0) / 1000;
    }
  }
  return total / slots.length;
}

/**
 * Comprueba que ninguna tabla se ha quedado coja: que todas suman mil, que el
 * titular que anuncia cada sobre lo respalda su tabla de ranuras, y que la
 * escalera sube de verdad — cada sobre reparte mejor que el anterior en TODOS
 * los niveles a la vez, que es la promesa entera de la tienda.
 *
 * Se llama desde el script de verificación, no en tiempo de ejecución.
 */
export function assertOdds(): void {
  for (const type of PACK_TYPES) {
    for (const [slot, odds] of Object.entries(PACK_ODDS[type]) as Array<
      [RollSlot, Odds]
    >) {
      const total = Object.values(odds).reduce((sum, n) => sum + n, 0);
      if (total !== 1000) {
        throw new Error(
          `Tabla ${type}/${slot}: suma ${total}, debería sumar 1000`,
        );
      }
    }

    const floors = PACK_SLOTS[type].map((slot) => slotFloor(type, slot));
    const { count, rarity } = PACK_HEADLINE[type];
    const guaranteed = floors.filter(
      (floor) => RARITY_ORDER.indexOf(floor) >= RARITY_ORDER.indexOf(rarity),
    ).length;
    if (guaranteed < count) {
      throw new Error(
        `Sobre ${type}: anuncia ${count} × ${rarity} o mejor, pero sólo garantiza ${guaranteed}`,
      );
    }
  }

  // La escalera, escalón a escalón y nivel a nivel: ningún nivel puede
  // empeorar al subir de sobre, y alguno tiene que mejorar. Se pide «alguno» y
  // no «todos» porque los dos sobres de arriba ya reparten brillantes en las
  // ocho ranuras: el Divino no puede subir ese nivel porque el Especial lo
  // tiene lleno, y sí sube todos los de encima.
  for (let step = 1; step < PACK_LADDER.length; step++) {
    const worse = PACK_LADDER[step - 1];
    const better = PACK_LADDER[step];
    let improves = false;
    for (const rarity of RARITY_ORDER.slice(RARITY_ORDER.indexOf("holo"))) {
      const before = chanceOfAtLeast(worse, rarity);
      const after = chanceOfAtLeast(better, rarity);
      if (after < before) {
        throw new Error(
          `Escalera rota en ${rarity}: ${better} da ${(after * 100).toFixed(2)} % ` +
            `y ${worse} ya daba ${(before * 100).toFixed(2)} %`,
        );
      }
      if (after > before) improves = true;
    }
    if (!improves) {
      throw new Error(`Escalera plana: ${better} no mejora en nada a ${worse}`);
    }
  }
}

function rollRarity(odds: Odds, rng: Rng): Rarity {
  let ticket = rng() * 1000;
  let last: Rarity = "common";
  for (const rarity of RARITY_ORDER) {
    const weight = odds[rarity];
    if (!weight) continue;
    last = rarity;
    ticket -= weight;
    if (ticket < 0) return rarity;
  }
  // Sólo se llega aquí por el redondeo del último tramo.
  return last;
}

/**
 * Saca una carta de ese nivel, de cualquier generación.
 *
 * Si el nivel se queda sin cartas —una expansión futura, un recorte del
 * catálogo— baja de nivel en vez de devolver un hueco: un sobre con cuatro
 * cartas sería un error mucho más visible que una holo donde tocaba una ex.
 */
function drawCard(rarity: Rarity, taken: Set<number>, rng: Rng): number | null {
  for (let step = RARITY_ORDER.indexOf(rarity); step >= 0; step--) {
    const pool = poolFor(RARITY_ORDER[step]);
    if (pool.length === 0) continue;
    // Ocho intentos de esquivar una repetición dentro del mismo sobre; a
    // partir de ahí se acepta, que es mejor que sesgar el sorteo.
    for (let attempt = 0; attempt < 8; attempt++) {
      const index = pool[Math.floor(rng() * pool.length)];
      if (!taken.has(index)) return index;
    }
    return pool[Math.floor(rng() * pool.length)];
  }
  return null;
}

/**
 * Abre un sobre.
 *
 * `owned` es la máscara de la colección **antes** de abrir, para que dos
 * copias de la misma carta nueva salgan bien: la primera como nueva y la
 * segunda como repetida.
 */
export function openPack(
  type: PackType,
  owned: string,
  rng: Rng = Math.random,
): PackResult {
  // El Divino se sortea antes que nada. Cuando toca, el sobre se abre ENTERO
  // como Divino —sus ranuras y sus tablas—, que es lo que convierte un
  // Relámpago de sesenta PE en la mejor apertura de la partida.
  const godPack = type !== "god" && rng() < GOD_PACK_CHANCE;
  const opened: PackType = godPack ? "god" : type;

  const taken = new Set<number>();
  const cards: PulledCard[] = [];
  let peGained = 0;

  for (const slot of PACK_SLOTS[opened]) {
    const rarity = isRoll(slot)
      ? rollRarity(oddsFor(opened, slot), rng)
      : slot;

    const index = drawCard(rarity, taken, rng);
    if (index === null) continue;
    const card = cardAt(index);
    if (!card) continue;

    // Nueva se decide contra la colección de antes de abrir Y contra lo que ya
    // ha salido en este mismo sobre.
    const isNew = !hasCard(owned, index) && !taken.has(index);
    taken.add(index);
    const dust = isNew ? 0 : DUST[card.rarity];
    peGained += dust;
    cards.push({ ...card, isNew, dust });
  }

  return { type, cards, peGained, godPack };
}
