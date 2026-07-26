/**
 * Image generation for the battle modes (rival portraits and the trainer
 * figures that stand next to their Pokémon on the field).
 *
 * The primary path is the Responses API driven by the project's own chat
 * model — OPENAI_BATTLE_MODEL, "gpt-5.6-luna" — which selects the underlying
 * GPT Image model itself through its `image_generation` tool. Two things
 * routinely go wrong with that path, and neither is an error worth surfacing:
 * an account without the tool, and transparency, since the model behind the
 * tool renders opaque while the field figures need a cut-out.
 *
 * So every request walks a short ladder instead: the Responses tool first,
 * then the Images API. Cut-outs skip the opaque-only model on that ladder,
 * because a square with a painted background cannot be keyed out afterwards
 * and would land on the stage as a floating poster.
 */
const RESPONSES_URL = "https://api.openai.com/v1/responses";
const IMAGES_URL = "https://api.openai.com/v1/images/generations";

import { BATTLE_MODEL } from "./openai";

/** Images API models, best first. gpt-image-2 has no transparent background. */
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";
/** Models that honour `background: "transparent"`, best first. */
const CUTOUT_MODELS = [
  process.env.OPENAI_CUTOUT_MODEL ?? "gpt-image-1.5",
  "gpt-image-1",
];

export interface ImageRequest {
  prompt: string;
  /** Ask for a cut-out (PNG, no background) instead of a full picture. */
  transparent?: boolean;
  size?: string;
}

const dataUrl = (b64: string) => `data:image/png;base64,${b64}`;

/** Reads the base64 payload out of a Responses call, if the tool produced one. */
function imageFromResponses(data: unknown): string | null {
  const output = (data as { output?: Array<{ type?: string; result?: unknown }> })
    ?.output;
  if (!Array.isArray(output)) return null;
  for (const item of output) {
    if (item?.type === "image_generation_call" && typeof item.result === "string") {
      return item.result;
    }
  }
  return null;
}

/** One shot at the Responses API with the image tool, driven by the chat model. */
async function viaResponses(
  apiKey: string,
  { prompt, transparent, size }: ImageRequest,
): Promise<string | null> {
  const res = await fetch(RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: BATTLE_MODEL,
      input: prompt,
      tools: [
        {
          type: "image_generation",
          size: size ?? "1024x1024",
          quality: "high",
          output_format: "png",
          background: transparent ? "transparent" : "auto",
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const b64 = imageFromResponses(await res.json().catch(() => null));
  return b64 ? dataUrl(b64) : null;
}

/** One shot at the Images API with an explicit model. */
async function viaImages(
  apiKey: string,
  model: string,
  { prompt, transparent, size }: ImageRequest,
): Promise<string | null> {
  const res = await fetch(IMAGES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      size: size ?? "1024x1024",
      n: 1,
      ...(transparent
        ? { background: "transparent", output_format: "png" }
        : {}),
    }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const b64 = (data as { data?: Array<{ b64_json?: unknown }> })?.data?.[0]
    ?.b64_json;
  return typeof b64 === "string" && b64 ? dataUrl(b64) : null;
}

/**
 * Generates one image and returns it as a `data:` URL, or null when every
 * path was refused. Callers treat that null as "no picture this time": the
 * portraits and the field figures both have a drawn fallback, so a missing
 * key or a model rename never blocks a battle.
 */
export async function generateImage(
  apiKey: string,
  request: ImageRequest,
): Promise<string | null> {
  const fallbacks = request.transparent ? CUTOUT_MODELS : [IMAGE_MODEL];

  // Qué peldaño acabó sirviendo la imagen. Merece la pena dejarlo dicho: la
  // escalera es silenciosa por diseño, y cuando un recorte sale con fondo
  // pintado lo primero que hay que saber es quién lo pintó.
  const served = (path: string) => console.info(`battle/image served by ${path}`);

  try {
    const first = await viaResponses(apiKey, request);
    if (first) {
      served(`responses/${BATTLE_MODEL}`);
      return first;
    }
  } catch {
    // Network hiccup on the tool path; the Images API below still gets a go.
  }

  for (const model of fallbacks) {
    try {
      const image = await viaImages(apiKey, model, request);
      if (image) {
        served(`images/${model}`);
        return image;
      }
    } catch {
      // Same: try the next model rather than failing the whole request.
    }
  }
  return null;
}
