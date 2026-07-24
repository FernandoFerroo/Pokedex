"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { Backpack, DoorOpen, FlaskRound, Swords } from "lucide-react";
import { effectiveness } from "@/lib/battle/type-chart";
import { artworkUrl, typeAura, typeLabel } from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";
import type { BattleMove, Battler } from "@/types/battle";

/* ------------------------------------------------------------------ */
/* Shared chrome: Sword/Shield-style dark translucent glass panels     */
/* ------------------------------------------------------------------ */

/** Dark glass databox, like the SwSh status bars over the field. */
const glass =
  "rounded-xl border border-white/15 bg-[#101c2e]/90 shadow-[0_4px_16px_rgba(0,0,0,0.45)] backdrop-blur-sm";

/** White label text with the soft outline the Switch games use. */
const outlined =
  "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.5)]";

/* ------------------------------------------------------------------ */
/* HP bar                                                             */
/* ------------------------------------------------------------------ */

function hpGradient(pct: number): string {
  if (pct > 50) return "linear-gradient(180deg, #86efac, #22c55e 55%, #16a34a)";
  if (pct > 20) return "linear-gradient(180deg, #fde68a, #f59e0b 55%, #d97706)";
  return "linear-gradient(180deg, #fca5a5, #ef4444 55%, #dc2626)";
}

export function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  return (
    <div className="flex items-center gap-1.5">
      <span className="rounded-sm bg-[#f59e0b] px-1 py-px font-display text-[9px] leading-none font-bold text-[#1c1204]">
        PS
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full border border-black/50 bg-[#0a1220] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
        <div
          className="h-full rounded-full transition-[width] duration-600 ease-out"
          style={{ width: `${pct}%`, background: hpGradient(pct) }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Databoxes (enemy: no numbers · player: numbers + EXP strip)         */
/* ------------------------------------------------------------------ */

export function Databox({
  battler,
  side,
  team,
}: {
  battler: Battler;
  side: "player" | "enemy";
  /** Full roster, for the Poké Ball row of remaining Pokémon. */
  team: Battler[];
}) {
  return (
    <div className={cn(glass, "w-60 max-w-[46vw] px-3.5 py-2.5")}>
      <div className="flex items-baseline justify-between gap-2">
        <p className={cn(outlined, "truncate text-sm font-bold tracking-wide")}>
          {battler.label}
        </p>
        <p className={cn(outlined, "shrink-0 text-xs font-semibold")}>
          <span className="mr-0.5 text-[10px] text-slate-300">Nv.</span>
          {battler.level}
        </p>
      </div>
      <div className="mt-1.5">
        <HpBar hp={battler.hp} maxHp={battler.maxHp} />
      </div>
      {side === "player" ? (
        <>
          <div className="mt-1 flex items-center justify-between gap-2">
            <TeamPips team={team} />
            <p className={cn(outlined, "text-xs font-bold")}>
              {battler.hp}
              <span className="text-slate-300">/{battler.maxHp}</span>
            </p>
          </div>
          {/* EXP strip, decorative like in the games (fills with level). */}
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#0a1220]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#818cf8]"
              style={{ width: `${battler.level}%` }}
            />
          </div>
        </>
      ) : (
        <TeamPips team={team} className="mt-1.5" />
      )}
    </div>
  );
}

/** Row of mini Poké Balls: one per team member, grayed out when fainted. */
export function TeamPips({
  team,
  className,
}: {
  team: Battler[];
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1", className)}>
      {team.map((b) => (
        <span
          key={b.id}
          title={b.label}
          className={cn(
            "h-2.5 w-2.5 rounded-full border",
            b.hp > 0
              ? "border-black/60 bg-gradient-to-b from-[#ef4444] from-50% to-[#f8fafc] to-50% shadow-[0_0_4px_rgba(239,68,68,0.6)]"
              : "border-slate-600 bg-slate-700",
          )}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Message bar with typewriter text (bottom strip, like the Switch)    */
/* ------------------------------------------------------------------ */

export function MessageBox({ text }: { text: string }) {
  // Render-phase reset: a new message restarts the typewriter from zero.
  const [typed, setTyped] = useState({ text, count: text.length });
  if (typed.text !== text) setTyped({ text, count: 0 });
  const count = typed.text === text ? typed.count : 0;

  useEffect(() => {
    // Reduced motion reveals the full line on the first tick.
    const step = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? Number.MAX_SAFE_INTEGER
      : 2;
    const id = window.setInterval(() => {
      setTyped((t) => {
        if (t.text !== text || t.count >= text.length) {
          clearInterval(id);
          return t;
        }
        return { text, count: Math.min(text.length, t.count + step) };
      });
    }, 18);
    return () => clearInterval(id);
  }, [text]);

  return (
    <div className={cn(glass, "flex min-h-[3.75rem] items-center px-5 py-3")}>
      <p className={cn(outlined, "text-base leading-snug font-semibold sm:text-lg")}>
        {text.slice(0, count)}
        {count < text.length && (
          <span aria-hidden className="cursor-blink ml-1 text-red-400">
            ▼
          </span>
        )}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Command pills (the SwSh bottom-right column)                        */
/* ------------------------------------------------------------------ */

/** Glossy rounded command pill with the Switch-style top shine. */
function CommandPill({
  onClick,
  disabled,
  className,
  children,
  big,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  big?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex w-full items-center justify-center gap-2.5 rounded-full border-2 border-white/30 font-display font-bold tracking-widest uppercase transition",
        outlined,
        "shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_3px_10px_rgba(0,0,0,0.5)]",
        "enabled:hover:scale-[1.03] enabled:hover:brightness-110 enabled:active:scale-95",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50",
        big ? "h-14 text-lg" : "h-11 text-sm",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Mini Poké Ball icon for the Pokémon command. */
function BallIcon() {
  return (
    <span
      aria-hidden
      className="relative h-4.5 w-4.5 shrink-0 rounded-full border-2 border-[#101c2e] bg-gradient-to-b from-[#ef4444] from-48% to-white to-52% shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
    >
      <span className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#101c2e] bg-white" />
    </span>
  );
}

export function ActionMenu({
  onFight,
  onBag,
  onSwitch,
  onFlee,
  potions,
  canSwitch,
}: {
  onFight: () => void;
  onBag: () => void;
  onSwitch: () => void;
  onFlee: () => void;
  potions: number;
  canSwitch: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <CommandPill
        big
        onClick={onFight}
        className="bg-gradient-to-b from-[#ff6b57] via-[#ef2f3e] to-[#c01327]"
      >
        <Swords size={20} /> Lucha
      </CommandPill>
      <CommandPill
        onClick={onSwitch}
        disabled={!canSwitch}
        className="bg-gradient-to-b from-[#57d374] via-[#27ad4e] to-[#158a3d]"
      >
        <BallIcon /> Pokémon
      </CommandPill>
      <CommandPill
        onClick={onBag}
        disabled={potions === 0}
        className="bg-gradient-to-b from-[#ffd45e] via-[#f5a623] to-[#d97706]"
      >
        <Backpack size={17} /> Mochila
      </CommandPill>
      <CommandPill
        onClick={onFlee}
        className="bg-gradient-to-b from-[#5db4ff] via-[#2f80e4] to-[#1560bd]"
      >
        <DoorOpen size={17} /> Huir
      </CommandPill>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Move pills (type-colored, with PP and the effectiveness hint)       */
/* ------------------------------------------------------------------ */

function effectivenessHint(mult: number): { text: string; className: string } | null {
  if (mult === 0) return { text: "Sin efecto", className: "text-slate-300" };
  if (mult > 1) return { text: "¡Súper eficaz!", className: "text-amber-200" };
  if (mult < 1) return { text: "Poco eficaz", className: "text-slate-200/80" };
  return null;
}

export function MoveMenu({
  moves,
  targetTypes,
  onPick,
  onBack,
}: {
  moves: BattleMove[];
  /** Types of the enemy's active Pokémon, for the SwSh effectiveness tag. */
  targetTypes: string[];
  onPick: (move: BattleMove) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {moves.map((move) => {
        const aura = typeAura(move.type);
        const hint = effectivenessHint(effectiveness(move.type, targetTypes));
        return (
          <button
            key={move.slug}
            type="button"
            disabled={move.pp === 0}
            onClick={() => onPick(move)}
            style={
              {
                background: `linear-gradient(180deg, color-mix(in srgb, ${aura} 80%, #fff 12%), ${aura} 45%, color-mix(in srgb, ${aura} 55%, #000))`,
              } as CSSProperties
            }
            className={cn(
              "w-full rounded-full border-2 border-white/30 px-4 py-1.5 text-left transition",
              "shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_3px_10px_rgba(0,0,0,0.5)]",
              "enabled:hover:scale-[1.03] enabled:hover:brightness-110 enabled:active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50",
            )}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className={cn(outlined, "truncate text-sm font-bold tracking-wide")}>
                {move.label}
              </span>
              {hint && (
                <span
                  className={cn(
                    "shrink-0 text-[11px] font-bold [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]",
                    hint.className,
                  )}
                >
                  {hint.text}
                </span>
              )}
            </span>
            <span className="mt-0.5 flex items-center justify-between gap-2">
              <span className="rounded-sm bg-black/35 px-1.5 py-px text-[10px] font-bold tracking-widest text-white uppercase">
                {typeLabel(move.type)}
              </span>
              <span className={cn(outlined, "text-[11px] font-semibold")}>
                PP {move.pp}
                <span className="text-slate-300">/{move.maxPp}</span>
              </span>
            </span>
          </button>
        );
      })}
      <BackPill onClick={onBack} />
    </div>
  );
}

/** Dark "Volver" pill closing a submenu, like the B-button hint. */
function BackPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        glass,
        outlined,
        "h-9 w-full rounded-full text-xs font-bold tracking-widest uppercase transition hover:bg-[#1b2b44]/90",
      )}
    >
      ← Volver
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Bag                                                                 */
/* ------------------------------------------------------------------ */

export function BagMenu({
  potions,
  onPotion,
  onBack,
}: {
  potions: number;
  onPotion: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onPotion}
        disabled={potions === 0}
        className={cn(
          "w-full rounded-2xl border-2 border-white/30 bg-gradient-to-b from-[#c084fc] via-[#9333ea] to-[#6b21a8] px-4 py-2.5 text-left transition",
          "shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_3px_10px_rgba(0,0,0,0.5)]",
          "enabled:hover:scale-[1.02] enabled:hover:brightness-110 enabled:active:scale-95",
          "disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50",
        )}
      >
        <span className={cn(outlined, "flex items-center gap-2 text-sm font-bold")}>
          <FlaskRound size={16} /> Poción
          <span className="ml-auto">×{potions}</span>
        </span>
        <span className="mt-0.5 block text-xs text-purple-100/90">
          Restaura 60 PS. Gasta el turno.
        </span>
      </button>
      <BackPill onClick={onBack} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Party screen (the SwSh "Pokémon" list, as a full overlay)           */
/* ------------------------------------------------------------------ */

export function SwitchMenu({
  team,
  active,
  forced,
  onPick,
  onBack,
}: {
  team: Battler[];
  active: number;
  /** Forced replacement after a faint: no back button. */
  forced: boolean;
  onPick: (index: number) => void;
  onBack: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col gap-3 overflow-y-auto bg-[#07101d]/90 p-4 backdrop-blur-sm sm:p-6">
      <p className={cn(outlined, "text-base font-bold tracking-wide")}>
        {forced ? "¿A qué Pokémon envías ahora?" : "Elige un Pokémon."}
      </p>
      <div className="grid flex-1 content-start gap-2 sm:grid-cols-2">
        {team.map((b, i) => {
          const fainted = b.hp <= 0;
          const disabled = fainted || i === active;
          const aura = typeAura(b.types[0]);
          return (
            <button
              key={b.id}
              type="button"
              disabled={disabled}
              onClick={() => onPick(i)}
              style={{ "--aura": aura } as CSSProperties}
              className={cn(
                "flex items-center gap-3 rounded-full border-2 bg-gradient-to-r from-[#18293f]/95 to-[#101c2e]/95 py-1.5 pr-4 pl-2 text-left transition",
                i === active
                  ? "border-cyan-300/70 shadow-[0_0_16px_-4px_rgba(103,232,249,0.7)]"
                  : "border-white/15",
                !disabled &&
                  "hover:scale-[1.015] hover:border-[color-mix(in_srgb,var(--aura)_70%,white)] hover:shadow-[0_0_18px_-4px_var(--aura)]",
                fainted && "opacity-60 saturate-0",
                disabled && "cursor-not-allowed",
              )}
            >
              <span className="relative h-12 w-12 shrink-0 rounded-full border border-white/20 bg-black/40">
                <Image
                  src={artworkUrl(b.id)}
                  alt=""
                  fill
                  sizes="48px"
                  className={cn("object-contain p-0.5", fainted && "grayscale")}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={cn(outlined, "truncate text-sm font-bold")}>
                    {b.label}
                  </span>
                  <span className={cn(outlined, "shrink-0 text-xs font-semibold")}>
                    <span className="mr-0.5 text-[10px] text-slate-300">Nv.</span>
                    {b.level}
                  </span>
                </span>
                <HpBar hp={b.hp} maxHp={b.maxHp} />
                <span className="mt-0.5 flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-widest uppercase",
                      fainted
                        ? "text-red-400"
                        : i === active
                          ? "text-cyan-300"
                          : "text-transparent",
                    )}
                  >
                    {fainted ? "Debilitado" : i === active ? "En combate" : "—"}
                  </span>
                  <span className={cn(outlined, "text-[11px] font-semibold")}>
                    {b.hp}
                    <span className="text-slate-300">/{b.maxHp}</span>
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {!forced && (
        <div className="w-48 self-end">
          <BackPill onClick={onBack} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rival trainer speech bubble                                         */
/* ------------------------------------------------------------------ */

export function DialogueBubble({
  avatar,
  name,
  text,
}: {
  avatar: string | null;
  name: string;
  text: string;
}) {
  return (
    <div className="fx-bubble-pop pointer-events-none flex max-w-sm items-start gap-2">
      <span className="relative mt-1 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-[#101c2e] shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-sm font-bold text-red-400">
            {name.charAt(0)}
          </span>
        )}
      </span>
      <div className={cn(glass, "rounded-2xl rounded-tl-sm px-3.5 py-2")}>
        <p className="text-[11px] font-bold tracking-wider text-red-300 uppercase">
          {name}
        </p>
        <p className={cn(outlined, "mt-0.5 text-xs leading-snug font-semibold")}>
          {text}
        </p>
      </div>
    </div>
  );
}
