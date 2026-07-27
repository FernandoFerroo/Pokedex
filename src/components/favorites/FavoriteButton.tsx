"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { useT } from "@/lib/i18n/client";
import { formatName } from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";

/**
 * Heart toggle rendered over each Pokédex card, right above the add-to-team
 * button. Shows an explicit "Añadir a favoritos" tooltip to the left while
 * hovered. Lives inside the card's <Link>, so it must swallow the click
 * before the navigation fires.
 */
export function FavoriteButton({ id, name }: { id: number; name: string }) {
  const t = useT();
  const { has, toggle } = useFavorites();
  const isFavorite = has(id);
  const tooltip = isFavorite ? t.list.favRemove : t.list.favAdd;

  return (
    <span className="group/fav relative flex">
      <button
        type="button"
        aria-label={`${tooltip}: ${formatName(name)}`}
        // A toggle, not a one-shot action: `aria-pressed` is what tells a
        // screen reader whether the entry is already a favourite. Without it
        // the filled-vs-outlined heart is the only signal — colour and shape
        // alone (WCAG 1.4.1).
        aria-pressed={isFavorite}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(id);
        }}
        className={cn(
          // Slightly smaller on phones, where it shares a ~111px card with the
          // artwork instead of a 200px+ one.
          "flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur transition sm:h-8 sm:w-8",
          isFavorite
            ? "border-pink-400/70 bg-pink-400/15 text-pink-300 shadow-[0_0_12px_-2px_rgba(244,114,182,0.7)]"
            : "border-slate-600/80 bg-black/50 text-slate-300 hover:border-pink-400/70 hover:text-pink-300 hover:shadow-[0_0_12px_-2px_rgba(244,114,182,0.7)]",
        )}
      >
        <Heart size={15} fill={isFavorite ? "currentColor" : "none"} />
      </button>
      {/* Tooltip a la izquierda, visible mientras el cursor está encima. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-full mr-2 -translate-y-1/2 rounded border border-pink-400/40 bg-hud-1/95 px-2 py-1 font-mono text-[11px] whitespace-nowrap text-pink-200 opacity-0 shadow-[0_0_10px_-2px_rgba(244,114,182,0.5)] backdrop-blur transition-opacity duration-150 group-hover/fav:opacity-100"
      >
        {tooltip}
      </span>
    </span>
  );
}
