"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { cn } from "@/lib/utils";
import type { Side } from "@/types/battle";

/** What the stage needs to draw one combatant. */
export interface SpriteView {
  /** Changes force a re-entry animation (switches): `${side}-${id}`. */
  key: string;
  /** Animated Showdown GIF: back view for the player, front for the enemy. */
  url: string;
  /** Neon accent of the creature's primary type (drop-shadow). */
  aura: string;
}

export interface StageHandle {
  /** Attacker lunges; the move plays its typed animation on the defender. */
  attack(side: Side, move: { type: string; damageClass: string }): void;
  /** Defender blinks; the screen shakes (harder on super-effective). */
  hit(side: Side, effectiveness: number): void;
  faint(side: Side): void;
}

/** Battle backdrop, in the spirit of the classic game arenas. */
export type ScenarioKey =
  | "pradera"
  | "bosque"
  | "cueva"
  | "costa"
  | "volcan"
  | "noche";

/** Scenario chosen from the rival's opening Pokémon, like themed routes. */
export function scenarioForTypes(types: string[]): ScenarioKey {
  const t = types[0] ?? "";
  if (t === "fire") return "volcan";
  if (t === "water" || t === "ice") return "costa";
  if (["rock", "ground", "steel", "fighting"].includes(t)) return "cueva";
  if (["ghost", "psychic", "dark", "fairy", "dragon"].includes(t))
    return "noche";
  if (["grass", "bug", "poison"].includes(t)) return "bosque";
  return "pradera";
}

/* ------------------------------------------------------------------ */
/* Per-type move FX configuration                                      */
/* ------------------------------------------------------------------ */

type Shape = "spark" | "flame" | "drop" | "bolt" | "leaf" | "shard" | "star" | "ring";

const TYPE_FX: Record<string, { colors: string[]; shape: Shape }> = {
  normal: { colors: ["#e7e5e4", "#a8a29e"], shape: "star" },
  fire: { colors: ["#ff6b2b", "#fbbf24", "#ef4444"], shape: "flame" },
  water: { colors: ["#38bdf8", "#0ea5e9", "#bae6fd"], shape: "drop" },
  electric: { colors: ["#fde047", "#facc15", "#fff"], shape: "bolt" },
  grass: { colors: ["#34d399", "#84cc16", "#bbf7d0"], shape: "leaf" },
  ice: { colors: ["#a5f3fc", "#67e8f9", "#e0f2fe"], shape: "shard" },
  fighting: { colors: ["#ef4444", "#fca5a5"], shape: "star" },
  poison: { colors: ["#d946ef", "#a21caf", "#f0abfc"], shape: "drop" },
  ground: { colors: ["#d97706", "#92400e", "#fbbf24"], shape: "shard" },
  flying: { colors: ["#7dd3fc", "#e0f2fe"], shape: "ring" },
  psychic: { colors: ["#f472b6", "#c084fc"], shape: "ring" },
  bug: { colors: ["#a3e635", "#65a30d"], shape: "leaf" },
  rock: { colors: ["#b8a038", "#78716c"], shape: "shard" },
  ghost: { colors: ["#8b5cf6", "#4c1d95"], shape: "ring" },
  dragon: { colors: ["#a855f7", "#6366f1"], shape: "flame" },
  dark: { colors: ["#6d28d9", "#1e1b4b"], shape: "ring" },
  steel: { colors: ["#94a3b8", "#e2e8f0"], shape: "shard" },
  fairy: { colors: ["#fb7185", "#fbcfe8"], shape: "star" },
};

/** Screen-space anchors of both sprites (they drive projectiles/bursts). */
const ANCHORS: Record<Side, { left: string; top: string }> = {
  player: { left: "26%", top: "56%" },
  rival: { left: "72%", top: "38%" },
};

interface ActiveFx {
  seq: number;
  attacker: Side;
  type: string;
  /** "special" shoots a projectile; "physical" strikes on the target. */
  damageClass: string;
}

/** Pseudo-random but stable particle fan (no Math.random per render). */
const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2 + 0.4;
  const dist = 34 + (i % 3) * 22;
  return {
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist * 0.75,
    delay: (i % 4) * 45,
  };
});

/** One move's visual: optional projectile, then a typed particle burst. */
function MoveFx({ fx }: { fx: ActiveFx }) {
  const conf = TYPE_FX[fx.type] ?? TYPE_FX.normal;
  const target: Side = fx.attacker === "player" ? "rival" : "player";
  const at = ANCHORS[target];
  const special = fx.damageClass === "special";
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {special && (
        <span
          className={cn(
            "pk-projectile absolute h-5 w-5 rounded-full",
            fx.attacker === "player" ? "pk-shot-to-e" : "pk-shot-to-p",
          )}
          style={{
            background: conf.colors[0],
            boxShadow: `0 0 14px 4px ${conf.colors[0]}, 0 0 34px 10px ${conf.colors[0]}66`,
          }}
        />
      )}
      {/* Impact burst at the defender, delayed until the projectile lands. */}
      <span
        className="absolute"
        style={{ left: at.left, top: at.top }}
        aria-hidden
      >
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className={cn("pk-particle", `pk-shape-${conf.shape}`)}
            style={
              {
                "--dx": `${p.dx * (special ? 1 : 1.25)}px`,
                "--dy": `${p.dy * (special ? 1 : 1.25)}px`,
                background:
                  conf.shape === "ring"
                    ? "transparent"
                    : conf.colors[i % conf.colors.length],
                borderColor: conf.colors[i % conf.colors.length],
                animationDelay: `${(special ? 420 : 160) + p.delay}ms`,
              } as CSSProperties
            }
          />
        ))}
        {/* Physical strikes add crossed slash streaks, like the classics. */}
        {!special && (
          <>
            <span
              className="pk-slash"
              style={{ background: conf.colors[0], animationDelay: "120ms" }}
            />
            <span
              className="pk-slash pk-slash-2"
              style={{ background: conf.colors[1] ?? conf.colors[0], animationDelay: "240ms" }}
            />
          </>
        )}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scenario backdrops (pure CSS, layered like the game arenas)         */
/* ------------------------------------------------------------------ */

const SCENARIO_SKY: Record<ScenarioKey, string> = {
  pradera: "linear-gradient(#7ec8f2 0%, #a5dcf7 45%, #cdeffb 68%, #8bc34a 68%, #6aa63c 100%)",
  bosque: "linear-gradient(#4c7c4c 0%, #6f9f5f 40%, #9ccc65 68%, #33691e 68%, #244d15 100%)",
  cueva: "linear-gradient(#2b2233 0%, #3c2f46 45%, #4e3d58 68%, #3a2d33 68%, #241c20 100%)",
  costa: "linear-gradient(#64b5f6 0%, #90caf9 40%, #4fc3f7 55%, #0288d1 68%, #f5d79a 68%, #e0b96e 100%)",
  volcan: "linear-gradient(#3d1414 0%, #7a2018 42%, #b2401e 68%, #4a1f14 68%, #331109 100%)",
  noche: "linear-gradient(#0b1026 0%, #1b2440 45%, #2c3a63 68%, #17203a 68%, #0d1322 100%)",
};

const PLATFORM_TONE: Record<ScenarioKey, [string, string]> = {
  pradera: ["#5c9a34", "#4a7d2a"],
  bosque: ["#2e5d1e", "#234916"],
  cueva: ["#5d4a63", "#443549"],
  costa: ["#e8c88a", "#cfa96a"],
  volcan: ["#6b2a16", "#521f10"],
  noche: ["#26314f", "#1b2439"],
};

/** Decorative far-background props per scenario (silhouettes, sun, stars). */
function ScenarioProps({ scenario }: { scenario: ScenarioKey }) {
  if (scenario === "pradera" || scenario === "bosque") {
    return (
      <>
        <span className="absolute top-[6%] left-[10%] h-10 w-24 rounded-full bg-white/70 blur-[2px]" />
        <span className="absolute top-[14%] left-[55%] h-8 w-32 rounded-full bg-white/60 blur-[2px]" />
        <span className="absolute top-[40%] left-0 h-[28%] w-full bg-[radial-gradient(ellipse_60%_100%_at_20%_100%,rgba(20,60,20,0.35),transparent),radial-gradient(ellipse_50%_90%_at_80%_100%,rgba(20,60,20,0.3),transparent)]" />
      </>
    );
  }
  if (scenario === "costa") {
    return (
      <>
        <span className="absolute top-[8%] right-[12%] h-14 w-14 rounded-full bg-[#fff59d] shadow-[0_0_40px_14px_rgba(255,245,157,0.7)]" />
        <span className="absolute top-[52%] left-0 h-[3%] w-full bg-white/30 blur-[3px]" />
      </>
    );
  }
  if (scenario === "volcan") {
    return (
      <>
        <span className="absolute top-[30%] left-[8%] h-[38%] w-[30%] bg-[#2a0d08] [clip-path:polygon(50%_0,100%_100%,0_100%)] opacity-80" />
        <span className="absolute top-[22%] left-[52%] h-[46%] w-[38%] bg-[#1f0a06] [clip-path:polygon(50%_0,100%_100%,0_100%)] opacity-90" />
        <span className="absolute top-[20%] left-[68%] h-3 w-3 rounded-full bg-[#ffab40] blur-[2px]" />
      </>
    );
  }
  if (scenario === "noche") {
    return (
      <>
        {[
          [8, 12], [22, 6], [37, 18], [52, 8], [66, 14], [80, 5], [90, 20],
        ].map(([l, t], i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-white/80"
            style={{ left: `${l}%`, top: `${t}%` }}
          />
        ))}
        <span className="absolute top-[9%] right-[14%] h-12 w-12 rounded-full bg-[#f4f1c9] shadow-[0_0_30px_10px_rgba(244,241,201,0.4)]" />
      </>
    );
  }
  // cueva
  return (
    <>
      <span className="absolute top-0 left-[18%] h-[22%] w-[7%] bg-[#241a2b] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
      <span className="absolute top-0 left-[42%] h-[15%] w-[5%] bg-[#241a2b] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
      <span className="absolute top-0 left-[70%] h-[26%] w-[8%] bg-[#241a2b] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stage                                                               */
/* ------------------------------------------------------------------ */

interface StageProps {
  player: SpriteView | null;
  enemy: SpriteView | null;
  scenario: ScenarioKey;
}

/**
 * Escenario de combate 2D al estilo clásico: fondo temático, plataformas
 * elípticas, el rival de frente arriba a la derecha y tu Pokémon de espaldas
 * abajo a la izquierda, con animaciones de movimiento distintas por tipo
 * (proyectil + estallido para especiales, embestida + tajos para físicos).
 */
export const BattleStage2D = forwardRef<StageHandle, StageProps>(
  function BattleStage2D({ player, enemy, scenario }, ref) {
    const [fx, setFx] = useState<ActiveFx | null>(null);
    const [spriteFx, setSpriteFx] = useState<Record<Side, string>>({
      player: "",
      rival: "",
    });
    const [shake, setShake] = useState<"" | "soft" | "hard">("");
    const seqRef = useRef(0);
    const timers = useRef<number[]>([]);

    const later = (ms: number, fn: () => void) => {
      timers.current.push(window.setTimeout(fn, ms));
    };

    const setSprite = (side: Side, cls: string) =>
      setSpriteFx((f) => ({ ...f, [side]: cls }));

    useImperativeHandle(ref, (): StageHandle => {
      return {
        attack(side, move) {
          const seq = ++seqRef.current;
          setSprite(side, side === "player" ? "pk-lunge-p" : "pk-lunge-e");
          later(450, () => setSprite(side, ""));
          setFx({ seq, attacker: side, type: move.type, damageClass: move.damageClass });
          later(1100, () => setFx((f) => (f?.seq === seq ? null : f)));
        },
        hit(side, effectiveness) {
          setSprite(side, "pk-hit");
          later(520, () => setSprite(side, ""));
          setShake(effectiveness > 1 ? "hard" : "soft");
          later(effectiveness > 1 ? 500 : 350, () => setShake(""));
        },
        faint(side) {
          // Persists until the sprite is replaced (key change re-mounts it).
          setSprite(side, "pk-faint");
        },
      };
    }, []);

    // Clear pending timers if the stage unmounts mid-animation.
    useEffect(() => {
      const pending = timers.current;
      return () => pending.forEach(clearTimeout);
    }, []);

    const [platA, platB] = PLATFORM_TONE[scenario];

    return (
      <div
        className={cn(
          "relative h-full w-full overflow-hidden",
          shake === "soft" && "fx-screen-shake",
          shake === "hard" && "pk-shake-hard",
        )}
        style={{ background: SCENARIO_SKY[scenario] }}
      >
        <ScenarioProps scenario={scenario} />

        {/* Enemy platform + sprite (front view, elevated right). */}
        <span
          aria-hidden
          className="absolute rounded-[50%]"
          style={{
            left: "56%",
            top: "42%",
            width: "34%",
            height: "11%",
            background: `radial-gradient(ellipse at 50% 35%, ${platA}, ${platB})`,
            boxShadow: "inset 0 -6px 12px rgba(0,0,0,0.25)",
          }}
        />
        {enemy && (
          <div
            key={enemy.key}
            className="pk-send-in absolute flex items-end justify-center"
            style={{ left: "58%", top: "6%", width: "30%", height: "40%" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={enemy.url}
              alt=""
              className={cn(
                "max-h-full max-w-full origin-bottom object-contain [image-rendering:pixelated]",
                spriteFx.rival,
              )}
              style={{
                height: "88%",
                filter: `drop-shadow(0 6px 6px rgba(0,0,0,0.35)) drop-shadow(0 0 10px ${enemy.aura}44)`,
              }}
            />
          </div>
        )}

        {/* Player platform + sprite (back view, big, bottom-left). */}
        <span
          aria-hidden
          className="absolute rounded-[50%]"
          style={{
            left: "1%",
            bottom: "2%",
            width: "48%",
            height: "13%",
            background: `radial-gradient(ellipse at 50% 35%, ${platA}, ${platB})`,
            boxShadow: "inset 0 -6px 12px rgba(0,0,0,0.25)",
          }}
        />
        {player && (
          <div
            key={player.key}
            className="pk-send-in absolute flex items-end justify-center"
            style={{ left: "4%", bottom: "5%", width: "42%", height: "58%" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={player.url}
              alt=""
              className={cn(
                "max-h-full max-w-full origin-bottom object-contain [image-rendering:pixelated]",
                spriteFx.player,
              )}
              style={{
                height: "82%",
                filter: `drop-shadow(0 8px 8px rgba(0,0,0,0.4)) drop-shadow(0 0 12px ${player.aura}44)`,
              }}
            />
          </div>
        )}

        {fx && <MoveFx key={fx.seq} fx={fx} />}
      </div>
    );
  },
);
