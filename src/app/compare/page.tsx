import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, GitCompareArrows } from "lucide-react";
import { PokemonComparator } from "@/components/compare/PokemonComparator";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { ogDefaults } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const dict = getDict(lang);
  return {
    title: dict.compare.metaTitle,
    description: dict.compare.metaDescription,
    alternates: { canonical: "/compare" },
    openGraph: {
      ...ogDefaults(lang),
      title: dict.compare.metaTitle,
      description: dict.compare.metaDescription,
      url: "/compare",
      // Declaring `openGraph` here drops the root card, so point back at it —
      // this route has no `opengraph-image` of its own.
      images: "/opengraph-image",
    },
  };
}

/**
 * Comparador de Pokémon: la selección vive en la URL (?a=&b=) y las fichas se
 * piden al vuelo desde el cliente, así que la página solo aporta la cabecera
 * y el idioma resuelto en el servidor.
 */
export default async function ComparePage() {
  const t = getDict(await getLang()).compare;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:py-8"
    >
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md border border-slate-700/70 bg-black/30 px-3 py-2 font-mono text-xs tracking-wider text-slate-300 uppercase transition hover:border-sky-400/60 hover:text-sky-300"
        >
          <ArrowLeft size={15} />
          {t.back}
        </Link>
        <h1 className="flex items-center gap-2.5 font-display text-xl font-extrabold tracking-wide sm:text-3xl">
          <GitCompareArrows
            size={26}
            aria-hidden
            className="text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.7)]"
          />
          <span className="legend-text">{t.title}</span>
        </h1>
        <p className="hidden font-mono text-sm tracking-widest text-sky-300/70 uppercase lg:block">
          {t.tagline}
        </p>
      </div>

      {/* useSearchParams (via nuqs) requires a Suspense boundary to prerender. */}
      <Suspense>
        <PokemonComparator />
      </Suspense>
    </main>
  );
}
