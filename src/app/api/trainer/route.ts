import { NextResponse } from "next/server";
import { fetchLearnset, legalSlugsAt } from "@/lib/battle/learnset";
import { fetchPokemon } from "@/lib/battle/loadout";
import { getDict } from "@/lib/i18n";
import { isLang, type Lang } from "@/lib/i18n/config";
import { getLang } from "@/lib/i18n/server";
import { getPokemonIndex } from "@/lib/index/build-index";
import {
  CATEGORY_LABELS_ES,
  COLOR_LABELS_ES,
  EGG_GROUP_LABELS_ES,
  formatName,
  HABITAT_LABELS_ES,
  SHAPE_LABELS_ES,
  TYPE_LABELS_ES,
} from "@/lib/pokemon-meta";
import { filterPokemon } from "@/lib/search/evolution-search";
import { SORT_OPTIONS } from "@/lib/sort";
import type { PokemonIndex, PokemonIndexEntry } from "@/types/pokemon";
import { DEFAULT_LEVEL, type TeamMember } from "@/types/team";
import type { TrainerAction, TrainerFilterPatch } from "@/types/trainer";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

/** Hard cap on tool-call round-trips per user message. */
const MAX_TOOL_ROUNDS = 6;

/** Slots in a team, mirroring TEAM_SIZE on the client. */
const TEAM_SIZE = 6;

/** Species names a single `list_pokemon` answer may carry back to the model. */
const MAX_LISTED = 60;

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
La página lista todas las especies de Gen I a IX, y el usuario tiene un equipo de hasta ${TEAM_SIZE} Pokémon con nivel, habilidad y movimientos. Puedes hacer prácticamente todo lo que haría el usuario:
- set_pokedex_filters: aplica o cambia filtros de la lista (búsqueda, tipo, generación, color, hábitat, forma, grupo huevo, categoría, etapa evolutiva, orden y EXCLUSIONES). Los campos que no envíes se mantienen; envía null en un campo para limpiarlo.
- clear_filters: limpia todos los filtros.
- open_pokemon: abre la ficha detallada de una especie.
- list_pokemon: consulta qué especies cumplen unos filtros y te devuelve sus nombres. ÚSALA SIEMPRE antes de afirmar qué Pokémon cumplen algo o antes de fichar a varios a la vez.
- add_to_team / remove_from_team / clear_team: gestionan el equipo del usuario.
- set_team_levels: pone el nivel de combate de uno, varios o todos los miembros.
- set_pokemon_moves: elige la habilidad y hasta 4 movimientos de un miembro del equipo. Solo valen movimientos que esa especie conozca A SU NIVEL: el servidor descarta los ilegales y te dice cuáles ha aceptado.
- open_team: abre el panel «Mi Equipo».
- start_battle: lleva al usuario al Modo Combate.

REGLAS DE HERRAMIENTAS
- Úsalas siempre que el usuario quiera ver, buscar, filtrar, abrir fichas o tocar su equipo («enséñame los de tipo eléctrico menos Pikachu y sus evoluciones», «añade a Charizard a mi equipo», «pon a todos a nivel 5», «dale Lanzallamas»…). No las uses para preguntas puramente conversacionales.
- Encadena varias si hace falta: para «ficha a todos los de tipo eléctrico menos Pikachu y sus evoluciones», primero list_pokemon con esos filtros y luego add_to_team con los nombres que te devuelva.
- El equipo tiene ${TEAM_SIZE} plazas. Si lo que pide el usuario no cabe, ficha lo que quepa y díselo con naturalidad.
- Tras usarlas, confirma en una o dos frases lo que has hecho, con tu estilo. Si una herramienta te dice que algo no se pudo hacer, admítelo en vez de inventártelo.
- El campo q busca por nombre o cadena evolutiva y espera nombres en inglés en minúsculas (ej.: "pikachu"). OJO: q="pikachu" trae también a Pichu y Raichu, porque la búsqueda arrastra la familia evolutiva entera.
- Para «menos X» usa exclude: ["x"], y exclude_family: true cuando el usuario diga «y sus evoluciones», «y su familia» o similar.
- Los nombres de especie y de movimiento van SIEMPRE en slug inglés de PokéAPI en minúsculas: "charizard", "mr-mime", "nidoran-f", "ho-oh", "thunder-shock", "flamethrower".
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

/** Extra system line for non-Spanish UIs; the es prompt stays intact. The
 * note itself is in Spanish (the prompt's language) and names the professor's
 * official localized identity so the persona survives translation. */
const languageNote = (idioma: string, oak: string) => `

IDIOMA
- El usuario está usando la versión en ${idioma} de la Pokédex: responde SIEMPRE en ${idioma}, salvo que el usuario escriba claramente en otro idioma. Mantén exactamente la misma personalidad del Profesor Oak (conocido en ese idioma como ${oak}).`;

const LANGUAGE_NOTE: Record<Lang, string> = {
  es: "",
  en: `

IDIOMA
- El usuario está usando la versión en inglés de la Pokédex: responde SIEMPRE en inglés, salvo que el usuario escriba claramente en otro idioma. Mantén exactamente la misma personalidad del Profesor Oak.`,
  fr: languageNote("francés", "Professeur Chen"),
  de: languageNote("alemán", "Professor Eich"),
  it: languageNote("italiano", "Professor Oak"),
  ja: languageNote("japonés", "オーキド博士"),
  ko: languageNote("coreano", "오박사"),
  "zh-Hans": languageNote("chino simplificado", "大木博士"),
  "zh-Hant": languageNote("chino tradicional", "大木博士"),
};

/** Filter properties shared by `set_pokedex_filters` and `list_pokemon`. */
const FILTER_PROPERTIES = {
  q: {
    type: ["string", "null"],
    description:
      "Búsqueda por nombre o cadena evolutiva, en inglés minúsculas (arrastra la familia entera)",
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
  exclude: {
    type: ["array", "null"],
    items: { type: "string" },
    description: 'Especies a dejar fuera, ej. ["pikachu"] para «menos Pikachu»',
  },
  exclude_family: {
    type: ["boolean", "null"],
    description:
      "true cuando la exclusión debe arrastrar toda la familia evolutiva",
  },
} as const;

const NAMES_PARAM = {
  type: "array",
  items: { type: "string" },
  description: 'Slugs ingleses en minúsculas, ej. ["pikachu", "charizard"]',
} as const;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "set_pokedex_filters",
      description:
        "Aplica filtros a la lista de la Pokédex. Los campos omitidos no cambian; un campo a null se limpia.",
      parameters: {
        type: "object",
        properties: FILTER_PROPERTIES,
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
  {
    type: "function",
    function: {
      name: "list_pokemon",
      description:
        "Devuelve qué especies cumplen unos filtros, sin tocar la pantalla. Úsala antes de enumerar Pokémon o de ficharlos en bloque.",
      parameters: {
        type: "object",
        properties: {
          ...FILTER_PROPERTIES,
          limit: {
            type: ["integer", "null"],
            minimum: 1,
            maximum: MAX_LISTED,
            description: `Cuántos nombres devolver como máximo (por defecto ${MAX_LISTED})`,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_team",
      description: `Ficha especies para el equipo del usuario (máximo ${TEAM_SIZE} en total).`,
      parameters: {
        type: "object",
        properties: {
          names: NAMES_PARAM,
          level: {
            type: ["integer", "null"],
            minimum: 1,
            maximum: 100,
            description: "Nivel de combate para los que fiches ahora",
          },
        },
        required: ["names"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_from_team",
      description: "Quita del equipo las especies indicadas.",
      parameters: {
        type: "object",
        properties: { names: NAMES_PARAM },
        required: ["names"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clear_team",
      description: "Vacía por completo el equipo del usuario.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "set_team_levels",
      description:
        "Cambia el nivel de combate. Sin 'names', se aplica a todo el equipo.",
      parameters: {
        type: "object",
        properties: {
          level: { type: "integer", minimum: 1, maximum: 100 },
          names: { ...NAMES_PARAM, description: "Miembros concretos (opcional)" },
        },
        required: ["level"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_pokemon_moves",
      description:
        "Elige habilidad y hasta 4 movimientos de un miembro del equipo. Solo se aceptan los que conozca a su nivel.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: 'Miembro, ej. "charizard"' },
          moves: {
            type: ["array", "null"],
            items: { type: "string" },
            description: 'Hasta 4 slugs, ej. ["flamethrower", "dragon-claw"]',
          },
          ability: {
            type: ["string", "null"],
            description: 'Slug inglés de la habilidad, ej. "blaze"',
          },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_team",
      description: "Abre el panel «Mi Equipo» para que el usuario lo vea.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "start_battle",
      description:
        "Lleva al usuario al Modo Combate con su equipo actual. Necesita al menos 1 Pokémon.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

/** Loose species matcher shared with the other AI routes. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

function slugOf(value: unknown): string {
  return typeof value === "string"
    ? value.toLowerCase().trim().replace(/[^a-z0-9-]/g, "").slice(0, 60)
    : "";
}

/** Reads a `names` argument into clean slugs. */
function slugList(value: unknown, max = TEAM_SIZE * 4): string[] {
  return Array.isArray(value)
    ? [...new Set(value.map(slugOf).filter(Boolean))].slice(0, max)
    : [];
}

function clampLevel(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(100, Math.max(1, Math.round(value)))
    : null;
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
  if (args.exclude === null) {
    patch.x = null;
    patch.xfam = null;
  } else if (Array.isArray(args.exclude)) {
    const names = slugList(args.exclude);
    patch.x = names.length > 0 ? names.join(",") : null;
    if (names.length === 0) patch.xfam = null;
  }
  if (args.exclude_family === null) patch.xfam = null;
  else if (typeof args.exclude_family === "boolean") {
    patch.xfam = args.exclude_family || null;
  }
  return patch;
}

/** The filter arguments as the pure search engine wants them. */
function toSearchFilters(args: Record<string, unknown>) {
  const str = (key: string, valid: string[]) => {
    const v = args[key];
    return typeof v === "string" && valid.includes(v) ? v : null;
  };
  return {
    query: typeof args.q === "string" ? args.q : "",
    type: str("type", TYPE_SLUGS),
    generation:
      typeof args.gen === "number" && args.gen >= 1 && args.gen <= 9
        ? Math.trunc(args.gen)
        : null,
    color: str("color", COLOR_SLUGS),
    habitat: str("habitat", HABITAT_SLUGS),
    shape: str("shape", SHAPE_SLUGS),
    eggGroup: str("egg", EGG_SLUGS),
    category: str("cat", CATEGORY_SLUGS) as null,
    stage: str("stage", STAGE_SLUGS) as null,
    exclude: slugList(args.exclude, 30),
    excludeFamily: args.exclude_family === true,
  };
}

/** Whitelists the roster the client sent along with the conversation. */
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
      name: slugOf(m.name),
      types: m.types.filter((t) => TYPE_SLUGS.includes(t)).slice(0, 2),
      level: clampLevel(m.level) ?? DEFAULT_LEVEL,
      build: m.build,
    }))
    .filter((m) => m.name)
    .slice(0, TEAM_SIZE);
}

/** Everything a tool needs to read the Pokédex and rewrite the team. */
interface ToolContext {
  index: PokemonIndex;
  byName: Map<string, PokemonIndexEntry>;
  team: TeamMember[];
  /** Set once any tool touched the roster, so one set_team action is emitted. */
  teamChanged: boolean;
  actions: TrainerAction[];
}

type ToolResult = Record<string, unknown>;

/** Runs one tool call, mutating the context and appending any UI action. */
async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolResult> {
  switch (name) {
    case "set_pokedex_filters": {
      const patch = sanitizePatch(args);
      if (Object.keys(patch).length === 0) {
        return { ok: false, detail: "sin campos válidos" };
      }
      ctx.actions.push({ type: "set_filters", patch });
      return { ok: true, applied: patch };
    }

    case "clear_filters":
      ctx.actions.push({ type: "clear_filters" });
      return { ok: true };

    case "open_pokemon": {
      const slug = slugOf(args.name);
      if (!slug) return { ok: false, detail: "slug vacío" };
      if (!ctx.byName.has(normalize(slug))) {
        return { ok: false, detail: `"${slug}" no existe en la Pokédex` };
      }
      ctx.actions.push({ type: "open_pokemon", name: slug });
      return { ok: true };
    }

    case "list_pokemon": {
      const limit = clampLevel(args.limit) ?? MAX_LISTED;
      const results = filterPokemon(ctx.index, toSearchFilters(args));
      return {
        ok: true,
        total: results.length,
        names: results.slice(0, Math.min(limit, MAX_LISTED)).map((e) => e.name),
        truncated: results.length > Math.min(limit, MAX_LISTED),
      };
    }

    case "add_to_team": {
      const level = clampLevel(args.level);
      const added: string[] = [];
      const unknown: string[] = [];
      let full = false;
      for (const slug of slugList(args.names)) {
        const entry = ctx.byName.get(normalize(slug));
        if (!entry) {
          unknown.push(slug);
          continue;
        }
        if (ctx.team.some((m) => m.id === entry.id)) continue;
        if (ctx.team.length >= TEAM_SIZE) {
          full = true;
          break;
        }
        ctx.team.push({
          id: entry.id,
          name: entry.name,
          types: entry.types,
          level: level ?? DEFAULT_LEVEL,
        });
        ctx.teamChanged = true;
        added.push(entry.name);
      }
      return {
        ok: added.length > 0,
        added,
        unknown,
        full,
        team: ctx.team.map((m) => m.name),
        freeSlots: TEAM_SIZE - ctx.team.length,
      };
    }

    case "remove_from_team": {
      const wanted = new Set(slugList(args.names).map(normalize));
      const removed = ctx.team
        .filter((m) => wanted.has(normalize(m.name)))
        .map((m) => m.name);
      if (removed.length > 0) {
        ctx.team = ctx.team.filter((m) => !wanted.has(normalize(m.name)));
        ctx.teamChanged = true;
      }
      return { ok: removed.length > 0, removed, team: ctx.team.map((m) => m.name) };
    }

    case "clear_team": {
      if (ctx.team.length === 0) return { ok: false, detail: "ya estaba vacío" };
      ctx.team = [];
      ctx.teamChanged = true;
      return { ok: true };
    }

    case "set_team_levels": {
      const level = clampLevel(args.level);
      if (level === null) return { ok: false, detail: "nivel inválido" };
      const wanted = slugList(args.names).map(normalize);
      const targets =
        wanted.length > 0
          ? ctx.team.filter((m) => wanted.includes(normalize(m.name)))
          : ctx.team;
      if (targets.length === 0) {
        return { ok: false, detail: "esos Pokémon no están en el equipo" };
      }
      for (const member of targets) {
        member.level = level;
        // A level change can invalidate hand-picked moves; the build editor
        // and the battle loadout drop what the Pokémon no longer knows, so
        // re-validate here too instead of leaving an illegal set behind.
        if (member.build?.moves?.length) {
          member.build = await revalidateBuild(member);
        }
      }
      ctx.teamChanged = true;
      return { ok: true, level, changed: targets.map((m) => m.name) };
    }

    case "set_pokemon_moves": {
      const slug = slugOf(args.name);
      const member = ctx.team.find((m) => normalize(m.name) === normalize(slug));
      if (!member) {
        return { ok: false, detail: `"${slug}" no está en el equipo` };
      }
      const wantedMoves = slugList(args.moves, 4);
      const wantedAbility = slugOf(args.ability);
      try {
        const pokemon = await fetchPokemon(member.name);
        const abilities = new Set(
          [
            ...pokemon.abilities,
            ...(pokemon.past_abilities ?? []).flatMap((p) => p.abilities),
          ]
            .filter((a) => a.ability !== null)
            .map((a) => a.ability!.name),
        );
        const level = member.level ?? DEFAULT_LEVEL;
        const legal = legalSlugsAt(await fetchLearnset(pokemon), level);
        const accepted = wantedMoves.filter((m) => legal.has(m));
        const rejected = wantedMoves.filter((m) => !legal.has(m));
        const ability = abilities.has(wantedAbility) ? wantedAbility : undefined;
        member.build =
          accepted.length > 0 || ability
            ? { ability, moves: accepted.length > 0 ? accepted : undefined }
            : undefined;
        ctx.teamChanged = true;
        return {
          ok: accepted.length > 0 || Boolean(ability),
          accepted,
          rejected,
          ability: ability ?? null,
          level,
          detail:
            rejected.length > 0
              ? `no los conoce a nivel ${level}: ${rejected.join(", ")}`
              : undefined,
        };
      } catch {
        return { ok: false, detail: "no se pudo leer el repertorio de esa especie" };
      }
    }

    case "open_team":
      ctx.actions.push({ type: "open_team" });
      return { ok: true };

    case "start_battle": {
      if (ctx.team.length === 0) {
        return { ok: false, detail: "el equipo está vacío" };
      }
      ctx.actions.push({ type: "start_battle" });
      return { ok: true };
    }

    default:
      return { ok: false, detail: "herramienta desconocida" };
  }
}

/** Drops the moves a member no longer knows after a level change. */
async function revalidateBuild(member: TeamMember) {
  if (!member.build?.moves?.length) return member.build;
  try {
    const pokemon = await fetchPokemon(member.name);
    const legal = legalSlugsAt(
      await fetchLearnset(pokemon),
      member.level ?? DEFAULT_LEVEL,
    );
    const moves = member.build.moves.filter((m) => legal.has(m));
    return member.build.ability || moves.length > 0
      ? { ability: member.build.ability, moves: moves.length > 0 ? moves : undefined }
      : undefined;
  } catch {
    return member.build; // Upstream hiccup: battle setup re-checks anyway.
  }
}

export async function POST(request: Request) {
  let body: {
    messages?: IncomingMessage[];
    filters?: Record<string, unknown>;
    team?: unknown;
    lang?: string;
  };
  try {
    body = await request.json();
  } catch {
    // No usable body: fall back to the language cookie.
    return NextResponse.json(
      { error: getDict(await getLang()).trainer.errBadJson },
      { status: 400 },
    );
  }

  // The chat sends its language explicitly; the cookie covers older clients.
  const lang: Lang = isLang(body.lang) ? body.lang : await getLang();
  const t = getDict(lang).trainer;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: t.errMissingKey }, { status: 500 });
  }

  const history = (body.messages ?? [])
    .filter(
      (m): m is IncomingMessage =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m?.content === "string",
    )
    .slice(-20);
  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: t.errNoMessage }, { status: 400 });
  }

  const activeFilters = Object.entries(body.filters ?? {})
    .filter(([key, v]) => v !== null && v !== "" && key !== "page")
    .map(([key, v]) => `${key}=${String(v)}`)
    .join(", ");

  const index = await getPokemonIndex();
  const ctx: ToolContext = {
    index,
    byName: new Map(index.entries.map((e) => [normalize(e.name), e])),
    team: sanitizeTeam(body.team),
    teamChanged: false,
    actions: [],
  };

  const describeTeam = () =>
    ctx.team.length === 0
      ? "El usuario no tiene ningún Pokémon en su equipo ahora mismo."
      : `Equipo actual del usuario (${ctx.team.length}/${TEAM_SIZE}): ${ctx.team
          .map((m) => {
            const moves = m.build?.moves?.length
              ? `, movimientos: ${m.build.moves.join("/")}`
              : "";
            return `${m.name} (nivel ${m.level ?? DEFAULT_LEVEL}${moves})`;
          })
          .join("; ")}.`;

  const conversation: Record<string, unknown>[] = [
    { role: "system", content: SYSTEM_PROMPT + LANGUAGE_NOTE[lang] },
    {
      role: "system",
      content: activeFilters
        ? `Filtros activos ahora mismo en la Pokédex: ${activeFilters}.`
        : "Ahora mismo la Pokédex no tiene ningún filtro activo.",
    },
    { role: "system", content: describeTeam() },
    ...history,
  ];

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
          error: res.status === 401 ? t.errBadApiKey : t.errUpstream,
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
            : t.fallbackEmpty,
        actions: finalActions(ctx, t),
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
      const result = await executeTool(call.function.name, args, ctx);
      conversation.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  // Unreachable: the last round runs without tools, so it always returns.
  return NextResponse.json({
    message: t.fallbackError,
    actions: finalActions(ctx, t),
  });
}

/** Appends the single roster action, if the professor touched the team. */
function finalActions(
  ctx: ToolContext,
  t: ReturnType<typeof getDict>["trainer"],
): TrainerAction[] {
  if (!ctx.teamChanged) return ctx.actions;
  return [
    ...ctx.actions,
    {
      type: "set_team",
      members: ctx.team,
      summary:
        ctx.team.length === 0
          ? t.actionTeamCleared
          : t.actionTeamSet(
              ctx.team
                .map((m) =>
                  t.actionMemberLevel(
                    formatName(m.name),
                    m.level ?? DEFAULT_LEVEL,
                  ),
                )
                .join(", "),
            ),
    },
  ];
}
