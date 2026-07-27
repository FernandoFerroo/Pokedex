/**
 * La colección entre visitas.
 *
 * Mismo trato que el registro del torneo (`lib/tournament/run`): se comprueba
 * que hay ventana antes de leer, todo va en try/catch, lo leído se valida
 * campo a campo y un fallo al escribir se traga en silencio — quedarse sin
 * cuota no puede tumbar la partida en curso.
 *
 * A propósito NO importa el catálogo: así `pool.json` no entra en el paquete
 * de todas las páginas por culpa del provider, sólo en el del álbum.
 */
import {
  PACK_TYPES,
  PE_LEDGER_MAX,
  TCG_SCHEMA,
  type PackInventory,
  type PackType,
  type PeEntry,
  type PeReason,
  type TcgCollection,
  type TcgStats,
} from "@/types/tcg";
import { EMPTY_MASK, normalizeMask } from "./encode";
import { MILESTONE_PCTS } from "./milestones";

export const TCG_COLLECTION_KEY = "pokedex-tcg-collection-v1";

const PE_REASONS: readonly PeReason[] = [
  "round",
  "title",
  "flawless",
  "consolation",
  "duplicate",
  "purchase",
];

/**
 * Fábrica, no constante: la colección lleva objetos anidados, y compartir uno
 * entre dos llamadas haría que una mutación contaminase a la otra.
 */
export function emptyCollection(): TcgCollection {
  return {
    v: TCG_SCHEMA,
    owned: EMPTY_MASK,
    speciesOwned: 0,
    cardsOwned: 0,
    pe: 0,
    packs: {},
    milestones: [],
    stats: { packsOpened: 0, cardsPulled: 0, peEarned: 0, peSpent: 0 },
    ledger: [],
  };
}

function count(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function normalizePacks(value: unknown): PackInventory {
  const out: PackInventory = {};
  if (!value || typeof value !== "object") return out;
  const raw = value as Record<string, unknown>;
  for (const type of PACK_TYPES) {
    const n = count(raw[type]);
    if (n > 0) out[type] = n;
  }
  return out;
}

/**
 * Los hitos cobrados. Se filtran contra la escalera vigente: un porcentaje que
 * ya no existe es un pago sin hito, y dejarlo pasar sólo sirve para que un
 * guardado viejo bloquee un escalón que hoy se llama de otra forma.
 */
function normalizeMilestones(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return MILESTONE_PCTS.filter((pct) => value.includes(pct));
}

function normalizeStats(value: unknown): TcgStats {
  const raw = (value ?? {}) as Record<string, unknown>;
  return {
    packsOpened: count(raw.packsOpened),
    cardsPulled: count(raw.cardsPulled),
    peEarned: count(raw.peEarned),
    peSpent: count(raw.peSpent),
  };
}

function normalizeLedger(value: unknown): PeEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is PeEntry => {
      const e = entry as PeEntry;
      return (
        typeof e === "object" &&
        e !== null &&
        Number.isFinite(e.amount) &&
        Number.isFinite(e.at) &&
        PE_REASONS.includes(e.reason)
      );
    })
    .slice(0, PE_LEDGER_MAX);
}

export function loadCollection(): TcgCollection {
  if (typeof window === "undefined") return emptyCollection();
  try {
    const saved = localStorage.getItem(TCG_COLLECTION_KEY);
    if (!saved) return emptyCollection();
    const parsed = JSON.parse(saved) as Partial<TcgCollection>;
    return {
      v: TCG_SCHEMA,
      owned: normalizeMask(parsed.owned),
      speciesOwned: count(parsed.speciesOwned),
      cardsOwned: count(parsed.cardsOwned),
      pe: count(parsed.pe),
      packs: normalizePacks(parsed.packs),
      milestones: normalizeMilestones(parsed.milestones),
      stats: normalizeStats(parsed.stats),
      ledger: normalizeLedger(parsed.ledger),
    };
  } catch {
    return emptyCollection();
  }
}

export function saveCollection(collection: TcgCollection) {
  try {
    localStorage.setItem(TCG_COLLECTION_KEY, JSON.stringify(collection));
  } catch {
    // Sin cuota o sin almacenamiento: la colección funciona esta sesión y no
    // se recuerda la próxima. Peor sería no dejar abrir el sobre.
  }
}

export function clearCollection() {
  try {
    localStorage.removeItem(TCG_COLLECTION_KEY);
  } catch {
    // Nada que hacer: al leer se valida de todas formas.
  }
}

/** Añade una entrada al historial, recortándolo por el final. */
export function pushLedger(
  ledger: PeEntry[],
  amount: number,
  reason: PeReason,
): PeEntry[] {
  if (amount === 0) return ledger;
  return [{ amount, reason, at: Date.now() }, ...ledger].slice(0, PE_LEDGER_MAX);
}

/** Suma sobres a un inventario sin mutarlo. */
export function addPacks(
  inventory: PackInventory,
  grant: PackInventory,
): PackInventory {
  const out: PackInventory = { ...inventory };
  for (const [type, amount] of Object.entries(grant) as Array<[PackType, number]>) {
    if (amount > 0) out[type] = (out[type] ?? 0) + amount;
  }
  return out;
}

/** Sobres sin abrir, de todos los tipos. */
export function totalPacks(inventory: PackInventory): number {
  return Object.values(inventory).reduce((sum, n) => sum + (n ?? 0), 0);
}
