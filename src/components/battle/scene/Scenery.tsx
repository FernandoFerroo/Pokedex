/**
 * Ilustración 2D del escenario de combate.
 *
 * Two vector illustrations, one per game mode: the floodlit stadium of the
 * tournament and the holographic chamber of the AI battle. Both are built
 * back-to-front the way a painted background is — sky, structure, field,
 * light pass — and both share the same chrome (sky gradient, horizon haze,
 * light pool, grade, vignette) so they sit in the frame identically.
 *
 * Everything is flat color — no textures, no photographic assets — so it
 * stays razor sharp at any size and weighs nothing.
 *
 * The whole scene lives in one 1600×900 viewBox and is sliced to fill the
 * arena, so the composition holds from a phone to an ultrawide monitor.
 */
import type { Backdrop, ScenarioKey, ScenarioPalette } from "./palettes";
import { PALETTES } from "./palettes";

/** Horizon line inside the viewBox; every layer is placed around it. */
const HORIZON = 470;

/**
 * Coloca un fondo pintado dentro del lienzo de 1600×900 haciendo coincidir su
 * horizonte con el de la escena.
 *
 * Es la pieza que permite cambiar el decorado sin tocar el juego: `BattleStage2D`
 * apoya a los tres personajes sobre `HORIZON`, así que una imagen cuyo césped
 * empiece en otro sitio los dejaría flotando sobre el graderío. Se escala al
 * mayor de tres mínimos — cubrir el ancho, no dejar hueco por arriba, no
 * dejarlo por abajo — y se desplaza hasta que su horizonte cae en la línea.
 */
function backdropBox({ horizon, aspect }: Backdrop) {
  const height = Math.max(
    1600 / aspect,
    HORIZON / horizon,
    (900 - HORIZON) / (1 - horizon),
  );
  const width = height * aspect;
  return {
    x: (1600 - width) / 2,
    y: HORIZON - horizon * height,
    width,
    height,
  };
}

/**
 * Deterministic 0-1 spread (no Math.random: SSR and client must agree).
 * A sine hash rather than a linear congruence — the latter lines its
 * outputs up on a diagonal, which showed as neat rows of "stars".
 */
function rnd(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Pick from a list with the same deterministic hash. */
function pick<T>(list: T[], i: number, salt: number): T {
  return list[Math.floor(rnd(i, salt) * list.length) % list.length];
}

/* ------------------------------------------------------------------ */
/* Shared sky                                                          */
/* ------------------------------------------------------------------ */

/** Star field: three sizes, twinkling out of phase. */
function Stars({ id }: { id: string }) {
  return (
    <g>
      {Array.from({ length: 90 }, (_, i) => {
        const x = rnd(i, 7) * 1600;
        const y = rnd(i, 13) * (HORIZON - 60);
        const r = 1 + rnd(i, 23) * 2.2;
        return (
          <circle
            key={`${id}-${i}`}
            cx={x}
            cy={y}
            r={r}
            fill="#fdfdff"
            opacity={0.35 + rnd(i, 31) * 0.6}
            className="pk-star"
            style={{ animationDelay: `${rnd(i, 41) * 4}s` }}
          />
        );
      })}
      {/* A couple of brighter beacons, drawn as four-point sparkles. */}
      {[
        [240, 120, 16],
        [1180, 96, 20],
        [860, 210, 12],
      ].map(([x, y, s], i) => (
        <path
          key={`${id}-spark-${i}`}
          d={`M${x} ${y - s} Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z`}
          fill="#ffffff"
          className="pk-star"
          style={{ animationDelay: `${i * 1.3}s` }}
        />
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Stadium                                                             */
/* ------------------------------------------------------------------ */

/**
 * The bowl wraps toward the camera, so every tier line sits flat across the
 * middle and lifts at the left and right edges. `t⁴` keeps the run flat for
 * most of the width and then climbs fast at the ends, which is what a wide
 * lens sees inside an oval stand.
 *
 * Both the band shapes and the crowd dots are derived from this one function,
 * so the seating can never drift off its own steps.
 */
function bowlY(x: number, base: number, lift: number): number {
  const t = Math.min(1, Math.abs(x - 800) / 880);
  return base + lift * 0.15 - lift * 1.15 * t ** 4;
}

/** Sampled polyline across the full width, left → right. */
function bowlPoints(base: number, lift: number): [number, number][] {
  return Array.from({ length: 25 }, (_, i) => {
    const x = -80 + (i / 24) * 1760;
    return [x, bowlY(x, base, lift)] as [number, number];
  });
}

/** Closed band between two bowl curves, ready to fill. */
function bandPath(top: number, bottom: number, lift: number): string {
  const up = bowlPoints(top, lift);
  const down = bowlPoints(bottom, lift).reverse();
  return [
    `M${up[0][0]} ${up[0][1]}`,
    ...up.slice(1).map(([x, y]) => `L${x} ${y}`),
    `L${down[0][0]} ${down[0][1]}`,
    ...down.slice(1).map(([x, y]) => `L${x} ${y}`),
    "Z",
  ].join(" ");
}

/** Single bowl line, for rails and fascia edges. */
function linePath(base: number, lift: number): string {
  const pts = bowlPoints(base, lift);
  return [
    `M${pts[0][0]} ${pts[0][1]}`,
    ...pts.slice(1).map(([x, y]) => `L${x} ${y}`),
  ].join(" ");
}

/** Vertical extent of each seating deck, back (highest) to front. */
const TIERS = [
  { top: 200, bottom: 292, lift: 128, dots: 150 },
  { top: 302, bottom: 388, lift: 112, dots: 130 },
  { top: 398, bottom: 452, lift: 96, dots: 96 },
];

/**
 * Graderío lleno. La densidad real la pone un patrón de puntos (miles de
 * asientos por unos pocos nodos); encima van unos cientos de manchas de
 * color y los flashes de las cámaras, que son los que dan vida.
 */
function Crowd({ p, id }: { p: ScenarioPalette; id: string }) {
  const s = p.stadium!;
  return (
    <g>
      {TIERS.map((tier, ti) => {
        const path = bandPath(tier.top, tier.bottom, tier.lift);
        return (
          <g key={`${id}-tier-${ti}`}>
            {/* Concrete of the deck, then the seated mass over it. */}
            <path d={path} fill={ti === 1 ? s.tierDark : s.tier} />
            <path d={path} fill={`url(#${id}-seats)`} opacity={0.9} />
            {/* Home end in ember, away end in cyan: the bowl reads as two
                supporters' blocks with a neutral mix at the halfway line. */}
            <path d={path} fill={`url(#${id}-ends)`} opacity={0.38} />
            {/* Front rail of the deck, catching the floodlights. */}
            <path
              d={linePath(tier.bottom, tier.lift)}
              fill="none"
              stroke={s.rail}
              strokeWidth={4}
              opacity={0.85}
            />
          </g>
        );
      })}

      {/* Colour on top of the pattern: individual supporters. */}
      {TIERS.flatMap((tier, ti) =>
        Array.from({ length: tier.dots }, (_, i) => {
          const k = ti * 400 + i;
          const x = -60 + rnd(k, 3) * 1720;
          const y =
            bowlY(x, tier.top, tier.lift) +
            8 +
            rnd(k, 9) * (tier.bottom - tier.top - 14);
          // Which block this seat belongs to decides its wardrobe.
          const side = x < 640 ? s.crowdWarm : x > 960 ? s.crowdCool : s.crowdNeutral;
          return (
            <circle
              key={`${id}-c-${k}`}
              cx={x}
              cy={y}
              r={2 + rnd(k, 15) * 1.4}
              fill={pick(side, k, 21)}
              opacity={0.5 + rnd(k, 27) * 0.5}
            />
          );
        }),
      )}

      {/* Flashes: the detail that makes a still crowd feel like 40.000
          people. They reuse the star twinkle, out of phase. */}
      {Array.from({ length: 30 }, (_, i) => {
        const tier = TIERS[i % 3];
        const x = -40 + rnd(i, 33) * 1680;
        const y =
          bowlY(x, tier.top, tier.lift) +
          6 +
          rnd(i, 39) * (tier.bottom - tier.top - 12);
        return (
          <circle
            key={`${id}-f-${i}`}
            cx={x}
            cy={y}
            r={3.4}
            fill={s.flash}
            className="pk-star"
            style={{ animationDelay: `${rnd(i, 45) * 5}s` }}
          />
        );
      })}
    </g>
  );
}

/** Top and bottom of the roof canopy, and how hard it lifts at the edges. */
const ROOF = { top: 88, bottom: 176, lift: 210 };

/**
 * Floodlight mast: lamp array over a lattice column that runs down behind
 * the canopy. The column stops just inside the roof line at its own `x`, so
 * the mast reads as standing outside the bowl at every width.
 */
function Mast({
  x,
  top,
  p,
  id,
}: {
  x: number;
  top: number;
  p: ScenarioPalette;
  id: string;
}) {
  const s = p.stadium!;
  const headH = 58;
  const headW = 126;
  const foot = bowlY(x, ROOF.top, ROOF.lift) + 16;
  return (
    <g>
      <path
        d={`M${x - 9} ${top + headH} L${x + 9} ${top + headH} L${x + 16} ${foot} L${x - 16} ${foot} Z`}
        fill={s.mast}
      />
      <line
        x1={x - 10}
        y1={top + headH + 6}
        x2={x + 12}
        y2={foot}
        stroke={s.truss}
        strokeWidth={2.5}
        opacity={0.7}
      />
      {/* Bloom, then the lamp box and its bulbs. */}
      <circle cx={x} cy={top + headH / 2} r={158} fill={`url(#${id}-lampglow)`} />
      <rect
        x={x - headW / 2}
        y={top}
        width={headW}
        height={headH}
        rx={8}
        fill={s.mast}
        stroke={s.truss}
        strokeWidth={2}
      />
      {Array.from({ length: 12 }, (_, i) => (
        <circle
          key={`${id}-bulb-${i}`}
          cx={x - headW / 2 + 18 + (i % 4) * 30}
          cy={top + 16 + Math.floor(i / 4) * 15}
          r={6.5}
          fill={s.lamp}
          opacity={0.95}
        />
      ))}
    </g>
  );
}

/** Volumetric cone dropping from a mast onto the pitch. */
function Beam({ x, top, id }: { x: number; top: number; id: string }) {
  const spread = 470;
  return (
    <path
      d={`M${x - 62} ${top} L${x + 62} ${top} L${x + spread} 940 L${x - spread} 940 Z`}
      fill={`url(#${id}-beam)`}
    />
  );
}

/** Mown turf, painted markings and the tufts closest to the camera. */
function Turf({ p, id }: { p: ScenarioPalette; id: string }) {
  const s = p.stadium!;
  return (
    <g>
      <path
        d={`M-80 ${HORIZON} L1680 ${HORIZON} L1680 940 L-80 940 Z`}
        fill={p.ground[1]}
      />
      {/* Mown stripes converge on the vanishing point, like a real pitch
          seen across its width. Every other wedge is left unpainted. */}
      <g clipPath={`url(#${id}-pitch)`}>
        {Array.from({ length: 13 }, (_, i) =>
          i % 2 === 0 ? null : (
            <path
              key={`${id}-stripe-${i}`}
              d={`M800 ${HORIZON} L${-900 + i * 260} 940 L${-900 + (i + 1) * 260} 940 Z`}
              fill={s.stripe}
              opacity={0.55}
            />
          ),
        )}
        {/* Lit crest hugging the horizon, then the shaded front lip. */}
        <path
          d={`M-80 ${HORIZON} L1680 ${HORIZON} L1680 ${HORIZON + 62} L-80 ${HORIZON + 62} Z`}
          fill={p.ground[0]}
          opacity={0.5}
        />
        <path d={`M-80 830 L1680 830 L1680 940 L-80 940 Z`} fill={p.ground[2]} opacity={0.5} />
        {/* Markings: halfway arc and the centre circle. */}
        <ellipse
          cx={800}
          cy={706}
          rx={330}
          ry={96}
          fill="none"
          stroke={s.paint}
          strokeWidth={5}
          opacity={0.3}
        />
        <path
          d={`M-80 ${HORIZON + 128} Q800 ${HORIZON + 96} 1680 ${HORIZON + 128}`}
          fill="none"
          stroke={s.paint}
          strokeWidth={4}
          opacity={0.22}
        />
      </g>
      {/* Blades of grass, bigger and sparser toward the camera. */}
      {Array.from({ length: 54 }, (_, i) => {
        const row = i % 3;
        const y = HORIZON + 96 + row * 130 + rnd(i, 37) * 76;
        const x = rnd(i, 53) * 1760 - 80;
        const sc = (0.6 + row * 0.6) * (0.75 + rnd(i, 61) * 0.7);
        return (
          <g key={`${id}-t-${i}`} transform={`translate(${x} ${y}) scale(${sc})`}>
            <path
              d="M0 0 C -2 -12 -8 -18 -14 -22 C -6 -20 -2 -12 0 0 Z"
              fill={p.detail.bladeDark}
            />
            <path
              d="M0 0 C 1 -14 1 -22 0 -30 C 4 -22 4 -12 3 0 Z"
              fill={p.detail.blade}
            />
            <path
              d="M2 0 C 4 -12 9 -17 15 -21 C 8 -18 5 -11 4 0 Z"
              fill={p.detail.bladeDark}
            />
          </g>
        );
      })}
    </g>
  );
}

/**
 * Masts stand outside the bowl, clear of the centre where the HUD sits.
 * Their heads are kept above the roof line at their own `x` — the canopy
 * lifts toward the edges, so the outer pair has to be raised with it.
 */
const MASTS = [
  { x: 258, top: 14 },
  { x: 630, top: 4 },
  { x: 970, top: 4 },
  { x: 1342, top: 14 },
];

/** Estadio nocturno: cuenco lleno, focos, cinta LED y césped a franjas. */
function StadiumScene({ p, id }: { p: ScenarioPalette; id: string }) {
  const s = p.stadium!;
  return (
    <g>
      {/* Masts first: the canopy crops their columns, which is what puts
          them outside the bowl instead of floating over the crowd. */}
      {MASTS.map((m) => (
        <Mast key={`${id}-m-${m.x}`} x={m.x} top={m.top} p={p} id={id} />
      ))}

      {/* Roof canopy, with the trusses hanging off its underside. */}
      <path d={bandPath(ROOF.top, ROOF.bottom, ROOF.lift)} fill={s.roof} />
      <g stroke={s.truss} strokeWidth={3} opacity={0.45}>
        {Array.from({ length: 15 }, (_, i) => {
          const x = -40 + i * 122;
          return (
            <line
              key={`${id}-tr-${i}`}
              x1={x}
              y1={bowlY(x, ROOF.top, ROOF.lift) + 8}
              x2={x}
              y2={bowlY(x, ROOF.bottom, ROOF.lift)}
            />
          );
        })}
      </g>
      {/* Flags planted along the leading edge of the canopy. */}
      {Array.from({ length: 16 }, (_, i) => {
        const x = -20 + i * 110;
        const y = bowlY(x, ROOF.top, ROOF.lift);
        return (
          <g key={`${id}-flag-${i}`}>
            <line x1={x} y1={y - 46} x2={x} y2={y} stroke={s.truss} strokeWidth={2.5} />
            <path
              d={`M${x} ${y - 46} L${x + 32} ${y - 37} L${x} ${y - 28} Z`}
              fill={pick(s.banner, i, 5)}
              opacity={0.9}
            />
          </g>
        );
      })}

      {/* LED ribbon under the roof: alternating red and cyan panels, the
          brightest line in the bowl. */}
      <path d={bandPath(178, 200, 170)} fill={s.shellDark} />
      <path d={bandPath(180, 197, 170)} fill={`url(#${id}-led)`} opacity={0.85} />

      {/* Seating. */}
      <Crowd p={p} id={id} />

      {/* Big banners hanging off the upper deck. */}
      {[
        { x: 236, c: 0 },
        { x: 1330, c: 1 },
      ].map((b, i) => (
        <g key={`${id}-banner-${i}`}>
          <rect
            x={b.x - 34}
            y={bowlY(b.x, 292, 128)}
            width={68}
            height={128}
            fill={s.banner[b.c]}
            opacity={0.85}
          />
          <path
            d={`M${b.x - 34} ${bowlY(b.x, 292, 128) + 128} L${b.x} ${bowlY(b.x, 292, 128) + 106} L${b.x + 34} ${bowlY(b.x, 292, 128) + 128} Z`}
            fill={s.shellDark}
          />
          <circle
            cx={b.x}
            cy={bowlY(b.x, 292, 128) + 54}
            r={20}
            fill="none"
            stroke="#ffffff"
            strokeWidth={5}
            opacity={0.75}
          />
        </g>
      ))}

      {/* Boards ringing the pitch, right on the horizon. */}
      <path d={bandPath(452, 474, 90)} fill={s.shellDark} />
      <path d={bandPath(454, 472, 90)} fill={`url(#${id}-led)`} opacity={0.6} />

      {/* Pitch. */}
      <Turf p={p} id={id} />

      {/* Light cones last, so they wash over crowd and grass alike. */}
      <g opacity={0.42}>
        {MASTS.map((m) => (
          <Beam key={`${id}-b-${m.x}`} x={m.x} top={m.top + 40} id={id} />
        ))}
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Simulation                                                          */
/* ------------------------------------------------------------------ */

/** Floating readout: header bar plus a few lines of stand-in data. */
function DataPanel({
  x,
  y,
  w,
  h,
  p,
  delay,
  id,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  p: ScenarioPalette;
  delay: number;
  id: string;
}) {
  const s = p.sim!;
  return (
    <g
      className="sprite-float"
      style={{ animationDelay: `${delay}s` }}
      opacity={0.75}
    >
      <rect x={x} y={y} width={w} height={h} rx={6} fill={s.panel} opacity={0.75} />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill="none"
        stroke={s.panelEdge}
        strokeWidth={1.6}
        opacity={0.8}
      />
      <rect x={x} y={y} width={w} height={14} rx={6} fill={s.panelEdge} opacity={0.32} />
      {Array.from({ length: 4 }, (_, i) => (
        <rect
          key={`${id}-l-${i}`}
          x={x + 10}
          y={y + 26 + i * 13}
          width={(w - 20) * (0.4 + rnd(i, 7) * 0.55)}
          height={4}
          rx={2}
          fill={s.ink}
          opacity={0.5}
        />
      ))}
    </g>
  );
}

/** Cámara de simulación: rejilla en fuga, anillos y paneles de datos. */
function SimScene({ p, id }: { p: ScenarioPalette; id: string }) {
  const s = p.sim!;
  return (
    <g>
      {/* Sparse data motes standing in for a star field. */}
      {Array.from({ length: 46 }, (_, i) => (
        <circle
          key={`${id}-mote-${i}`}
          cx={rnd(i, 7) * 1600}
          cy={rnd(i, 13) * (HORIZON - 40)}
          r={1 + rnd(i, 23) * 1.6}
          fill={s.glow}
          opacity={0.18 + rnd(i, 31) * 0.4}
          className="pk-star"
          style={{ animationDelay: `${rnd(i, 41) * 5}s` }}
        />
      ))}

      {/* Containment dome: latitude arcs plus meridians, barely there. */}
      <g fill="none" stroke={s.lineSoft} strokeWidth={1.6} opacity={0.5}>
        {[110, 200, 290, 380].map((y, i) => (
          <path
            key={`${id}-lat-${i}`}
            d={`M-40 ${y + 70} Q800 ${y - 90} 1640 ${y + 70}`}
          />
        ))}
        {Array.from({ length: 9 }, (_, i) => {
          const x = 60 + i * 185;
          return (
            <path
              key={`${id}-mer-${i}`}
              d={`M${x} ${HORIZON} Q${800 + (x - 800) * 0.32} 70 ${800 + (x - 800) * 0.12} 20`}
            />
          );
        })}
      </g>

      {/* Vertical shafts rising off the grid. */}
      <g opacity={0.75}>
        {[300, 520, 800, 1080, 1300].map((x, i) => (
          <path
            key={`${id}-sh-${i}`}
            d={`M${x - 26} ${HORIZON + 30} L${x + 26} ${HORIZON + 30} L${x + 54} 940 L${x - 54} 940 Z`}
            fill={`url(#${id}-shaft)`}
          />
        ))}
      </g>

      {/* Horizon bar: the bright seam where floor meets void. */}
      <rect x={-40} y={HORIZON - 34} width={1680} height={68} fill={`url(#${id}-seam)`} />
      <path
        d={`M-40 ${HORIZON} L1640 ${HORIZON}`}
        stroke={s.glow}
        strokeWidth={2.5}
        opacity={0.85}
      />

      {/* Floor plane. */}
      <path
        d={`M-80 ${HORIZON} L1680 ${HORIZON} L1680 940 L-80 940 Z`}
        fill={p.ground[1]}
      />

      {/* Wireframe grid: rails converging on the vanishing point, and rungs
          whose spacing opens up toward the camera. */}
      <g clipPath={`url(#${id}-floor)`}>
        <g stroke={s.line} strokeWidth={1.8} opacity={0.58}>
          {Array.from({ length: 25 }, (_, i) => (
            <line
              key={`${id}-rail-${i}`}
              x1={800}
              y1={HORIZON}
              x2={-2000 + i * 220}
              y2={940}
            />
          ))}
        </g>
        <g stroke={s.line} fill="none">
          {Array.from({ length: 15 }, (_, i) => {
            const y = HORIZON + 470 * (i / 14) ** 2.3;
            return (
              <path
                key={`${id}-rung-${i}`}
                d={`M-80 ${y} Q800 ${y - 10 - i} 1680 ${y}`}
                strokeWidth={1.2 + i * 0.16}
                opacity={0.28 + i * 0.042}
              />
            );
          })}
        </g>
        {/* Targeting rings under the fighters. */}
        <g fill="none" stroke={s.glow} opacity={0.42}>
          <ellipse cx={800} cy={720} rx={520} ry={150} strokeWidth={2.4} />
          <ellipse cx={800} cy={720} rx={340} ry={98} strokeWidth={2} />
          <ellipse
            cx={800}
            cy={720}
            rx={170}
            ry={49}
            strokeWidth={1.6}
            strokeDasharray="14 12"
          />
        </g>
      </g>

      {/* Readouts, kept to the edges so they never crowd the fighters. */}
      <DataPanel x={188} y={168} w={186} h={96} p={p} delay={0} id={`${id}-p0`} />
      <DataPanel x={214} y={292} w={138} h={76} p={p} delay={1.4} id={`${id}-p1`} />
      <DataPanel x={1232} y={150} w={192} h={102} p={p} delay={0.7} id={`${id}-p2`} />
      <DataPanel x={1264} y={280} w={146} h={72} p={p} delay={2.1} id={`${id}-p3`} />

      {/* Scanlines over the whole render, then the sweep travelling down it. */}
      <rect width="1600" height="900" fill={`url(#${id}-scanlines)`} opacity={0.5} />
      <rect
        className="pk-sim-sweep"
        x={0}
        y={-120}
        width="1600"
        height="120"
        fill={`url(#${id}-sweep)`}
      />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Scenery                                                             */
/* ------------------------------------------------------------------ */

/**
 * Fondo ilustrado completo del combate. `scenario` elige entre las dos
 * únicas escenas de la web: el estadio del torneo y la cámara de simulación
 * del combate contra la IA.
 */
export function Scenery({ scenario }: { scenario: ScenarioKey }) {
  const p = PALETTES[scenario];
  // Gradient ids are namespaced per scenario: two backdrops overlap during
  // the crossfade, and duplicated ids would cross-wire their fills.
  const id = `sc-${scenario}`;
  const s = p.stadium;
  const sim = p.sim;
  return (
    <svg
      aria-hidden
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.sky[0]} />
          <stop offset="38%" stopColor={p.sky[1]} />
          <stop offset="72%" stopColor={p.sky[2]} />
          <stop offset="100%" stopColor={p.sky[3]} />
        </linearGradient>
        <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.horizonHaze} stopOpacity="0" />
          <stop offset="70%" stopColor={p.horizonHaze} stopOpacity="0.34" />
          <stop offset="100%" stopColor={p.horizonHaze} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-pool`}>
          <stop offset="0%" stopColor={p.lightPool} />
          <stop offset="100%" stopColor={p.lightPool} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-vignette`}>
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>

        {s && (
          <>
            {/* Thousands of seats for a handful of nodes: the tile repeats
                under every deck and the colour dots go on top of it. */}
            {/* Rotated off the axis on purpose: square to the tiers the
                tile repeat showed as a diagonal moiré across the stands. */}
            <pattern
              id={`${id}-seats`}
              width={11}
              height={9}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(11)"
            >
              <circle cx={2.5} cy={2.5} r={1.7} fill={s.crowdNeutral[1]} opacity={0.8} />
              <circle cx={7.5} cy={4} r={1.5} fill={s.crowdNeutral[0]} opacity={0.55} />
              <circle cx={4.5} cy={7} r={1.6} fill={s.crowdNeutral[3]} opacity={0.65} />
              <circle cx={9.5} cy={7.5} r={1.3} fill={s.crowdNeutral[2]} opacity={0.45} />
            </pattern>
            <linearGradient id={`${id}-ends`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={s.crowdWarm[3]} stopOpacity="0.75" />
              <stop offset="34%" stopColor={s.crowdWarm[0]} stopOpacity="0.28" />
              <stop offset="50%" stopColor={s.crowdNeutral[1]} stopOpacity="0.05" />
              <stop offset="66%" stopColor={s.crowdCool[1]} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.crowdCool[3]} stopOpacity="0.75" />
            </linearGradient>
            <pattern
              id={`${id}-led`}
              width={96}
              height={40}
              patternUnits="userSpaceOnUse"
            >
              <rect width={48} height={40} fill={s.led} />
              <rect x={48} width={48} height={40} fill={s.ledAlt} />
            </pattern>
            <radialGradient id={`${id}-lampglow`}>
              <stop offset="0%" stopColor={s.lamp} stopOpacity="0.55" />
              <stop offset="40%" stopColor={s.beam} stopOpacity="0.18" />
              <stop offset="100%" stopColor={s.beam} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.beam} stopOpacity="0.3" />
              <stop offset="55%" stopColor={s.beam} stopOpacity="0.09" />
              <stop offset="100%" stopColor={s.beam} stopOpacity="0" />
            </linearGradient>
            <clipPath id={`${id}-pitch`}>
              <rect x={-80} y={HORIZON} width={1760} height={470} />
            </clipPath>
          </>
        )}

        {sim && (
          <>
            <linearGradient id={`${id}-seam`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={sim.glow} stopOpacity="0" />
              <stop offset="50%" stopColor={sim.glow} stopOpacity="0.6" />
              <stop offset="100%" stopColor={sim.glow} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${id}-shaft`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={sim.shaft} stopOpacity="0.3" />
              <stop offset="100%" stopColor={sim.shaft} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${id}-sweep`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={sim.scan} stopOpacity="0" />
              <stop offset="50%" stopColor={sim.scan} stopOpacity="0.16" />
              <stop offset="100%" stopColor={sim.scan} stopOpacity="0" />
            </linearGradient>
            <pattern
              id={`${id}-scanlines`}
              width={4}
              height={4}
              patternUnits="userSpaceOnUse"
            >
              <rect width={4} height={1.2} fill={sim.scan} opacity={0.14} />
            </pattern>
            <clipPath id={`${id}-floor`}>
              <rect x={-80} y={HORIZON} width={1760} height={470} />
            </clipPath>
          </>
        )}
      </defs>

      {p.backdrop ? (
        // Decorado pintado: trae su propio cielo, estructura y campo, y su
        // horizonte ya viene alineado con el de la escena. Se pinta sobre
        // negro porque es opaco y cubre el lienzo entero.
        <image
          {...backdropBox(p.backdrop)}
          href={p.backdrop.src}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <>
          {/* Sky */}
          <rect width="1600" height="900" fill={`url(#${id}-sky)`} />
          {p.stars && <Stars id={id} />}

          {p.kind === "stadium" ? (
            <StadiumScene p={p} id={id} />
          ) : (
            <SimScene p={p} id={id} />
          )}

          {/* Haze that separates distance from field. Sólo para el vector: la
              imagen ya trae su propia bruma de profundidad, y una banda cálida
              encima le queda como un borrón sobre el césped. */}
          <rect
            x="0"
            y={HORIZON - 40}
            width="1600"
            height="110"
            fill={`url(#${id}-haze)`}
          />
        </>
      )}

      {/* Light pass: a pool over the battlefield, a grade over the whole
          illustration and a vignette to seat it in the frame. */}
      <ellipse
        cx={620}
        cy={HORIZON + 210}
        rx={900}
        ry={330}
        fill={`url(#${id}-pool)`}
      />
      <rect width="1600" height="900" fill={p.grade} />
      <rect width="1600" height="900" fill={`url(#${id}-vignette)`} />
    </svg>
  );
}
