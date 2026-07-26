/**
 * Generación de imágenes para los guiones de arte del proyecto.
 *
 * Es la versión de línea de comandos de `src/lib/battle/openai-image.ts`, y
 * sube la misma escalera: primero la Responses API pilotada por el modelo del
 * proyecto (OPENAI_BATTLE_MODEL, "gpt-5.6-luna"), que elige por su cuenta el
 * modelo de imagen, y si esa vía no está disponible, la Images API.
 *
 * Los recortes con fondo transparente se saltan gpt-image-2, que sólo pinta
 * fondos opacos: un recorte con fondo pintado no se puede quitar después y
 * acabaría sobre el campo como una pegatina.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const RESPONSES_URL = "https://api.openai.com/v1/responses";
const IMAGES_URL = "https://api.openai.com/v1/images/generations";

const MODEL = process.env.OPENAI_BATTLE_MODEL ?? "gpt-5.6-luna";
const OPAQUE_MODELS = [process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2", "gpt-image-1.5"];
const CUTOUT_MODELS = [process.env.OPENAI_CUTOUT_MODEL ?? "gpt-image-1.5", "gpt-image-1"];

/** Lee OPENAI_API_KEY del entorno y, si no está, de .env.local. */
export function apiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  try {
    const env = readFileSync(join(ROOT, ".env.local"), "utf8");
    const line = env.match(/^OPENAI_API_KEY\s*=\s*(.+)$/m);
    if (line) return line[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    // Sin .env.local: cae al error de abajo.
  }
  throw new Error("Falta OPENAI_API_KEY (en el entorno o en .env.local).");
}

async function viaResponses(key, { prompt, transparent, size }) {
  const res = await fetch(RESPONSES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      input: prompt,
      tools: [
        {
          type: "image_generation",
          size,
          quality: "high",
          output_format: "webp",
          output_compression: 88,
          background: transparent ? "transparent" : "auto",
        },
      ],
    }),
  });
  if (!res.ok) {
    console.warn(`    · Responses/${MODEL} → ${res.status}; sigo por Images.`);
    return null;
  }
  const data = await res.json();
  const call = (data.output ?? []).find((o) => o?.type === "image_generation_call");
  return typeof call?.result === "string" ? call.result : null;
}

async function viaImages(key, model, { prompt, transparent, size }) {
  const res = await fetch(IMAGES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      prompt,
      size,
      n: 1,
      quality: "high",
      output_format: "webp",
      output_compression: 88,
      ...(transparent ? { background: "transparent" } : {}),
    }),
  });
  if (!res.ok) {
    console.warn(`    · Images/${model} → ${res.status}.`);
    return null;
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  return typeof b64 === "string" ? b64 : null;
}

/** Devuelve el webp en base64, o null si ninguna vía respondió. */
export async function generateImage(key, { prompt, transparent = false, size = "1024x1024" }) {
  const request = { prompt, transparent, size };
  let b64 = await viaResponses(key, request);
  for (const model of transparent ? CUTOUT_MODELS : OPAQUE_MODELS) {
    if (b64) break;
    b64 = await viaImages(key, model, request);
  }
  return b64;
}
