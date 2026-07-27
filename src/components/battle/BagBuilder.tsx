"use client";

import Image from "next/image";
import { Backpack, Minus, Plus, RotateCcw } from "lucide-react";
import {
  BAG_CAPACITY,
  BAG_ITEM_IDS,
  BAG_ITEMS,
  bagCount,
  DEFAULT_BAG,
  itemSpriteUrl,
  MAX_PER_ITEM,
  type Bag,
  type BagItemId,
} from "@/lib/battle/items";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

/**
 * Pantalla de mochila previa al combate, hermana del creador de equipo rival:
 * seis huecos que el jugador reparte entre pociones, revivir, curas y objetos
 * X, con el sprite oficial de cada objeto. Lo que empaquete aquí es lo único
 * que podrá usar en combate.
 */
export function BagBuilder({
  bag,
  onChange,
  accent = "#fbbf24",
}: {
  bag: Bag;
  onChange: (bag: Bag) => void;
  /** Frame colour, so the panel belongs to whichever screen hosts it. */
  accent?: string;
}) {
  const t = useT().bag;
  const used = bagCount(bag);
  const full = used >= BAG_CAPACITY;

  const setCount = (id: BagItemId, count: number) => {
    const next = { ...bag };
    if (count <= 0) delete next[id];
    else next[id] = count;
    onChange(next);
  };

  return (
    <section
      style={{ "--accent": accent, "--edge": accent } as CSSProperties}
      className="lobby-panel relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-hud-3/70 px-4 py-5 shadow-[0_0_48px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:px-6"
    >
      <div className="flex flex-wrap items-center gap-3 pb-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]">
          <Backpack size={20} />
        </span>
        <h2 className="font-display text-lg font-bold tracking-wide text-slate-100">
          {t.title}
        </h2>
        {/* Capacidad como badge: el número es la regla de toda la sección. */}
        <span
          className={cn(
            "rounded-full border px-3 py-1 font-mono text-xs font-bold tracking-[0.15em] uppercase transition",
            full
              ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent)]"
              : "border-slate-600/80 bg-black/40 text-slate-300",
          )}
        >
          {t.subtitle(used, BAG_CAPACITY)}
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_BAG })}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-black/30 px-3 py-2 font-mono text-xs tracking-wider text-slate-300 uppercase transition hover:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] hover:text-[var(--accent)]"
        >
          <RotateCcw size={14} /> {t.reset}
        </button>
      </div>

      {/* Capacidad de la mochila: un segmento encendido por hueco ocupado. */}
      <div
        aria-hidden
        className="flex gap-1.5 border-b border-[color-mix(in_srgb,var(--accent)_20%,transparent)] pb-4"
      >
        {Array.from({ length: BAG_CAPACITY }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition duration-300",
              i < used
                ? "bg-[var(--accent)] shadow-[0_0_10px_-1px_var(--accent)]"
                : "bg-slate-700/70",
            )}
          />
        ))}
      </div>

      <p className="text-sm leading-relaxed text-slate-300 max-sm:hidden">{t.intro}</p>

      <ul className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
        {BAG_ITEM_IDS.map((id) => {
          const count = bag[id] ?? 0;
          const tint = BAG_ITEMS[id].tint;
          const atMax = count >= MAX_PER_ITEM;
          const canAdd = !full && !atMax;
          return (
            <li
              key={id}
              style={{ "--tint": tint } as CSSProperties}
              className={cn(
                "flex flex-col gap-2 rounded-xl border p-3 backdrop-blur-sm transition max-sm:gap-1 max-sm:rounded-lg max-sm:p-1.5",
                count > 0
                  ? "border-[color-mix(in_srgb,var(--tint)_60%,transparent)] bg-[color-mix(in_srgb,var(--tint)_10%,transparent)] shadow-[0_0_20px_-8px_var(--tint)]"
                  : "border-slate-700/70 bg-black/30",
              )}
            >
              <div className="flex items-center gap-2.5 max-sm:flex-col max-sm:gap-0.5 max-sm:text-center">
                {/* Sprite oficial del objeto, sobre un disco del color del
                    ítem para que se lea igual en tema claro y oscuro. */}
                <span
                  className={cn(
                    "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition max-sm:h-8 max-sm:w-8",
                    count > 0
                      ? "border-[color-mix(in_srgb,var(--tint)_55%,transparent)] bg-[color-mix(in_srgb,var(--tint)_18%,transparent)] shadow-[0_0_14px_-6px_var(--tint)]"
                      : "border-slate-700/70 bg-black/40",
                  )}
                >
                  <Image
                    src={itemSpriteUrl(id)}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    className={cn(
                      "h-8 w-8 object-contain transition max-sm:h-6 max-sm:w-6",
                      // Los sprites de objeto son diminutos; el escalado
                      // pixelado los mantiene nítidos en vez de borrosos.
                      "[image-rendering:pixelated]",
                      count === 0 && "opacity-55 saturate-50",
                    )}
                  />
                </span>
                <span className="min-w-0 flex-1 max-sm:w-full">
                  <span className="block truncate font-mono text-sm font-semibold text-slate-100 max-sm:text-[8px]">
                    {t.itemName[id]}
                  </span>
                  <span
                    className={cn(
                      "block font-mono text-sm font-bold max-sm:text-[9px]",
                      count > 0 ? "text-[var(--tint)]" : "text-slate-600",
                    )}
                  >
                    ×{count}
                  </span>
                </span>
              </div>
              <p className="min-h-8 font-mono text-xs leading-snug text-slate-400 max-sm:hidden">
                {t.itemDesc[id]}
              </p>
              <div className="flex items-center gap-2 max-sm:gap-1">
                <button
                  type="button"
                  onClick={() => setCount(id, count - 1)}
                  disabled={count === 0}
                  aria-label={t.removeAria(t.itemName[id])}
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-slate-700/80 bg-black/40 text-slate-300 transition enabled:hover:border-red-500/60 enabled:hover:text-red-400 enabled:active:scale-95 disabled:opacity-35 max-sm:h-6"
                >
                  <Minus size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setCount(id, count + 1)}
                  disabled={!canAdd}
                  aria-label={t.addAria(t.itemName[id])}
                  title={atMax ? t.maxOf(t.itemName[id]) : full ? t.full : undefined}
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-slate-700/80 bg-black/40 text-slate-300 transition enabled:hover:border-[var(--tint)] enabled:hover:text-[var(--tint)] enabled:active:scale-95 disabled:opacity-35 max-sm:h-6"
                >
                  <Plus size={15} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {used === 0 && (
        <p className="text-center font-mono text-sm text-slate-500">{t.empty}</p>
      )}
    </section>
  );
}
