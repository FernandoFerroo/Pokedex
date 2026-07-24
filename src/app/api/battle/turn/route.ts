import { NextResponse } from "next/server";
import { chatJSON } from "@/lib/battle/openai";
import { effectiveness } from "@/lib/battle/type-chart";
import { TYPE_LABELS_ES } from "@/lib/pokemon-meta";
import type { BattleAction, RivalTurnResponse } from "@/types/battle";

const TYPE_SLUGS = Object.keys(TYPE_LABELS_ES);

const SYSTEM_PROMPT = `Eres el cerebro táctico de un Entrenador Pokémon rival en un combate 1 contra 1 con banquillo. Cada turno recibes el estado del combate y decides UNA acción, además de una frase corta de diálogo con la personalidad del entrenador.

Responde SOLO con un objeto JSON válido, sin markdown:
{
  "accion": "movimiento" | "cambio",
  "movimiento": "slug del movimiento elegido (si accion=movimiento)",
  "cambio": "slug del Pokémon del banquillo (si accion=cambio)",
  "frase": "frase de 4-14 palabras, estilo anime, en español"
}

Cómo decidir:
- Prioriza el movimiento con mejor daño esperado: eficacia de tipo (te la doy calculada), potencia y STAB. Remata si el rival está bajo de PS.
- Cambia de Pokémon solo si tu activo está en clara desventaja de tipo o casi debilitado y el banquillo ofrece algo mejor. No cambies dos turnos seguidos.
- La frase reacciona al momento: chulería si vas ganando, rabia o sorpresa si vas perdiendo ("¡No contaba con ese golpe crítico!"), épica al sacar a tu as.
- Nunca menciones que eres una IA. Sin emojis.`;

/** Client-supplied snapshot of one battler (already-public game data). */
interface Snapshot {
  name?: unknown;
  label?: unknown;
  hpPct?: unknown;
  types?: unknown;
  moves?: unknown;
}

interface MoveSnapshot {
  slug: string;
  label: string;
  type: string;
  power: number;
  pp: number;
}

function cleanTypes(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((t): t is string => TYPE_SLUGS.includes(t as string)).slice(0, 2)
    : [];
}

function cleanMoves(value: unknown): MoveSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (m): m is Record<string, unknown> => typeof m === "object" && m !== null,
    )
    .map((m) => ({
      slug: String(m.slug ?? "").slice(0, 40),
      label: String(m.label ?? "").slice(0, 40),
      type: TYPE_SLUGS.includes(m.type as string) ? (m.type as string) : "normal",
      power: typeof m.power === "number" ? m.power : 0,
      pp: typeof m.pp === "number" ? Math.max(0, m.pp) : 0,
    }))
    .filter((m) => m.slug)
    .slice(0, 4);
}

function cleanSnapshot(value: Snapshot | undefined) {
  return {
    name: String(value?.name ?? "").slice(0, 40),
    label: String(value?.label ?? value?.name ?? "?").slice(0, 40),
    hpPct: Math.min(
      100,
      Math.max(0, typeof value?.hpPct === "number" ? value.hpPct : 100),
    ),
    types: cleanTypes(value?.types),
    moves: cleanMoves(value?.moves),
  };
}

const pct = (n: number) => `${Math.round(n)}%`;

/** Heuristic decision used whenever the LLM fails or answers nonsense. */
function fallbackDecision(
  rival: ReturnType<typeof cleanSnapshot>,
  playerTypes: string[],
): RivalTurnResponse {
  const usable = rival.moves.filter((m) => m.pp > 0);
  const best = [...usable].sort(
    (a, b) =>
      b.power * effectiveness(b.type, playerTypes) -
      a.power * effectiveness(a.type, playerTypes),
  )[0];
  return {
    action: { kind: "move", move: best?.slug ?? rival.moves[0]?.slug ?? "" },
    dialogue: "¡Sigue atacando, no les des tregua!",
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta OPENAI_API_KEY en el servidor." },
      { status: 500 },
    );
  }

  let body: {
    trainer?: unknown;
    rivalActive?: Snapshot;
    rivalBench?: Snapshot[];
    playerActive?: Snapshot;
    lastEvents?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const rival = cleanSnapshot(body.rivalActive);
  const player = cleanSnapshot(body.playerActive);
  const bench = (Array.isArray(body.rivalBench) ? body.rivalBench : [])
    .map(cleanSnapshot)
    .filter((b) => b.name && b.hpPct > 0)
    .slice(0, 5);
  const trainer = String(body.trainer ?? "el rival").slice(0, 60);
  const lastEvents = (Array.isArray(body.lastEvents) ? body.lastEvents : [])
    .filter((e): e is string => typeof e === "string")
    .slice(-6)
    .map((e) => e.slice(0, 120));

  if (!rival.name || rival.moves.length === 0) {
    return NextResponse.json(
      { error: "Estado de combate incompleto." },
      { status: 400 },
    );
  }

  const moveLines = rival.moves
    .map((m) => {
      const eff = effectiveness(m.type, player.types);
      return `  · ${m.slug} (${m.label}, tipo ${m.type}, potencia ${m.power}, PP ${m.pp}, eficacia ×${eff} contra el rival)`;
    })
    .join("\n");
  const benchLines =
    bench
      .map((b) => `  · ${b.name} (${b.types.join("/")}, PS ${pct(b.hpPct)})`)
      .join("\n") || "  · (vacío)";

  const userMessage = `Eres ${trainer}.
TU POKÉMON ACTIVO: ${rival.label} (${rival.types.join("/")}), PS ${pct(rival.hpPct)}.
TUS MOVIMIENTOS:
${moveLines}
TU BANQUILLO:
${benchLines}
POKÉMON DEL JUGADOR: ${player.label} (${player.types.join("/")}), PS ${pct(player.hpPct)}.
ÚLTIMOS SUCESOS:
${lastEvents.map((e) => `  · ${e}`).join("\n") || "  · Comienza el combate."}

Decide tu acción y tu frase (JSON).`;

  let decision: RivalTurnResponse | null = null;
  try {
    const parsed = (await chatJSON(
      apiKey,
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      { temperature: 0.9, maxTokens: 200 },
    )) as Record<string, unknown> | null;

    const frase =
      typeof parsed?.frase === "string" && parsed.frase.trim()
        ? parsed.frase.trim().slice(0, 140)
        : null;

    // The model's choice only survives if it names a legal option.
    let action: BattleAction | null = null;
    if (parsed?.accion === "cambio") {
      const target = bench.find((b) => b.name === parsed?.cambio);
      if (target) {
        action = { kind: "switch", to: bench.indexOf(target) };
      }
    }
    if (!action && typeof parsed?.movimiento === "string") {
      const move = rival.moves.find(
        (m) => m.slug === parsed.movimiento && m.pp > 0,
      );
      if (move) action = { kind: "move", move: move.slug };
    }
    if (action) {
      decision = {
        action,
        dialogue: frase ?? "¡A por ellos!",
      };
    }
  } catch (err) {
    console.error("battle/turn LLM failed", err);
  }

  if (!decision) decision = fallbackDecision(rival, player.types);

  // "switch" decisions are returned with the BENCH index; the client maps it
  // back to a team index because only it knows the full ordering.
  return NextResponse.json(decision);
}
