import type { Metadata } from "next";
import { BattleScreen } from "@/components/battle/BattleScreen";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { ogDefaults } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const dict = getDict(lang);
  return {
    title: dict.battle.metaTitle,
    description: dict.battle.metaDescription,
    alternates: { canonical: "/battle" },
    openGraph: {
      ...ogDefaults(lang),
      title: dict.battle.metaTitle,
      description: dict.battle.metaDescription,
      url: "/battle",
      // Declaring `openGraph` here drops the root card, so point back at it —
      // this route has no `opengraph-image` of its own.
      images: "/opengraph-image",
    },
  };
}

/**
 * Arena del Modo Combate. Todo el estado vive en el cliente (equipo desde
 * localStorage + motor de combate); el servidor solo aporta las rutas de IA.
 */
export default function BattlePage() {
  return (
    <main id="main-content" tabIndex={-1} className="w-full">
      <BattleScreen />
    </main>
  );
}
