import { NextResponse } from "next/server";
import { fetchMoveOptions } from "@/lib/battle/catalogue";
import { isKnownAt } from "@/lib/battle/learnset";
import { fetchPokemon } from "@/lib/battle/loadout";
import {
  isMovePreset,
  PRESET_BRIEF,
  type MovePreset,
} from "@/lib/battle/move-presets";
import { chatJSON, OpenAIError } from "@/lib/battle/openai";
import { getDict } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n/config";
import { getLang } from "@/lib/i18n/server";
import { DEFAULT_LEVEL, type MoveCoachResponse, type MoveOption } from "@/types/team";

/**
 * The build editor's move coach: the user says what they want in their own
 * words (or taps one of the preset briefs) and gets back the four moves to
 * carry.
 *
 * The catch that makes this useful instead of decorative is that the model
 * never picks freely. It is handed the species' REAL repertoire at that exact
 * level — the same two shelves the editor shows, level-up moves it has already
 * unlocked plus the TMs it can use — and anything it answers that isn't on
 * that list is dropped here. So a set that comes back is a set the editor
 * would have let you build by hand, which is the whole point: the level and
 * legality rules can't be talked around.
 */

/** Hard cap on the free-text wish, to keep prompts (and abuse) bounded. */
const MAX_PROMPT_LENGTH = 300;

/** How many legal moves the prompt carries. Even a Mew stays under this. */
const MAX_CATALOGUE = 240;

/** A Pokémon carries four moves — the slots the editor draws. */
const MOVE_SLOTS = 4;

/** Stand-in power for variable-power attacks (Seismic Toss, Grass Knot…). */
const VARIABLE_POWER = 60;

/** Language name (in Spanish, the prompt's language) for the output line. */
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

const systemPrompt = (lang: Lang) =>
  `Eres el "Entrenador IA" de una Pokédex digital: eliges los movimientos de combate de un Pokémon concreto. Te doy su REPERTORIO LEGAL COMPLETO a su nivel actual y lo que quiere el entrenador; tú eliges ${MOVE_SLOTS} movimientos de esa lista.

Responde SOLO con un objeto JSON válido, sin markdown:
{
  "movimientos": ["slug-1", "slug-2", "slug-3", "slug-4"],
  "motivo": "1-2 frases explicando el conjunto"
}

Reglas:
- Los ${MOVE_SLOTS} slugs tienen que aparecer TAL CUAL en el repertorio que te doy. No inventes, no traduzcas y no uses movimientos de la forma evolucionada: cualquier slug que no esté en la lista se descarta y el hueco se rellena solo.
- ${MOVE_SLOTS} movimientos DISTINTOS. Si el repertorio tuviera menos de ${MOVE_SLOTS}, devuelve todos los que haya.
- Manda lo que pide el entrenador. Dentro de eso, optimiza: aprovecha el STAB (movimientos del mismo tipo que el Pokémon), evita repetir tipo de ataque salvo que se pida, y prefiere precisión alta a potencia inútil.
- No propongas un movimiento de estado si lo que se pide es daño puro, ni cuatro ataques si lo que se pide es control.
- Escribe "motivo" en ${LANG_NAME[lang]}. Las claves del JSON no se traducen NUNCA.
- Sin emojis en los valores JSON.`;

/** One catalogue line: everything the model needs to judge a move, compactly. */
function describeMove(move: MoveOption): string {
  const how =
    move.method === "machine" ? "MT" : `Nv${move.learnLevel ?? 1}`;
  const cls =
    move.damageClass === "physical"
      ? "fis"
      : move.damageClass === "special"
        ? "esp"
        : "est";
  return [
    move.slug,
    move.type,
    cls,
    `pot${move.power ?? "-"}`,
    `prec${move.accuracy ?? "-"}`,
    how,
  ].join("|");
}

/**
 * How good a move is on its own, for topping a short set up: raw power, times
 * STAB. Status moves score zero — a gap is filled with something that hits.
 */
function rawScore(move: MoveOption, types: string[]): number {
  if (move.damageClass === "status") return 0;
  return (move.power ?? VARIABLE_POWER) * (types.includes(move.type) ? 1.5 : 1);
}

/** Lowercased PokéAPI slug, or "" when the value isn't a usable string. */
function slugOf(value: unknown): string {
  return typeof value === "string"
    ? value.toLowerCase().trim().replace(/[^a-z0-9-]/g, "").slice(0, 60)
    : "";
}

export async function POST(request: Request) {
  const lang = await getLang();
  const t = getDict(lang).trainer;
  const tt = getDict(lang).team;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: t.errMissingKey }, { status: 500 });
  }

  let body: {
    species?: unknown;
    level?: unknown;
    prompt?: unknown;
    preset?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t.errBadJson }, { status: 400 });
  }

  const species = typeof body.species === "string" ? body.species : "";
  if (!/^[a-z0-9-]{1,40}$/.test(species)) {
    return NextResponse.json({ error: tt.apiInvalidSpecies }, { status: 400 });
  }
  const level =
    typeof body.level === "number" && Number.isFinite(body.level)
      ? Math.min(100, Math.max(1, Math.round(body.level)))
      : DEFAULT_LEVEL;

  // A preset chip wins over free text: the brief is ours, so it can't be
  // steered by whatever was left in the box.
  const preset: MovePreset | null = isMovePreset(body.preset)
    ? body.preset
    : null;
  const wish = preset
    ? PRESET_BRIEF[preset]
    : typeof body.prompt === "string"
      ? body.prompt.trim().slice(0, MAX_PROMPT_LENGTH)
      : "";
  if (!wish) {
    return NextResponse.json({ error: tt.coachMoveErrEmpty }, { status: 400 });
  }

  let pokemon;
  let legal: MoveOption[];
  try {
    pokemon = await fetchPokemon(species);
    // The editor's own two shelves, narrowed to what this level unlocks —
    // exactly the set a hand-built loadout may draw from.
    legal = (await fetchMoveOptions(pokemon, lang)).filter((m) =>
      isKnownAt(m, level),
    );
  } catch (err) {
    console.error("battle/move-coach catalogue failed", err);
    return NextResponse.json({ error: tt.apiOptionsError }, { status: 502 });
  }
  if (legal.length === 0) {
    return NextResponse.json(
      { error: tt.coachMoveErrNoMoves },
      { status: 422 },
    );
  }

  const types = pokemon.types.map((entry) => entry.type.name);
  // Strongest first, so a truncated catalogue keeps what matters.
  const shortlist = [...legal]
    .sort((a, b) => rawScore(b, types) - rawScore(a, types))
    .slice(0, MAX_CATALOGUE);
  const bySlug = new Map(legal.map((m) => [m.slug, m]));

  let picked: string[] = [];
  let motivo = "";
  try {
    const parsed = (await chatJSON(
      apiKey,
      [
        { role: "system", content: systemPrompt(lang) },
        {
          role: "user",
          content: [
            `POKÉMON: ${species} (tipos: ${types.join("/")}) · Nivel ${level}`,
            "",
            "REPERTORIO LEGAL (slug|tipo|categoría|potencia|precisión|cómo lo aprende):",
            shortlist.map(describeMove).join("\n"),
            "",
            `PETICIÓN DEL ENTRENADOR: ${wish}`,
          ].join("\n"),
        },
      ],
      { temperature: 0.6, maxTokens: 320 },
    )) as { movimientos?: unknown; motivo?: unknown } | null;

    if (Array.isArray(parsed?.movimientos)) {
      picked = [
        ...new Set(parsed.movimientos.map(slugOf).filter(Boolean)),
      ].filter((slug) => bySlug.has(slug));
    }
    if (typeof parsed?.motivo === "string") {
      motivo = parsed.motivo.trim().slice(0, 300);
    }
  } catch (err) {
    if (err instanceof OpenAIError && err.status === 401) {
      return NextResponse.json({ error: t.errBadApiKey }, { status: 502 });
    }
    console.error("battle/move-coach draft failed", err);
    return NextResponse.json({ error: t.coachErrUpstream }, { status: 502 });
  }

  // Anything the model got wrong (a hallucinated slug, an evolved-form move,
  // a duplicate) has already been dropped. Rather than hand back three slots
  // and a shrug, fill what's missing with the strongest legal attacks left,
  // preferring a type the set doesn't cover yet — and say so, because the
  // filler is ours and not the answer to what was asked.
  const toppedUp = picked.length < Math.min(MOVE_SLOTS, legal.length);
  if (toppedUp) {
    const covered = new Set(picked.map((slug) => bySlug.get(slug)?.type));
    const rest = legal
      .filter((m) => !picked.includes(m.slug))
      .sort(
        (a, b) =>
          rawScore(b, types) * (covered.has(b.type) ? 0.6 : 1) -
          rawScore(a, types) * (covered.has(a.type) ? 0.6 : 1),
      );
    for (const move of rest) {
      if (picked.length >= MOVE_SLOTS) break;
      picked.push(move.slug);
      covered.add(move.type);
    }
  }

  const payload: MoveCoachResponse = {
    moves: picked.slice(0, MOVE_SLOTS),
    motivo,
    toppedUp,
  };
  return NextResponse.json(payload);
}
