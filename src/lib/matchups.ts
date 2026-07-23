import { pokeFetch } from "@/lib/pokeapi/client";
import type { TypeResponse } from "@/lib/pokeapi/types";
import { TYPE_LABELS_ES } from "@/lib/pokemon-meta";

/** Defensive multipliers grouped the way fans read them. */
export interface DefensiveMatchups {
  /** ×4 — double weakness. */
  x4: string[];
  /** ×2 — weakness. */
  x2: string[];
  /** ×½ — resistance. */
  x05: string[];
  /** ×¼ — double resistance. */
  x025: string[];
  /** ×0 — immunity. */
  x0: string[];
}

/**
 * Combined defensive type chart for a mono- or dual-typed Pokémon: the
 * per-type damage relations multiply together (2 × 2 = 4, 2 × ½ = 1, ×0
 * always wins). Type responses come from the same cached endpoint the index
 * build already uses.
 */
export async function getDefensiveMatchups(
  defenderTypes: string[],
): Promise<DefensiveMatchups> {
  const responses = await Promise.all(
    defenderTypes.map((type) => pokeFetch<TypeResponse>(`/type/${type}`)),
  );

  const multipliers = new Map<string, number>(
    Object.keys(TYPE_LABELS_ES).map((attacker) => [attacker, 1]),
  );
  const apply = (attacker: string, factor: number) => {
    multipliers.set(attacker, (multipliers.get(attacker) ?? 1) * factor);
  };

  for (const { damage_relations: relations } of responses) {
    for (const t of relations.double_damage_from) apply(t.name, 2);
    for (const t of relations.half_damage_from) apply(t.name, 0.5);
    for (const t of relations.no_damage_from) apply(t.name, 0);
  }

  const matchups: DefensiveMatchups = { x4: [], x2: [], x05: [], x025: [], x0: [] };
  for (const [attacker, factor] of multipliers) {
    if (factor === 0) matchups.x0.push(attacker);
    else if (factor >= 4) matchups.x4.push(attacker);
    else if (factor === 2) matchups.x2.push(attacker);
    else if (factor === 0.5) matchups.x05.push(attacker);
    else if (factor < 0.5) matchups.x025.push(attacker);
  }
  return matchups;
}
