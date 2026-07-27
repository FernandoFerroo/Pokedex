/**
 * Compone el catálogo de cartas del JCC que alimenta los sobres y el álbum,
 * y lo deja escrito en `src/lib/tcg/pool.json`.
 *
 *   node scripts/fetch-tcg-pool.mjs              # catálogo completo
 *   node scripts/fetch-tcg-pool.mjs --limit 151  # sólo hasta cierto número
 *
 * El catálogo es un activo fijo: se genera una vez, aquí, y se commitea —
 * igual que los fondos de la arena y los sprites de Entrenador. Pedirle a
 * TCGdex mil doscientas cosas en cada arranque del servidor sería absurdo
 * cuando la respuesta no cambia de un mes para otro.
 *
 * El emparejamiento carta → especie NO se hace por nombre. TCGdex publica el
 * número de Pokédex de cada carta, así que se cruzan dos consultas exactas y
 * no queda ni una heurística de por medio:
 *
 *   1. Una consulta por rareza  → de qué nivel es cada carta.
 *   2. Una consulta por especie → a qué número de Pokédex pertenece.
 *
 * Cruzar por id de carta da la verdad de la casa, sin adivinar que «Blaine's
 * Charizard» o «Dark Charizard» son un #006 — lo dice el propio dato.
 *
 * Las cartas sin escaneo se descartan: una casilla del álbum sin ilustración
 * no es una carta, es un hueco.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "src", "lib", "tcg");
const OUT_FILE = join(OUT_DIR, "pool.json");
const BASE = "https://api.tcgdex.net/v2/en";
const ASSETS = "https://assets.tcgdex.net/";

/** Última especie de la Pokédex Nacional. Debe coincidir con `SPECIES_COUNT`. */
const DEX_SIZE = 1025;

/** Peticiones en vuelo. TCGdex no pide cuartel, pero tampoco hay prisa. */
const CONCURRENCY = 16;

/**
 * Cartas que guardamos por especie y nivel. Con una sola, cada Charizard holo
 * que saliese sería literalmente la misma ilustración; con tres, el sobre
 * respira sin que el catálogo se dispare de tamaño.
 */
const PER_SPECIES_TIER = 3;

/** Los seis niveles del álbum, de menor a mayor. El índice se persiste. */
const TIERS = ["common", "uncommon", "holo", "ex", "fullArt", "hyper"];

/**
 * Las rarezas reales de TCGdex, repartidas en nuestros seis niveles.
 *
 * La lista viva está en `GET /v2/en/rarities`, y el aviso del final del script
 * compara las dos: una rareza nueva que nadie mapee no rompe nada, se cae del
 * catálogo en silencio — que es exactamente cómo se perdieron «One Shiny» y
 * «Two Shiny» hasta que se auditó.
 */
const TIER_BY_RARITY = {
  // common
  Common: "common",
  "One Diamond": "common",
  // uncommon
  Uncommon: "uncommon",
  "Two Diamond": "uncommon",
  // holo
  Rare: "holo",
  "Rare Holo": "holo",
  "Holo Rare": "holo",
  "Three Diamond": "holo",
  "Radiant Rare": "holo",
  // ex / VMAX y compañía
  "Double rare": "ex",
  "Ultra Rare": "ex",
  "Holo Rare V": "ex",
  "Holo Rare VMAX": "ex",
  "Holo Rare VSTAR": "ex",
  "Four Diamond": "ex",
  "Rare Holo LV.X": "ex",
  "Rare PRIME": "ex",
  "ACE SPEC Rare": "ex",
  "Amazing Rare": "ex",
  // Full Art / ilustración
  "Illustration rare": "fullArt",
  "Special illustration rare": "fullArt",
  "Full Art Trainer": "fullArt",
  "One Star": "fullArt",
  "Two Star": "fullArt",
  // hyper / secretas
  "Hyper rare": "hyper",
  Crown: "hyper",
  "Secret Rare": "hyper",
  "Shiny Ultra Rare": "hyper",
  "Mega Hyper Rare": "hyper",
  "Shiny rare": "hyper",
  "Shiny rare V": "hyper",
  "Shiny rare VMAX": "hyper",
  "Three Star": "hyper",
  "Classic Collection": "hyper",
  "Black White Rare": "hyper",
  // En la escala de diamantes y estrellas, el brillante va por encima de las
  // tres estrellas y sólo por debajo de la Corona: es la carta de vitrina.
  "One Shiny": "hyper",
  "Two Shiny": "hyper",
};

/**
 * Rarezas que se dejan fuera a sabiendas.
 *
 * No describen el nivel de una carta dentro de un sobre: `Promo` es por dónde
 * se repartió, `None` es la ausencia del dato y `LEGEND` es un formato de dos
 * mitades que no encaja en ninguna de nuestras seis baldas. Están aquí escritas
 * para que el aviso del final distinga «decidido» de «se nos ha colado».
 */
const RARITIES_IGNORED = new Set(["Promo", "None", "LEGEND"]);

async function getJson(path, attempt = 0) {
  try {
    const res = await fetch(`${BASE}/${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // Mil doscientas peticiones seguidas dan para algún corte suelto; sólo
    // se rinde tras tres intentos, y entonces sí es un fallo de verdad.
    if (attempt >= 3) throw new Error(`${path}: ${err.message}`);
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    return getJson(path, attempt + 1);
  }
}

/** Recorre `items` con `worker`, como mucho CONCURRENCY a la vez. */
async function mapPool(items, worker) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await worker(items[i], i);
      }
    }),
  );
  return out;
}

function progress(label, done, total) {
  process.stdout.write(`\r  ${label} ${done}/${total}`.padEnd(48));
  if (done === total) process.stdout.write("\n");
}

// ---------------------------------------------------------------------------

const limitArg = process.argv.indexOf("--limit");
const dexLimit =
  limitArg > -1 ? Number(process.argv[limitArg + 1]) || DEX_SIZE : DEX_SIZE;

console.log(`Catálogo JCC — especies #1 a #${dexLimit}\n`);

// 0. Contraste con la lista viva de rarezas. Va ANTES de las mil peticiones
//    para que un catálogo que ha crecido se sepa en el primer segundo y no
//    después de veinte minutos de descarga.
const liveRarities = await getJson("rarities");
const unknown = liveRarities.filter(
  (rarity) => !TIER_BY_RARITY[rarity] && !RARITIES_IGNORED.has(rarity),
);
if (unknown.length) {
  console.log("  ⚠ rarezas nuevas en TCGdex, sin nivel asignado:");
  for (const rarity of unknown) console.log(`      «${rarity}»`);
  console.log("    Se quedarán fuera del catálogo hasta mapearlas.\n");
}

// 1. Rareza de cada carta. Una consulta por rareza trae de golpe todas las
//    cartas del catálogo que la tienen, así que son unas pocas peticiones para
//    clasificar veinte mil cartas.
const rarities = Object.keys(TIER_BY_RARITY);
const tierById = new Map();
let rarityDone = 0;
await mapPool(rarities, async (rarity) => {
  const cards = await getJson(`cards?rarity=eq:${encodeURIComponent(rarity)}`);
  const tier = TIER_BY_RARITY[rarity];
  for (const card of cards) {
    // Una carta puede figurar en dos rarezas por reimpresión; nos quedamos
    // con el nivel más alto, que es el que el jugador considera "su" carta.
    const prev = tierById.get(card.id);
    if (!prev || TIERS.indexOf(tier) > TIERS.indexOf(prev)) {
      tierById.set(card.id, tier);
    }
  }
  progress("rarezas", ++rarityDone, rarities.length);
});
console.log(`  ${tierById.size} cartas clasificadas por nivel\n`);

// 2. Fecha de cada expansión, para quedarnos con las ilustraciones recientes.
const setList = await getJson("sets");
const setDate = new Map();
let setDone = 0;
await mapPool(setList, async (set) => {
  const detail = await getJson(`sets/${set.id}`);
  setDate.set(set.id, detail.releaseDate ?? "0000-00-00");
  progress("expansiones", ++setDone, setList.length);
});

// 3. Cartas de cada especie. El filtro `dexId` es exacto: nada de nombres.
const dexIds = Array.from({ length: dexLimit }, (_, i) => i + 1);
const bySpecies = new Map();
let speciesDone = 0;
await mapPool(dexIds, async (dexId) => {
  const cards = await getJson(`cards?dexId=eq:${dexId}`);
  const usable = [];
  for (const card of cards) {
    if (!card.image) continue; // sin escaneo no hay carta
    const tier = tierById.get(card.id);
    if (!tier) continue; // rareza fuera de nuestros seis niveles
    usable.push({ id: card.id, name: card.name, image: card.image, tier });
  }
  if (usable.length) bySpecies.set(dexId, usable);
  progress("especies", ++speciesDone, dexIds.length);
});

// 4. Recorte: las PER_SPECIES_TIER más recientes de cada especie y nivel.
/** Id de expansión a partir del id de carta: «sv06.5-039» → «sv06.5». */
const setOf = (cardId) => cardId.slice(0, cardId.lastIndexOf("-"));

const setIndex = new Map();
const sets = [];
/** Ruta de la expansión dentro de assets, interna para no repetirla 8000 veces. */
function internSet(imageUrl) {
  // «https://assets.tcgdex.net/en/sv/sv03/001» → dir «en/sv/sv03», hoja «001»
  const path = imageUrl.startsWith(ASSETS)
    ? imageUrl.slice(ASSETS.length)
    : imageUrl;
  const cut = path.lastIndexOf("/");
  const dir = path.slice(0, cut);
  const leaf = path.slice(cut + 1);
  let idx = setIndex.get(dir);
  if (idx === undefined) {
    idx = sets.length;
    setIndex.set(dir, idx);
    sets.push(dir);
  }
  return { idx, leaf };
}

const cards = [];
const perTier = Object.fromEntries(TIERS.map((t) => [t, 0]));
const speciesWithCard = new Set();

for (const dexId of dexIds) {
  const usable = bySpecies.get(dexId);
  if (!usable) continue;
  for (const tier of TIERS) {
    const picks = usable
      .filter((c) => c.tier === tier)
      .sort((a, b) => {
        const da = setDate.get(setOf(a.id)) ?? "";
        const db = setDate.get(setOf(b.id)) ?? "";
        // Más reciente primero; el id desempata para que dos ejecuciones del
        // script den exactamente el mismo catálogo.
        return db.localeCompare(da) || a.id.localeCompare(b.id);
      })
      .slice(0, PER_SPECIES_TIER);
    for (const pick of picks) {
      const { idx, leaf } = internSet(pick.image);
      cards.push([dexId, TIERS.indexOf(tier), idx, leaf, pick.name]);
      perTier[tier]++;
      speciesWithCard.add(dexId);
    }
  }
}

const pool = { v: 1, tiers: TIERS, sets, cards };
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(pool));

// Los totales van APARTE, en un módulo de tres líneas.
//
// El banner de la portada enseña «142 / 1025», y para eso sólo necesita el
// denominador. Si lo sacara de `pool.ts` —que importa el catálogo entero—,
// esos doscientos y pico kilobytes acabarían en el paquete de la portada, y de
// ahí en el de todas las páginas. Se comprobó mirando los manifiestos de la
// compilación: pasaba exactamente eso.
writeFileSync(
  join(OUT_DIR, "totals.ts"),
  `/**
 * Los totales del catálogo, generados por \`scripts/fetch-tcg-pool.mjs\`.
 *
 * Este archivo existe para que quien sólo necesita el denominador —la portada—
 * no tenga que importar \`pool.json\` entero. No se edita a mano: se regenera
 * con el catálogo.
 */

/** Especies con al menos una carta. Es el denominador del álbum. */
export const ALBUM_SIZE = ${speciesWithCard.size};

/** Cartas distintas del catálogo. */
export const CARD_TOTAL = ${cards.length};
`,
);

const bytes = JSON.stringify(pool).length;
console.log(`\nCatálogo escrito en src/lib/tcg/pool.json`);
console.log(`  ${cards.length} cartas · ${sets.length} expansiones · ${(bytes / 1024).toFixed(0)} kB`);
console.log(
  `  cobertura: ${speciesWithCard.size} de ${dexLimit} especies (${((speciesWithCard.size / dexLimit) * 100).toFixed(1)} %)`,
);
for (const tier of TIERS) {
  console.log(`    ${tier.padEnd(9)} ${String(perTier[tier]).padStart(5)}`);
}

// Un nivel vacío en una ventana de generación dejaría un sobre sin poder
// rellenar su ranura garantizada, así que se avisa aquí y no en tiempo de uso.
const GEN_LAST = [151, 251, 386, 493, 649, 721, 809, 905, 1025];
const genOf = (id) => GEN_LAST.findIndex((last) => id <= last) + 1;
const windows = { "Relámpago": [1, 2], "Élite": [3, 4, 5], "Maestro": [6, 7, 8, 9] };
console.log("");
for (const [label, gens] of Object.entries(windows)) {
  const holes = TIERS.filter(
    (tier) =>
      !cards.some(
        ([dexId, tierIdx]) =>
          tierIdx === TIERS.indexOf(tier) && gens.includes(genOf(dexId)),
      ),
  );
  if (holes.length) {
    console.log(`  ⚠ Sobre ${label}: sin cartas de nivel ${holes.join(", ")}`);
  }
}
