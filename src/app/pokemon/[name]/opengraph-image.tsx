import { ImageResponse } from "next/og";
import { DEFAULT_LANG } from "@/lib/i18n/config";
import { ogFonts } from "@/lib/og-fonts";
import { pokeFetch } from "@/lib/pokeapi/client";
import type { PokemonResponse, PokemonSpeciesResponse } from "@/lib/pokeapi/types";
import {
  artworkUrl,
  formatDexNumber,
  formatName,
  typeAura,
  typeLabel,
} from "@/lib/pokemon-meta";
import { SITE_NAME } from "@/lib/site";

/**
 * Per-Pokémon social card: artwork, dex number and types over the aura of the
 * primary type, so a shared sheet looks like the sheet itself. Overrides the
 * site-wide card in `app/opengraph-image.tsx` for this route.
 *
 * Rendered by satori: flexbox only, and every element with more than one child
 * needs `display: flex`.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#050a14";

/** Only exists to give `og:image:alt` the Pokémon's name (no extra fetch). */
export function generateImageMetadata({
  params,
}: {
  params: { name: string };
}) {
  const displayName = formatName(decodeURIComponent(params.name));
  return [
    {
      id: "card",
      alt: `${displayName} · ${SITE_NAME}`,
      size,
      contentType,
    },
  ];
}

/**
 * Same species → default variety hop the page does, so forms like Deoxys or
 * Wormadam resolve to a real artwork. Both fetches are the ones the sheet
 * already makes, and they stay cached for a day.
 */
async function getData(name: string) {
  const species = await pokeFetch<PokemonSpeciesResponse>(
    `/pokemon-species/${name}`,
  );
  const variety =
    species.varieties.find((v) => v.is_default) ?? species.varieties[0];
  const pokemon = await pokeFetch<PokemonResponse>(
    `/pokemon/${variety.pokemon.name}`,
  );
  const types = pokemon.types.map(({ type }) => type.name);
  return {
    displayName: formatName(species.name),
    dex: formatDexNumber(species.id),
    types,
    artwork:
      pokemon.sprites.other?.["official-artwork"]?.front_default ??
      artworkUrl(pokemon.id),
  };
}

/**
 * Satori resolves `<img src>` itself and throws when the sprite host answers
 * anything but an image — which would turn a flaky GitHub into a 500 and leave
 * the crawler with no card at all. Fetching it here instead means a failure
 * degrades to the artwork-less card. Cached for a day like the rest of the
 * PokéAPI data, so this costs one request per Pokémon per day.
 */
async function loadArtwork(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Keeps the name inside its 600px column, whatever its length. Tuned for
 * Orbitron, whose glyphs run ~0.72em wide — far wider than a text face, so the
 * steps are tighter than they look like they need to be.
 */
function nameSize(name: string): number {
  if (name.length > 11) return 56;
  if (name.length > 9) return 68;
  if (name.length > 7) return 80;
  return 96;
}

export default async function Image({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const slug = decodeURIComponent(name).toLowerCase();

  // A missing or renamed species must not break the card: fall back to a
  // typeless one with the slug prettified.
  const data = await getData(slug).catch(() => ({
    displayName: formatName(slug),
    dex: "",
    types: [] as string[],
    artwork: null,
  }));
  const aura = typeAura(data.types[0]);
  const artwork = data.artwork ? await loadArtwork(data.artwork) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 76px",
          backgroundColor: INK,
          backgroundImage: `radial-gradient(760px 620px at 78% 50%, ${aura}55, transparent 70%), radial-gradient(640px 480px at 4% 4%, rgba(56,189,248,0.16), transparent 70%)`,
          color: "#f8fafc",
          position: "relative",
          fontFamily: "Geist",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            backgroundImage: `linear-gradient(90deg, ${aura}, transparent)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            border: `2px solid ${aura}45`,
            borderRadius: 24,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", width: 600 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Orbitron",
              fontSize: 28,
              letterSpacing: 8,
              color: aura,
            }}
          >
            {data.dex}
          </div>
          <div
            style={{
              // Satori never breaks a single word, so long names (Crabominable)
              // step down instead of running under the artwork.
              fontFamily: "Orbitron",
              fontSize: nameSize(data.displayName),
              letterSpacing: -1,
              lineHeight: 1.15,
              marginTop: 14,
            }}
          >
            {data.displayName}
          </div>

          <div style={{ display: "flex", marginTop: 30 }}>
            {data.types.map((type) => (
              <div
                key={type}
                style={{
                  display: "flex",
                  marginRight: 16,
                  padding: "10px 24px",
                  borderRadius: 999,
                  fontFamily: "Orbitron",
                  fontSize: 24,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: typeAura(type),
                  border: `2px solid ${typeAura(type)}80`,
                  backgroundColor: `${typeAura(type)}1f`,
                }}
              >
                {typeLabel(type, DEFAULT_LANG)}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 44,
              fontFamily: "Orbitron",
              fontSize: 22,
              letterSpacing: 6,
              color: "#94a3b8",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: aura,
                marginRight: 16,
              }}
            />
            {SITE_NAME.toUpperCase()}
          </div>
        </div>

        {artwork && (
          // next/image doesn't exist inside satori: a plain <img>, already
          // inlined as a data URI by `loadArtwork`.
          <img
            src={artwork}
            alt=""
            width={440}
            height={440}
            style={{ objectFit: "contain" }}
          />
        )}
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
