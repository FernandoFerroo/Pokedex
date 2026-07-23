/** Shared contracts between the team builder UI and the AI coach API route. */

/** Minimal snapshot of a Pokémon stored in a team slot. */
export interface TeamMember {
  /** National Pokédex id — drives the artwork URL and dedupe. */
  id: number;
  /** PokéAPI species slug, e.g. "pikachu". */
  name: string;
  /** Type slugs ordered by slot, e.g. ["water", "flying"]. */
  types: string[];
}

/** Per-attack-type tally of how the whole team takes that attack. */
export interface TypePressure {
  /** Attacking type slug. */
  type: string;
  /** Members taking ×2 or worse from this type. */
  weakCount: number;
  /** Members taking ×½ or less (immunities included). */
  resistCount: number;
}

/** Output of the pure coverage engine in `lib/team-analysis.ts`. */
export interface TeamAnalysis {
  /** Attack types 3+ members are weak to — the "⚠️ Peligro" list. */
  criticalWeaknesses: TypePressure[];
  /** Attack types 3+ members resist. */
  strongResistances: TypePressure[];
  /** Defending types no member hits super-effectively with STAB. */
  missingCoverage: string[];
  /** Full 18-row matrix, for the detailed grid. */
  matrix: TypePressure[];
}

/** Structured report returned by the AI coach. */
export interface CoachReport {
  /** Executive summary, e.g. "Equipo ofensivo pero frágil ante Tierra". */
  resumen: string;
  /** Exactly 3 battle-strategy tips. */
  consejos: string[];
  /** Substitution suggestions when coverage gaps are serious. */
  sustituciones: Array<{ sale: string; entra: string; motivo: string }>;
}

export interface CoachResponse {
  report: CoachReport;
}
