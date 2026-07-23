import { Suspense } from "react";
import {
  DailyBanner,
  DailyBannerSkeleton,
} from "@/components/pokemon/DailyBanner";
import { PokedexView } from "@/components/pokemon/PokedexView";
import { getPokemonIndex } from "@/lib/index/build-index";

/**
 * ISR hourly: the underlying PokéAPI fetches stay cached for a day, but the
 * page itself re-renders often enough that the "Pokémon del día" banner flips
 * at most one hour after midnight.
 */
export const revalidate = 3600;

export default async function HomePage() {
  const index = await getPokemonIndex();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <Suspense fallback={<DailyBannerSkeleton />}>
        <DailyBanner />
      </Suspense>
      {/* useSearchParams (via nuqs) requires a Suspense boundary to prerender. */}
      <Suspense>
        <PokedexView index={index} />
      </Suspense>
    </main>
  );
}
