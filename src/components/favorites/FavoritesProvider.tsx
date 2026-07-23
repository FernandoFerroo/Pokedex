"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/** Survives navigation and full reloads. */
const STORAGE_KEY = "pokedex-favorites-v1";

interface FavoritesContextValue {
  /** National Pokédex ids marked as favorites, in the order they were added. */
  favorites: number[];
  has: (id: number) => boolean;
  toggle: (id: number) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  // Starts empty on both server and client render, then loads from
  // localStorage after mount: this component hydrates on every page, so a
  // lazy initializer would mismatch the server HTML.
  const [favorites, setFavorites] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // One deliberate post-mount setState: localStorage can't be read in
          // the initializer without desyncing SSR HTML from the first client
          // render, so the hearts pop in right after hydration.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setFavorites(parsed.filter((id): id is number => typeof id === "number"));
        }
      }
    } catch {
      // Corrupt/unavailable storage: start with no favorites.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Storage full/unavailable: favorites still work, they just won't persist.
    }
  }, [favorites, hydrated]);

  const toggle = useCallback((id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }, []);

  const has = useCallback(
    (id: number) => favorites.includes(id),
    [favorites],
  );

  return (
    <FavoritesContext.Provider value={{ favorites, has, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites requires a <FavoritesProvider> ancestor.");
  return ctx;
}
