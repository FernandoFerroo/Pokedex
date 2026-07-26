import { NextResponse } from "next/server";
import { chatJSON } from "@/lib/battle/openai";
import { sanitizeTeam } from "@/lib/battle/sanitize";
import { battleDict } from "@/lib/i18n/dictionaries/battle";
import { tournamentDict } from "@/lib/i18n/dictionaries/tournament";
import type { Lang } from "@/lib/i18n/config";
import { getLang } from "@/lib/i18n/server";
import { getPokemonIndex } from "@/lib/index/build-index";
import { formatName } from "@/lib/pokemon-meta";
import {
  isTournamentFormat,
  ladderTrainer,
  RIVAL_ROSTER_SIZE,
  tierForRound,
} from "@/lib/tournament/config";
import type { PokemonIndexEntry } from "@/types/pokemon";
import {
  difficultyOf,
  TOURNAMENT_LEVEL,
  type RivalTier,
  type TournamentBracketResponse,
  type TournamentDifficulty,
  type TournamentFormat,
  type TournamentTrainer,
  type TrainerLines,
} from "@/types/tournament";

/**
 * Draws the whole ladder in one request: for every round, a trainer with its
 * persona, its three battle lines and a roster picked from the species index
 * according to the round's tier.
 *
 * The species picks are deterministic-ish game data, so they never depend on
 * the language model; the model only dresses the trainers up. That way a run
 * still works end to end when OPENAI_API_KEY is missing — it just gets the
 * canned personas from the dictionary instead.
 */

/**
 * Species pools per tier, carved out of the index once per request.
 *
 * Legendaries are the Master Cup's promise and nobody else's: the easy and
 * medium cups keep the champion pool fully evolved but ordinary, so a
 * beginner's final is a strong team rather than a Mewtwo.
 */
function poolFor(
  tier: RivalTier,
  difficulty: TournamentDifficulty,
  entries: PokemonIndexEntry[],
): PokemonIndexEntry[] {
  switch (tier) {
    case "rookie":
      // Base forms and mid-evolutions of ordinary species: the kind of team a
      // kid on the first bench of the tournament would bring.
      return entries.filter(
        (e) => e.category === "normal" && !e.isFinal && e.stage <= 2,
      );
    case "veteran":
      // Fully evolved, still no legends.
      return entries.filter((e) => e.category === "normal" && e.isFinal);
    case "champion":
      return entries.filter(
        (e) =>
          e.isFinal &&
          (e.category === "normal" ||
            (difficulty === "hard" &&
              (e.category === "legendary" || e.category === "mythical"))),
      );
  }
}

/** Draws `count` distinct species from a pool, avoiding ids already used. */
function draw(
  pool: PokemonIndexEntry[],
  count: number,
  used: Set<number>,
): PokemonIndexEntry[] {
  const picked: PokemonIndexEntry[] = [];
  let guard = 0;
  while (picked.length < count && guard < count * 40 && pool.length > 0) {
    guard++;
    const entry = pool[Math.floor(Math.random() * pool.length)];
    if (used.has(entry.id)) continue;
    used.add(entry.id);
    picked.push(entry);
  }
  return picked;
}

/**
 * Lo que el modelo aporta a cada rung. El plantel ya no se inventa: nombre,
 * clase y cara son fijos (ver `LADDER`), porque cada uno tiene su retrato
 * pintado de antemano y un Campeón etiquetado «Cazabichos» delata el truco.
 * Lo que sí cambia en cada partida es lo que dicen y cómo se les describe.
 */
interface DraftedTrainer {
  estilo: string;
  lineas: TrainerLines;
}

const systemPrompt = (lang: Lang) =>
  `Eres el guionista del "Torneo IA" de una Pokédex digital. El plantel de Entrenadores es fijo y ya lo conoces: tu trabajo es ponerles voz para esta partida, ronda a ronda y en dificultad creciente.

Responde SOLO con un objeto JSON válido, sin markdown:
{
  "entrenadores": [
    {
      "estilo": "descripción visual breve en 5-10 palabras, fiel al Entrenador que te doy",
      "inicio": "frase al empezar el combate, 4-14 palabras",
      "apuro": "frase cuando va perdiendo o le queda un solo Pokémon",
      "derrota": "frase al perder el combate"
    }
  ]
}

Reglas:
- Exactamente un objeto por ronda, en el orden que te doy.
- Escribe EN PERSONAJE: respeta el nombre y la clase de cada uno. Un novato habla como un crío ilusionado; un Campeón, con calma y autoridad.
- Frases con chispa, estilo anime, sin emojis y sin mencionar que eres una IA.
- ${battleDict[lang].api.answerIn}`;

async function draftTrainers(
  apiKey: string,
  rounds: Array<{
    round: number;
    tier: RivalTier;
    name: string;
    trainerClass: string;
    species: string[];
  }>,
  lang: Lang,
): Promise<DraftedTrainer[] | null> {
  const roster = rounds
    .map(
      (r) =>
        `- Ronda ${r.round} — ${r.trainerClass} ${r.name} (${r.tier}): ${r.species.map(formatName).join(", ")}`,
    )
    .join("\n");
  try {
    const parsed = (await chatJSON(
      apiKey,
      [
        { role: "system", content: systemPrompt(lang) },
        {
          role: "user",
          content: `RONDAS DEL TORNEO (${rounds.length}):\n${roster}\n\nGenera el JSON de entrenadores.`,
        },
      ],
      { temperature: 0.9, maxTokens: 180 * rounds.length },
    )) as { entrenadores?: unknown } | null;
    if (!Array.isArray(parsed?.entrenadores)) return null;
    const drafted = parsed.entrenadores
      .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
      .map((e) => ({
        estilo: String(e.estilo ?? "").trim().slice(0, 120),
        lineas: {
          start: String(e.inicio ?? "").trim().slice(0, 140),
          pinch: String(e.apuro ?? "").trim().slice(0, 140),
          defeat: String(e.derrota ?? "").trim().slice(0, 140),
        },
      }))
      .filter((e) => e.lineas.start);
    return drafted.length === rounds.length ? drafted : null;
  } catch (err) {
    console.error("tournament/bracket draft failed", err);
    return null;
  }
}

export async function POST(request: Request) {
  const lang = await getLang();
  const t = tournamentDict[lang];

  let body: { team?: unknown; format?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: battleDict[lang].api.errBadJson }, { status: 400 });
  }

  const team = sanitizeTeam(body.team);
  if (team.length === 0) {
    return NextResponse.json(
      { error: battleDict[lang].api.errNeedTeam },
      { status: 400 },
    );
  }
  const format: TournamentFormat = isTournamentFormat(body.format)
    ? body.format
    : 4;
  const difficulty = difficultyOf(format);

  const index = await getPokemonIndex();
  const pools: Record<RivalTier, PokemonIndexEntry[]> = {
    rookie: poolFor("rookie", difficulty, index.entries),
    veteran: poolFor("veteran", difficulty, index.entries),
    champion: poolFor("champion", difficulty, index.entries),
  };

  // The player's own species never show up on the other side of the net.
  const used = new Set<number>(team.map((m) => m.id));
  // Un rung por ronda: el Entrenador que la ocupa sale de la escalera fija y
  // el tier — equipo, mochila y cerebro — de la dificultad de la copa. Por eso
  // el mismo Leo aprieta más en la Maestra que en la Relámpago, y por eso Rhea
  // sólo se cruza en el camino de quien juega los cinco combates.
  const rounds = Array.from({ length: format }, (_, i) => {
    const round = i + 1;
    const tier = tierForRound(round, format, difficulty);
    const picks = draw(pools[tier], RIVAL_ROSTER_SIZE, used);
    const rung = ladderTrainer(round);
    return {
      round,
      tier,
      picks,
      name: rung.name,
      trainerClass: t.trainerClass[rung.classKey],
      emoji: rung.emoji,
    };
  });

  // Personas: one model call for the whole ladder, canned fallback otherwise.
  const apiKey = process.env.OPENAI_API_KEY;
  const drafted = apiKey
    ? await draftTrainers(
        apiKey,
        rounds.map((r) => ({
          round: r.round,
          tier: r.tier,
          name: r.name,
          trainerClass: r.trainerClass,
          species: r.picks.map((p) => p.name),
        })),
        lang,
      )
    : null;

  const trainers: TournamentTrainer[] = rounds.map((r, i) => {
    const canned = t.lines[r.tier];
    const draftedTrainer = drafted?.[i];
    return {
      round: r.round,
      name: r.name,
      trainerClass: r.trainerClass,
      emoji: r.emoji,
      style: draftedTrainer?.estilo || t.defaultStyle,
      tier: r.tier,
      lines: {
        start: draftedTrainer?.lineas.start || canned.start,
        pinch: draftedTrainer?.lineas.pinch || canned.pinch,
        defeat: draftedTrainer?.lineas.defeat || canned.defeat,
      },
      species: r.picks.map((p) => ({
        id: p.id,
        name: p.name,
        types: p.types,
        level: TOURNAMENT_LEVEL,
      })),
    };
  });

  const payload: TournamentBracketResponse = { format, trainers };
  return NextResponse.json(payload);
}
