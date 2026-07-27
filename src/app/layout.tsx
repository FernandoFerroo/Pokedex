import type { Metadata } from "next";
import { Chakra_Petch, Exo_2, Orbitron, Press_Start_2P } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SfxProvider } from "@/components/audio/SfxProvider";
import { SoundtrackPlayer } from "@/components/audio/SoundtrackPlayer";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { IntroSplash } from "@/components/layout/IntroSplash";
import { TeamDrawer } from "@/components/team/TeamDrawer";
import { TeamProvider } from "@/components/team/TeamProvider";
import { I18nProvider } from "@/lib/i18n/client";
import { getDict } from "@/lib/i18n";
import { getLang, getTheme } from "@/lib/i18n/server";
import { ogDefaults, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * Primary UI typeface: geometric and tech-flavored but highly legible —
 * reads like the Pokédex's own operating system. Variable font, so every
 * weight utility resolves without extra downloads.
 */
const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
});

/**
 * HUD readout typeface (fills the `font-mono` slot): squared, techno and far
 * more characterful than a plain code font. Carries the banner copy, filters,
 * chips, labels and data readouts.
 */
const chakraPetch = Chakra_Petch({
  variable: "--font-chakra",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

/** Retro arcade display font, reserved for HUD chrome (headings, labels). */
const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

/** Sleek sci-fi display font for the brand title and big headings. */
const orbitron = Orbitron({
  variable: "--font-orbitron",
  weight: ["600", "800"],
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const dict = getDict(lang);
  const title = {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  };
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: dict.layout.metaDescription,
    applicationName: SITE_NAME,
    alternates: { canonical: "/" },
    // Social cards. `og:image` comes from the file-based `opengraph-image.tsx`
    // in this folder, which every route inherits unless it ships its own.
    openGraph: {
      ...ogDefaults(lang),
      title,
      description: dict.layout.metaDescription,
      url: "/",
    },
    // Only the card style is set: Next fills twitter:title/description/image
    // from the Open Graph block above (and from each route's own override).
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [lang, theme] = await Promise.all([getLang(), getTheme()]);
  const a11y = getDict(lang).a11y;

  return (
    <html
      lang={lang}
      // Theme and language come from cookies so SSR always matches the choice.
      // The header toggles mutate the attribute/cookie on the client, hence
      // suppressHydrationWarning.
      data-theme={theme}
      suppressHydrationWarning
      className={`${exo2.variable} ${chakraPetch.variable} ${pressStart.variable} ${orbitron.variable} h-full antialiased`}
    >
      {/* font-medium base: Exo 2 gains presence on the dark backdrop. */}
      <body className="flex min-h-full flex-col font-sans font-medium text-slate-100">
        {/*
          Primer tabulable del documento: deja saltar la cabecera (marca,
          LEDs, equipo, tema, idioma) e ir directo al contenido — WCAG 2.4.1.
          Sólo aparece cuando recibe foco de teclado.
        */}
        <a href="#main-content" className="skip-link">
          {a11y.skipToContent}
        </a>
        {/* Mini intro con la Poké Ball, una vez por sesión. */}
        <IntroSplash lang={lang} />
        <NuqsAdapter>
          <I18nProvider lang={lang}>
            <TeamProvider>
              <FavoritesProvider>
                {/* Efectos de sonido (Web Audio): el combate los dispara y la
                    barra de la arena ajusta su volumen. */}
                <SfxProvider>
                  <Header lang={lang} theme={theme} />
                  {children}
                  <Footer lang={lang} />
                  {/* Cajón del equipo: fijo al borde inferior en todas las páginas. */}
                  <TeamDrawer />
                  {/* Soundtrack en bucle (embed de YouTube), sobre el cajón. */}
                  <SoundtrackPlayer />
                </SfxProvider>
              </FavoritesProvider>
            </TeamProvider>
          </I18nProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
