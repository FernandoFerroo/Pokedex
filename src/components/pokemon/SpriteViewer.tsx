"use client";

import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Model3D } from "@/components/pokemon/Model3D";

export interface SpriteSet {
  artwork: { normal: string | null; shiny: string | null };
  /** Pokémon HOME renders (póster y fallback del modo 3D). */
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
type Variant = "normal" | "shiny";

const MODE_LABELS: Record<ViewMode, string> = {
  art: "Arte",
  "3d": "3D",
  "2d": "2D",
};

/** Community glTF models keyed by National Dex id (regular + shiny). */
const MODEL_BASE =
  "https://cdn.jsdelivr.net/gh/Sudhanshu-Ambastha/Pokemon-3D-api@main/models/opt";

const modelUrl = (dexId: number, variant: Variant) =>
  `${MODEL_BASE}/${variant === "shiny" ? "shiny" : "regular"}/${dexId}.glb`;

const clamp = (value: number, limit: number) =>
  Math.min(limit, Math.max(-limit, value));

/**
 * Fallback stage when the glTF model is unavailable: the HOME render tilts in
 * perspective while dragging (CSS vars, no re-renders) and springs back.
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

  const release = () => {
    dragRef.current = null;
    stageRef.current?.classList.remove("dragging");
    setRotation(0, 0);
  };

  return (
    <div style={{ perspective: "900px" }} className="h-full w-full">
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
        onPointerUp={release}
        onPointerCancel={release}
        className="sprite-3d relative h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
      >
        <Image
          src={src}
          alt={alt}
          fill
          draggable={false}
          sizes="280px"
          className="pointer-events-none object-contain"
        />
      </div>
    </div>
  );
}

interface SpriteViewerProps {
  name: string;
  /** National Dex id — keys the 3D model files. */
  dexId: number;
  sprites: SpriteSet;
}

export function SpriteViewer({ name, dexId, sprites }: SpriteViewerProps) {
  const [mode, setMode] = useState<ViewMode>("art");
  const [shiny, setShiny] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [modelFailed, setModelFailed] = useState<Record<Variant, boolean>>({
    normal: false,
    shiny: false,
  });

  const sprite2d = (side: "front" | "back", variant: Variant) => {
    if (side === "back") {
      return variant === "shiny"
        ? (sprites.anim.backShiny ?? sprites.pixel.backShiny)
        : (sprites.anim.back ?? sprites.pixel.back);
    }
    return variant === "shiny"
      ? (sprites.anim.frontShiny ?? sprites.pixel.frontShiny)
      : (sprites.anim.front ?? sprites.pixel.front);
  };

  const availableModes = (["art", "3d", "2d"] as const).filter((m) =>
    m === "art"
      ? sprites.artwork.normal !== null
      : m === "3d"
        ? sprites.home.normal !== null
        : sprite2d("front", "normal") !== null,
  );

  const hasShiny =
    mode === "art"
      ? sprites.artwork.shiny !== null
      : mode === "3d"
        ? sprites.home.shiny !== null
        : sprite2d("front", "shiny") !== null;
  const showShiny = shiny && hasShiny;
  const variant: Variant = showShiny ? "shiny" : "normal";

  const artworkSrc = showShiny
    ? sprites.artwork.shiny
    : sprites.artwork.normal;
  const homeSrc = showShiny ? sprites.home.shiny : sprites.home.normal;

  const backSrc2d = sprite2d("back", variant);
  const current2d =
    facing === "back" ? (backSrc2d ?? sprite2d("front", variant)) : sprite2d("front", variant);

  const variantLabel = showShiny ? `${name} shiny` : name;

  return (
    <div className="flex h-full flex-col gap-4">
      <div
        key={`${mode}-${showShiny}`}
        className="flex flex-1 flex-col items-center justify-center gap-2 motion-safe:animate-[fade-in_250ms_ease-out]"
      >
        {mode === "2d" ? (
          <>
            <div className="relative flex aspect-square w-full max-w-70 items-end justify-center">
              <span
                aria-hidden
                className="absolute bottom-4 left-1/2 h-5 w-44 -translate-x-1/2 rounded-[50%] bg-slate-900/10 blur-md dark:bg-black/50"
              />
              <div className="relative mb-3 h-[86%] w-full">
                <Image
                  src={current2d as string}
                  alt={`${variantLabel} (${facing === "back" ? "espalda" : "frente"})`}
                  fill
                  unoptimized={(current2d as string).endsWith(".gif")}
                  sizes="280px"
                  className="object-contain object-bottom [image-rendering:pixelated]"
                />
              </div>
            </div>
            {backSrc2d !== null && (
              <div
                role="group"
                aria-label="Lado del sprite"
                className="flex rounded-md border border-slate-700 bg-black/50 p-0.5"
              >
                {(["front", "back"] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setFacing(side)}
                    aria-pressed={facing === side}
                    className={`rounded px-2.5 py-1 font-mono text-[13px] font-medium tracking-wider uppercase transition ${
                      facing === side
                        ? "bg-red-500/20 text-red-300 shadow-[0_0_10px_-2px_rgba(239,68,68,0.6)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {side === "front" ? "Frente" : "Espalda"}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : mode === "3d" ? (
          <>
            <div className="relative aspect-square w-full max-w-70">
              {modelFailed[variant] ? (
                <Stage3D src={homeSrc as string} alt={variantLabel} />
              ) : (
                <Model3D
                  src={modelUrl(dexId, variant)}
                  poster={homeSrc ?? undefined}
                  alt={variantLabel}
                  onFail={() =>
                    setModelFailed((prev) => ({ ...prev, [variant]: true }))
                  }
                />
              )}
            </div>
            <p className="pointer-events-none text-xs text-slate-300 dark:text-slate-400">
              Arrastra para girar
            </p>
          </>
        ) : (
          <div className="relative aspect-square w-full max-w-70">
            <Image
              src={artworkSrc as string}
              alt={variantLabel}
              fill
              priority
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
          className="flex rounded-md border border-slate-700 bg-black/50 p-0.5"
        >
          {availableModes.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`rounded px-3 py-1.5 font-mono text-xs font-medium tracking-wider uppercase transition ${
                mode === m
                  ? "bg-red-500/20 text-red-300 shadow-[0_0_10px_-2px_rgba(239,68,68,0.6)]"
                  : "text-slate-400 hover:text-slate-200"
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
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-xs font-medium tracking-wider uppercase transition disabled:cursor-not-allowed disabled:opacity-40 ${
            showShiny
              ? "border-amber-400/60 bg-amber-400/10 text-amber-300 shadow-[0_0_14px_-2px_rgba(251,191,36,0.6)]"
              : "border-slate-700 bg-black/50 text-slate-400 hover:text-amber-200"
          }`}
        >
          <Sparkles size={13} />
          Shiny
        </button>
      </div>
    </div>
  );
}
