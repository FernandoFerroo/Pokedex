import { NextResponse } from "next/server";
import { buildTeam, type LoadoutMember } from "@/lib/battle/loadout";
import { chatJSON } from "@/lib/battle/openai";
import { getPokemonIndex } from "@/lib/index/build-index";
import { formatName, TYPE_LABELS_ES } from "@/lib/pokemon-meta";
import { DEFAULT_LEVEL, type TeamMember } from "@/types/team";
import type { BattleSetupResponse } from "@/types/battle";

const TYPE_SLUGS = Object.keys(TYPE_LABELS_ES);

const SYSTEM_PROMPT = `Eres el generador de rivales del "Modo Combate" de una Pokédex digital. Dado el equipo del jugador, inventa un Entrenador rival carismático con un equipo equilibrado que le plante cara (ni un rodillo imposible ni un saco de boxeo).

Responde SOLO con un objeto JSON válido, sin markdown:
{
  "nombre": "nombre y apodo del entrenador (ej.: 'Vega, Domadora de Dragones')",
  "lema": "grito de guerra de 1 frase, con chispa, estilo anime",
  "estilo": "descripción visual breve del entrenador en 5-10 palabras (para dibujarlo)",
  "equipo": ["slug-1", "slug-2", "slug-3", "slug-4", "slug-5", "slug-6"]
}

Reglas:
- Exactamente 6 especies reales y distintas, por su slug inglés de PokéAPI en minúsculas ("pikachu", "mr-mime", "ho-oh"…).
- El equipo debe tener coherencia temática con el personaje y una fuerza comparable a la del jugador: si el jugador no lleva legendarios, no metas más de uno.
- Busca cierta ventaja táctica (algún Pokémon que castigue las debilidades del jugador) pero deja huecos explotables.
- Sin emojis en los valores JSON.`;

/** Same whitelist the coach route applies to client-supplied teams. */
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

/** Loose species matcher shared with team-suggest. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

interface RivalDraft {
  nombre: string;
  lema: string;
  estilo: string;
  slugs: string[];
}

type Persona = Omit<RivalDraft, "slugs">;

const PERSONA_PROMPT = `Eres el generador de rivales del "Modo Combate" de una Pokédex digital. El usuario ya ha elegido el equipo del rival; tú solo inventas al Entrenador que lo lidera, coherente con esas especies.

Responde SOLO con un objeto JSON válido, sin markdown:
{
  "nombre": "nombre y apodo del entrenador (ej.: 'Vega, Domadora de Dragones')",
  "lema": "grito de guerra de 1 frase, con chispa, estilo anime",
  "estilo": "descripción visual breve del entrenador en 5-10 palabras (para dibujarlo)"
}

Sin emojis en los valores JSON.`;

/** Persona for a hand-picked roster; null on any failure. */
async function draftPersona(
  apiKey: string,
  roster: LoadoutMember[],
): Promise<Persona | null> {
  const lines = roster
    .map((m) => `- ${formatName(m.name)} (${m.types.join("/")}) · Nivel ${m.level}`)
    .join("\n");
  try {
    const parsed = (await chatJSON(
      apiKey,
      [
        { role: "system", content: PERSONA_PROMPT },
        {
          role: "user",
          content: `EQUIPO DEL RIVAL (elegido por el usuario):\n${lines}\n\nGenera el entrenador JSON.`,
        },
      ],
      { temperature: 0.9, maxTokens: 200 },
    )) as Partial<Record<"nombre" | "lema" | "estilo", unknown>> | null;
    if (typeof parsed?.nombre !== "string" || typeof parsed?.lema !== "string") {
      return null;
    }
    return {
      nombre: parsed.nombre.trim().slice(0, 60),
      lema: parsed.lema.trim().slice(0, 160),
      estilo:
        typeof parsed.estilo === "string"
          ? parsed.estilo.trim().slice(0, 120)
          : "entrenador misterioso de estética neón",
    };
  } catch (err) {
    console.error("battle/setup persona draft failed", err);
    return null;
  }
}

const CANNED_RIVALS: Omit<RivalDraft, "slugs">[] = [
  {
    nombre: "Neo, el Domador del Circuito",
    lema: "¡Mis circuitos ya calcularon tu derrota!",
    estilo: "entrenador cyberpunk con visor neón y gabardina",
  },
  {
    nombre: "Askal, la Sombra de Kanto",
    lema: "En la oscuridad de la arena, solo brillará mi victoria.",
    estilo: "entrenadora misteriosa con capa oscura y ojos brillantes",
  },
];

/** Asks the LLM for a rival persona + roster; null on any failure. */
async function draftRival(
  apiKey: string,
  team: TeamMember[],
): Promise<RivalDraft | null> {
  const roster = team
    .map(
      (m) =>
        `- ${formatName(m.name)} (${m.types.join("/")}) · Nivel ${m.level ?? DEFAULT_LEVEL}`,
    )
    .join("\n");
  try {
    const parsed = (await chatJSON(
      apiKey,
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `EQUIPO DEL JUGADOR (${team.length}/6):\n${roster}\n\nGenera el rival JSON.`,
        },
      ],
      { temperature: 0.9, maxTokens: 400 },
    )) as Partial<Record<"nombre" | "lema" | "estilo", unknown>> & {
      equipo?: unknown;
    };
    if (
      typeof parsed?.nombre !== "string" ||
      typeof parsed?.lema !== "string" ||
      !Array.isArray(parsed?.equipo)
    ) {
      return null;
    }
    return {
      nombre: parsed.nombre.trim().slice(0, 60),
      lema: parsed.lema.trim().slice(0, 160),
      estilo:
        typeof parsed.estilo === "string"
          ? parsed.estilo.trim().slice(0, 120)
          : "entrenador misterioso de estética neón",
      slugs: parsed.equipo.filter((s): s is string => typeof s === "string"),
    };
  } catch (err) {
    console.error("battle/setup rival draft failed", err);
    return null;
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta OPENAI_API_KEY en el servidor." },
      { status: 500 },
    );
  }

  let body: { team?: unknown; rival?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const team = sanitizeTeam(body.team);
  if (team.length === 0) {
    return NextResponse.json(
      { error: "Necesitas al menos un Pokémon en el equipo para combatir." },
      { status: 400 },
    );
  }

  const avgLevel = Math.round(
    team.reduce((sum, m) => sum + (m.level ?? DEFAULT_LEVEL), 0) / team.length,
  );

  // Hand-picked rival (built in the pre-battle lobby): use it verbatim and
  // only invent the trainer persona. Otherwise, full random draft as always.
  const manualRival = sanitizeTeam(body.rival);
  let rivalMembers: LoadoutMember[];
  let persona: Persona;

  if (manualRival.length > 0) {
    rivalMembers = manualRival.map((m) => ({
      id: m.id,
      name: m.name,
      types: m.types,
      level: m.level ?? DEFAULT_LEVEL,
    }));
    persona =
      (await draftPersona(apiKey, rivalMembers)) ??
      CANNED_RIVALS[Math.floor(Math.random() * CANNED_RIVALS.length)];
  } else {
    const draft = await draftRival(apiKey, team);
    const index = await getPokemonIndex();
    const byName = new Map(index.entries.map((e) => [normalize(e.name), e]));

    // Resolve the LLM roster against the real species index; top up with
    // random species (skipping duplicates and the player's picks) so the
    // rival always fields as many Pokémon as the player.
    const used = new Set<number>(team.map((m) => m.id));
    const members: LoadoutMember[] = [];
    const pushEntry = (entry: { id: number; name: string; types: string[] }) => {
      if (used.has(entry.id)) return;
      used.add(entry.id);
      // ±2 level jitter around the player's average keeps it a fair fight.
      const level = Math.min(
        100,
        Math.max(1, avgLevel + Math.floor(Math.random() * 5) - 2),
      );
      members.push({
        id: entry.id,
        name: entry.name,
        types: entry.types,
        level,
      });
    };

    for (const slug of draft?.slugs ?? []) {
      if (members.length >= team.length) break;
      const entry = byName.get(normalize(slug));
      if (entry) pushEntry(entry);
    }
    while (members.length < team.length) {
      pushEntry(index.entries[Math.floor(Math.random() * index.entries.length)]);
    }
    rivalMembers = members;
    persona =
      draft ?? CANNED_RIVALS[Math.floor(Math.random() * CANNED_RIVALS.length)];
  }

  try {
    const [player, rivalTeam] = await Promise.all([
      buildTeam(team.map((m) => ({ ...m, level: m.level ?? DEFAULT_LEVEL }))),
      buildTeam(rivalMembers),
    ]);
    const payload: BattleSetupResponse = {
      player,
      rival: {
        nombre: persona.nombre,
        lema: persona.lema,
        estilo: persona.estilo,
        team: rivalTeam,
      },
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("battle/setup loadout failed", err);
    return NextResponse.json(
      { error: "No se pudieron preparar los equipos de combate. Inténtalo de nuevo." },
      { status: 502 },
    );
  }
}
