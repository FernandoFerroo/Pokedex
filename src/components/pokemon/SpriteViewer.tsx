"use client";

import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export interface SpriteSet {
  artwork: { normal: string | null; shiny: string | null };
  /** Pokémon HOME renders (modelos 3D). */
  home: { normal: string | null; shiny: string | null };
  /** Pixel-art de los juegos (vista 2D), frente y espalda. */
  pixel: {
    front: string | null;
    back: string | null;
    frontShiny: string | null;
    backShiny: string | null;
  };
}

type ViewMode = "art" | "3d" | "2d";

const MODE_LABELS: Record<ViewMode, string> = {
  art: "Arte",
  "3d": "3D",
  "2d": "2D",
};

interface SpriteViewerProps {
  name: string;
  sprites: SpriteSet;
}

export function SpriteViewer({ name, sprites }: SpriteViewerProps) {
  const [mode, setMode] = useState<ViewMode>("art");
  const [shiny, setShiny] = useState(false);

  const availableModes = (["art", "3d", "2d"] as const).filter((m) =>
    m === "art"
      ? sprites.artwork.normal !== null
      : m === "3d"
        ? sprites.home.normal !== null
        : sprites.pixel.front !== null,
  );

  const hasShiny =
    mode === "art"
      ? sprites.artwork.shiny !== null
      : mode === "3d"
        ? sprites.home.shiny !== null
        : sprites.pixel.frontShiny !== null;
  const showShiny = shiny && hasShiny;

  const single =
    mode === "art"
      ? showShiny
        ? sprites.artwork.shiny
        : sprites.artwork.normal
      : showShiny
        ? sprites.home.shiny
        : sprites.home.normal;

  const pixelPair = [
    {
      key: "front",
      src: showShiny ? sprites.pixel.frontShiny : sprites.pixel.front,
      label: "frente",
    },
    {
      key: "back",
      src: showShiny ? sprites.pixel.backShiny : sprites.pixel.back,
      label: "espalda",
    },
  ].filter((s) => s.src !== null);

  const variantLabel = showShiny ? `${name} shiny` : name;

  return (
    <div className="flex h-full flex-col gap-4">
      <div
        key={`${mode}-${showShiny}`}
        className="flex flex-1 items-center justify-center motion-safe:animate-[fade-in_250ms_ease-out]"
      >
        {mode === "2d" ? (
          <div className="flex items-center justify-center gap-2">
            {pixelPair.map((sprite) => (
              <div key={sprite.key} className="relative size-32 sm:size-36">
                <Image
                  src={sprite.src as string}
                  alt={`${variantLabel} (${sprite.label})`}
                  fill
                  sizes="144px"
                  className="object-contain [image-rendering:pixelated]"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative aspect-square w-full max-w-70">
            <Image
              src={single as string}
              alt={variantLabel}
              fill
              priority={mode === "art"}
              sizes="280px"
              className="object-contain"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        <div
          role="group"
          aria-label="Modo de visualización"
          className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800"
        >
          {availableModes.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mode === m
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShiny((s) => !s)}
          disabled={!hasShiny}
          aria-pressed={showShiny}
          title={hasShiny ? "Alternar forma shiny" : "Sin sprite shiny"}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
            showShiny
              ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-400/10 dark:text-amber-300"
              : "border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          <Sparkles size={13} />
          Shiny
        </button>
      </div>
    </div>
  );
}
