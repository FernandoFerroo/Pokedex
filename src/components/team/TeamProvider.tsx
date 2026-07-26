"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { MemberBuild, TeamMember } from "@/types/team";

export const TEAM_SIZE = 6;

/** Survives navigation and full reloads. */
const STORAGE_KEY = "pokedex-team-v1";

interface TeamContextValue {
  /** Up to 6 members, in slot order. */
  team: TeamMember[];
  /** The Pokémon whose detail page is open right now, if any. */
  current: TeamMember | null;
  setCurrent: (member: TeamMember | null) => void;
  /** Adds any Pokémon to the first free slot (no-op if full or duplicated). */
  add: (member: TeamMember) => void;
  /** Adds `current` to the first free slot (no-op if full or duplicated). */
  addCurrent: () => void;
  remove: (id: number) => void;
  /** Sets a member's combat level, clamped to 1-100. */
  setLevel: (id: number, level: number) => void;
  /** Sets (or clears, with undefined) a member's hand-picked combat build. */
  setBuild: (id: number, build: MemberBuild | undefined) => void;
  /** Replaces the whole roster (AI generator). */
  replace: (members: TeamMember[]) => void;
  /** Swaps one member for another, keeping its slot (AI substitutions). */
  swap: (outId: number, member: TeamMember) => void;
  clear: () => void;
  has: (id: number) => boolean;
  isFull: boolean;
  /** True once the roster has been read from localStorage after mount. */
  hydrated: boolean;
  /** Drawer visibility lives here so any page can open the team sheet. */
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const TeamContext = createContext<TeamContextValue | null>(null);

function isValidBuild(value: unknown): value is MemberBuild | undefined {
  if (value === undefined) return true;
  const b = value as MemberBuild;
  return (
    typeof b === "object" &&
    b !== null &&
    (b.ability === undefined || typeof b.ability === "string") &&
    (b.moves === undefined ||
      (Array.isArray(b.moves) &&
        b.moves.length <= 4 &&
        b.moves.every((m) => typeof m === "string")))
  );
}

function isValidMember(value: unknown): value is TeamMember {
  const m = value as TeamMember;
  return (
    typeof m === "object" &&
    m !== null &&
    typeof m.id === "number" &&
    typeof m.name === "string" &&
    Array.isArray(m.types) &&
    m.types.every((t) => typeof t === "string") &&
    (m.level === undefined || typeof m.level === "number") &&
    isValidBuild(m.build)
  );
}

function clampLevel(level: number): number {
  return Math.min(100, Math.max(1, Math.round(level)));
}

export function TeamProvider({ children }: { children: ReactNode }) {
  // Starts empty on both server and client render, then loads from
  // localStorage after mount: this component hydrates on every page, so a
  // lazy initializer would mismatch the server HTML.
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [current, setCurrent] = useState<TeamMember | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // One deliberate post-mount setState: localStorage can't be read in
          // the initializer without desyncing SSR HTML from the first client
          // render, so the roster pops in right after hydration.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setTeam(parsed.filter(isValidMember).slice(0, TEAM_SIZE));
        }
      }
    } catch {
      // Corrupt/unavailable storage: start with an empty team.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
    } catch {
      // Storage full/unavailable: the team still works, it just won't persist.
    }
  }, [team, hydrated]);

  const add = useCallback((member: TeamMember) => {
    setTeam((prev) => {
      if (prev.length >= TEAM_SIZE) return prev;
      if (prev.some((m) => m.id === member.id)) return prev;
      return [...prev, member];
    });
  }, []);

  const addCurrent = useCallback(() => {
    if (current) add(current);
  }, [current, add]);

  const remove = useCallback((id: number) => {
    setTeam((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const setLevel = useCallback((id: number, level: number) => {
    setTeam((prev) =>
      prev.map((m) => (m.id === id ? { ...m, level: clampLevel(level) } : m)),
    );
  }, []);

  const setBuild = useCallback((id: number, build: MemberBuild | undefined) => {
    setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, build } : m)));
  }, []);

  const replace = useCallback((members: TeamMember[]) => {
    const seen = new Set<number>();
    setTeam(
      members
        .filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        })
        .slice(0, TEAM_SIZE),
    );
  }, []);

  const swap = useCallback((outId: number, member: TeamMember) => {
    setTeam((prev) => {
      if (prev.some((m) => m.id === member.id)) return prev;
      return prev.map((m) => (m.id === outId ? member : m));
    });
  }, []);

  const clear = useCallback(() => setTeam([]), []);

  const has = useCallback(
    (id: number) => team.some((m) => m.id === id),
    [team],
  );

  return (
    <TeamContext.Provider
      value={{
        team,
        current,
        setCurrent,
        add,
        addCurrent,
        remove,
        setLevel,
        setBuild,
        replace,
        swap,
        clear,
        has,
        isFull: team.length >= TEAM_SIZE,
        hydrated,
        drawerOpen,
        setDrawerOpen,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam(): TeamContextValue {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeam requires a <TeamProvider> ancestor.");
  return ctx;
}

/**
 * Invisible helper the detail page renders to mark its Pokémon as the
 * "currently selected" one that the drawer's empty slots can add.
 */
export function CurrentPokemonTracker({ member }: { member: TeamMember }) {
  const { setCurrent } = useTeam();
  useEffect(() => {
    setCurrent(member);
    return () => setCurrent(null);
    // Primitive deps: `member` is a fresh object literal on every render.
  }, [member.id, member.name, member.types.join(","), setCurrent]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
