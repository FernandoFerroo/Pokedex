/**
 * Plataforma de combate ilustrada.
 *
 * The disc the Pokémon stands on, drawn in vector with real thickness: a
 * shaded side wall, a lit surface, a material pattern (metal grid, soil,
 * sand, rock or cooled lava) and the soft elliptical contact shadow the
 * games always put under the fighter.
 */
import type { PlatformKind } from "./palettes";

/** Flat color set per material: rim light, surface, pattern ink, side wall. */
const MATERIALS: Record<
  PlatformKind,
  { rim: string; top: string; topDark: string; ink: string; side: string }
> = {
  // Césped del estadio.
  grass: {
    rim: "#a5e07a",
    top: "#77c24f",
    topDark: "#559a37",
    ink: "#43862c",
    side: "#33702a",
  },
  // Disco técnico de la cámara de simulación.
  metal: {
    rim: "#8fd4ff",
    top: "#3c5079",
    topDark: "#2b3a5c",
    ink: "#1b2540",
    side: "#161f38",
  },
};

interface PlatformProps {
  kind: PlatformKind;
  /** Sizing/positioning classes from the stage. */
  className?: string;
  /** The near platform is drawn a touch richer (more visible detail). */
  near?: boolean;
  /** Unique suffix for the gradient ids of this instance. */
  id: string;
}

/**
 * Disco 2.5D con grosor visible. El viewBox es fijo (400×140) y la elipse
 * conserva su forma en cualquier pantalla porque el contenedor fija el
 * aspecto.
 */
export function Platform2D({ kind, className, near, id }: PlatformProps) {
  const m = MATERIALS[kind];
  const uid = `pf-${id}`;
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 400 140"
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id={`${uid}-top`} cx="50%" cy="34%" r="72%">
          <stop offset="0%" stopColor={m.top} />
          <stop offset="70%" stopColor={m.topDark} />
          <stop offset="100%" stopColor={m.ink} />
        </radialGradient>
        <linearGradient id={`${uid}-side`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={m.side} />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id={`${uid}-contact`}>
          <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        {/* The surface pattern is clipped to the disc so it never spills. */}
        <clipPath id={`${uid}-clip`}>
          <ellipse cx="200" cy="62" rx="188" ry="52" />
        </clipPath>
      </defs>

      {/* Thickness: the same ellipse pushed down, in the shaded side color. */}
      <ellipse cx="200" cy="80" rx="188" ry="52" fill={`url(#${uid}-side)`} />
      {/* Surface. */}
      <ellipse cx="200" cy="62" rx="188" ry="52" fill={`url(#${uid}-top)`} />

      <g clipPath={`url(#${uid}-clip)`}>
        {kind === "metal" && (
          // Clean neon grid: concentric rings plus radial ribs, the tech
          // platform of a modern battle stadium.
          <g fill="none" stroke={m.rim} strokeOpacity={0.42}>
            <ellipse cx="200" cy="62" rx="150" ry="41" strokeWidth={2} />
            <ellipse cx="200" cy="62" rx="104" ry="28" strokeWidth={2} />
            <ellipse cx="200" cy="62" rx="56" ry="15" strokeWidth={2} />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={200 + Math.cos(a) * 40}
                  y1={62 + Math.sin(a) * 11}
                  x2={200 + Math.cos(a) * 190}
                  y2={62 + Math.sin(a) * 53}
                  strokeWidth={1.5}
                />
              );
            })}
            <circle cx="200" cy="62" r="7" fill={m.rim} stroke="none" opacity={0.8} />
          </g>
        )}
        {kind === "grass" && (
          // Organic ground: scattered specks and a couple of soil patches.
          <g>
            <ellipse cx="150" cy="52" rx="52" ry="14" fill={m.ink} opacity={0.22} />
            <ellipse cx="268" cy="80" rx="44" ry="12" fill={m.ink} opacity={0.18} />
            {Array.from({ length: 26 }, (_, i) => (
              <circle
                key={i}
                cx={30 + ((i * 137) % 340)}
                cy={26 + ((i * 61) % 72)}
                r={i % 3 === 0 ? 3 : 1.8}
                fill={i % 2 === 0 ? m.rim : m.ink}
                opacity={0.35}
              />
            ))}
          </g>
        )}
        {/* Front lip in shadow: the disc reads as a solid slab. */}
        <ellipse cx="200" cy="126" rx="188" ry="46" fill="#000000" opacity={0.22} />
      </g>

      {/* Rim light along the back edge, where the sky hits the disc. */}
      <path
        d="M22 58 A188 52 0 0 1 378 58"
        fill="none"
        stroke={m.rim}
        strokeOpacity={near ? 0.75 : 0.55}
        strokeWidth={3}
      />
      {/* Soft contact shadow where the Pokémon's feet land. */}
      <ellipse cx="200" cy="66" rx="120" ry="30" fill={`url(#${uid}-contact)`} />
    </svg>
  );
}
