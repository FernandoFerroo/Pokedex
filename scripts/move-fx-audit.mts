/**
 * Auditoría de cobertura de las animaciones de combate.
 *
 *   node --import ./scripts/lib/alias-hook.mjs scripts/move-fx-audit.mts
 *   node --import ./scripts/lib/alias-hook.mjs scripts/move-fx-audit.mts --list swirl
 *   node --import ./scripts/lib/alias-hook.mjs scripts/move-fx-audit.mts --write
 *
 * Por qué existe: el catálogo de `move-fx.ts` se cura a mano, movimiento a
 * movimiento, y a mano se cometen exactamente tres fallos — escribir un
 * identificador que no existe, dejarse un movimiento sin curar y meter el
 * mismo en dos coreografías. Los tres se ven aquí en un segundo:
 *
 *   · FANTASMA  — está en el catálogo pero PokéAPI no lo conoce
 *   · SIN CURAR — PokéAPI lo trae y el catálogo no lo nombra (cae en la red
 *                 de familias por nombre, que puede acertar o no)
 *
 * Los duplicados los caza el propio módulo al cargarse, así que si este
 * script arranca es que no hay ninguno.
 *
 * `--write` deja la tabla completa en `scripts/move-fx.coverage.txt`, que es
 * la foto revisable de los 937 movimientos con su animación.
 */
import { writeFileSync } from "node:fs";
import {
  catalogueSizes,
  choreographyFor,
  isCurated,
  signatureCount,
  signatureFor,
  type Choreography,
} from "@/lib/battle/move-fx";

const API = "https://pokeapi.co/api/v2";

interface Move {
  slug: string;
  type: string;
  damageClass: string;
  target: string;
  es: string | null;
}

/** Lo que este script necesita de `/move/{name}`, y nada más. */
interface MoveResponse {
  name: string;
  type: { name: string } | null;
  damage_class: { name: string } | null;
  target: { name: string } | null;
  names: { name: string; language: { name: string } }[];
}

interface MoveIndex {
  results: { name: string; url: string }[];
}

async function get<T>(url: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url);
    if (res.ok) return (await res.json()) as T;
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  throw new Error(`no se pudo leer ${url}`);
}

/** Todos los movimientos de PokéAPI, con lo justo para elegir animación. */
async function fetchMoves(): Promise<Move[]> {
  const index = await get<MoveIndex>(`${API}/move?limit=2000`);
  const queue = [...index.results];
  const out: Move[] = [];
  await Promise.all(
    Array.from({ length: 16 }, async () => {
      while (queue.length) {
        const entry = queue.shift()!;
        const m = await get<MoveResponse>(entry.url);
        out.push({
          slug: m.name,
          type: m.type?.name ?? "normal",
          damageClass: m.damage_class?.name ?? "status",
          target: m.target?.name ?? "selected-pokemon",
          es: m.names?.find((n) => n.language.name === "es")?.name ?? null,
        });
      }
    }),
  );
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Un movimiento de estado dirigido a uno mismo, igual que en la arena. */
const isSelfTarget = (target: string) =>
  target === "user" || target === "users-field" || target === "user-and-allies";

const moves = await fetchMoves();
const real = new Set(moves.map((m) => m.slug));

const assigned = new Map<string, Choreography>();
for (const m of moves) {
  assigned.set(
    m.slug,
    choreographyFor(m.slug, m.type, m.damageClass, isSelfTarget(m.target)),
  );
}

const listArg = process.argv.indexOf("--list");
if (listArg !== -1) {
  const want = process.argv[listArg + 1];
  for (const m of moves) {
    if (assigned.get(m.slug) === want) console.log(`${m.slug}\t${m.es ?? ""}`);
  }
  process.exit(0);
}

/* — Fantasmas: en el catálogo pero inexistentes en PokéAPI —————— */
const sizes = catalogueSizes();
const ghosts: string[] = [];
// El catálogo no se exporta entero a propósito; se reconstruye preguntándole
// al resolutor por cada identificador real y comparando el total curado.
let curatedReal = 0;
for (const slug of real) if (isCurated(slug)) curatedReal++;
const curatedTotal = Object.values(sizes).reduce((a, b) => a + b, 0);

/* — Sin curar: PokéAPI los trae y el catálogo no los nombra ————— */
const uncurated = moves.filter((m) => !isCurated(m.slug));

console.log(`Movimientos en PokéAPI: ${moves.length}`);
console.log(`Curados a mano:         ${curatedReal}`);
console.log(`Entradas del catálogo:  ${curatedTotal}`);
if (curatedTotal !== curatedReal) {
  console.log(
    `\n⚠ ${curatedTotal - curatedReal} entradas del catálogo NO existen en PokéAPI (fantasmas).`,
  );
  console.log(`  Ejecuta con --ghosts para verlas.`);
}
console.log(`Sin curar:              ${uncurated.length}`);

if (process.argv.includes("--ghosts")) {
  // Fuerza bruta: no hay export del catálogo, así que se listan comparando
  // contra el módulo compilado leído como texto.
  const source = await import("node:fs").then((fs) =>
    fs.readFileSync(new URL("../src/lib/battle/move-fx.ts", import.meta.url), "utf8"),
  );
  const body = source.slice(
    source.indexOf("const CATALOGUE"),
    source.indexOf("const BY_SLUG"),
  );
  for (const match of body.matchAll(/"([a-z0-9-]+)"/g)) {
    if (!real.has(match[1])) ghosts.push(match[1]);
  }
  console.log(`\nFANTASMAS (${ghosts.length}):`);
  for (const g of ghosts) console.log(`  ${g}`);
}

if (uncurated.length && !process.argv.includes("--quiet")) {
  console.log(`\nSIN CURAR — resueltos por familia de nombre o por tipo:`);
  for (const m of uncurated) {
    console.log(
      `  ${m.slug.padEnd(34)} ${String(assigned.get(m.slug)).padEnd(9)} ${m.type}/${m.damageClass}  ${m.es ?? ""}`,
    );
  }
}

/* — Reparto final ————————————————————————————————————— */
const tally = new Map<Choreography, number>();
for (const fx of assigned.values()) tally.set(fx, (tally.get(fx) ?? 0) + 1);
console.log(`\nReparto por coreografía:`);
for (const [fx, n] of [...tally].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${fx.padEnd(10)} ${String(n).padStart(4)}`);
}

if (process.argv.includes("--write")) {
  const lines = moves.map(
    (m) =>
      `${m.slug.padEnd(36)}${String(assigned.get(m.slug)).padEnd(10)}${isCurated(m.slug) ? "  " : "· "}${m.type}/${m.damageClass}`,
  );
  const path = new URL("./move-fx.coverage.txt", import.meta.url);
  writeFileSync(
    path,
    [
      `# Animación de cada movimiento de PokéAPI (${moves.length}).`,
      `# Generado por scripts/move-fx-audit.mts --write. No se edita a mano:`,
      `# lo que se edita es el catálogo de src/lib/battle/move-fx.ts.`,
      `# Un "·" marca los que resuelve la red de familias en vez del catálogo.`,
      ``,
      ...lines,
      ``,
    ].join("\n"),
  );
  console.log(`\nEscrito ${path.pathname}`);
}

/* — Coherencia de objetivo ————————————————————————————
 *
 * Cada coreografía se dibuja sobre alguien fijo: unas sobre quien la lanza y
 * otras sobre el rival. Un movimiento que en las reglas se aplica a UNO MISMO
 * y que tuviera asignada una coreografía de las que pintan enfrente saldría
 * al revés que en los juegos — Barrera Ácida echando gas sobre el rival. */
const ON_FOE = new Set([
  "debuff", "venom", "hex", "psylift", "trap", "powder", "spire", "meteor",
  "hazard", "bolt", "swirl", "quake",
]);
const selfMoves = moves.filter((m) => isSelfTarget(m.target));
const misaimed = selfMoves.filter((m) => ON_FOE.has(assigned.get(m.slug)!));
console.log(`\nMovimientos sobre uno mismo: ${selfMoves.length}`);
if (misaimed.length) {
  console.log(`⚠ ${misaimed.length} apuntan al rival y no deberían:`);
  for (const m of misaimed) {
    console.log(`  ${m.slug.padEnd(30)} ${assigned.get(m.slug)}  ${m.es ?? ""}`);
  }
} else {
  console.log(`Todos se dibujan sobre quien los lanza. ✓`);
}

/* — Firmas propias ————————————————————————————————————
 *
 * La coreografía dice de qué familia es el movimiento; la firma es lo que
 * hace que dos de la misma familia no salgan calcados. No todos la
 * necesitan —el peso sale solo de la potencia—, así que esto no busca llegar
 * a 937: busca que los que SÍ se ven distintos en los juegos la tengan. */
const sig = signatureCount();
const withSig = moves.filter((m) => {
  const s = signatureFor(m.slug);
  return s.hits !== undefined || s.tint || s.tempo || s.power !== undefined;
});
console.log(`\nFirmas propias:         ${withSig.length} movimientos`);
console.log(`  color propio          ${sig.tinted}`);
console.log(`  ritmo propio          ${sig.timed}`);
console.log(`  multigolpe            ${sig.multi}`);
