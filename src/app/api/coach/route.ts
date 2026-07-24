import { NextResponse } from "next/server";
import { formatName, TYPE_LABELS_ES } from "@/lib/pokemon-meta";
import { analyzeTeam } from "@/lib/team-analysis";
import { DEFAULT_LEVEL, type CoachReport, type TeamMember } from "@/types/team";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const TYPE_SLUGS = Object.keys(TYPE_LABELS_ES);

const SYSTEM_PROMPT = `Eres el "Coach Bot" de una Pokédex digital: un entrenador veterano experto en combate competitivo Pokémon (formatos singles estándar). Analizas equipos y das consejos claros, concretos y accionables, en español.

Recibirás el equipo del usuario (hasta 6 Pokémon con sus tipos y su nivel de combate, 1-100) y un análisis de cobertura ya calculado (debilidades críticas, resistencias fuertes y huecos de cobertura ofensiva STAB). Apóyate en esos datos —no los contradigas— y añade tu conocimiento real de la franquicia (estadísticas típicas, roles habituales, movimientos característicos de cada especie).

Responde SOLO con un objeto JSON válido, sin markdown, con esta forma exacta:
{
  "resumen": "1-2 frases con el estado global del equipo (ej.: 'Equipo ofensivo balanceado' o 'Equipo muy frágil ante tipo Fuego')",
  "consejos": ["consejo 1", "consejo 2", "consejo 3"],
  "sustituciones": [{ "sale": "nombre del miembro que saldría", "entra": "especie sugerida", "motivo": "por qué" }]
}

Reglas:
- Exactamente 3 consejos de estrategia de combate, específicos para ESTE equipo (leads, pivotes, a qué amenazas vigilar, cómo jugar sus debilidades).
- Ten en cuenta los niveles: señala miembros con nivel muy por debajo del resto y cómo compensarlo.
- "sustituciones": solo si detectas fallos graves de cobertura (debilidad crítica compartida o hueco ofensivo importante); 0-2 entradas, nunca más. Si el equipo está bien construido, devuelve [].
- En "sale" copia el nombre del miembro tal y como aparece en el equipo. En "entra" sugiere especies reales que cubran el hueco, usando su slug inglés de PokéAPI en minúsculas (ej.: "tyranitar", "mr-mime", "ho-oh").
- Sin emojis en los valores JSON. Tono directo de entrenador, frases cortas.`;

/** Whitelists the client payload down to well-formed members. */
function sanitizeTeam(value: unknown): TeamMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (m): m is TeamMember =>
        typeof m === "object" &&
        m !== null &&
        typeof (m as TeamMember).id === "number" &&
        typeof (m as TeamMember).name === "string" &&
        Array.isArray((m as TeamMember).types),
    )
    .map((m) => ({
      id: m.id,
      name: m.name.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40),
      types: m.types.filter((t) => TYPE_SLUGS.includes(t)).slice(0, 2),
      level:
        typeof m.level === "number"
          ? Math.min(100, Math.max(1, Math.round(m.level)))
          : DEFAULT_LEVEL,
    }))
    .filter((m) => m.name && m.types.length > 0)
    .slice(0, 6);
}

const typeLabel = (slug: string) => TYPE_LABELS_ES[slug] ?? slug;

/** Clamps the model's JSON to the CoachReport shape the client renders. */
function sanitizeReport(value: unknown): CoachReport | null {
  const r = value as CoachReport;
  if (typeof r !== "object" || r === null) return null;
  if (typeof r.resumen !== "string" || !r.resumen.trim()) return null;
  const consejos = Array.isArray(r.consejos)
    ? r.consejos.filter((c) => typeof c === "string" && c.trim()).slice(0, 3)
    : [];
  if (consejos.length === 0) return null;
  const sustituciones = Array.isArray(r.sustituciones)
    ? r.sustituciones
        .filter(
          (s) =>
            typeof s === "object" &&
            s !== null &&
            typeof s.sale === "string" &&
            typeof s.entra === "string" &&
            typeof s.motivo === "string",
        )
        .slice(0, 2)
    : [];
  return { resumen: r.resumen.trim(), consejos, sustituciones };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta OPENAI_API_KEY en el servidor." },
      { status: 500 },
    );
  }

  let body: { team?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const team = sanitizeTeam(body.team);
  if (team.length === 0) {
    return NextResponse.json(
      { error: "El equipo está vacío: añade al menos un Pokémon." },
      { status: 400 },
    );
  }

  // Recompute the coverage server-side so the AI always reasons over data
  // this codebase produced, not whatever the client claims.
  const analysis = analyzeTeam(team);
  const roster = team
    .map(
      (m) =>
        `- ${formatName(m.name)} (${m.types.map(typeLabel).join("/")}) · Nivel ${m.level ?? DEFAULT_LEVEL}`,
    )
    .join("\n");
  const userMessage = `EQUIPO (${team.length}/6):
${roster}

ANÁLISIS DE COBERTURA CALCULADO:
- Debilidades críticas (3+ miembros débiles): ${
    analysis.criticalWeaknesses
      .map((p) => `${typeLabel(p.type)} (${p.weakCount} miembros)`)
      .join(", ") || "ninguna"
  }
- Resistencias fuertes (3+ miembros resisten): ${
    analysis.strongResistances
      .map((p) => `${typeLabel(p.type)} (${p.resistCount} miembros)`)
      .join(", ") || "ninguna"
  }
- Tipos sin cobertura ofensiva STAB: ${
    analysis.missingCoverage.map(typeLabel).join(", ") || "ninguno"
  }

Genera el informe JSON.`;

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
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 900,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("OpenAI coach error", res.status, detail.slice(0, 500));
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
  let report: CoachReport | null = null;
  try {
    report = sanitizeReport(JSON.parse(data.choices?.[0]?.message?.content));
  } catch {
    // Malformed JSON from the model: fall through to the error below.
  }
  if (!report) {
    return NextResponse.json(
      { error: "El Coach Bot devolvió un informe ilegible. Prueba otra vez." },
      { status: 502 },
    );
  }

  return NextResponse.json({ report });
}
