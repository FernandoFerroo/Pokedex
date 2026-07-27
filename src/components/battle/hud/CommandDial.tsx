"use client";

import { type CSSProperties, type ReactNode } from "react";
import { useSfx } from "@/components/audio/SfxProvider";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { BagIcon, BallIcon, FistIcon, RunIcon } from "./BattleIcons";

/**
 * Menú de comandos del combate: cuatro botones ovalados de cristal neón,
 * cada uno con su icono dibujado y su color.
 *
 * Each button is a stack of flat layers — tinted glass, inner sheen, neon
 * rim and halo — so it reads as a lit console key rather than a web button,
 * and it keeps the keyboard and screen-reader behavior of the plain
 * `<button>` underneath.
 */

function GlassKey({
  onClick,
  disabled,
  glow,
  icon,
  label,
  primary,
}: {
  onClick: () => void;
  disabled?: boolean;
  /** Neon color of this command. */
  glow: string;
  icon: ReactNode;
  label: string;
  /** The Fight key is bigger and brighter, like in the games. */
  primary?: boolean;
}) {
  const sfx = useSfx();
  return (
    <button
      type="button"
      onClick={() => {
        sfx.play("confirm");
        onClick();
      }}
      onPointerEnter={() => !disabled && sfx.play("menu")}
      disabled={disabled}
      style={{ "--glow": glow } as CSSProperties}
      className={cn(
        "group relative flex w-full items-center gap-3 overflow-hidden rounded-full border text-left transition",
        "border-[color-mix(in_srgb,var(--glow)_55%,transparent)]",
        "bg-[linear-gradient(120deg,color-mix(in_srgb,var(--glow)_26%,transparent),rgba(8,14,26,0.9)_58%)]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-8px_16px_rgba(0,0,0,0.45),0_4px_14px_rgba(0,0,0,0.5),0_0_18px_-8px_var(--glow)]",
        "backdrop-blur-md",
        "enabled:hover:border-[color-mix(in_srgb,var(--glow)_85%,white)] enabled:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-8px_16px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.5),0_0_26px_-4px_var(--glow)]",
        "enabled:hover:scale-[1.025] enabled:active:scale-[0.97]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:saturate-50",
        primary ? "h-[3.1rem] px-3.5" : "h-[2.6rem] px-3",
      )}
    >
      {/* Gloss sweeping the top half of the capsule. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-[3px] h-[42%] rounded-full bg-gradient-to-b from-white/28 to-transparent"
      />
      {/* Icon well: a lit disc that carries the command's color. */}
      <span
        aria-hidden
        className={cn(
          "relative grid shrink-0 place-items-center rounded-full",
          "bg-[radial-gradient(circle_at_35%_28%,color-mix(in_srgb,var(--glow)_75%,white),color-mix(in_srgb,var(--glow)_60%,#000)_75%)]",
          "text-[#08111f] shadow-[0_0_12px_-2px_var(--glow),inset_0_1px_0_rgba(255,255,255,0.6)]",
          primary ? "h-9 w-9" : "h-7.5 w-7.5",
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          "relative font-display font-bold tracking-widest text-white uppercase",
          primary ? "text-[15px]" : "text-[13px]",
        )}
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.95)" }}
      >
        {label}
      </span>
      {/* Neon underline that lights up on hover/focus. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 bottom-[3px] h-px rounded-full opacity-50 transition group-enabled:group-hover:opacity-100"
        style={{ background: "var(--glow)", boxShadow: "0 0 8px var(--glow)" }}
      />
    </button>
  );
}

export function CommandDial({
  onFight,
  onBag,
  onSwitch,
  onFlee,
  canUseBag,
  canSwitch,
  onKeyDown,
  groupRef,
}: {
  onFight: () => void;
  onBag: () => void;
  onSwitch: () => void;
  onFlee: () => void;
  canUseBag: boolean;
  canSwitch: boolean;
  /** D-pad navigation handler owned by the HUD. */
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  groupRef: React.Ref<HTMLDivElement>;
}) {
  const { battle: t, a11y } = useT();
  return (
    <div
      ref={groupRef}
      role="group"
      aria-label={a11y.actionsMenuAria}
      onKeyDown={onKeyDown}
      className="flex flex-col gap-2"
    >
      <p className="sr-only">{a11y.keyboardHint}</p>
      <GlassKey
        primary
        glow="#ff5a4d"
        icon={<FistIcon size={20} />}
        label={t.menuFight}
        onClick={onFight}
      />
      <GlassKey
        glow="#37dd7f"
        icon={<BallIcon size={17} />}
        label={t.menuPokemon}
        disabled={!canSwitch}
        onClick={onSwitch}
      />
      <GlassKey
        glow="#ffc531"
        icon={<BagIcon size={17} />}
        label={t.menuBag}
        disabled={!canUseBag}
        onClick={onBag}
      />
      <GlassKey
        glow="#4da9ff"
        icon={<RunIcon size={17} />}
        label={t.menuFlee}
        onClick={onFlee}
      />
    </div>
  );
}
