import { NextResponse } from "next/server";
import { chatJSON, OpenAIError } from "@/lib/battle/openai";
import {
  baseStatTotal,
  compare,
  formatMultiplier,
  statValue,
  STAT_ORDER,
  type AbilityEdge,
} from "@/lib/compare";
import { getDict } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n/config";
import { getLang } from "@/lib/i18n/server";
import { formatName, TYPE_LABELS, TYPE_LABELS_ES } from "@/lib/pokemon-meta";
import { STAT_LABELS } from "@/lib/stats";
import type { ComparePokemon, CompareVerdict } from "@/types/compare";

const TYPE_SLUGS = Object.keys(TYPE_LABELS_ES);

/** Language name (in Spanish, the prompt's language) for the instruction line. */
const LANG_NAME: Record<Lang, string> = {
  es: "español",
  en: "inglés",
  fr: "francés",
  de: "alemán",
  it: "italiano",
  ja: "japonés",
  ko: "coreano",
  "zh-Hans": "chino simplificado",
  "zh-Hant": "chino tradicional",
};

const systemPrompt = (
  lang: Lang,
) => `Eres el analista de combate de una Pokédex digital: comparas dos Pokémon cara a cara y explicas quién domina el enfrentamiento directo (singles estándar, ambos al mismo nivel), en ${LANG_NAME[lang]}.

Recibirás la ficha de ambos (tipos, habilidades, estadísticas base, total base) y un análisis ya calculado por la aplicación: duelo estadística a estadística, diferencia de total base, ventaja elemental STAB con las habilidades ya aplicadas (inmunidades y resistencias incluidas), la habilidad decisiva de cada uno y un índice de duelo ponderado. Apóyate en esos datos —no los contradigas— y añade tu conocimiento real de la franquicia (roles habituales, movimientos característicos, cómo se juega cada habilidad).

Responde SOLO con un objeto JSON válido, sin markdown, con esta forma exacta:
{
  "veredicto": "3-5 frases desarrollando quién domina el enfrentamiento y por qué",
  "claves": ["clave 1", "clave 2", "clave 3", "clave 4"],
  "riesgo": "1-2 frases sobre qué le daría la vuelta al duelo",
  "ganador": "a" | "b" | "empate"
}

Reglas:
- "veredicto": 3-5 frases. Empieza por quién domina, explica cómo se desarrollaría el intercambio (quién ataca primero, qué daño entra, cuántos turnos aguanta cada uno) y cierra con el margen real de la ventaja. Nada de relleno: cada frase aporta un dato o una consecuencia.
- Exactamente 4 "claves": frases concretas sobre ESTE duelo (iniciativa, qué tipo de daño conviene, qué debilidad se explota, qué habilidad pesa, cómo se compensa una desventaja). Una o dos líneas cada una, no telegramas.
- "riesgo": el factor que puede dar la vuelta al resultado (un movimiento de cobertura, una subida de stats, un crítico, la habilidad rival). Si el duelo es tan desequilibrado que no hay vuelta atrás, dilo con una frase.
- "ganador" es "a" o "b" según el Pokémon A o B que recibes, o "empate" si el duelo está realmente igualado.
- Escribe TODOS los valores de texto en ${LANG_NAME[lang]}. Las claves del JSON ("veredicto", "claves", "riesgo", "ganador") no se traducen NUNCA.
- Sin emojis. Tono directo de analista: desarrollado, pero sin adornos.`;

/** Whitelists one side of the client payload down to a well-formed sheet. */
function sanitizePokemon(value: unknown): ComparePokemon | null {
  const p = value as ComparePokemon;
  if (typeof p !== "object" || p === null) return null;
  if (typeof p.name !== "string" || !Array.isArray(p.types)) return null;
  if (!Array.isArray(p.stats)) return null;
  const stats = p.stats
    .filter(
      (s) =>
        typeof s?.name === "string" &&
        STAT_ORDER.includes(s.name as (typeof STAT_ORDER)[number]) &&
        typeof s.base === "number",
    )
    .map((s) => ({
      name: s.name,
      base: Math.min(255, Math.max(0, Math.round(s.base))),
      effort: 0,
    }));
  if (stats.length === 0) return null;
  const name = p.name.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
  if (!name) return null;
  return {
    id: typeof p.id === "number" ? p.id : 0,
    name,
    label: typeof p.label === "string" ? p.label.slice(0, 60) : formatName(name),
    types: p.types.filter((t) => TYPE_SLUGS.includes(t)).slice(0, 2),
    height: typeof p.height === "number" ? p.height : 0,
    weight: typeof p.weight === "number" ? p.weight : 0,
    generation: typeof p.generation === "number" ? p.generation : 0,
    abilities: Array.isArray(p.abilities)
      ? p.abilities
          .filter((a) => typeof a?.label === "string")
          .slice(0, 4)
          .map((a) => ({
            slug: String(a.slug ?? "").slice(0, 40),
            label: a.label.slice(0, 60),
            isHidden: Boolean(a.isHidden),
          }))
      : [],
    stats,
  };
}

/** Clamps the model's JSON to the shape the client renders. */
function sanitizeVerdict(value: unknown): CompareVerdict | null {
  const v = value as CompareVerdict;
  if (typeof v !== "object" || v === null) return null;
  if (typeof v.veredicto !== "string" || !v.veredicto.trim()) return null;
  const claves = Array.isArray(v.claves)
    ? v.claves.filter((c) => typeof c === "string" && c.trim()).slice(0, 4)
    : [];
  if (claves.length === 0) return null;
  return {
    veredicto: v.veredicto.trim(),
    claves,
    // Optional on purpose: an older or terser answer still renders.
    riesgo:
      typeof v.riesgo === "string" && v.riesgo.trim()
        ? v.riesgo.trim()
        : undefined,
    ganador:
      v.ganador === "a" || v.ganador === "b" || v.ganador === "empate"
        ? v.ganador
        : "empate",
  };
}

/**
 * The ability the engine judged decisive, spelled out as multipliers so the
 * model reasons over the same reading the screen shows.
 */
function describeAbility(edge: AbilityEdge, lang: Lang): string {
  if (!edge.label) return "ninguna con efecto relevante en este duelo";
  const notes = edge.notes.map((note) => {
    const target =
      note.kind === "type"
        ? (TYPE_LABELS[lang][note.key ?? ""] ?? note.key)
        : note.kind === "stat"
          ? (STAT_LABELS[lang][note.key ?? ""] ?? note.key)
          : note.kind === "foeStat"
            ? `${STAT_LABELS[lang][note.key ?? ""] ?? note.key} del rival`
            : note.kind === "stab"
              ? "daño del mismo tipo"
              : "daño recibido";
    return `${target} ${formatMultiplier(note.multiplier)}`;
  });
  return `${edge.label} (${notes.join(", ")})`;
}

/** Compact dossier of one side, in the user's language. */
function sheet(pokemon: ComparePokemon, lang: Lang): string {
  const statLine = STAT_ORDER.map(
    (name) => `${STAT_LABELS[lang][name] ?? name} ${statValue(pokemon, name)}`,
  ).join(", ");
  return `${pokemon.label} (${pokemon.types
    .map((t) => TYPE_LABELS[lang][t] ?? t)
    .join("/")}) · Gen ${pokemon.generation}
  Habilidades: ${pokemon.abilities.map((a) => a.label).join(", ") || "—"}
  Stats base: ${statLine}
  Total base: ${baseStatTotal(pokemon)}`;
}

export async function POST(request: Request) {
  const lang = await getLang();
  const t = getDict(lang).compare;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: t.aiMissingKey }, { status: 500 });
  }

  let body: { a?: unknown; b?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t.aiBadRequest }, { status: 400 });
  }

  const a = sanitizePokemon(body.a);
  const b = sanitizePokemon(body.b);
  if (!a || !b) {
    return NextResponse.json({ error: t.aiBadRequest }, { status: 400 });
  }

  // Recompute the metrics server-side so the model always reasons over data
  // this codebase produced, not whatever the client claims.
  const result = compare(a, b);
  const typeName = (slug: string) => TYPE_LABELS[lang][slug] ?? slug;
  const userMessage = `POKÉMON A:
${sheet(a, lang)}

POKÉMON B:
${sheet(b, lang)}

ANÁLISIS CALCULADO:
- Duelo de stats: ${result.duels
    .map(
      (d) =>
        `${STAT_LABELS[lang][d.name] ?? d.name} ${d.a} vs ${d.b} (${
          d.winner === null
            ? "empate"
            : `gana ${d.winner === "a" ? a.label : b.label} por ${d.gap}`
        })`,
    )
    .join("; ")}
- Stats ganadas: ${a.label} ${result.wins.a}, ${b.label} ${result.wins.b}, empates ${result.wins.ties}
- Total base: ${a.label} ${result.bstA} vs ${b.label} ${result.bstB} (${
    result.bstLeader === null
      ? "idéntico"
      : `+${result.bstGap} para ${result.bstLeader === "a" ? a.label : b.label}`
  })
- Mejor STAB de ${a.label} contra ${b.label}: ${formatMultiplier(
    result.advantage.a.multiplier,
  )} (${result.advantage.a.types.map(typeName).join(", ") || "—"})
- Mejor STAB de ${b.label} contra ${a.label}: ${formatMultiplier(
    result.advantage.b.multiplier,
  )} (${result.advantage.b.types.map(typeName).join(", ") || "—"})
- Ataca primero: ${
    result.fasterSide === null
      ? "empate de velocidad"
      : result.fasterSide === "a"
        ? a.label
        : b.label
  }
- Habilidad decisiva de ${a.label}: ${describeAbility(result.abilities.a, lang)}
- Habilidad decisiva de ${b.label}: ${describeAbility(result.abilities.b, lang)}
- Índice calculado del duelo: ${a.label} ${result.index.scoreA}% · ${b.label} ${
    result.index.scoreB
  }% (${
    result.index.winner === null
      ? "duelo igualado"
      : `favorece a ${result.index.winner === "a" ? a.label : b.label}`
  })

Genera el veredicto JSON.`;

  try {
    const raw = await chatJSON(
      apiKey,
      [
        { role: "system", content: systemPrompt(lang) },
        { role: "user", content: userMessage },
      ],
      // Room for the developed verdict, four takeaways and the risk note —
      // a tighter budget truncates the JSON and the answer is lost.
      { temperature: 0.7, maxTokens: 1100 },
    );
    const verdict = sanitizeVerdict(raw);
    if (!verdict) {
      return NextResponse.json({ error: t.aiUnreadable }, { status: 502 });
    }
    return NextResponse.json({ verdict });
  } catch (err) {
    console.error("compare verdict failed", err);
    const status = err instanceof OpenAIError ? err.status : 0;
    return NextResponse.json(
      { error: status === 401 ? t.aiBadApiKey : t.aiUpstream },
      { status: 502 },
    );
  }
}
