import { NextResponse } from "next/server";
import { chatJSON } from "@/lib/battle/openai";
import { effectiveness } from "@/lib/battle/type-chart";
import { battleDict } from "@/lib/i18n/dictionaries/battle";
import type { Lang } from "@/lib/i18n/config";
import { getLang } from "@/lib/i18n/server";
import { TYPE_LABELS_ES } from "@/lib/pokemon-meta";

const TYPE_SLUGS = Object.keys(TYPE_LABELS_ES);

/**
 * La VOZ del rival, y sólo la voz.
 *
 * La jugada ya viene decidida por el cerebro del cliente
 * (`src/lib/battle/ai/`), que calcula el daño con la fórmula del motor. Aquí
 * sólo se pide la frase, que es lo único en lo que un modelo de lenguaje gana
 * a una heurística. Antes decidía además la táctica, y cuando contestaba con
 * un movimiento inexistente el combate caía en la heurística más simple del
 * repositorio: el rival pasaba de listo a torpe sin que se notara por qué.
 *
 * Base en español; una línea por idioma fija en cuál se contesta.
 */
const systemPrompt = (lang: Lang) =>
  `Eres un Entrenador Pokémon rival en pleno combate. Tu Pokémon acaba de hacer una jugada que YA está decidida; tu único trabajo es decir una frase corta, en personaje, reaccionando a ella.

Responde SOLO con un objeto JSON válido, sin markdown:
{
  "frase": "frase de 4-14 palabras, estilo anime"
}

Cómo hablar:
- Reacciona a la jugada concreta y a la intención que te doy: chulería al rematar, cálculo frío al cambiar de Pokémon, rabia o sorpresa si vas perdiendo.
- Habla del combate, no de números: nadie dice «eficacia por dos» en voz alta.
- Nunca menciones que eres una IA. Sin emojis.
- ${battleDict[lang].api.answerIn}`;

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
  isStatus: boolean;
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
      isStatus: m.damageClass === "status",
      // Variable-power attacks (client sends null) score as a middle ~60 so
      // the heuristic and the LLM still consider them; status moves deal 0.
      power:
        m.damageClass === "status"
          ? 0
          : typeof m.power === "number"
            ? m.power
            : 60,
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

/** Cómo se dice en voz alta cada intención que manda el cerebro. */
const INTENT: Record<string, string> = {
  finisher: "rematar",
  attack: "pegar fuerte",
  setup: "prepararte antes de pegar",
  status: "dejar al rival tocado",
  pivot: "cambiar a un emparejamiento mejor",
  sacrifice: "dejar caer a este para entrar bien",
  heal: "curarte",
  revive: "revivir a uno del banquillo",
  stall: "ganar tiempo",
};

export async function POST(request: Request) {
  const lang = await getLang();
  const t = battleDict[lang].api;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: t.errNoKey }, { status: 500 });
  }

  let body: {
    trainer?: unknown;
    rivalActive?: Snapshot;
    rivalBench?: Snapshot[];
    playerActive?: Snapshot;
    lastEvents?: unknown;
    decision?: { play?: unknown; reason?: unknown };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t.errBadJson }, { status: 400 });
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
    return NextResponse.json({ error: t.errIncompleteState }, { status: 400 });
  }

  // Qué se acaba de jugar, tal y como lo cuenta el cliente.
  const play = String(body.decision?.play ?? "").slice(0, 120);
  const reason = String(body.decision?.reason ?? "").slice(0, 40);

  const moveLines = rival.moves
    .map((m) => {
      if (m.isStatus) {
        return `  · ${m.slug} (${m.label}, tipo ${m.type}, movimiento de ESTADO — no hace daño, aplica su efecto, PP ${m.pp})`;
      }
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
TU JUGADA DE ESTE TURNO: ${play || "atacas"}${reason ? ` (intención: ${INTENT[reason] ?? reason})` : ""}.

Di tu frase (JSON).`;

  let frase: string | null = null;
  try {
    const parsed = (await chatJSON(
      apiKey,
      [
        { role: "system", content: systemPrompt(lang) },
        { role: "user", content: userMessage },
      ],
      { temperature: 0.9, maxTokens: 90 },
    )) as Record<string, unknown> | null;

    if (typeof parsed?.frase === "string" && parsed.frase.trim()) {
      frase = parsed.frase.trim().slice(0, 140);
    }
  } catch (err) {
    console.error("battle/turn LLM failed", err);
  }

  // Sólo la frase: la acción la decidió el cliente y no vuelve por aquí.
  return NextResponse.json({ dialogue: frase ?? t.turnDefaultDialogue });
}
