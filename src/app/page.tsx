import { Suspense } from "react";
import {
  DailyBanner,
  DailyBannerSkeleton,
} from "@/components/pokemon/DailyBanner";
import { BattleCta } from "@/components/battle/BattleCta";
import { PokedexView } from "@/components/pokemon/PokedexView";
import { TeamCta } from "@/components/team/TeamCta";
import { TrainerChat } from "@/components/trainer/TrainerChat";
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
      {/* Banner del creador de equipos y, debajo, el del Modo Combate: ambos
          a todo lo ancho encima de los filtros. */}
      <div className="mt-6 mb-2 flex flex-col gap-4">
        <TeamCta />
        <BattleCta />
      </div>
      {/* useSearchParams (via nuqs) requires a Suspense boundary to prerender. */}
      <Suspense>
        <PokedexView index={index} />
      </Suspense>
      {/* Chat con el Profesor Oak: panel fijo al borde derecho, no ocupa hueco en el flujo. */}
      <Suspense>
        <TrainerChat />
      </Suspense>
    </main>
  );
}
