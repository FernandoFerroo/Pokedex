/**
 * The bag the player packs before a fight, persisted between visits. Battle
 * mode and tournament mode share the same pouch, so packing it once is
 * enough.
 */
import { DEFAULT_BAG, normalizeBag, type Bag } from "./items";

const BAG_STORAGE_KEY = "pokedex-bag-v1";

export function loadBag(): Bag {
  if (typeof window === "undefined") return { ...DEFAULT_BAG };
  try {
    const saved = localStorage.getItem(BAG_STORAGE_KEY);
    return saved ? normalizeBag(JSON.parse(saved)) : { ...DEFAULT_BAG };
  } catch {
    return { ...DEFAULT_BAG };
  }
}

export function saveBag(bag: Bag) {
  try {
    localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(bag));
  } catch {
    // Storage unavailable: the bag still works for this battle.
  }
}
