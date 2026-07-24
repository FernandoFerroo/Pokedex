/**
 * OpenAI chat helper for the battle routes.
 *
 * The rival brain targets the model in OPENAI_BATTLE_MODEL (default
 * "gpt-5.6-luna", chosen for cost/latency). Because model catalogs move fast,
 * a request rejected with "model not found" is retried once against the
 * project-wide OPENAI_MODEL fallback so the battle never dies on a rename.
 */
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export const BATTLE_MODEL =
  process.env.OPENAI_BATTLE_MODEL ?? "gpt-5.6-luna";

const FALLBACK_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class OpenAIError extends Error {
  constructor(
    readonly status: number,
    detail: string,
  ) {
    super(`OpenAI request failed (${status}): ${detail.slice(0, 300)}`);
    this.name = "OpenAIError";
  }
}

/** True for 400/404 bodies that blame the model id rather than the request. */
function isUnknownModelError(status: number, detail: string): boolean {
  return (
    (status === 400 || status === 404) &&
    /model/i.test(detail) &&
    /(not exist|not found|unknown|invalid|no access|does not)/i.test(detail)
  );
}

/**
 * Calls chat completions in JSON mode and returns the parsed content object.
 * Throws OpenAIError on transport/HTTP failures and SyntaxError on bad JSON —
 * callers decide their own fallback (heuristic move, canned dialogue…).
 */
export async function chatJSON(
  apiKey: string,
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<unknown> {
  const attempt = async (model: string) =>
    fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: "json_object" },
        temperature: opts.temperature ?? 0.8,
        max_tokens: opts.maxTokens ?? 400,
      }),
    });

  let res = await attempt(BATTLE_MODEL);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (
      BATTLE_MODEL !== FALLBACK_MODEL &&
      isUnknownModelError(res.status, detail)
    ) {
      console.warn(
        `Modelo "${BATTLE_MODEL}" no disponible en OpenAI; reintentando con "${FALLBACK_MODEL}".`,
      );
      res = await attempt(FALLBACK_MODEL);
      if (!res.ok) {
        throw new OpenAIError(res.status, await res.text().catch(() => ""));
      }
    } else {
      throw new OpenAIError(res.status, detail);
    }
  }

  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "null");
}
