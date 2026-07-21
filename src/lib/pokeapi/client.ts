const BASE_URL = "https://pokeapi.co/api/v2";

/** Revalidate PokéAPI data once a day — it is effectively static. */
const REVALIDATE_SECONDS = 60 * 60 * 24;

export class PokeApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
  ) {
    super(`PokéAPI request failed (${status}): ${path}`);
    this.name = "PokeApiError";
  }
}

export async function pokeFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new PokeApiError(res.status, path);
  }
  return res.json() as Promise<T>;
}

/** Extracts the numeric id from a PokéAPI resource URL, e.g. ".../pokemon-species/25/" -> 25. */
export function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  if (!match) {
    throw new Error(`Cannot extract id from PokéAPI URL: ${url}`);
  }
  return Number(match[1]);
}

/** Maps `fn` over `items` with at most `limit` requests in flight. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const current = next++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}
