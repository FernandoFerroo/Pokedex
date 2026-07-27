/**
 * El gancho de resolución que registra `alias-hook.mjs`. Corre en el hilo de
 * carga de módulos, así que vive en su propio archivo.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Raíz de `src/`, que llega desde el hilo principal. */
let SRC = "";

export function initialize(data) {
  SRC = data.src;
}

/** Extensiones que probar cuando el import viene pelado, en orden. */
const CANDIDATES = [".ts", ".tsx", ".mts", ".js", "/index.ts", "/index.tsx"];

/** La primera variante del especificador que existe en disco, o null. */
function probe(url) {
  for (const ext of CANDIDATES) {
    const candidate = url + ext;
    if (existsSync(fileURLToPath(candidate))) return candidate;
  }
  return null;
}

export function resolve(specifier, context, next) {
  // Alias del proyecto.
  let target = specifier.startsWith("@/") ? SRC + specifier.slice(2) : specifier;

  // Relativos e internos sin extensión: se completan mirando el disco.
  const bare = /\.[cm]?[jt]sx?$/.test(target) === false;
  if (bare && (target.startsWith(".") || target.startsWith("file:"))) {
    const absolute = target.startsWith("file:")
      ? target
      : new URL(target, context.parentURL).href;
    const found = probe(absolute);
    if (found) return next(found, context);
  }

  return next(target, context);
}
