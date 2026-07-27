/**
 * Whitelist for the team snapshots the client posts to the battle routes.
 * Everything that reaches PokéAPI or a prompt goes through here first, so a
 * hand-crafted request can only ever describe a legal roster.
 */
import { TYPE_LABELS_ES } from "@/lib/pokemon-meta";
import { DEFAULT_LEVEL, type MemberBuild, type TeamMember } from "@/types/team";

const TYPE_SLUGS = Object.keys(TYPE_LABELS_ES);

/** Lowercased PokéAPI slug, or "" when the value isn't a usable string. */
export function sanitizeSlug(value: unknown): string {
  return typeof value === "string"
    ? value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60)
    : "";
}

/** Whitelists a member's hand-picked build (ability + ≤4 distinct moves). */
export function sanitizeBuild(value: unknown): MemberBuild | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const b = value as MemberBuild;
  const ability = sanitizeSlug(b.ability);
  const moves = Array.isArray(b.moves)
    ? [...new Set(b.moves.map(sanitizeSlug).filter(Boolean))].slice(0, 4)
    : [];
  if (!ability && moves.length === 0) return undefined;
  return {
    ability: ability || undefined,
    moves: moves.length > 0 ? moves : undefined,
  };
}

/** Up to six real-looking members; anything malformed is dropped. */
export function sanitizeTeam(value: unknown): TeamMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (m): m is TeamMember =>
        typeof m === "object" &&
        m !== null &&
        typeof (m as TeamMember).id === "number" &&
        typeof (m as TeamMember).name === "string" &&
        Array.isArray((m as TeamMember).types),
    )
    .map((m) => ({
      id: m.id,
      name: m.name.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40),
      types: m.types.filter((t) => TYPE_SLUGS.includes(t)).slice(0, 2),
      level:
        typeof m.level === "number"
          ? Math.min(100, Math.max(1, Math.round(m.level)))
          : DEFAULT_LEVEL,
      build: sanitizeBuild(m.build),
    }))
    .filter((m) => m.name && m.types.length > 0)
    .slice(0, 6);
}
