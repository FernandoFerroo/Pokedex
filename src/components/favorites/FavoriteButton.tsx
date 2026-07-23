"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { formatName } from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";

/**
 * Heart toggle rendered over each Pokédex card, right above the add-to-team
 * button. Shows an explicit "Añadir a favoritos" tooltip to the left while
 * hovered. Lives inside the card's <Link>, so it must swallow the click
 * before the navigation fires.
 */
export function FavoriteButton({ id, name }: { id: number; name: string }) {
  const { has, toggle } = useFavorites();
  const isFavorite = has(id);
  const tooltip = isFavorite ? "Quitar de favoritos" : "Añadir a favoritos";

  return (
    <span className="group/fav relative flex">
      <button
        type="button"
        aria-label={`${tooltip}: ${formatName(name)}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(id);
        }}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur transition",
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
        className="pointer-events-none absolute top-1/2 right-full mr-2 -translate-y-1/2 rounded border border-pink-400/40 bg-[#0a101d]/95 px-2 py-1 font-mono text-[11px] whitespace-nowrap text-pink-200 opacity-0 shadow-[0_0_10px_-2px_rgba(244,114,182,0.5)] backdrop-blur transition-opacity duration-150 group-hover/fav:opacity-100"
      >
        {tooltip}
      </span>
    </span>
  );
}
