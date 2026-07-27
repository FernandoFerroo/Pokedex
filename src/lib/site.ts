/** Canonical site identity, shared by the metadata exports and OG images. */

import { type Lang, ogLocale } from "./i18n/config";

export const SITE_NAME = "Pokédex";

/**
 * Absolute origin used as `metadataBase`: every relative URL in the metadata
 * (canonical links, `og:image`, `og:url`) is resolved against it, and Open
 * Graph requires absolute URLs.
 *
 * `NEXT_PUBLIC_SITE_URL` wins so a custom domain can be pinned; otherwise we
 * take Vercel's production host (preview deploys point their cards at the
 * production origin on purpose — that's also what the canonical link should
 * say) and fall back to localhost for `next dev`.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const SITE_URL = resolveSiteUrl();

/**
 * Shared `openGraph` fields. Next *replaces* the whole `openGraph` object per
 * route segment instead of merging it, so every page that adds its own Open
 * Graph data spreads this in to keep the site name, type and locale.
 */
export function ogDefaults(lang: Lang) {
  return {
    type: "website",
    siteName: SITE_NAME,
    locale: ogLocale(lang),
  } as const;
}
