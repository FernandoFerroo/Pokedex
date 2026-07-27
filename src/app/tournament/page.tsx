import type { Metadata } from "next";
import { TournamentScreen } from "@/components/tournament/TournamentScreen";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { ogDefaults } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const dict = getDict(lang);
  return {
    title: dict.tournament.metaTitle,
    description: dict.tournament.metaDescription,
    alternates: { canonical: "/tournament" },
    openGraph: {
      ...ogDefaults(lang),
      title: dict.tournament.metaTitle,
      description: dict.tournament.metaDescription,
      url: "/tournament",
      // Declaring `openGraph` here drops the root card, so point back at it —
      // this route has no `opengraph-image` of its own.
      images: "/opengraph-image",
    },
  };
}

/**
 * Modo Torneo. Igual que la arena de combate, todo el estado vive en el
 * cliente (equipo de localStorage + motor local); el servidor solo sortea el
 * cuadro y hidrata los equipos de cada ronda.
 */
export default function TournamentPage() {
  return (
    <main id="main-content" tabIndex={-1} className="w-full">
      <TournamentScreen />
    </main>
  );
}
