import { NextResponse } from "next/server";
import { fetchLearnset, legalSlugsAt } from "@/lib/battle/learnset";
import { fetchPokemon } from "@/lib/battle/loadout";
import { getDict } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n/config";
import { getLang } from "@/lib/i18n/server";
import { getPokemonIndex } from "@/lib/index/build-index";
import { mapWithConcurrency } from "@/lib/pokeapi/client";
import { DEFAULT_LEVEL, type MemberBuild, type TeamMember } from "@/types/team";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

/** Hard cap on the free-text wish, to keep prompts (and abuse) bounded. */
const MAX_PROMPT_LENGTH = 500;

/** Extra completion rounds allowed to fill slots whose slugs didn't resolve. */
const MAX_REFILL_ROUNDS = 2;

const TEAM_SIZE = 6;

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
) => `Eres el "Coach Bot" de una Pokédex digital: un entrenador veterano experto en combate competitivo Pokémon. El usuario describirá con sus palabras el equipo que le gustaría tener y tú se lo construyes, optimizado y listo para combatir.

Responde SOLO con un objeto JSON válido, sin markdown, con esta forma exacta:
{
  "equipo": [
    {
      "especie": "slug inglés de PokéAPI en minúsculas",
      "nivel": 50,
      "habilidad": "slug inglés de la habilidad (opcional)",
      "movimientos": ["slug-1", "slug-2", "slug-3", "slug-4"]
    }
  ],
  "motivo": "1-2 frases explicando por qué este equipo encaja con lo pedido y qué cubre"
}

Reglas:
- Exactamente 6 especies reales y distintas, identificadas por su slug inglés de PokéAPI en minúsculas: "pikachu", "mr-mime", "nidoran-f", "ho-oh", "tyranitar"…
- NIVEL: número entero de 1 a 100. Si el usuario pide un nivel concreto ("equipo de nivel 5", "todos a 100"), TODOS los miembros llevan EXACTAMENTE ese nivel. Si no dice nada, usa ${DEFAULT_LEVEL}.
- MOVIMIENTOS: hasta 4 slugs ingleses de PokéAPI ("thunder-shock", "flamethrower", "swords-dance"). Elige SOLO movimientos que esa especie pueda conocer a ESE nivel: a nivel bajo son los primeros movimientos por nivel del Pokémon, no los de su forma final. Es preferible dar 2 movimientos correctos que 4 imposibles; el servidor descarta los ilegales.
- HABILIDAD: slug inglés de una habilidad real de esa especie, o se omite.
- Si el usuario ya tiene un equipo, se te indicará con sus niveles y movimientos: interpreta su petición como una modificación sobre ese equipo. Conserva tal cual (nivel y movimientos incluidos) los miembros que no pida cambiar y devuelve SIEMPRE el equipo final completo de 6.
- Respeta las preferencias del usuario (tipos, generación o región, temática, especies concretas que mencione) y a la vez optimiza el conjunto: pocas debilidades compartidas, buena cobertura ofensiva STAB de los 18 tipos y roles variados (ofensivo, tanque, pivote…).
- Si el usuario pide algo imposible o incompleto, acércate lo máximo posible y acláralo en "motivo".
- Escribe el texto de "motivo" en ${LANG_NAME[lang]}: es el idioma del usuario. Las claves del JSON no se traducen NUNCA; mantenlas exactamente como se indican.
- Sin emojis en los valores JSON.`;

/** Loose species matcher: lowercase, no accents, only [a-z0-9]. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Lowercased PokéAPI slug, or "" when the value isn't a usable string. */
function slugOf(value: unknown): string {
  return typeof value === "string"
    ? value.toLowerCase().trim().replace(/[^a-z0-9-]/g, "").slice(0, 60)
    : "";
}

/** One member as the model drafts it, before it meets the real Pokédex. */
interface DraftMember {
  species: string;
  level: number;
  ability: string;
  moves: string[];
}

/** Accepts both the object form and a bare slug string, for robustness. */
function toDraft(raw: unknown): DraftMember | null {
  if (typeof raw === "string") {
    const species = slugOf(raw);
    return species
      ? { species, level: DEFAULT_LEVEL, ability: "", moves: [] }
      : null;
  }
  if (typeof raw !== "object" || raw === null) return null;
  const m = raw as Record<string, unknown>;
  const species = slugOf(m.especie ?? m.slug ?? m.nombre);
  if (!species) return null;
  const level =
    typeof m.nivel === "number" && Number.isFinite(m.nivel)
      ? Math.min(100, Math.max(1, Math.round(m.nivel)))
      : DEFAULT_LEVEL;
  const moves = Array.isArray(m.movimientos)
    ? [...new Set(m.movimientos.map(slugOf).filter(Boolean))].slice(0, 4)
    : [];
  return { species, level, ability: slugOf(m.habilidad), moves };
}

/**
 * Turns a draft into a real team member: the species must exist, the ability
 * must belong to it and the moves must be ones it already knows at that
 * level. Anything that fails is dropped, never faked — a short-but-legal
 * build is autofilled at battle setup.
 */
async function resolveBuild(
  draft: DraftMember,
): Promise<MemberBuild | undefined> {
  if (!draft.ability && draft.moves.length === 0) return undefined;
  try {
    const pokemon = await fetchPokemon(draft.species);
    const abilities = new Set(
      [
        ...pokemon.abilities,
        ...(pokemon.past_abilities ?? []).flatMap((p) => p.abilities),
      ]
        .filter((a) => a.ability !== null)
        .map((a) => a.ability!.name),
    );
    const ability = abilities.has(draft.ability) ? draft.ability : undefined;

    let moves: string[] | undefined;
    if (draft.moves.length > 0) {
      const legal = legalSlugsAt(await fetchLearnset(pokemon), draft.level);
      const kept = draft.moves.filter((slug) => legal.has(slug));
      moves = kept.length > 0 ? kept : undefined;
    }
    return ability || moves ? { ability, moves } : undefined;
  } catch {
    // PokéAPI hiccup: ship the member without a build rather than failing the
    // whole request — battle setup will pick its moves.
    return undefined;
  }
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** One chat completion; returns the raw content string or null on any failure. */
async function complete(
  apiKey: string,
  messages: ChatMessage[],
): Promise<string | null> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1400,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("OpenAI team-suggest error", res.status, detail.slice(0, 500));
    return res.status === 401 ? "__unauthorized__" : null;
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : null;
}

/** Describes the roster the user already has, levels and builds included. */
function describeTeam(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (m): m is TeamMember =>
        typeof m === "object" &&
        m !== null &&
        typeof (m as TeamMember).name === "string",
    )
    .slice(0, TEAM_SIZE)
    .map((m) => {
      const level = typeof m.level === "number" ? m.level : DEFAULT_LEVEL;
      const moves = m.build?.moves?.length
        ? `, movimientos: ${m.build.moves.join(", ")}`
        : "";
      const ability = m.build?.ability ? `, habilidad: ${m.build.ability}` : "";
      return `${m.name} (nivel ${level}${ability}${moves})`;
    });
}

export async function POST(request: Request) {
  const lang = await getLang();
  const t = getDict(lang).trainer;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: t.errMissingKey }, { status: 500 });
  }

  let body: { prompt?: unknown; team?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t.errBadJson }, { status: 400 });
  }

  const prompt =
    typeof body.prompt === "string"
      ? body.prompt.trim().slice(0, MAX_PROMPT_LENGTH)
      : "";
  if (!prompt) {
    return NextResponse.json({ error: t.suggestErrNoPrompt }, { status: 400 });
  }

  // Current roster (optional): lets the wish be a modification, not a rebuild.
  const currentLines = describeTeam(body.team);

  const userMessage = currentLines.length
    ? `Mi equipo actual es:\n${currentLines
        .map((line) => `- ${line}`)
        .join("\n")}\n\nPetición: ${prompt}`
    : `Quiero este equipo: ${prompt}`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(lang) },
    { role: "user", content: userMessage },
  ];

  const first = await complete(apiKey, messages);
  if (first === "__unauthorized__") {
    return NextResponse.json({ error: t.errBadApiKey }, { status: 502 });
  }
  if (first === null) {
    return NextResponse.json({ error: t.coachErrUpstream }, { status: 502 });
  }

  let parsed: { equipo?: unknown; motivo?: unknown } = {};
  try {
    parsed = JSON.parse(first);
  } catch {
    // Malformed JSON from the model: handled by the empty-team check below.
  }

  // Resolve the model's slugs against the real species index so the client
  // only ever receives Pokémon that exist, with their true id and types.
  const index = await getPokemonIndex();
  const byName = new Map(index.entries.map((e) => [normalize(e.name), e]));

  const drafts: DraftMember[] = [];
  const seen = new Set<number>();
  /** Keeps the model's draft only when it names a species that exists. */
  const addDrafts = (raw: unknown) => {
    if (!Array.isArray(raw)) return;
    for (const item of raw) {
      const draft = toDraft(item);
      if (!draft) continue;
      const entry = byName.get(normalize(draft.species));
      if (!entry || seen.has(entry.id)) continue;
      seen.add(entry.id);
      // Store the canonical slug: the model's spelling may be a variant.
      drafts.push({ ...draft, species: entry.name });
      if (drafts.length === TEAM_SIZE) break;
    }
  };
  addDrafts(parsed.equipo);

  // The roster must always come back complete: if any slug failed to resolve,
  // ask the model for replacements, excluding what's already picked.
  messages.push({ role: "assistant", content: first });
  for (
    let round = 0;
    drafts.length > 0 && drafts.length < TEAM_SIZE && round < MAX_REFILL_ROUNDS;
    round++
  ) {
    const missing = TEAM_SIZE - drafts.length;
    messages.push({
      role: "user",
      content: `Algunos slugs no existen en la Pokédex. Ya tengo: ${drafts
        .map((d) => d.species)
        .join(", ")}. Devuelve el mismo objeto JSON pero con "equipo" conteniendo exactamente ${missing} miembros adicionales (con su "nivel" y sus "movimientos"), de especies reales y distintas de las ya elegidas, coherentes con mi petición original. Mantén "motivo".`,
    });
    const refill = await complete(apiKey, messages);
    if (refill === null || refill === "__unauthorized__") break;
    messages.push({ role: "assistant", content: refill });
    try {
      addDrafts((JSON.parse(refill) as { equipo?: unknown }).equipo);
    } catch {
      // Ignore a malformed refill; the next round (or the fallback) covers it.
    }
  }

  // Last resort: top up from the index so the team is never short of 6. The
  // filler inherits the level the model chose, so "todos a nivel 5" holds.
  if (drafts.length > 0 && drafts.length < TEAM_SIZE) {
    const level = drafts[0].level;
    for (const entry of index.entries) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      drafts.push({ species: entry.name, level, ability: "", moves: [] });
      if (drafts.length === TEAM_SIZE) break;
    }
  }

  if (drafts.length === 0) {
    return NextResponse.json({ error: t.suggestErrFailed }, { status: 502 });
  }

  // Validate abilities and moves against each species' real learnset.
  const builds = await mapWithConcurrency(drafts, 3, resolveBuild);
  const team: TeamMember[] = drafts.map((draft, i) => {
    const entry = byName.get(normalize(draft.species))!;
    return {
      id: entry.id,
      name: entry.name,
      types: entry.types,
      level: draft.level,
      build: builds[i],
    };
  });

  return NextResponse.json({
    team,
    motivo:
      typeof parsed.motivo === "string" && parsed.motivo.trim()
        ? parsed.motivo.trim()
        : t.suggestFallbackMotivo,
  });
}
