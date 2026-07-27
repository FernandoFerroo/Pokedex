/**
 * Paletas ilustradas de la arena 2D.
 *
 * La web tiene exactamente DOS escenarios, uno por modo de juego:
 *
 *   · «estadio»    — Modo Torneo. Un estadio nocturno bajo focos, con el
 *                    graderío lleno hasta arriba, banderas, cinta LED y la
 *                    hierba segada a franjas.
 *   · «simulacion» — Modo Combate contra la IA. Una cámara de simulación:
 *                    rejilla holográfica en fuga, anillos de puntería,
 *                    paneles de datos flotando y barrido de escáner.
 *
 * No se eligen por tipo ni al azar: cada pantalla fija el suyo, así el
 * torneo siempre se siente como una final y el combate IA como un ensayo
 * dentro de la máquina.
 *
 * Cada escenario es una paleta plana. El SVG del fondo, las plataformas y
 * la pasada de luz leen de aquí, así que un entorno entero cambia editando
 * un puñado de hexes. Los colores son pocos y saturados a propósito — el
 * acabado cel-shaded sale de rellenos planos más un tono de sombra por
 * superficie, nunca de degradados haciendo el dibujo.
 */

/** Battle backdrop. One per game mode — see the module header. */
export type ScenarioKey = "estadio" | "simulacion";

/** Ambient particle system layered over the illustration. */
export type Weather = "confetti" | "stardust" | "none";

/** Surface material of the two battle platforms. */
export type PlatformKind = "grass" | "metal";

/** Dressing exclusive to the stadium: everything above the pitch. */
export interface StadiumDressing {
  /** Bowl shell: outer wall and its shaded underside. */
  shell: string;
  shellDark: string;
  /** Roof canopy and the trusses hanging off it. */
  roof: string;
  truss: string;
  /** Seating tiers, and the walkways that separate them. */
  tier: string;
  tierDark: string;
  rail: string;
  /**
   * Crowd speckle. The bowl is tinted by halves — the home end in ember red
   * and the away end in rival cyan — with a neutral mix in between, so the
   * stands read as two supporters' blocks rather than one flat texture.
   */
  crowdWarm: string[];
  crowdCool: string[];
  crowdNeutral: string[];
  /** Camera flashes popping in the stands. */
  flash: string;
  /** Floodlight mast, its lamp array and the cone it drops on the pitch. */
  mast: string;
  lamp: string;
  beam: string;
  /** Flags on the roof and the big banners hanging off the upper deck. */
  banner: string[];
  /** LED ribbon under the roof and the boards ringing the pitch. */
  led: string;
  ledAlt: string;
  /** Lighter mown stripe over the base turf. */
  stripe: string;
  /** Painted pitch markings. */
  paint: string;
}

/**
 * Fondo pintado que sustituye a la ilustración vectorial de un escenario.
 *
 * Lo genera `scripts/generate-scenery.mjs` una sola vez y se sirve desde
 * `public/`: un decorado tiene que ser idéntico en cada combate y estar en
 * pantalla antes que el primer sprite, así que no se pide en caliente.
 *
 * `horizon` es el dato que hace que encaje con el juego. Toda la escena se
 * apoya en una única línea de suelo, y las figuras se colocan respecto a
 * ella; declarando dónde cae en la imagen, `Scenery` la escala y la desplaza
 * hasta hacerla coincidir con la del lienzo. Cambia si se regenera el fondo:
 * mídela sobre el archivo nuevo y actualízala aquí.
 */
export interface Backdrop {
  /** Ruta pública del archivo. */
  src: string;
  /** Borde lejano del campo, en fracción del alto de la imagen (0-1). */
  horizon: number;
  /** Relación ancho/alto de la imagen. */
  aspect: number;
}

/** Dressing exclusive to the simulation chamber. */
export interface SimDressing {
  /** Wireframe floor grid: bright lines and their dimmer neighbours. */
  line: string;
  lineSoft: string;
  /** Horizon bar, targeting rings and the vertical shafts. */
  glow: string;
  shaft: string;
  /** Floating data panels: body, edge and the "text" inside them. */
  panel: string;
  panelEdge: string;
  ink: string;
  /** Scanlines and the sweep that travels down the chamber. */
  scan: string;
}

export interface ScenarioPalette {
  /** Picks which illustration Scenery draws behind the shared chrome. */
  kind: "stadium" | "sim";
  /** Four sky bands, painted top → horizon. */
  sky: [string, string, string, string];
  /** Haze sitting right on the horizon line. */
  horizonHaze: string;
  stars: boolean;
  /** Ground plane: lit top, mid body and shaded front lip. */
  ground: [string, string, string];
  /** Blades and tufts scattered over the field. */
  detail: { blade: string; bladeDark: string; accent: string };
  /** Pool of light cast over the battlefield. */
  lightPool: string;
  /** Overall color grade laid over the whole illustration. */
  grade: string;
  weather: Weather;
  platform: PlatformKind;
  /**
   * Cuando está, `Scenery` pinta esta imagen en lugar del cielo y la
   * ilustración vectorial del escenario. La paleta sigue haciendo falta: la
   * pasada de luz, las plataformas y las partículas leen de ella, y sin
   * fondo pintado el vector vuelve a ser el decorado.
   */
  backdrop?: Backdrop;
  stadium?: StadiumDressing;
  sim?: SimDressing;
}

export const PALETTES: Record<ScenarioKey, ScenarioPalette> = {
  estadio: {
    kind: "stadium",
    // Anochecer sobre el cuenco: índigo profundo arriba que se calienta al
    // acercarse al borde del tejado, donde arrancan los focos.
    sky: ["#050818", "#101a44", "#26306c", "#5b4f96"],
    horizonHaze: "#ffd3a0",
    stars: true,
    ground: ["#4f9f48", "#3c8038", "#295b27"],
    detail: { blade: "#63b455", bladeDark: "#2f6b2c", accent: "#eaffd0" },
    lightPool: "rgba(255, 248, 216, 0.24)",
    grade: "rgba(56, 40, 108, 0.1)",
    weather: "confetti",
    platform: "grass",
    // Estadio nocturno renderizado, generado con el modelo del proyecto. El
    // césped arranca al 47.9% del alto de la imagen — ahí está su horizonte.
    backdrop: {
      src: "/scenery/estadio.webp",
      horizon: 0.479,
      aspect: 1536 / 1024,
    },
    stadium: {
      shell: "#1a2049",
      shellDark: "#0c1029",
      roof: "#0f1430",
      truss: "#334084",
      tier: "#222a5c",
      tierDark: "#161c3e",
      rail: "#46539a",
      crowdWarm: ["#f2726a", "#ff9d6b", "#ffd166", "#e05a5a"],
      crowdCool: ["#5ad3ff", "#4aa8e0", "#8ee0ff", "#6c7dff"],
      crowdNeutral: ["#d3dae9", "#8e97b8", "#f5efe2", "#a7b0cc"],
      flash: "#ffffff",
      mast: "#0b0f24",
      lamp: "#fffbe6",
      beam: "#ffeec4",
      banner: ["#ef4444", "#22d3ee", "#fbbf24", "#a78bfa"],
      led: "#ef4444",
      ledAlt: "#22d3ee",
      stripe: "#59ac4f",
      paint: "#eaf7ea",
    },
  },
  simulacion: {
    kind: "sim",
    // Cámara a oscuras: el vacío solo se ilumina donde hay malla o dato.
    sky: ["#01030a", "#040a1a", "#07162c", "#0c2b48"],
    horizonHaze: "#4fd6ff",
    stars: false,
    ground: ["#0a1c33", "#061021", "#020610"],
    detail: { blade: "#1d4f70", bladeDark: "#0c2337", accent: "#7ef0ff" },
    lightPool: "rgba(72, 196, 255, 0.26)",
    grade: "rgba(8, 30, 68, 0.16)",
    weather: "stardust",
    platform: "metal",
    sim: {
      line: "#3fc9ff",
      lineSoft: "#1a6790",
      glow: "#8aeeff",
      shaft: "#38bdf8",
      panel: "#08243c",
      panelEdge: "#3fc9ff",
      ink: "#8ee6ff",
      scan: "#7dd3fc",
    },
  },
};
