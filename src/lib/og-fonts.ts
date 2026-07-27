import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Typefaces for the generated social cards, mirroring the split the site uses:
 * Orbitron for display type (wordmark, names, HUD labels) and a neutral face
 * for running text.
 *
 * They live in `public/` rather than next to the routes because that is the one
 * directory the standalone Docker image copies verbatim — a `readFile` against
 * a source folder would resolve in dev and Vercel but not in the container.
 * Geist is the font `next/og` bundles by default; we vendor a copy so passing a
 * `fonts` array (which replaces satori's default) doesn't lose it.
 */
const FONT_DIR = join(process.cwd(), "public", "fonts");

async function load() {
  const [orbitron, geist] = await Promise.all([
    readFile(join(FONT_DIR, "Orbitron-ExtraBold.ttf")),
    readFile(join(FONT_DIR, "Geist-Regular.ttf")),
  ]);
  return [
    { name: "Orbitron", data: orbitron, weight: 800 as const, style: "normal" as const },
    { name: "Geist", data: geist, weight: 400 as const, style: "normal" as const },
  ];
}

/** Read once per server instance — every card render shares the buffers. */
let cached: ReturnType<typeof load> | null = null;

export function ogFonts() {
  cached ??= load();
  return cached;
}
