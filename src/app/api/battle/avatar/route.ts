import { NextResponse } from "next/server";
import { generateImage } from "@/lib/battle/openai-image";
import type { Lang } from "@/lib/i18n/config";
import { getLang } from "@/lib/i18n/server";

/**
 * Optional flourish: generated art of the rival trainer, in two shapes.
 *
 * - `portrait` is the bust that fills the intro medallion and the speech
 *   bubble; it keeps its painted arena background.
 * - `field` is the full-body figure that stands next to the rival's Pokémon
 *   on the stage, the way trainers do in the games. It has to be a cut-out —
 *   a square with a background would sit on the arena as a poster — so it is
 *   requested with a transparent background.
 *
 * Both start from a drawn fallback in the UI (a neon monogram, a silhouette)
 * and swap this in when (if) it arrives, so failures here are silent by
 * design. The model ladder lives in `lib/battle/openai-image`.
 */
type Kind = "portrait" | "field";

/**
 * Dirección de arte del Modo Combate, compartida por el busto y la figura.
 *
 * Es la hermana de la que `scripts/generate-trainers.mjs` aplica al plantel
 * del torneo, y hace el mismo trabajo: describir la ESCENA en la que está de
 * pie el personaje, no al personaje. Una figura generada suelta trae su
 * propia luz, y al soltarla sobre el decorado se nota que no estaba allí.
 *
 * Cambia el sitio, eso sí: estos rivales no pisan el estadio, aparecen en la
 * cámara de simulación, que es negra y sólo la alumbra su malla holográfica.
 * Por eso aquí la luz es fría y sube desde el suelo — que es la fuente — en
 * vez de caer cálida desde unos focos.
 */
const CHAMBER_LIGHT = `LIGHTING AND INTEGRATION — this person is standing inside a dark holographic simulation chamber and must be lit by that room and nothing else. Key light: cold electric-cyan light rising from a glowing wireframe floor grid below, so the brightest planes are the underside of the jaw, the chest, the forearms and the tops of the boots. Rim light: a thin white-hot cyan edge down one contour and a deep crimson edge down the other, from emitters far off in the void. Fill: almost none — the shadow side falls away into near-black navy. No warm sunlight, no daylight, no floodlights. Shadows are deep navy, never grey; highlights are cold cyan-white with a tight bloom. Faint volumetric haze, as if photographed through the same charged air as the chamber.

STYLE — a character render from a modern AAA console game: believable materials, grounded anatomy, slightly heightened heroic proportions. Not anime cel shading, not flat vector, not cartoon, not pixel art. No outline or stroke around the figure of any kind.`;

/** Lo que el rival aporta al prompt: su nombre y el estilo que el modelo le
 *  escribió en el vestíbulo, que llega ya en el idioma de la sesión. */
const who = (lang: Lang, nombre: string, estilo: string) =>
  `a creature trainer called "${nombre}": ${estilo || (lang === "es" ? "estética cyberpunk" : "cyberpunk aesthetic")}`;

const portraitPrompt = (lang: Lang, nombre: string, estilo: string) =>
  `Bust portrait of ${who(lang, nombre, estilo)}. Head and shoulders only, face turned three-quarters toward the viewer's left, defiant gaze, readable at small size.

${CHAMBER_LIGHT}

Cut out on a fully transparent background: no scenery, no backdrop, no frame, no vignette, no cast shadow. No text, letters, numbers, logos or watermarks anywhere.`;

/**
 * La figura de campo se planta junto a su Pokémon, así que va encuadrada como
 * las del torneo: cuerpo entero, pies a la vista, de pie sobre nada y vuelta
 * hacia el rival que tiene enfrente.
 */
const fieldPrompt = (lang: Lang, nombre: string, estilo: string) =>
  `Full-body render of ${who(lang, nombre, estilo)}. Standing at ease on level ground, weight on one leg, turned three-quarters toward the viewer's LEFT and looking off to the left at an opponent out of frame. Camera low, roughly at hip height, almost level. The whole figure from head to feet inside the frame with a small margin, centred.

${CHAMBER_LIGHT}

Cut out on a fully transparent background: no ground, no floor, no grid, no cast shadow, no scenery, no backdrop, no frame, no platform under the feet — the figure alone. No text, letters, numbers, logos or watermarks anywhere.`;

export async function POST(request: Request) {
  const lang = await getLang();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Sin API key." }, { status: 500 });
  }

  let body: { nombre?: unknown; estilo?: unknown; kind?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const nombre = String(body.nombre ?? "").slice(0, 60);
  const estilo = String(body.estilo ?? "").slice(0, 120);
  const kind: Kind = body.kind === "field" ? "field" : "portrait";
  if (!nombre) {
    return NextResponse.json({ error: "Falta el nombre." }, { status: 400 });
  }

  // Ambas se piden recortadas: el busto también, porque va dentro de un
  // medallón redondo y un fondo pintado asomaría por las esquinas. La figura
  // se pide en vertical, que es la única forma de que un cuerpo entero quepa
  // sin quedarse en un muñeco diminuto en mitad de un cuadrado.
  const image = await generateImage(apiKey, {
    prompt:
      kind === "field"
        ? fieldPrompt(lang, nombre, estilo)
        : portraitPrompt(lang, nombre, estilo),
    transparent: true,
    size: kind === "field" ? "1024x1536" : "1024x1024",
  });

  if (!image) {
    console.error(`battle/avatar failed (${kind})`);
    return NextResponse.json({ error: "Sin retrato." }, { status: 502 });
  }
  return NextResponse.json({ image });
}
