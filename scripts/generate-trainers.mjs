/**
 * Pinta a los cinco Entrenadores de la escalera del torneo y los guarda en
 * `public/trainers/`.
 *
 *   node scripts/generate-trainers.mjs          # los cinco
 *   node scripts/generate-trainers.mjs rhea     # sólo uno
 *
 * Van pintados de antemano, no en caliente, por tres razones: son personajes
 * fijos (ver `LADDER` en src/lib/tournament/config.ts), tienen que estar en
 * pantalla en el primer fotograma del combate, y — la que importa — sólo se
 * puede dirigir el arte si se mira el resultado. Un retrato distinto cada
 * partida es un retrato que nadie ha revisado.
 *
 * De cada uno salen dos piezas:
 *   · `-field`  recorte de cuerpo entero, el que se planta en el campo;
 *   · `-bust`   busto, para el cuadro del torneo y el bocadillo de diálogo.
 *
 * ART DIRECTION — es el grueso del guion, y por un motivo. El problema de una
 * figura generada suelta no es que esté mal dibujada: es que viene con su
 * propia luz, y al soltarla sobre el estadio se nota que no estaba allí. Así
 * que el prompt no describe al personaje, describe LA ESCENA EN LA QUE ESTÁ
 * DE PIE: de dónde viene la luz principal, qué le recorta el contorno, qué le
 * rebota desde el césped y con qué gama se ha revelado. Los cinco comparten
 * ese bloque palabra por palabra, que es lo que hace que parezcan pintados en
 * la misma tarde y sobre el mismo campo.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { apiKey, generateImage } from "./lib/openai-image.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "trainers");

/**
 * La luz del estadio, idéntica para los cinco. Describe el mismo sitio que
 * `public/scenery/estadio.webp`: focos cálidos altos, cinta LED roja y cian a
 * los lados y césped verde debajo devolviendo rebote.
 */
const STADIUM_LIGHT = `LIGHTING AND INTEGRATION — this character is standing on the turf of a floodlit night stadium, and must be lit by that stadium and nothing else. Key light: a hard, warm white floodlight from high above and slightly behind the left shoulder, throwing crisp highlights on the head, shoulders and the tops of the arms, and dropping the eye sockets and the underside of the chin into shadow. Rim light: a cool cyan edge tracing the right-hand contour and a deep red edge on the left, both spilling from the stadium's LED ribbon boards far behind. Bounce: a soft, dim green fill washing up the shins, the underside of the arms and the jaw, reflected off the grass. Shadows are deep indigo-teal, never grey and never black; highlights are warm amber-white. Faint atmospheric haze and a gentle lens bloom on the brightest edges, as if photographed through the same humid night air as the stadium behind. Colour grade: cool teal shadows, warm amber highlights, rich contrast, cinematic.

STYLE — a character render from a modern AAA console game: believable materials (woven fabric, worn leather, scuffed rubber, skin with real subsurface warmth), grounded anatomy, slightly heightened heroic proportions. Not anime cel shading, not flat vector, not cartoon, not pixel art. No outline or stroke around the figure of any kind.`;

/** Encuadre del recorte de cuerpo entero. */
const FIELD_FRAMING = `FRAMING — full body, head to feet, entire figure inside the frame with a small margin, centred. Standing at ease on level ground, weight on one leg, turned three-quarters toward the viewer's LEFT, looking off to the left at an opponent out of frame. Camera low, roughly at hip height, almost level. Cut out on a FULLY TRANSPARENT background: no ground, no floor, no grass, no cast shadow, no scenery, no backdrop, no vignette, no frame, no platform under the feet — the figure alone, nothing else. No text, letters, numbers, logos, watermarks or signatures anywhere.`;

/** Encuadre del busto. */
const BUST_FRAMING = `FRAMING — bust portrait, head and shoulders only, face turned three-quarters toward the viewer's left, chin level, confident and readable at small size. Cut out on a FULLY TRANSPARENT background: no scenery, no backdrop, no frame, no vignette, no cast shadow — the bust alone, nothing else. No text, letters, numbers, logos, watermarks or signatures anywhere.`;

/**
 * Los cinco, en el orden en que el jugador se los encuentra. La descripción
 * sube de veteranía a la vez que la escalera: quien llega a la quinta ronda
 * tiene que notar por la silueta que ha llegado a la final.
 */
const LADDER = [
  {
    slug: "leo",
    who: `LEO, a cheerful twelve-year-old rookie creature trainer at his very first tournament. Scruffy brown hair under a red-and-white baseball cap worn slightly askew, a bright green short-sleeved shirt, dark blue denim shorts, scuffed white sneakers and an oversized yellow backpack. Grinning wide, one arm raised holding a small spherical capsule, all nerve and no technique.`,
  },
  {
    slug: "kenta",
    who: `KENTA, a disciplined young martial artist in his late teens. Heavy white cotton training gi with the sleeves rolled to the elbow and a worn black belt knotted at the waist, bare forearms wrapped in cloth tape, dark hair tied back in a short knot. Standing square and still, fists loosely closed at his sides, jaw set, absolutely focused.`,
  },
  {
    slug: "iris",
    who: `IRIS, a sharp, self-assured trainer in her early twenties. Fitted white-and-cyan technical sports jacket with the collar up over a dark top, slim charcoal trousers, cyan-soled trainers, long dark ponytail, mirrored sunglasses pushed up onto her forehead. One hand on her hip, chin slightly raised, half-smiling like she already knows how this ends.`,
  },
  {
    slug: "dante",
    who: `DANTE, a theatrical ace trainer in his late twenties. Long dark tailored coat with deep crimson lining that catches the light as it falls open, black gloves, high collar, silver-streaked black hair swept back. One arm extended with a spherical capsule balanced spinning on a fingertip, posture loose and showmanlike, enjoying the audience.`,
  },
  {
    slug: "rhea",
    who: `RHEA, the reigning Champion, a commanding woman in her thirties. Floor-length white and antique-gold coat over a fitted dark under-suit with subtle armoured panelling at the shoulders, the coat's hem lifting in the night air. Silver hair swept into an elaborate crown-like braid, gold ornament at the temple. Standing perfectly upright, arms folded, utterly still — the calm of someone who has never been beaten.`,
  },
];

async function paint(key, trainer) {
  console.log(`▸ ${trainer.slug}`);
  const pieces = [
    { kind: "field", framing: FIELD_FRAMING, size: "1024x1536" },
    { kind: "bust", framing: BUST_FRAMING, size: "1024x1024" },
  ];
  for (const piece of pieces) {
    const b64 = await generateImage(key, {
      prompt: `${trainer.who}\n\n${STADIUM_LIGHT}\n\n${piece.framing}`,
      transparent: true,
      size: piece.size,
    });
    if (!b64) throw new Error(`No se pudo pintar «${trainer.slug}» (${piece.kind}).`);
    mkdirSync(OUT, { recursive: true });
    const file = join(OUT, `${trainer.slug}-${piece.kind}.webp`);
    const bytes = Buffer.from(b64, "base64");
    writeFileSync(file, bytes);
    console.log(`  ✓ ${trainer.slug}-${piece.kind}.webp — ${(bytes.length / 1024).toFixed(0)} kB`);
  }
}

const wanted = process.argv.slice(2);
const list = wanted.length
  ? LADDER.filter((t) => wanted.includes(t.slug))
  : LADDER;
if (list.length === 0) {
  console.error(`Nadie con ese nombre. Hay: ${LADDER.map((t) => t.slug).join(", ")}.`);
  process.exit(1);
}
const key = apiKey();
for (const trainer of list) {
  await paint(key, trainer);
}
