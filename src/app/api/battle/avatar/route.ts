import { NextResponse } from "next/server";
import { generateImage } from "@/lib/battle/openai-image";
import type { Lang } from "@/lib/i18n/config";
import { getLang } from "@/lib/i18n/server";

/**
 * Optional flourish: the generated bust of the rival trainer, which fills the
 * intro medallion and the speech bubble.
 *
 * Sólo el busto. La figura de cuerpo entero que se planta en el campo también
 * se generaba aquí, y era un error: tardaba en llegar, salía distinta cada
 * partida y hasta entonces dejaba una silueta dibujada en mitad de la arena.
 * Ahora quien pisa el campo es un Entrenador del plantel oficial, que está en
 * el primer fotograma (ver `src/lib/trainers/roster.ts`).
 *
 * El medallón arranca con un monograma de neón y cambia a esto cuando (si)
 * llega, así que fallar aquí es silencioso por diseño. La escalera de modelos
 * vive en `lib/battle/openai-image`.
 */

/**
 * Dirección de arte del busto: describe la ESCENA en la que está el
 * personaje, no al personaje. Una figura generada suelta trae su propia luz, y
 * al soltarla sobre el decorado se nota que no estaba allí.
 *
 * Estos rivales no pisan el estadio: aparecen en la cámara de simulación, que
 * es negra y sólo la alumbra su malla holográfica. Por eso la luz es fría y
 * sube desde el suelo — que es la fuente — en vez de caer cálida desde unos
 * focos.
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

export async function POST(request: Request) {
  const lang = await getLang();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Sin API key." }, { status: 500 });
  }

  let body: { nombre?: unknown; estilo?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const nombre = String(body.nombre ?? "").slice(0, 60);
  const estilo = String(body.estilo ?? "").slice(0, 120);
  if (!nombre) {
    return NextResponse.json({ error: "Falta el nombre." }, { status: 400 });
  }

  // Recortado: el medallón es redondo y un fondo pintado asomaría por las
  // esquinas.
  const image = await generateImage(apiKey, {
    prompt: portraitPrompt(lang, nombre, estilo),
    transparent: true,
    size: "1024x1024",
  });

  if (!image) {
    console.error("battle/avatar failed");
    return NextResponse.json({ error: "Sin retrato." }, { status: 502 });
  }
  return NextResponse.json({ image });
}
