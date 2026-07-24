import { NextResponse } from "next/server";

/**
 * Optional flourish: a generated portrait of the rival trainer. The battle
 * starts with a neon silhouette and swaps this in when (if) it arrives, so
 * failures here are silent by design.
 *
 * Image model: OPENAI_IMAGE_MODEL (default "gpt-image-2"); an unknown-model
 * rejection retries once with "gpt-image-1" for older accounts.
 */
const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";
const FALLBACK_IMAGE_MODEL = "gpt-image-1";

export async function POST(request: Request) {
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

  const prompt = `Retrato busto de un entrenador de criaturas de anime llamado "${nombre}": ${estilo || "estética cyberpunk"}. Estilo anime años 90 con iluminación neón cian y roja, fondo oscuro de arena de combate futurista, mirada desafiante. Sin texto ni logotipos.`;

  const attempt = (model: string) =>
    fetch(OPENAI_IMAGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, prompt, size: "1024x1024", n: 1 }),
    });

  let res = await attempt(IMAGE_MODEL);
  if (!res.ok && IMAGE_MODEL !== FALLBACK_IMAGE_MODEL) {
    const detail = await res.text().catch(() => "");
    if (/model/i.test(detail)) {
      res = await attempt(FALLBACK_IMAGE_MODEL);
    }
  }
  if (!res.ok) {
    console.error("battle/avatar failed", res.status);
    return NextResponse.json({ error: "Sin retrato." }, { status: 502 });
  }

  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (typeof b64 !== "string" || !b64) {
    return NextResponse.json({ error: "Sin retrato." }, { status: 502 });
  }
  return NextResponse.json({ image: `data:image/png;base64,${b64}` });
}
