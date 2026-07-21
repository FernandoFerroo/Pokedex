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
