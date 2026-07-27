/** Shared contracts between the team builder UI and the AI coach API route. */

import type { LearnMethod } from "@/lib/battle/learnset";

/** Minimal snapshot of a Pokémon stored in a team slot. */
export interface TeamMember {
  /** National Pokédex id — drives the artwork URL and dedupe. */
  id: number;
  /** PokéAPI species slug, e.g. "pikachu". */
  name: string;
  /** Type slugs ordered by slot, e.g. ["water", "flying"]. */
  types: string[];
  /** Combat level 1-100; absent means the default (50). */
  level?: number;
  /** Custom combat build; absent means "auto" (server picks everything). */
  build?: MemberBuild;
}

/**
 * Hand-picked combat configuration for one member. Every field is optional:
 * gaps are autofilled at battle setup (strongest level-up moves, primary
 * ability), so a partial build is always valid.
 */
export interface MemberBuild {
  /** Chosen ability slug, e.g. "solar-power". */
  ability?: string;
  /** Up to 4 distinct move slugs, e.g. ["flamethrower"]. */
  moves?: string[];
}

/** One selectable ability in the build editor. */
export interface AbilityOption {
  slug: string;
  /** Spanish name, e.g. "Mar Llamas". */
  label: string;
  isHidden: boolean;
}

/** One selectable move in the build editor (status moves render disabled). */
export interface MoveOption {
  slug: string;
  /** Spanish name, e.g. "Lanzallamas". */
  label: string;
  /** Type slug, e.g. "fire". */
  type: string;
  damageClass: "physical" | "special" | "status";
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  /** How the species gets it — drives the "Nv. 24 / MT / Huevo / Tutor" tag. */
  method: LearnMethod;
  /** Level it is learned at; null for every non level-up method. */
  learnLevel: number | null;
}

/** Response of `/api/battle/build-options?species=…`. */
export interface BuildOptionsResponse {
  abilities: AbilityOption[];
  moves: MoveOption[];
}

/** Default combat level for members that never had theirs edited. */
export const DEFAULT_LEVEL = 50;

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

/** Response of the AI team generator (`/api/team-suggest`). */
export interface TeamSuggestResponse {
  team: TeamMember[];
  /** Short rationale the model gives for its picks. */
  motivo: string;
}
