"use client";

import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Model3D } from "@/components/pokemon/Model3D";
import { useT } from "@/lib/i18n/client";

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
  const { detail: d, a11y } = useT();
  const modeLabels: Record<ViewMode, string> = {
    art: d.modeArt,
    "3d": d.mode3d,
    "2d": d.mode2d,
  };
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

  // Spoken description of what is on the pedestal right now. The old value
  // ("Garchomp shiny") named the subject but not the image, so a screen
  // reader gave the artwork, the 3D model and the fallback render the exact
  // same alt text even though they are three different things.
  const variantLabel = showShiny ? a11y.shinyArtOf(name) : a11y.artOf(name);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Escaparate: resplandor ambiental + pedestal holográfico bajo la
          criatura. El aro queda fijo; la criatura levita encima. */}
      <div
        key={`${mode}-${showShiny}`}
        className="relative flex flex-1 flex-col items-center justify-center gap-2 motion-safe:animate-[fade-in_250ms_ease-out]"
      >
        <span aria-hidden className="hero-glow absolute inset-0" />
        <span
          aria-hidden
          className="holo-pedestal bottom-[4%] h-[15%] w-[76%]"
        />

        {mode === "2d" ? (
          <>
            <div className="relative flex aspect-square w-full max-w-70 items-end justify-center">
              <div className="sprite-float relative mb-6 h-[80%] w-full">
                <Image
                  src={current2d as string}
                  alt={d.spriteAlt(variantLabel, facing)}
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
                aria-label={d.spriteSideAria}
                className="absolute top-1 left-1/2 flex -translate-x-1/2 rounded-full border border-slate-700/60 bg-black/50 p-0.5 backdrop-blur-md"
              >
                {(["front", "back"] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setFacing(side)}
                    aria-pressed={facing === side}
                    className={`rounded-full px-2.5 py-1 font-mono text-[13px] font-medium tracking-wider uppercase transition ${
                      facing === side
                        ? "neon-aura"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {side === "front" ? d.front : d.back}
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
                  alt={a11y.model3dOf(name)}
                  onFail={() =>
                    setModelFailed((prev) => ({ ...prev, [variant]: true }))
                  }
                />
              )}
            </div>
            <p className="pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 font-mono text-xs whitespace-nowrap text-slate-400">
              {d.dragToRotate}
            </p>
          </>
        ) : (
          <div className="sprite-float relative aspect-square w-full max-w-70">
            <Image
              src={artworkSrc as string}
              alt={variantLabel}
              fill
              priority
              sizes="280px"
              className="object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
            />
          </div>
        )}
      </div>

      {/* Consola de cristal neón integrada al pie del escaparate. */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        <div
          role="group"
          aria-label={d.viewModeAria}
          className="flex gap-1 rounded-full border border-slate-700/40 bg-black/30 p-1 backdrop-blur-md"
        >
          {availableModes.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className="glass-btn rounded-full px-3 py-1.5 font-mono text-xs font-semibold tracking-wider uppercase"
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShiny((s) => !s)}
          disabled={!hasShiny}
          aria-pressed={showShiny}
          // The visible label is just "SHINY"; the accessible name says what
          // pressing it does, and `aria-pressed` says which state it is in.
          aria-label={hasShiny ? d.shinyToggleTitle : d.noShinyTitle}
          title={hasShiny ? d.shinyToggleTitle : d.noShinyTitle}
          style={showShiny ? ({ "--aura": "#fbbf24" } as React.CSSProperties) : undefined}
          className="glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-mono text-xs font-semibold tracking-wider uppercase disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Sparkles size={13} />
          {d.shiny}
        </button>
      </div>
    </div>
  );
}
