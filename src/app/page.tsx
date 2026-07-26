import { Suspense } from "react";
import {
  DailyBanner,
  DailyBannerSkeleton,
} from "@/components/pokemon/DailyBanner";
import { BattleCta } from "@/components/battle/BattleCta";
import { ComparatorCta } from "@/components/compare/ComparatorCta";
import { PokedexView } from "@/components/pokemon/PokedexView";
import { TeamCta } from "@/components/team/TeamCta";
import { TournamentCta } from "@/components/tournament/TournamentCta";
import { TrainerChat } from "@/components/trainer/TrainerChat";
import { getLang } from "@/lib/i18n/server";
import { getPokemonIndex } from "@/lib/index/build-index";

/**
 * Rendered per request: the root layout reads the lang/theme cookies, which
 * opts every route into dynamic rendering. The underlying PokéAPI fetches
 * stay cached for a day, so the "Pokémon del día" banner still flips right
 * after midnight without hammering the API.
 */

export default async function HomePage() {
  const lang = await getLang();
  const index = await getPokemonIndex();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto w-full max-w-7xl flex-1 px-4 py-2 sm:py-6"
    >
      <Suspense fallback={<DailyBannerSkeleton lang={lang} />}>
        <DailyBanner />
      </Suspense>
      {/* Los cuatro niveles exclusivos, a todo lo ancho encima de los filtros:
          Comparador IA (azul), creador de equipos (jade), Modo Combate (rojo)
          y Modo Torneo (oro), que corona la escalera. En móvil se pliegan a un
          2x2 de fichas compactas para que los filtros y las primeras filas del
          listado entren en la misma pantalla que en escritorio. */}
      <div className="mt-2 mb-2 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-col sm:gap-4">
        <ComparatorCta />
        <TeamCta />
        <BattleCta />
        <TournamentCta />
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
