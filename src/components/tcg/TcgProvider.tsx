"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type PackInventory,
  type PackResult,
  type PackType,
  type TcgCollection,
} from "@/types/tcg";
import { withCards } from "@/lib/tcg/encode";
import { unclaimedMilestones } from "@/lib/tcg/milestones";
import type { RunReward } from "@/lib/tcg/rewards";
import {
  addPacks,
  clearCollection,
  emptyCollection,
  loadCollection,
  pushLedger,
  saveCollection,
  totalPacks,
} from "@/lib/tcg/storage";

/**
 * La colección, compartida por las tres pantallas que la tocan: el torneo la
 * paga, el álbum la gasta y la home enseña el progreso.
 *
 * Con un hook por página cada una leería el almacenamiento por su cuenta y
 * cualquier escritura dejaría a las otras desfasadas el resto de la sesión —
 * que es justo lo que este provider existe para evitar.
 *
 * No sabe nada del catálogo de cartas a propósito: cuelga del layout raíz, así
 * que importar `pool.json` aquí lo metería en el paquete de todas las páginas.
 * El álbum es quien lo carga, y quien le pasa el resultado ya sorteado.
 */
interface TcgContextValue {
  collection: TcgCollection;
  /** Cierto una vez leída la colección del almacenamiento, tras montar. */
  hydrated: boolean;
  /** Sobres sin abrir, de todos los tipos. */
  packsWaiting: number;

  /** Botín de una carrera de torneo. Suma PE y sobres de una vez. */
  applyRunReward: (reward: RunReward) => void;
  /** Gasta un sobre. Falso si no quedaba ninguno de ese tipo. */
  spendPack: (type: PackType) => boolean;
  /** Anota lo salido de un sobre ya abierto: cartas, PE de repetidas y conteos. */
  applyPull: (result: PackResult, counts: { species: number; cards: number }) => void;
  /** Compra un sobre. Falso si no está a la venta o faltan PE. */
  buyPack: (type: PackType, price: number) => boolean;
  /** Recuenta especies y cartas a partir del catálogo (sólo lo llama el álbum). */
  syncCounts: (counts: { species: number; cards: number }) => void;
  reset: () => void;
}

const TcgContext = createContext<TcgContextValue | null>(null);

export function TcgProvider({ children }: { children: ReactNode }) {
  // Arranca vacía en servidor y en el primer render de cliente, y se lee del
  // almacenamiento tras montar: este provider se hidrata en todas las páginas,
  // así que un inicializador perezoso descuadraría el HTML del servidor.
  const [collection, setCollection] = useState<TcgCollection>(emptyCollection);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // El único setState post-montaje deliberado, por la razón de arriba.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollection(loadCollection());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCollection(collection);
  }, [collection, hydrated]);

  const applyRunReward = useCallback((reward: RunReward) => {
    setCollection((prev) => {
      let ledger = prev.ledger;
      const { round, title, flawless, consolation } = reward.peByReason;
      ledger = pushLedger(ledger, round, "round");
      ledger = pushLedger(ledger, title, "title");
      ledger = pushLedger(ledger, flawless, "flawless");
      ledger = pushLedger(ledger, consolation, "consolation");
      return {
        ...prev,
        pe: prev.pe + reward.pe,
        packs: addPacks(prev.packs, reward.packs),
        stats: { ...prev.stats, peEarned: prev.stats.peEarned + reward.pe },
        ledger,
      };
    });
  }, []);

  const spendPack = useCallback((type: PackType) => {
    let spent = false;
    setCollection((prev) => {
      const held = prev.packs[type] ?? 0;
      if (held <= 0) return prev;
      spent = true;
      const packs: PackInventory = { ...prev.packs };
      if (held === 1) delete packs[type];
      else packs[type] = held - 1;
      return { ...prev, packs };
    });
    return spent;
  }, []);

  const applyPull = useCallback(
    (result: PackResult, counts: { species: number; cards: number }) => {
      setCollection((prev) => {
        // Los hitos se cobran AQUÍ y no en un efecto que vigile el recuento:
        // abrir un sobre es lo único que hace crecer las especies, y un efecto
        // pagaría dos veces en cuanto React montara el provider dos veces.
        // Se cobran todos los pendientes de golpe, no sólo el recién cruzado,
        // para que un guardado anterior a la escalera acabe cuadrado.
        const earned = unclaimedMilestones(counts.species, prev.milestones);
        let packs = prev.packs;
        for (const milestone of earned) packs = addPacks(packs, milestone.packs);

        return {
          ...prev,
          owned: withCards(
            prev.owned,
            result.cards.map((card) => card.index),
          ),
          speciesOwned: counts.species,
          cardsOwned: counts.cards,
          pe: prev.pe + result.peGained,
          packs,
          milestones: earned.length
            ? [...prev.milestones, ...earned.map((milestone) => milestone.pct)]
            : prev.milestones,
          stats: {
            ...prev.stats,
            packsOpened: prev.stats.packsOpened + 1,
            cardsPulled: prev.stats.cardsPulled + result.cards.length,
            peEarned: prev.stats.peEarned + result.peGained,
          },
          ledger: pushLedger(prev.ledger, result.peGained, "duplicate"),
        };
      });
    },
    [],
  );

  const buyPack = useCallback((type: PackType, price: number) => {
    let bought = false;
    setCollection((prev) => {
      if (price <= 0 || prev.pe < price) return prev;
      bought = true;
      return {
        ...prev,
        pe: prev.pe - price,
        packs: addPacks(prev.packs, { [type]: 1 }),
        stats: { ...prev.stats, peSpent: prev.stats.peSpent + price },
        ledger: pushLedger(prev.ledger, -price, "purchase"),
      };
    });
    return bought;
  }, []);

  const syncCounts = useCallback((counts: { species: number; cards: number }) => {
    setCollection((prev) =>
      prev.speciesOwned === counts.species && prev.cardsOwned === counts.cards
        ? prev
        : { ...prev, speciesOwned: counts.species, cardsOwned: counts.cards },
    );
  }, []);

  const reset = useCallback(() => {
    clearCollection();
    setCollection(emptyCollection());
  }, []);

  const value = useMemo<TcgContextValue>(
    () => ({
      collection,
      hydrated,
      packsWaiting: totalPacks(collection.packs),
      applyRunReward,
      spendPack,
      applyPull,
      buyPack,
      syncCounts,
      reset,
    }),
    [
      collection,
      hydrated,
      applyRunReward,
      spendPack,
      applyPull,
      buyPack,
      syncCounts,
      reset,
    ],
  );

  return <TcgContext.Provider value={value}>{children}</TcgContext.Provider>;
}

export function useTcg(): TcgContextValue {
  const context = useContext(TcgContext);
  if (!context) throw new Error("useTcg must be used within a TcgProvider");
  return context;
}
