"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSfx, type SfxManager } from "@/lib/audio/sfx";

const STORAGE_KEY = "pokedex-sfx";

/** Loud enough to carry over the BGM without drowning it (0-100). */
const DEFAULT_VOLUME = 55;

interface StoredPrefs {
  volume: number;
  muted: boolean;
}

interface SfxContextValue {
  /** 0-100, mirroring the soundtrack player's scale. */
  volume: number;
  muted: boolean;
  setVolume: (volume: number) => void;
  toggleMuted: () => void;
}

const SfxContext = createContext<SfxContextValue | null>(null);

/**
 * Mounted once in the root layout. Owns the SFX volume/mute preferences
 * (persisted like the BGM ones), pushes them into the shared soundboard and
 * unlocks the AudioContext on the first interaction — browsers keep it
 * suspended until then, so the first cue would otherwise be swallowed.
 */
export function SfxProvider({ children }: { children: ReactNode }) {
  const sfx = getSfx();
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);

  // One-time restore after mount (same pattern as TeamProvider / the BGM).
  /* eslint-disable react-hooks/set-state-in-effect -- one-time restore */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<StoredPrefs>;
      if (typeof saved.volume === "number") {
        setVolumeState(Math.min(100, Math.max(0, Math.round(saved.volume))));
      }
      if (typeof saved.muted === "boolean") setMuted(saved.muted);
    } catch {
      // Corrupt prefs: fall back to the defaults.
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Keep the soundboard and localStorage in sync with the UI state.
  useEffect(() => {
    sfx.setVolume(volume / 100);
    sfx.setMuted(muted || volume === 0);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ volume, muted } satisfies StoredPrefs),
    );
  }, [sfx, volume, muted]);

  // Any gesture resumes the context; once running it stays running.
  useEffect(() => {
    const unlock = () => sfx.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [sfx]);

  // Leaving the page (or hot-reloading) must not leave the alarm beeping.
  useEffect(() => () => sfx.stopAll(), [sfx]);

  const value = useMemo<SfxContextValue>(
    () => ({
      volume,
      muted,
      setVolume: (next: number) => {
        setVolumeState(Math.min(100, Math.max(0, Math.round(next))));
        if (next > 0) setMuted(false);
      },
      toggleMuted: () => setMuted((m) => !m),
    }),
    [volume, muted],
  );

  return <SfxContext.Provider value={value}>{children}</SfxContext.Provider>;
}

/** Volume/mute state for the on-screen control. */
export function useSfxSettings(): SfxContextValue {
  const ctx = useContext(SfxContext);
  if (!ctx) throw new Error("useSfxSettings must be used inside <SfxProvider>");
  return ctx;
}

/**
 * The soundboard itself. Deliberately context-free: any client component can
 * fire a cue without threading a provider through, and the manager is a
 * module singleton so every caller shares one AudioContext.
 */
export function useSfx(): SfxManager {
  return useMemo(() => getSfx(), []);
}
