import type { Metadata } from "next";
import { Suspense } from "react";
import { AlbumScreen } from "@/components/tcg/AlbumScreen";
import { getPokemonIndex } from "@/lib/index/build-index";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { ogDefaults } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const dict = getDict(lang);
  return {
    title: dict.tcg.metaTitle,
    description: dict.tcg.metaDescription,
    alternates: { canonical: "/album" },
    openGraph: {
      ...ogDefaults(lang),
      title: dict.tcg.metaTitle,
      description: dict.tcg.metaDescription,
      url: "/album",
      // Declaring `openGraph` here drops the root card, so point back at it —
      // this route has no `opengraph-image` of its own.
      images: "/opengraph-image",
    },
  };
}

/**
 * Álbum del JCC. El índice se sirve desde el servidor porque el álbum necesita
 * el nombre, los tipos y la generación de cada especie para sus filtros — lo
 * mismo que ya hace la portada con la rejilla de la Pokédex.
 *
 * El catálogo de cartas no viaja por aquí: es un JSON estático que importa el
 * propio componente de cliente, así que sólo se descarga en esta ruta y no en
 * todas las páginas por culpa del provider.
 */
export default async function AlbumPage() {
  const index = await getPokemonIndex();
  return (
    <main id="main-content" tabIndex={-1} className="w-full">
      {/* Los filtros viven en la URL (nuqs), y useSearchParams necesita una
          frontera de Suspense para poder prerenderizar. */}
      <Suspense>
        <AlbumScreen index={index} />
      </Suspense>
    </main>
  );
}
