import { NextResponse } from "next/server";
import { getPokemonIndex } from "@/lib/index/build-index";
import { DEFAULT_LEVEL, type TeamMember } from "@/types/team";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

/** Hard cap on the free-text wish, to keep prompts (and abuse) bounded. */
const MAX_PROMPT_LENGTH = 500;

const SYSTEM_PROMPT = `Eres el "Coach Bot" de una Pokédex digital: un entrenador veterano experto en combate competitivo Pokémon. El usuario describirá con sus palabras el equipo que le gustaría tener y tú se lo construyes, optimizado.

Responde SOLO con un objeto JSON válido, sin markdown, con esta forma exacta:
{
  "equipo": ["slug-1", "slug-2", "slug-3", "slug-4", "slug-5", "slug-6"],
  "motivo": "1-2 frases explicando por qué este equipo encaja con lo pedido y qué cubre"
}

Reglas:
- Exactamente 6 especies reales y distintas, identificadas por su slug inglés de PokéAPI en minúsculas: "pikachu", "mr-mime", "nidoran-f", "ho-oh", "tyranitar"…
- Respeta las preferencias del usuario (tipos, generación o región, temática, especies concretas que mencione) y a la vez optimiza el conjunto: pocas debilidades compartidas, buena cobertura ofensiva STAB de los 18 tipos y roles variados (ofensivo, tanque, pivote…).
- Si el usuario pide algo imposible o incompleto, acércate lo máximo posible y acláralo en "motivo".
- Sin emojis en los valores JSON.`;

/** Loose species matcher: lowercase, no accents, only [a-z0-9]. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta OPENAI_API_KEY en el servidor." },
      { status: 500 },
    );
  }

  let body: { prompt?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const prompt =
    typeof body.prompt === "string"
      ? body.prompt.trim().slice(0, MAX_PROMPT_LENGTH)
      : "";
  if (!prompt) {
    return NextResponse.json(
      { error: "Describe el equipo que quieres." },
      { status: 400 },
    );
  }

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Quiero este equipo: ${prompt}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("OpenAI team-suggest error", res.status, detail.slice(0, 500));
    return NextResponse.json(
      {
        error:
          res.status === 401
            ? "La API key de OpenAI no es válida o ha caducado."
            : "El Coach Bot no pudo contactar con la IA. Inténtalo de nuevo.",
      },
      { status: 502 },
    );
  }

  const data = await res.json();
  let parsed: { equipo?: unknown; motivo?: unknown } = {};
  try {
    parsed = JSON.parse(data.choices?.[0]?.message?.content);
  } catch {
    // Malformed JSON from the model: handled by the empty-team check below.
  }

  // Resolve the model's slugs against the real species index so the client
  // only ever receives Pokémon that exist, with their true id and types.
  const index = await getPokemonIndex();
  const byName = new Map(index.entries.map((e) => [normalize(e.name), e]));

  const team: TeamMember[] = [];
  const slugs = Array.isArray(parsed.equipo) ? parsed.equipo : [];
  for (const raw of slugs) {
    if (typeof raw !== "string") continue;
    const entry = byName.get(normalize(raw));
    if (!entry || team.some((m) => m.id === entry.id)) continue;
    team.push({
      id: entry.id,
      name: entry.name,
      types: entry.types,
      level: DEFAULT_LEVEL,
    });
    if (team.length === 6) break;
  }

  if (team.length === 0) {
    return NextResponse.json(
      { error: "El Coach Bot no supo montar ese equipo. Prueba a describirlo de otra forma." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    team,
    motivo:
      typeof parsed.motivo === "string" && parsed.motivo.trim()
        ? parsed.motivo.trim()
        : "Equipo generado a partir de tu descripción.",
  });
}
