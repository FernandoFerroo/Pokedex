import { Suspense } from "react";
import {
  DailyBanner,
  DailyBannerSkeleton,
} from "@/components/pokemon/DailyBanner";
import { BattleCta } from "@/components/battle/BattleCta";
import { ComparatorCta } from "@/components/compare/ComparatorCta";
import { PokedexView } from "@/components/pokemon/PokedexView";
import { TeamCta } from "@/components/team/TeamCta";
import { AlbumCta } from "@/components/tcg/AlbumCta";
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
      {/* Los cinco niveles exclusivos, a todo lo ancho encima de los filtros:
          Comparador IA (azul), creador de equipos (jade), Modo Combate (rojo),
          Modo Torneo (oro), que corona la escalera, y el Álbum JCC (violeta),
          que es lo que la copa paga.

          Van apilados en barras horizontales TAMBIÉN en el móvil, que es la
          composición de escritorio: cada modo ocupa su propia franja con su
          icono, su nombre y su botón. Se probó plegarlos a un 2x2 de fichas
          para ganar alto, pero eso los convierte en pastillas sin jerarquía —
          y la jerarquía (comparar → equipo → combate → torneo → colección) es
          justo lo que cuenta el bloque. */}
      <div className="mt-2 mb-2 flex flex-col gap-1.5 sm:mt-6 sm:gap-4">
        <ComparatorCta />
        <TeamCta />
        <BattleCta />
        <TournamentCta />
        <AlbumCta />
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
