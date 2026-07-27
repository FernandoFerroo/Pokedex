/**
 * Baja los sprites oficiales de Entrenador y los guarda en `public/trainers/`.
 *
 *   node scripts/fetch-trainers.mjs          # todos
 *   node scripts/fetch-trainers.mjs brock    # sólo uno
 *
 * Vienen de la misma librería de sprites de Pokémon Showdown que ya sirve a
 * los combatientes animados de la arena, así que Entrenadores y Pokémon
 * comparten paleta, resolución y ojo — que es justo lo que fallaba cuando el
 * plantel era de personajes inventados y pintados aparte: la figura estaba
 * bien dibujada, pero no era de este juego.
 *
 * Son 80×80 de pixel art. Se escalan en pantalla con `image-rendering:
 * pixelated`, igual que los sprites de combate: nada de suavizado.
 *
 * La lista de quién se baja vive en `src/lib/trainers/roster.ts`, que es
 * también quien decide en qué ronda aparece cada uno.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "trainers");
const BASE = "https://play.pokemonshowdown.com/sprites/trainers";

/**
 * Los slugs son los de Showdown, no los nuestros: «ltsurge», sin guion. El
 * roster de la app guarda este mismo valor para poder componer la ruta.
 */
const TRAINERS = [
  // El jugador y su eterno rival.
  "red",
  "blue",
  // Los ocho Líderes de Gimnasio de Kanto, en orden de medalla.
  "brock",
  "misty",
  "ltsurge",
  "erika",
  "koga",
  "sabrina",
  "blaine",
  "giovanni",
  // El Campeón.
  "lance",
  // El rival del Modo Combate: el científico de Plasma, que estudia el
  // combate con máquinas. Ver `AI_TRAINER` en el roster.
  "colress",
];

async function fetchOne(slug) {
  const res = await fetch(`${BASE}/${slug}.png`);
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${slug}.png`), bytes);
  console.log(`  ✓ ${slug}.png — ${(bytes.length / 1024).toFixed(1)} kB`);
}

const wanted = process.argv.slice(2);
const list = wanted.length
  ? TRAINERS.filter((slug) => wanted.includes(slug))
  : TRAINERS;
if (list.length === 0) {
  console.error(`Nadie con ese nombre. Hay: ${TRAINERS.join(", ")}.`);
  process.exit(1);
}
for (const slug of list) {
  await fetchOne(slug);
}
