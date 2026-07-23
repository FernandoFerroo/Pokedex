import { CardGrid } from "@/components/pokemon/CardGrid";
import { fetchTcgCards } from "@/lib/tcgdex";

const MAX_CARDS = 18;

interface CardGalleryProps {
  /** English display name of the Pokémon, as printed on the cards. */
  name: string;
}

export async function CardGallery({ name }: CardGalleryProps) {
  const cards = await fetchTcgCards(name);

  if (cards === null) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-300">
        No se ha podido cargar la galería de cartas. Inténtalo más tarde.
      </p>
    );
  }
  if (cards.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-300">
        No se han encontrado cartas del JCC para {name}.
      </p>
    );
  }

  const visible = cards.slice(0, MAX_CARDS);

  return (
    <div>
      <CardGrid cards={visible} />
      {cards.length > MAX_CARDS && (
        <p className="mt-3 text-xs text-slate-300 dark:text-slate-400">
          Mostrando {MAX_CARDS} de {cards.length} cartas.
        </p>
      )}
    </div>
  );
}

export function CardGallerySkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 6 }, (_, i) => (
        <li
          key={i}
          className="aspect-63/88 animate-pulse rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
        />
      ))}
    </ul>
  );
}
