/**
 * Los totales del catálogo, generados por \`scripts/fetch-tcg-pool.mjs\`.
 *
 * Este archivo existe para que quien sólo necesita el denominador —la portada—
 * no tenga que importar \`pool.json\` entero. No se edita a mano: se regenera
 * con el catálogo.
 */

/** Especies con al menos una carta. Es el denominador del álbum. */
export const ALBUM_SIZE = 1025;

/** Cartas distintas del catálogo. */
export const CARD_TOTAL = 7616;
