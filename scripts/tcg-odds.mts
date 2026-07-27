/**
 * Banco de pruebas de los sobres: abre cientos de miles y comprueba que lo que
 * sale coincide con las tablas de probabilidad declaradas.
 *
 *   node --import ./scripts/lib/alias-hook.mjs scripts/tcg-odds.mts
 *   node --import ./scripts/lib/alias-hook.mjs scripts/tcg-odds.mts --packs 500000
 *   node --import ./scripts/lib/alias-hook.mjs scripts/tcg-odds.mts --assert
 *
 * Por qué existe: una errata en una tabla de botín no se ve. El sobre sigue
 * dando cinco cartas, el jugador sigue contento, y resulta que la Hyper Rara
 * salía cuatro veces más de lo previsto. La única forma de detectarlo es
 * abrir muchos sobres y contar.
 *
 * Se comprueban tres cosas, y la tercera es la que sostiene la tienda:
 *
 *   1. Cada ranura reparte lo que dice su tabla — todas, no sólo la última.
 *   2. Cada sobre trae el número de cartas que anuncia.
 *   3. La ESCALERA sube. De un sobre al siguiente, la probabilidad de que una
 *      carta cualquiera salga Holo Rara o mejor, ex o mejor, Ilustración Rara o
 *      mejor e Hyper Rara sube en los cuatro niveles A LA VEZ. Un sobre más
 *      caro que mejore en un nivel y empeore en otro es justo el fallo que
 *      nadie descubre abriendo sobres a mano.
 *
 * `--assert` devuelve código 1 si alguna frecuencia observada se desvía más de
 * lo tolerado, si un sobre sale con un número de cartas distinto del que
 * anuncia o si la escalera deja de subir.
 */
import { PACK_TYPES, RARITY_ORDER, type PackType, type Rarity } from "@/types/tcg";
import { emptyMask, withCards } from "@/lib/tcg/encode";
import { ALBUM_SIZE, CARD_COUNT, poolFor } from "@/lib/tcg/pool";
import {
  assertOdds,
  chanceOfAtLeast,
  GOD_PACK_CHANCE,
  openPack,
  PACK_HEADLINE,
  PACK_LADDER,
  PACK_SIZE,
} from "@/lib/tcg/pull";
import { seeded } from "@/lib/tcg/rng";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const num = (name: string, fallback: number) => {
  const at = args.indexOf(name);
  return at > -1 ? Number(args[at + 1]) || fallback : fallback;
};

const PACKS = num("--packs", 200_000);
const STRICT = flag("--assert");

type Odds = Partial<Record<Rarity, number>>;

/**
 * Lo que se espera de cada ranura de cada sobre, en orden de apertura.
 *
 * Se copia a mano de `PACK_SLOTS` y `PACK_ODDS` a propósito: comparar el módulo
 * consigo mismo no comprobaría nada. Al tocar aquellas tablas hay que traer el
 * cambio aquí, y ese segundo paso ES la comprobación — obliga a escribir dos
 * veces el número que uno cree haber puesto.
 *
 * Un nivel suelto es una ranura fija; un objeto es una ranura sorteada, en
 * pesos por mil.
 */
const EXPECTED: Record<PackType, readonly (Rarity | Odds)[]> = {
  bolt: [
    "common",
    "common",
    "uncommon",
    "uncommon",
    { holo: 820, ex: 150, fullArt: 25, hyper: 5 },
  ],
  elite: [
    "common",
    "uncommon",
    "uncommon",
    "holo",
    { holo: 740, ex: 210, fullArt: 40, hyper: 10 },
    { holo: 480, ex: 420, fullArt: 85, hyper: 15 },
  ],
  master: [
    "common",
    "uncommon",
    "uncommon",
    "holo",
    "holo",
    { holo: 660, ex: 270, fullArt: 55, hyper: 15 },
    { ex: 700, fullArt: 250, hyper: 50 },
  ],
  special: [
    "holo",
    "holo",
    "holo",
    "holo",
    { ex: 760, fullArt: 210, hyper: 30 },
    { ex: 760, fullArt: 210, hyper: 30 },
    { ex: 760, fullArt: 210, hyper: 30 },
    { fullArt: 880, hyper: 120 },
  ],
  god: [
    { ex: 560, fullArt: 350, hyper: 90 },
    { ex: 560, fullArt: 350, hyper: 90 },
    { ex: 560, fullArt: 350, hyper: 90 },
    { ex: 560, fullArt: 350, hyper: 90 },
    { ex: 560, fullArt: 350, hyper: 90 },
    { ex: 560, fullArt: 350, hyper: 90 },
    { ex: 560, fullArt: 350, hyper: 90 },
    { fullArt: 700, hyper: 300 },
  ],
};

/** Los niveles con los que se lee la escalera: de Holo Rara para arriba. */
const LADDER_TIERS = RARITY_ORDER.slice(RARITY_ORDER.indexOf("holo"));

/**
 * Margen tolerado para una frecuencia observada.
 *
 * Un porcentaje fijo no sirve: la ranura Hyper sale una vez de cada cien, así
 * que en una tanda corta apenas junta un puñado de aciertos y su ruido
 * relativo es enorme, mientras que la Holo acumula decenas de miles y casi no
 * se mueve. Un margen fijo daría falsos fallos en la primera y dejaría pasar
 * desviaciones reales en la segunda.
 *
 * Se usa la desviación de la propia binomial a cuatro sigmas, con un suelo del
 * 1 % para que una tanda enorme no acabe siendo más exigente que la precisión
 * con la que están escritas las tablas.
 */
function tolerance(probability: number, trials: number): number {
  const sigma = Math.sqrt((probability * (1 - probability)) / trials);
  return Math.max(0.01, (4 * sigma) / probability);
}

let failures = 0;
const fail = (message: string) => {
  console.log(`  ✗ ${message}`);
  failures++;
};

const pct = (share: number, digits = 2) => `${(share * 100).toFixed(digits)} %`;

console.log(`Catálogo: ${CARD_COUNT} cartas · ${ALBUM_SIZE} especies\n`);

// 1. Las tablas suman mil, ningún sobre anuncia más garantías de las que
//    reparte y la escalera que declaran las tablas sube en todos los niveles.
try {
  assertOdds();
  console.log("Tablas, titulares y escalera declarados: cuadran ✓\n");
} catch (err) {
  fail((err as Error).message);
}

// 2. Ningún nivel puede quedarse sin cartas, o la ranura que lo pida bajaría de
//    nivel en silencio y el sobre repartiría por debajo de lo que anuncia.
console.log("Cobertura del catálogo por nivel");
for (const rarity of RARITY_ORDER) {
  const size = poolFor(rarity).length;
  console.log(`  ${rarity.padEnd(9)} ${String(size).padStart(5)}`);
  if (size === 0) fail(`sin cartas de nivel ${rarity}`);
}
console.log("");

// 3. Lo que promete la portada de cada sobre.
console.log("Titulares");
for (const type of PACK_TYPES) {
  const { count, rarity } = PACK_HEADLINE[type];
  console.log(
    `  ${type.padEnd(8)} ${PACK_SIZE[type]} cartas · ${count} × ${rarity} o mejor`,
  );
}
console.log("");

// 4. Se abren los sobres y se cuenta.
const owned = emptyMask(CARD_COUNT);

/** Reparto medido de cada sobre: qué fracción de sus cartas es de cada nivel. */
const measured = new Map<PackType, Record<Rarity, number>>();

for (const type of PACK_LADDER) {
  const rng = seeded(0x5eed + type.length * 7919);
  const perRarity = Object.fromEntries(
    RARITY_ORDER.map((rarity) => [rarity, 0]),
  ) as Record<Rarity, number>;
  /** Nivel de cada ranura, ranura a ranura. */
  const perSlot = EXPECTED[type].map(
    () =>
      Object.fromEntries(RARITY_ORDER.map((rarity) => [rarity, 0])) as Record<
        Rarity,
        number
      >,
  );
  let gods = 0;
  let plain = 0;
  let cards = 0;
  let sizeMismatch = 0;

  for (let i = 0; i < PACKS; i++) {
    const result = openPack(type, owned, rng);
    cards += result.cards.length;
    for (const card of result.cards) perRarity[card.rarity]++;
    // Un sobre que se convirtió en Divino reparte con OTRA tabla y con otras
    // ranuras: contarlo aquí mancharía la frecuencia del sobre que se compró.
    if (result.godPack) {
      gods++;
      continue;
    }
    plain++;
    if (result.cards.length !== PACK_SIZE[type]) sizeMismatch++;
    // Las cartas salen en el orden de las ranuras, así que la posición ES la
    // ranura: se puede comprobar la tabla de cada una y no sólo la del final.
    result.cards.forEach((card, slot) => {
      const tally = perSlot[slot];
      if (tally) tally[card.rarity]++;
    });
  }

  measured.set(
    type,
    Object.fromEntries(
      RARITY_ORDER.map((rarity) => [rarity, perRarity[rarity] / cards]),
    ) as Record<Rarity, number>,
  );

  console.log(
    `${type} — ${PACKS.toLocaleString("es-ES")} sobres, ${cards.toLocaleString("es-ES")} cartas`,
  );
  for (const rarity of RARITY_ORDER) {
    const share = perRarity[rarity] / cards;
    if (share > 0) console.log(`  ${rarity.padEnd(9)} ${pct(share)}`);
  }
  if (sizeMismatch) {
    fail(`${type}: ${sizeMismatch} sobres con un número de cartas inesperado`);
  }
  if (PACK_SIZE[type] !== EXPECTED[type].length) {
    fail(
      `${type}: reparte ${PACK_SIZE[type]} ranuras y aquí se esperaban ${EXPECTED[type].length}`,
    );
  }

  console.log("  ranura a ranura:");
  EXPECTED[type].forEach((expected, slot) => {
    const tally = perSlot[slot];
    if (!tally) return;
    const table: Odds =
      typeof expected === "string" ? { [expected]: 1000 } : expected;
    const parts: string[] = [];
    for (const [rarity, weight] of Object.entries(table) as Array<
      [Rarity, number]
    >) {
      const want = weight / 1000;
      const got = tally[rarity] / plain;
      const drift = Math.abs(got - want) / want;
      const margin = tolerance(want, plain);
      const ok = drift <= margin;
      parts.push(`${rarity} ${pct(got, 1)}${ok ? "" : " ✗"}`);
      if (!ok) {
        fail(
          `${type}/ranura ${slot + 1}/${rarity}: ${pct(got)} frente a ${pct(want)} (margen ±${pct(margin, 1)})`,
        );
      }
    }
    console.log(`    ${String(slot + 1).padStart(2)}. ${parts.join(" · ")}`);
  });

  if (type !== "god") {
    const got = gods / PACKS;
    console.log(
      `  sobres divinos: ${gods} (${pct(got, 4)}, esperado ${pct(GOD_PACK_CHANCE, 4)})`,
    );
  }
  console.log("");
}

// 5. La escalera, medida y no declarada: cada sobre reparte mejor que el
//    anterior en todos los niveles a la vez.
console.log("Escalera — probabilidad de que una carta sea de ese nivel o mejor");
console.log(
  `  ${"sobre".padEnd(8)} ${LADDER_TIERS.map((r) => r.padStart(9)).join(" ")}`,
);

const cumulative = new Map<PackType, Record<string, number>>();
for (const type of PACK_LADDER) {
  const mix = measured.get(type)!;
  const row: Record<string, number> = {};
  for (const rarity of LADDER_TIERS) {
    row[rarity] = RARITY_ORDER.slice(RARITY_ORDER.indexOf(rarity)).reduce(
      (sum, level) => sum + mix[level],
      0,
    );
  }
  cumulative.set(type, row);
  console.log(
    `  ${type.padEnd(8)} ${LADDER_TIERS.map((r) => pct(row[r]).padStart(9)).join(" ")}`,
  );

  // Y de paso: lo medido tiene que cuadrar con lo que el módulo calcula para su
  // propia escalera, que es la cifra que la tienda enseña.
  for (const rarity of LADDER_TIERS) {
    const want = chanceOfAtLeast(type, rarity);
    const drift = Math.abs(row[rarity] - want) / want;
    if (drift > tolerance(want, PACKS)) {
      fail(
        `${type}/${rarity} o mejor: medido ${pct(row[rarity])}, calculado ${pct(want)}`,
      );
    }
  }
}

for (let step = 1; step < PACK_LADDER.length; step++) {
  const worse = PACK_LADDER[step - 1];
  const better = PACK_LADDER[step];
  let improves = false;
  for (const rarity of LADDER_TIERS) {
    const before = cumulative.get(worse)![rarity];
    const after = cumulative.get(better)![rarity];
    // Se mide con ruido, así que un empate por decimales no es un escalón roto:
    // sólo cuenta como caída lo que se sale del margen de la propia tanda.
    if (before - after > tolerance(before, PACKS) * before) {
      fail(
        `escalera rota en ${rarity} o mejor: ${better} da ${pct(after)} y ${worse} ya daba ${pct(before)}`,
      );
    }
    if (after - before > tolerance(before, PACKS) * before) improves = true;
  }
  // Se pide que mejore en ALGÚN nivel y no en todos: los dos sobres de arriba
  // llenan sus ocho ranuras de brillantes, así que el Divino no puede subir ese
  // nivel por encima del Especial — lo tiene al máximo — y sí sube los demás.
  if (!improves) fail(`escalera plana: ${better} no mejora en nada a ${worse}`);
}
console.log("");

// 6. Cuántos sobres cuesta llenar el álbum. No es una aserción: es la cifra
//    que dice si la progresión es una tarde o una vida.
{
  const rng = seeded(20260727);
  let mask = emptyMask(CARD_COUNT);
  const species = new Set<number>();
  let packs = 0;
  const milestones = [0.25, 0.5, 0.75, 0.9];
  const reached: string[] = [];
  while (species.size < ALBUM_SIZE && packs < 200_000) {
    const type: PackType =
      packs % 3 === 0 ? "bolt" : packs % 3 === 1 ? "elite" : "master";
    const result = openPack(type, mask, rng);
    packs++;
    mask = withCards(
      mask,
      result.cards.map((card) => card.index),
    );
    for (const card of result.cards) species.add(card.dexId);
    const share = species.size / ALBUM_SIZE;
    while (milestones.length && share >= milestones[0]) {
      reached.push(
        `${(milestones.shift()! * 100).toFixed(0)} % en ${packs.toLocaleString("es-ES")} sobres`,
      );
    }
  }
  console.log("Ritmo de colección (sobres normales alternados)");
  for (const line of reached) console.log(`  ${line}`);
  console.log(
    `  ${species.size} de ${ALBUM_SIZE} especies tras ${packs.toLocaleString("es-ES")} sobres\n`,
  );
}

if (failures) {
  console.log(`${failures} comprobación(es) fallidas.`);
  if (STRICT) process.exit(1);
} else {
  console.log("Todo cuadra.");
}
