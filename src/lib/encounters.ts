/**
 * Wild-encounter data: turns the raw `/pokemon/{id}/encounters` payload into
 * a per-game-version structure ready for the "Ubicaciones y hábitat" atlas.
 * Pure functions — no React, no fetching — so the grouping is unit-testable.
 */

import type { PokemonEncountersResponse } from "@/lib/pokeapi/types";
import { formatName, versionLabel } from "@/lib/pokemon-meta";

/** Region shown next to each game version in the selector. */
export const REGION_BY_VERSION: Record<string, string> = {
  red: "Kanto",
  blue: "Kanto",
  yellow: "Kanto",
  gold: "Johto",
  silver: "Johto",
  crystal: "Johto",
  ruby: "Hoenn",
  sapphire: "Hoenn",
  emerald: "Hoenn",
  firered: "Kanto",
  leafgreen: "Kanto",
  diamond: "Sinnoh",
  pearl: "Sinnoh",
  platinum: "Sinnoh",
  heartgold: "Johto",
  soulsilver: "Johto",
  black: "Teselia",
  white: "Teselia",
  "black-2": "Teselia",
  "white-2": "Teselia",
  x: "Kalos",
  y: "Kalos",
  "omega-ruby": "Hoenn",
  "alpha-sapphire": "Hoenn",
  sun: "Alola",
  moon: "Alola",
  "ultra-sun": "Alola",
  "ultra-moon": "Alola",
  "lets-go-pikachu": "Kanto",
  "lets-go-eevee": "Kanto",
  sword: "Galar",
  shield: "Galar",
  "brilliant-diamond": "Sinnoh",
  "shining-pearl": "Sinnoh",
  "legends-arceus": "Hisui",
  scarlet: "Paldea",
  violet: "Paldea",
};

/** Canonical release order, used to sort the version selector. */
const VERSION_ORDER = Object.keys(REGION_BY_VERSION);

/** PokéAPI encounter-method slug -> Spanish label (fallback: formatName). */
export const METHOD_LABELS_ES: Record<string, string> = {
  walk: "Hierba alta",
  "dark-grass": "Hierba oscura",
  "grass-spots": "Hierba (calvero agitado)",
  "cave-spots": "Cueva (polvo agitado)",
  "bridge-spots": "Puente (sombra)",
  "surf-spots": "Surfeando (remolino)",
  "super-rod-spots": "Supercaña (remolino)",
  "yellow-flowers": "Flores amarillas",
  "purple-flowers": "Flores moradas",
  "red-flowers": "Flores rojas",
  "rough-terrain": "Terreno agreste",
  surf: "Surfeando",
  "old-rod": "Pescando (Caña Vieja)",
  "good-rod": "Pescando (Caña Buena)",
  "super-rod": "Pescando (Supercaña)",
  "rock-smash": "Golpe Roca",
  headbutt: "Cabezazo a un árbol",
  "headbutt-low": "Cabezazo (árbol bajo)",
  "headbutt-normal": "Cabezazo (árbol normal)",
  "headbutt-high": "Cabezazo (árbol alto)",
  "seaweed": "Entre algas",
  gift: "Regalo",
  "gift-egg": "Huevo de regalo",
  "only-one": "Encuentro único",
  "pokeflute": "Poké Flauta",
  "squirt-bottle": "Botella Squirt",
  "wailmer-pail": "Regadera Wailmer",
  "devon-scope": "Escáner Devon",
  "island-scan": "Escaneo Isla",
  "sos-encounter": "Llamada de auxilio (SOS)",
  "berry-piles": "Montones de bayas",
  "npc-trade": "Intercambio con NPC",
  "roaming-grass": "Errante (hierba)",
  "roaming-water": "Errante (agua)",
};

/** Icon per method family, keyed by slug prefix match. */
export function methodIcon(slug: string): string {
  if (slug.includes("rod") || slug === "seaweed") return "🎣";
  if (slug.includes("surf") || slug.includes("water")) return "🌊";
  if (slug.includes("rock")) return "🪨";
  if (slug.includes("headbutt")) return "🌳";
  if (slug.includes("gift") || slug.includes("trade")) return "🎁";
  if (slug === "only-one") return "⭐";
  if (slug.includes("cave")) return "🕳️";
  if (slug.includes("flowers")) return "🌸";
  return "🌿";
}

/** Location-area slug tokens translated for display. */
const AREA_WORDS_ES: Record<string, string> = {
  route: "Ruta",
  cave: "Cueva",
  caves: "Cuevas",
  forest: "Bosque",
  city: "Ciudad",
  town: "Pueblo",
  sea: "Mar",
  seafoam: "Espuma",
  islands: "Islas",
  island: "Isla",
  road: "Camino",
  tunnel: "Túnel",
  tower: "Torre",
  mountain: "Monte",
  mt: "Monte",
  lake: "Lago",
  river: "Río",
  meadow: "Pradera",
  garden: "Jardín",
  plant: "Central",
  power: "Eléctrica",
  safari: "Safari",
  zone: "Zona",
  victory: "Victoria",
  north: "norte",
  south: "sur",
  east: "este",
  west: "oeste",
  entrance: "entrada",
  inside: "interior",
  outside: "exterior",
  basement: "sótano",
  summit: "cima",
  area: "",
  and: "y",
};

/** Region prefixes stripped from area slugs ("kanto-route-2-…" -> "route-2-…"). */
const REGION_PREFIX =
  /^(kanto|johto|hoenn|sinnoh|unova|kalos|alola|galar|hisui|paldea)-/;

/**
 * "kanto-route-2-south-towards-viridian-city" -> "Ruta 2 (sur)".
 * Best-effort prettifier: strips the region, translates known tokens, keeps
 * floor markers ("B1F") uppercase and drops the generic "-area" suffix.
 */
export function areaLabel(slug: string): string {
  const tokens = slug.replace(REGION_PREFIX, "").split("-");
  const words = tokens
    .map((token) => {
      if (/^b?\d+f$/.test(token)) return token.toUpperCase();
      if (token in AREA_WORDS_ES) return AREA_WORDS_ES[token];
      return token.charAt(0).toUpperCase() + token.slice(1);
    })
    .filter(Boolean);
  return words.join(" ").replace(/\s+/g, " ").trim() || formatName(slug);
}

export interface EncounterMethodSummary {
  /** Raw method slug (keys icons). */
  method: string;
  label: string;
  /** Aggregated appearance chance in %, capped at 100. */
  chance: number;
  minLevel: number;
  maxLevel: number;
}

export interface EncounterSpot {
  /** Raw location-area slug (stable key + deterministic map position). */
  id: string;
  area: string;
  methods: EncounterMethodSummary[];
  /** Best method chance, used to size the map pin. */
  maxChance: number;
}

export interface VersionEncounters {
  version: string;
  label: string;
  region: string;
  spots: EncounterSpot[];
}

/**
 * Groups the raw encounter list by game version. Within a version, one spot
 * per location area; within a spot, encounter slots collapse per method
 * (chances add up, level ranges merge).
 */
export function groupEncountersByVersion(
  encounters: PokemonEncountersResponse,
): VersionEncounters[] {
  const byVersion = new Map<string, Map<string, EncounterSpot>>();

  for (const { location_area, version_details } of encounters) {
    for (const detail of version_details) {
      const version = detail.version.name;
      const spots = byVersion.get(version) ?? new Map<string, EncounterSpot>();
      byVersion.set(version, spots);

      const spot: EncounterSpot = spots.get(location_area.name) ?? {
        id: location_area.name,
        area: areaLabel(location_area.name),
        methods: [],
        maxChance: 0,
      };
      spots.set(location_area.name, spot);

      for (const slot of detail.encounter_details) {
        const method = slot.method.name;
        const existing = spot.methods.find((m) => m.method === method);
        if (existing) {
          existing.chance = Math.min(100, existing.chance + slot.chance);
          existing.minLevel = Math.min(existing.minLevel, slot.min_level);
          existing.maxLevel = Math.max(existing.maxLevel, slot.max_level);
        } else {
          spot.methods.push({
            method,
            label: METHOD_LABELS_ES[method] ?? formatName(method),
            chance: Math.min(100, slot.chance),
            minLevel: slot.min_level,
            maxLevel: slot.max_level,
          });
        }
      }
      spot.methods.sort((a, b) => b.chance - a.chance);
      spot.maxChance = Math.max(...spot.methods.map((m) => m.chance), 0);
    }
  }

  return [...byVersion.entries()]
    .sort(
      ([a], [b]) =>
        (VERSION_ORDER.indexOf(a) + 1 || Number.MAX_SAFE_INTEGER) -
        (VERSION_ORDER.indexOf(b) + 1 || Number.MAX_SAFE_INTEGER),
    )
    .map(([version, spots]) => ({
      version,
      label: versionLabel(version),
      region: REGION_BY_VERSION[version] ?? "—",
      spots: [...spots.values()].sort((a, b) => b.maxChance - a.maxChance),
    }));
}

/** Type guard used by the section to render the "not in the wild" state. */
export function hasWildEncounters(
  versions: VersionEncounters[],
): versions is [VersionEncounters, ...VersionEncounters[]] {
  return versions.length > 0;
}
