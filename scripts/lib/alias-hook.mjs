/**
 * Enseña a Node a leer los módulos del proyecto tal y como están escritos.
 *
 * Dos cosas que resuelve el bundler de Next y no Node:
 *
 *  1. el alias `@/` → `src/`;
 *  2. los imports SIN extensión (`./type-chart`, `@/lib/battle/engine`), que
 *     en ESM puro no resuelven solos.
 *
 * Con esto, un script suelto puede importar el motor de combate y jugar
 * partidas fuera de Next:
 *
 *   node --import ./scripts/lib/alias-hook.mjs scripts/ai-selfplay.mts
 *
 * Node 22.6+ ejecuta TypeScript quitando los tipos, así que los `.ts` entran
 * tal cual mientras no lleven sintaxis que haya que emitir (enums, decoradores).
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

const src = new URL("../../src/", import.meta.url).href;

register(
  "./alias-resolver.mjs",
  pathToFileURL(new URL("./", import.meta.url).pathname).href,
  { data: { src } },
);
