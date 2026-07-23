import { NextResponse } from "next/server";
import {
  CATEGORY_LABELS_ES,
  COLOR_LABELS_ES,
  EGG_GROUP_LABELS_ES,
  HABITAT_LABELS_ES,
  SHAPE_LABELS_ES,
  TYPE_LABELS_ES,
} from "@/lib/pokemon-meta";
import { SORT_OPTIONS } from "@/lib/sort";
import type { TrainerAction, TrainerFilterPatch } from "@/types/trainer";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

/** Hard cap on tool-call round-trips per user message. */
const MAX_TOOL_ROUNDS = 4;

const TYPE_SLUGS = Object.keys(TYPE_LABELS_ES);
const COLOR_SLUGS = Object.keys(COLOR_LABELS_ES);
const HABITAT_SLUGS = Object.keys(HABITAT_LABELS_ES);
const SHAPE_SLUGS = Object.keys(SHAPE_LABELS_ES);
const EGG_SLUGS = Object.keys(EGG_GROUP_LABELS_ES);
const CATEGORY_SLUGS = Object.keys(CATEGORY_LABELS_ES);
const STAGE_SLUGS = ["1", "2", "3", "final"];

/** slug -> "slug (Etiqueta en español)" listing for the system prompt. */
const listSlugs = (labels: Record<string, string>) =>
  Object.entries(labels)
    .map(([slug, label]) => `${slug} (${label})`)
    .join(", ");

const SYSTEM_PROMPT = `Eres el Profesor Samuel Oak, el investigador Pokémon más célebre de la franquicia, desde tu laboratorio de Pueblo Paleta. Esta Pokédex digital es tu gran invento: vives dentro de ella y acompañas al usuario mientras la explora.

PERSONALIDAD
- Hablas como el Profesor Oak: sabio, afable, curioso y didáctico, con orgullo de científico y un toque paternal. Tratas al usuario como a un joven entrenador prometedor y le explicas las cosas con rigor pero sin resultar pedante.
- De vez en cuando (sin abusar) mencionas tus investigaciones, a tu nieto Gary, a tu antiguo pupilo Ash Ketchum, tu afición a componer poemas senryū sobre Pokémon, o recuerdas que «hay un momento y un lugar para cada cosa».
- Eres un experto absoluto del universo Pokémon: especies, tipos, evoluciones, estrategia, juegos, anime, películas, regiones, gimnasios, objetos, bayas… Responde cualquier pregunta con datos reales de la franquicia.
- Respondes en el idioma del usuario (español por defecto). Mensajes claros y no demasiado largos: esto es un chat lateral.
- Puedes mantener conversación normal sobre cualquier tema, pero siempre desde tu personaje de profesor.

LA POKÉDEX QUE CONTROLAS
La página lista todas las especies de Gen I a IX. Tienes herramientas para manejarla:
- set_pokedex_filters: aplica o cambia filtros de la lista (búsqueda, tipo, generación, color, hábitat, forma, grupo huevo, categoría, etapa evolutiva y orden). Los campos que no envíes se mantienen; envía null en un campo para limpiarlo.
- clear_filters: limpia todos los filtros.
- open_pokemon: abre la ficha detallada de una especie.

REGLAS DE HERRAMIENTAS
- Úsalas cuando el usuario quiera ver, buscar o filtrar Pokémon en la lista, o abrir una ficha («enséñame los de tipo fuego», «abre a Charizard», «legendarios de Kanto»…). No las uses para preguntas puramente conversacionales.
- Tras usarlas, confirma en una frase lo que has hecho, con tu estilo.
- El campo q busca por nombre o cadena evolutiva y espera nombres en inglés en minúsculas (ej.: "pikachu").
- open_pokemon espera el slug inglés de PokéAPI en minúsculas: "charizard", "mr-mime", "nidoran-f", "ho-oh", "mewtwo"…
- Slugs válidos por filtro:
  · type: ${listSlugs(TYPE_LABELS_ES)}
  · color: ${listSlugs(COLOR_LABELS_ES)}
  · habitat (solo Gen I–III): ${listSlugs(HABITAT_LABELS_ES)}
  · shape: ${listSlugs(SHAPE_LABELS_ES)}
  · egg: ${listSlugs(EGG_GROUP_LABELS_ES)}
  · cat: ${listSlugs(CATEGORY_LABELS_ES)}
  · stage: 1 (básico), 2 (1ª evolución), 3 (2ª evolución), final (forma final)
  · sort: id-asc, id-desc, name-asc, name-desc
  · gen: número del 1 al 9`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "set_pokedex_filters",
      description:
        "Aplica filtros a la lista de la Pokédex. Los campos omitidos no cambian; un campo a null se limpia.",
      parameters: {
        type: "object",
        properties: {
          q: {
            type: ["string", "null"],
            description:
              "Búsqueda por nombre o cadena evolutiva, en inglés minúsculas",
          },
          type: { type: ["string", "null"], enum: [...TYPE_SLUGS, null] },
          gen: { type: ["integer", "null"], minimum: 1, maximum: 9 },
          sort: { type: ["string", "null"], enum: [...SORT_OPTIONS, null] },
          color: { type: ["string", "null"], enum: [...COLOR_SLUGS, null] },
          habitat: { type: ["string", "null"], enum: [...HABITAT_SLUGS, null] },
          shape: { type: ["string", "null"], enum: [...SHAPE_SLUGS, null] },
          egg: { type: ["string", "null"], enum: [...EGG_SLUGS, null] },
          cat: { type: ["string", "null"], enum: [...CATEGORY_SLUGS, null] },
          stage: { type: ["string", "null"], enum: [...STAGE_SLUGS, null] },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clear_filters",
      description: "Limpia todos los filtros de la Pokédex.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "open_pokemon",
      description:
        "Abre la ficha detallada de una especie. Usa el slug inglés de PokéAPI en minúsculas.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: 'Slug, ej. "charizard"' },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  },
];

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

/** Keep only whitelisted, well-typed fields from the model's arguments. */
function sanitizePatch(args: Record<string, unknown>): TrainerFilterPatch {
  const patch: TrainerFilterPatch = {};
  const pick = (key: keyof TrainerFilterPatch, valid: (v: string) => boolean) => {
    const v = args[key];
    if (v === null) patch[key] = null;
    else if (typeof v === "string" && valid(v)) {
      (patch as Record<string, unknown>)[key] = v;
    }
  };
  pick("q", () => true);
  pick("type", (v) => TYPE_SLUGS.includes(v));
  pick("sort", (v) => (SORT_OPTIONS as readonly string[]).includes(v));
  pick("color", (v) => COLOR_SLUGS.includes(v));
  pick("habitat", (v) => HABITAT_SLUGS.includes(v));
  pick("shape", (v) => SHAPE_SLUGS.includes(v));
  pick("egg", (v) => EGG_SLUGS.includes(v));
  pick("cat", (v) => CATEGORY_SLUGS.includes(v));
  pick("stage", (v) => STAGE_SLUGS.includes(v));
  const gen = args.gen;
  if (gen === null) patch.gen = null;
  else if (typeof gen === "number" && gen >= 1 && gen <= 9) {
    patch.gen = Math.trunc(gen);
  }
  return patch;
}

/** Runs one tool call, appending the resulting UI action. */
function executeTool(
  name: string,
  args: Record<string, unknown>,
  actions: TrainerAction[],
): { ok: boolean; detail?: string } {
  if (name === "set_pokedex_filters") {
    const patch = sanitizePatch(args);
    if (Object.keys(patch).length === 0) {
      return { ok: false, detail: "sin campos válidos" };
    }
    actions.push({ type: "set_filters", patch });
    return { ok: true };
  }
  if (name === "clear_filters") {
    actions.push({ type: "clear_filters" });
    return { ok: true };
  }
  if (name === "open_pokemon") {
    const slug = String(args.name ?? "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "");
    if (!slug) return { ok: false, detail: "slug vacío" };
    actions.push({ type: "open_pokemon", name: slug });
    return { ok: true };
  }
  return { ok: false, detail: "herramienta desconocida" };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta OPENAI_API_KEY en el servidor." },
      { status: 500 },
    );
  }

  let body: { messages?: IncomingMessage[]; filters?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const history = (body.messages ?? [])
    .filter(
      (m): m is IncomingMessage =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m?.content === "string",
    )
    .slice(-20);
  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "Falta el mensaje." }, { status: 400 });
  }

  const activeFilters = Object.entries(body.filters ?? {})
    .filter(([key, v]) => v !== null && v !== "" && key !== "page")
    .map(([key, v]) => `${key}=${String(v)}`)
    .join(", ");

  const conversation: Record<string, unknown>[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: activeFilters
        ? `Filtros activos ahora mismo en la Pokédex: ${activeFilters}.`
        : "Ahora mismo la Pokédex no tiene ningún filtro activo.",
    },
    ...history,
  ];

  const actions: TrainerAction[] = [];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const isLastRound = round === MAX_TOOL_ROUNDS;
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: conversation,
        tools: isLastRound ? undefined : TOOLS,
        temperature: 0.8,
        max_tokens: 700,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("OpenAI error", res.status, detail.slice(0, 500));
      return NextResponse.json(
        {
          error:
            res.status === 401
              ? "La API key de OpenAI no es válida o ha caducado."
              : "El transmisor de la Pokédex falló al contactar con la IA.",
        },
        { status: 502 },
      );
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message;
    const toolCalls: {
      id: string;
      function: { name: string; arguments: string };
    }[] = message?.tool_calls ?? [];

    if (toolCalls.length === 0) {
      return NextResponse.json({
        message:
          typeof message?.content === "string" && message.content.trim()
            ? message.content
            : "¡Uy! Me he quedado sin palabras… ¡inténtalo otra vez!",
        actions,
      });
    }

    conversation.push(message);
    for (const call of toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        // Malformed arguments: report failure back to the model.
      }
      const result = executeTool(call.function.name, args, actions);
      conversation.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  // Unreachable: the last round runs without tools, so it always returns.
  return NextResponse.json({ message: "¡Vaya! Algo salió mal.", actions });
}
