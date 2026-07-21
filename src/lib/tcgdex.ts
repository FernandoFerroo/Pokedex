/** TCGdex API client: cartas del JCC Pokémon, sin API key. */

const BASE_URL = "https://api.tcgdex.net/v2/en";

/** Card data is effectively static — revalidate once a day. */
const REVALIDATE_SECONDS = 60 * 60 * 24;

interface TcgdexCardBrief {
  id: string;
  localId: string;
  name: string;
  /** Base asset URL (append /high.webp or /low.webp). Missing for cards without a scan. */
  image?: string;
}

export interface TcgCard {
  id: string;
  name: string;
  imageUrl: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Fetches TCG cards whose name contains the Pokémon's (English) name as a
 * whole word — the API's `like:` filter is a substring match, so "Mew" would
 * otherwise also return every Mewtwo card. Returns `null` if the API fails.
 */
export async function fetchTcgCards(name: string): Promise<TcgCard[] | null> {
  let cards: TcgdexCardBrief[];
  try {
    const res = await fetch(
      `${BASE_URL}/cards?name=like:${encodeURIComponent(name)}`,
      { next: { revalidate: REVALIDATE_SECONDS } },
    );
    if (!res.ok) {
      return null;
    }
    cards = await res.json();
  } catch {
    return null;
  }

  const wholeWord = new RegExp(`(^|[^\\p{L}])${escapeRegExp(name)}(?![\\p{L}])`, "iu");
  return cards
    .filter((card) => card.image && wholeWord.test(card.name))
    .map((card) => ({
      id: card.id,
      name: card.name,
      imageUrl: `${card.image}/low.webp`,
    }));
}
