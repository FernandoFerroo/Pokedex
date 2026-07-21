"use client";

import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

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
  /** Sprites animados (GIF) de Pokémon Showdown, preferidos en la vista 2D. */
  anim: {
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

const clamp = (value: number, limit: number) =>
  Math.min(limit, Math.max(-limit, value));

/**
 * Drag-to-rotate stage for the HOME render: pointer drags update CSS vars
 * (no React re-renders) and the model springs back upright on release.
 */
function Stage3D({ src, alt }: { src: string; alt: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const setRotation = (rx: number, ry: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--rx", `${rx}deg`);
    stage.style.setProperty("--ry", `${ry}deg`);
  };

  return (
    <div className="relative flex w-full flex-1 flex-col items-center justify-center">
      <span
        aria-hidden
        className="absolute bottom-8 left-1/2 h-4 w-36 -translate-x-1/2 rounded-[50%] bg-slate-900/15 blur-md dark:bg-black/60"
      />
      <div style={{ perspective: "900px" }} className="flex w-full justify-center">
        <div
          ref={stageRef}
          onPointerDown={(e) => {
            dragRef.current = { x: e.clientX, y: e.clientY };
            stageRef.current?.setPointerCapture(e.pointerId);
            stageRef.current?.classList.add("dragging");
          }}
          onPointerMove={(e) => {
            const start = dragRef.current;
            if (!start) return;
            setRotation(
              clamp((start.y - e.clientY) * 0.35, 30),
              clamp((e.clientX - start.x) * 0.35, 50),
            );
          }}
          onPointerUp={() => {
            dragRef.current = null;
            stageRef.current?.classList.remove("dragging");
            setRotation(0, 0);
          }}
          onPointerCancel={() => {
            dragRef.current = null;
            stageRef.current?.classList.remove("dragging");
            setRotation(0, 0);
          }}
          className="sprite-3d relative aspect-square w-full max-w-70 cursor-grab touch-none select-none active:cursor-grabbing"
        >
          <Image
            src={src}
            alt={alt}
            fill
            draggable={false}
            sizes="280px"
            className="aura-sprite pointer-events-none object-contain"
          />
        </div>
      </div>
      <p className="pointer-events-none absolute bottom-1 text-[10px] text-slate-400 dark:text-slate-500">
        Arrastra para mover
      </p>
    </div>
  );
}

interface SpriteViewerProps {
  name: string;
  sprites: SpriteSet;
}

export function SpriteViewer({ name, sprites }: SpriteViewerProps) {
  const [mode, setMode] = useState<ViewMode>("art");
  const [shiny, setShiny] = useState(false);

  const front2d = (variant: "normal" | "shiny") =>
    variant === "shiny"
      ? (sprites.anim.frontShiny ?? sprites.pixel.frontShiny)
      : (sprites.anim.front ?? sprites.pixel.front);

  const availableModes = (["art", "3d", "2d"] as const).filter((m) =>
    m === "art"
      ? sprites.artwork.normal !== null
      : m === "3d"
        ? sprites.home.normal !== null
        : front2d("normal") !== null,
  );

  const hasShiny =
    mode === "art"
      ? sprites.artwork.shiny !== null
      : mode === "3d"
        ? sprites.home.shiny !== null
        : front2d("shiny") !== null;
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
      src: showShiny
        ? front2d("shiny")
        : front2d("normal"),
      label: "Frente",
    },
    {
      key: "back",
      src: showShiny
        ? (sprites.anim.backShiny ?? sprites.pixel.backShiny)
        : (sprites.anim.back ?? sprites.pixel.back),
      label: "Espalda",
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
          <div className="flex items-end justify-center gap-5 pb-2">
            {pixelPair.map((sprite) => (
              <figure
                key={sprite.key}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="relative flex h-36 w-32 items-end justify-center sm:h-40 sm:w-34">
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-1/2 h-3.5 w-24 -translate-x-1/2 rounded-[50%] bg-slate-900/10 blur-[5px] dark:bg-black/50"
                  />
                  <div className="relative mb-1.5 h-[88%] w-full">
                    <Image
                      src={sprite.src as string}
                      alt={`${variantLabel} (${sprite.label.toLowerCase()})`}
                      fill
                      unoptimized={(sprite.src as string).endsWith(".gif")}
                      sizes="144px"
                      className="aura-sprite object-contain object-bottom [image-rendering:pixelated]"
                    />
                  </div>
                </div>
                <figcaption className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {sprite.label}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : mode === "3d" ? (
          <Stage3D src={single as string} alt={variantLabel} />
        ) : (
          <div className="relative aspect-square w-full max-w-70">
            <Image
              src={single as string}
              alt={variantLabel}
              fill
              priority
              sizes="280px"
              className="aura-sprite object-contain"
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
