/** Presentation metadata: type colors/labels, generation labels, sprite URLs. */

export const TYPE_LABELS_ES: Record<string, string> = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  electric: "Eléctrico",
  grass: "Planta",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dragon: "Dragón",
  dark: "Siniestro",
  steel: "Acero",
  fairy: "Hada",
};

/** PokéAPI slug -> Spanish label for every filterable species attribute. */
export const COLOR_LABELS_ES: Record<string, string> = {
  black: "Negro",
  blue: "Azul",
  brown: "Marrón",
  gray: "Gris",
  green: "Verde",
  pink: "Rosa",
  purple: "Morado",
  red: "Rojo",
  white: "Blanco",
  yellow: "Amarillo",
};

/** Species color slug -> swatch hex, brightened to read on the dark HUD. */
export const COLOR_SWATCH_HEX: Record<string, string> = {
  black: "#475569",
  blue: "#3b82f6",
  brown: "#b45309",
  gray: "#94a3b8",
  green: "#22c55e",
  pink: "#f472b6",
  purple: "#a855f7",
  red: "#ef4444",
  white: "#f1f5f9",
  yellow: "#facc15",
};

export const HABITAT_LABELS_ES: Record<string, string> = {
  cave: "Cueva",
  forest: "Bosque",
  grassland: "Pradera",
  mountain: "Montaña",
  rare: "Raro",
  "rough-terrain": "Terreno agreste",
  sea: "Mar",
  urban: "Urbano",
  "waters-edge": "Ribera",
};

export const SHAPE_LABELS_ES: Record<string, string> = {
  ball: "Cabeza",
  squiggle: "Serpentino",
  fish: "Pez",
  arms: "Cabeza y brazos",
  blob: "Cabeza y base",
  upright: "Bípedo con cola",
  legs: "Cabeza y piernas",
  quadruped: "Cuadrúpedo",
  wings: "Dos alas",
  tentacles: "Tentáculos",
  heads: "Varios cuerpos",
  humanoid: "Humanoide",
  "bug-wings": "Insecto alado",
  armor: "Insectoide",
};

export const EGG_GROUP_LABELS_ES: Record<string, string> = {
  monster: "Monstruo",
  water1: "Agua 1",
  water2: "Agua 2",
  water3: "Agua 3",
  bug: "Bicho",
  flying: "Volador",
  ground: "Campo",
  fairy: "Hada",
  plant: "Planta",
  humanshape: "Humanoide",
  mineral: "Mineral",
  indeterminate: "Amorfo",
  ditto: "Ditto",
  dragon: "Dragón",
  "no-eggs": "Desconocido",
};

export const CATEGORY_LABELS_ES: Record<string, string> = {
  normal: "Normal",
  baby: "Bebé",
  legendary: "Legendario",
  mythical: "Singular",
};

export const STAGE_LABELS_ES: Record<string, string> = {
  "1": "Básico",
  "2": "1ª evolución",
  "3": "2ª evolución",
  final: "Forma final",
};

export const GROWTH_LABELS_ES: Record<string, string> = {
  slow: "Lento",
  medium: "Medio",
  fast: "Rápido",
  "medium-slow": "Medio-lento",
  "slow-then-very-fast": "Errático",
  "fast-then-very-slow": "Fluctuante",
};

/** Spanish titles of the main-series games, keyed by PokéAPI version slug. */
export const VERSION_LABELS_ES: Record<string, string> = {
  red: "Rojo",
  blue: "Azul",
  yellow: "Amarillo",
  gold: "Oro",
  silver: "Plata",
  crystal: "Cristal",
  ruby: "Rubí",
  sapphire: "Zafiro",
  emerald: "Esmeralda",
  firered: "Rojo Fuego",
  leafgreen: "Verde Hoja",
  diamond: "Diamante",
  pearl: "Perla",
  platinum: "Platino",
  heartgold: "HeartGold",
  soulsilver: "SoulSilver",
  black: "Negro",
  white: "Blanco",
  "black-2": "Negro 2",
  "white-2": "Blanco 2",
  x: "X",
  y: "Y",
  "omega-ruby": "Rubí Omega",
  "alpha-sapphire": "Zafiro Alfa",
  sun: "Sol",
  moon: "Luna",
  "ultra-sun": "Ultrasol",
  "ultra-moon": "Ultraluna",
  "lets-go-pikachu": "Let's Go, Pikachu!",
  "lets-go-eevee": "Let's Go, Eevee!",
  sword: "Espada",
  shield: "Escudo",
  "brilliant-diamond": "Diamante Brillante",
  "shining-pearl": "Perla Reluciente",
  "legends-arceus": "Leyendas: Arceus",
  scarlet: "Escarlata",
  violet: "Púrpura",
};

export function versionLabel(slug: string): string {
  return VERSION_LABELS_ES[slug] ?? formatName(slug);
}

export function growthLabel(slug: string | undefined): string {
  return (slug && GROWTH_LABELS_ES[slug]) || "—";
}

/**
 * Muted "soft badge" palette per type (tinted background + ring + readable
 * text in both themes). Full class strings so Tailwind can extract them.
 */
export const TYPE_COLORS: Record<string, string> = {
  normal:
    "bg-neutral-500/10 text-neutral-700 ring-neutral-500/25 dark:bg-neutral-400/10 dark:text-neutral-300 dark:ring-neutral-400/25",
  fire: "bg-orange-500/10 text-orange-700 ring-orange-600/25 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/25",
  water:
    "bg-blue-500/10 text-blue-700 ring-blue-600/25 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/25",
  electric:
    "bg-yellow-500/10 text-yellow-700 ring-yellow-600/25 dark:bg-yellow-400/10 dark:text-yellow-300 dark:ring-yellow-400/25",
  grass:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-600/25 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  ice: "bg-cyan-500/10 text-cyan-700 ring-cyan-600/25 dark:bg-cyan-400/10 dark:text-cyan-300 dark:ring-cyan-400/25",
  fighting:
    "bg-red-500/10 text-red-700 ring-red-600/25 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25",
  poison:
    "bg-fuchsia-500/10 text-fuchsia-700 ring-fuchsia-600/25 dark:bg-fuchsia-400/10 dark:text-fuchsia-300 dark:ring-fuchsia-400/25",
  ground:
    "bg-amber-500/10 text-amber-700 ring-amber-600/25 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
  flying:
    "bg-sky-500/10 text-sky-700 ring-sky-600/25 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25",
  psychic:
    "bg-pink-500/10 text-pink-700 ring-pink-600/25 dark:bg-pink-400/10 dark:text-pink-300 dark:ring-pink-400/25",
  bug: "bg-lime-500/10 text-lime-700 ring-lime-600/25 dark:bg-lime-400/10 dark:text-lime-300 dark:ring-lime-400/25",
  rock: "bg-stone-500/10 text-stone-700 ring-stone-600/25 dark:bg-stone-400/10 dark:text-stone-300 dark:ring-stone-400/25",
  ghost:
    "bg-violet-500/10 text-violet-700 ring-violet-600/25 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/25",
  dragon:
    "bg-indigo-500/10 text-indigo-700 ring-indigo-600/25 dark:bg-indigo-400/10 dark:text-indigo-300 dark:ring-indigo-400/25",
  dark: "bg-gray-500/10 text-gray-700 ring-gray-600/25 dark:bg-gray-400/10 dark:text-gray-300 dark:ring-gray-400/25",
  steel:
    "bg-zinc-500/10 text-zinc-700 ring-zinc-600/25 dark:bg-zinc-400/10 dark:text-zinc-300 dark:ring-zinc-400/25",
  fairy:
    "bg-rose-500/10 text-rose-700 ring-rose-600/25 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/25",
};

/**
 * Chart accent per type: a `text-*` pair so SVG marks can draw with
 * `currentColor` in both themes. Same hue family as TYPE_COLORS, one step
 * deeper in light mode so 2px strokes stay visible on white.
 */
export const TYPE_ACCENTS: Record<string, string> = {
  normal: "text-neutral-500 dark:text-neutral-400",
  fire: "text-orange-600 dark:text-orange-400",
  water: "text-blue-600 dark:text-blue-400",
  electric: "text-yellow-600 dark:text-yellow-400",
  grass: "text-emerald-600 dark:text-emerald-400",
  ice: "text-cyan-600 dark:text-cyan-400",
  fighting: "text-red-600 dark:text-red-400",
  poison: "text-fuchsia-600 dark:text-fuchsia-400",
  ground: "text-amber-600 dark:text-amber-400",
  flying: "text-sky-600 dark:text-sky-400",
  psychic: "text-pink-600 dark:text-pink-400",
  bug: "text-lime-600 dark:text-lime-400",
  rock: "text-stone-500 dark:text-stone-400",
  ghost: "text-violet-600 dark:text-violet-400",
  dragon: "text-indigo-600 dark:text-indigo-400",
  dark: "text-gray-600 dark:text-gray-400",
  steel: "text-zinc-500 dark:text-zinc-400",
  fairy: "text-rose-500 dark:text-rose-400",
};

export function typeAccent(type: string): string {
  return TYPE_ACCENTS[type] ?? "text-slate-500 dark:text-slate-400";
}

/**
 * Neon aura color per type, used as the `--aura` CSS variable that the
 * `.aura-card` class turns into a glow (see globals.css). Hand-picked neon
 * hues that read on both the near-black and the light background.
 */
export const TYPE_AURA: Record<string, string> = {
  normal: "#d6d3d1",
  fire: "#ff6b2b",
  water: "#22d3ee",
  electric: "#fde047",
  grass: "#34d399",
  ice: "#a5f3fc",
  fighting: "#ef4444",
  poison: "#d946ef",
  ground: "#f59e0b",
  flying: "#38bdf8",
  psychic: "#f472b6",
  bug: "#a3e635",
  rock: "#b8a038",
  ghost: "#8b5cf6",
  dragon: "#a855f7",
  dark: "#6d28d9",
  steel: "#94a3b8",
  fairy: "#fb7185",
};

/** Aura color for a Pokémon's primary type (neutral steel-gray fallback). */
export function typeAura(type: string | undefined): string {
  return (type && TYPE_AURA[type]) || "#94a3b8";
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export function generationLabel(generation: number): string {
  return `Gen ${ROMAN[generation - 1] ?? generation}`;
}

/** "generation-iv" -> 4 */
export function generationFromName(name: string): number {
  const roman = name.replace("generation-", "").toUpperCase();
  const index = ROMAN.indexOf(roman);
  return index === -1 ? 0 : index + 1;
}

export function typeLabel(type: string): string {
  return TYPE_LABELS_ES[type] ?? formatName(type);
}

export function typeColor(type: string): string {
  return (
    TYPE_COLORS[type] ??
    "bg-slate-500/10 text-slate-700 ring-slate-600/25 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/25"
  );
}

/** Official artwork hosted by the PokeAPI sprites repo, keyed by pokemon id. */
export function artworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

/** "mr-mime" -> "Mr Mime" */
export function formatName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** "#0025" style National Pokédex number. */
export function formatDexNumber(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}
