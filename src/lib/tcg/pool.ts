/**
 * El catálogo de cartas, desempaquetado y con los índices que necesitan los
 * sobres y el álbum.
 *
 * El archivo `pool.json` lo genera `scripts/fetch-tcg-pool.mjs` a partir de
 * TCGdex y va commiteado: aquí no se llama a ninguna API. (El vecino
 * `src/lib/tcgdex.ts` sí consulta en vivo, pero es para la galería de la ficha
 * de cada Pokémon, que es otra cosa.)
 */
import {
  RARITY_ORDER,
  type CardPoolFile,
  type PoolCard,
  type Rarity,
} from "@/types/tcg";
// El atributo `with` no es adorno: sin él Node se niega a cargar el JSON, y
// este módulo tiene que poder importarse también desde `scripts/tcg-odds.mts`.
import poolFile from "./pool.json" with { type: "json" };

const ASSETS = "https://assets.tcgdex.net";

// JSON no tiene tuplas: TypeScript ve `(string | number)[][]` donde nosotros
// sabemos que hay `[dexId, tier, set, leaf, name]`. El doble paso por
// `unknown` es la forma honesta de decirlo — quien garantiza la forma es
// `scripts/fetch-tcg-pool.mjs`, no el compilador.
const file = poolFile as unknown as CardPoolFile;

/** Todas las cartas del catálogo. La posición en este array ES su identidad. */
export const CARDS: readonly PoolCard[] = file.cards.map(
  ([dexId, tier, set, leaf, name], index) => ({
    index,
    dexId,
    rarity: RARITY_ORDER[tier] ?? "common",
    name,
    imageUrl: `${ASSETS}/${file.sets[set]}/${leaf}/low.webp`,
    imageHighUrl: `${ASSETS}/${file.sets[set]}/${leaf}/high.webp`,
  }),
);

export const CARD_COUNT = CARDS.length;

/**
 * Se re-exporta desde `totals.ts` a propósito.
 *
 * La portada enseña el progreso y sólo necesita el denominador. Si lo cogiera
 * de aquí arrastraría `pool.json` —doscientos y pico kilobytes— al paquete de
 * la portada, y de ahí al de todas las páginas. Quien sólo quiera el número
 * debe importar `@/lib/tcg/totals`, no este módulo.
 */
export { ALBUM_SIZE } from "./totals";

/**
 * Índices de carta agrupados por nivel — el sorteo de sobres.
 *
 * Por nivel y nada más: ningún sobre reparte por generaciones. De un Relámpago
 * puede salir un Pokémon de Paldea igual que uno de Kanto, y lo que separa a un
 * sobre del siguiente es la RAREZA de lo que trae, no de dónde viene. Dividir
 * el catálogo por generaciones convertía media colección en inalcanzable
 * mientras no se comprara el sobre concreto que la repartía.
 */
const byRarity = new Map<Rarity, number[]>();
/** Índices de carta agrupados por especie — la casilla del álbum. */
const bySpecies = new Map<number, number[]>();

for (const card of CARDS) {
  let bucket = byRarity.get(card.rarity);
  if (!bucket) byRarity.set(card.rarity, (bucket = []));
  bucket.push(card.index);

  let species = bySpecies.get(card.dexId);
  if (!species) bySpecies.set(card.dexId, (species = []));
  species.push(card.index);
}

/** Todas las cartas de ese nivel. Vacío si el catálogo no trae ninguna. */
export function poolFor(rarity: Rarity): readonly number[] {
  return byRarity.get(rarity) ?? [];
}

/** Todas las cartas de una especie, de menor a mayor nivel. */
export function cardsOfSpecies(dexId: number): readonly number[] {
  return bySpecies.get(dexId) ?? [];
}

/**
 * Los niveles que el catálogo trae de esa especie.
 *
 * Es lo que hace honesto el filtro de rareza del álbum: no toda especie tiene
 * Hyper Rara, así que «me faltan las Hyper Raras» sólo puede contar las que
 * existen. Se calcula una vez al cargar el catálogo — recorrer siete mil cartas
 * cada vez que alguien toca el desplegable sería trabajo tirado.
 */
const raritiesBySpecies = new Map<number, Set<Rarity>>();
for (const card of CARDS) {
  let levels = raritiesBySpecies.get(card.dexId);
  if (!levels) raritiesBySpecies.set(card.dexId, (levels = new Set()));
  levels.add(card.rarity);
}

const NO_RARITIES: ReadonlySet<Rarity> = new Set();

export function raritiesOfSpecies(dexId: number): ReadonlySet<Rarity> {
  return raritiesBySpecies.get(dexId) ?? NO_RARITIES;
}

export function cardAt(index: number): PoolCard | undefined {
  return CARDS[index];
}
