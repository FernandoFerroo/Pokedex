/**
 * Paints the battle backdrops with OpenAI and writes them into `public/`.
 *
 * A backdrop is a fixed asset, not a per-battle flourish: it has to be byte
 * identical every round and on screen before the first sprite lands. So it is
 * generated once, here, and committed — the app only ever serves the file.
 *
 * Run it when you want a different arena:
 *
 *   node scripts/generate-scenery.mjs            # every scenario
 *   node scripts/generate-scenery.mjs estadio    # just one
 *
 * The model is the project's own (OPENAI_BATTLE_MODEL, "gpt-5.6-luna") driving
 * the Responses API image tool, with the Images API as the fallback — the same
 * ladder `src/lib/battle/openai-image.ts` walks at runtime.
 *
 * Framing is the part that matters. `Scenery` draws in a 1600×900 viewBox with
 * the horizon at y=470 and slices it to fill the arena, so the pitch edge has
 * to land ~52% down the image or the platforms float off the ground. The lower
 * half also has to stay quiet: the fighters, both databoxes and the command
 * menu all sit there.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Reads OPENAI_API_KEY from the environment, falling back to .env.local. */
function apiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  try {
    const env = readFileSync(join(ROOT, ".env.local"), "utf8");
    const line = env.match(/^OPENAI_API_KEY\s*=\s*(.+)$/m);
    if (line) return line[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    // No .env.local: fall through to the error below.
  }
  throw new Error("Falta OPENAI_API_KEY (en el entorno o en .env.local).");
}

const MODEL = process.env.OPENAI_BATTLE_MODEL ?? "gpt-5.6-luna";
const IMAGE_MODELS = [process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2", "gpt-image-1.5"];

/**
 * Shared framing contract. Every scenario repeats it verbatim, because it is
 * what keeps a generated backdrop interchangeable with the vector one.
 */
const FRAMING = `Wide 3:2 landscape composition. CRITICAL — the camera is LOW: the lens sits barely a hand's width above the playing surface, at the near edge, aimed straight ahead and almost level, NOT looking down from the stands. Because the camera is that low, the surface sweeps up steeply toward the viewer and the far edge of the playing surface — the horizon line where the ground meets the structure — sits just ABOVE the vertical centre of the frame, a little over halfway up. The empty playing surface therefore fills the ENTIRE bottom half of the image, edge to edge, and everything above that line is structure, lights and sky.

The playing surface must be completely empty: no people, no creatures, no players, no ball, no equipment, no foreground objects of any kind, nothing blocking the lower half. Keep the lower half darker and low in contrast so bright interface panels stay readable over it. Nothing in the image may be text, letters, numbers, logos, watermarks, signatures or scoreboard writing.`;

const SCENARIOS = {
  estadio: {
    file: "public/scenery/estadio.webp",
    prompt: `A breathtaking AAA video-game battle arena background: a vast open-air stadium at night, seen from the edge of the pitch. Photorealistic rendering with the heightened, cinematic polish of a modern console game's key art — physically based materials, volumetric atmosphere, believable optics — not a cartoon and not a flat illustration.

The bowl rises all the way around: steep tiers packed to the rafters with a dense crowd reduced to thousands of tiny warm highlights, a sweeping cantilevered roof canopy with exposed steel trusses, and four towering floodlight masts whose lamp arrays throw broad volumetric shafts of warm white light down through the humid night air, each beam catching haze and dust. A brilliant LED ribbon board rings the bowl beneath the roof, glowing in deep crimson and electric cyan, its light spilling and reflecting onto the nearest rows and the advertising boards at pitch level. Beyond the roofline, a deep indigo night sky with a warm sodium glow banking up from the city on the horizon and a scatter of stars overhead.

The pitch itself is immaculate, freshly mown turf in alternating light and dark stripes converging toward the vanishing point, crisp white painted markings, wet with a faint sheen that catches the floodlights and reflects the ribbon boards. Rich colour grade: cool indigo and teal in the shadows, warm amber in the lit pools, strong but controlled contrast, subtle lens bloom around the lamps, gentle atmospheric depth haze separating the far stand from the near grass.

${FRAMING}`,
  },
  simulacion: {
    file: "public/scenery/simulacion.webp",
    prompt: `A breathtaking AAA video-game battle arena background: the interior of a vast holographic combat simulation chamber, seen from the edge of the floor. Photorealistic rendering with the heightened, cinematic polish of a modern console game's key art — physically based materials, volumetric atmosphere, believable optics — not a cartoon and not a flat illustration.

An enormous dark void of a room. The floor is a luminous cyan wireframe grid receding to a vanishing point, its lines crisp near the camera and dissolving into haze in the distance, reflecting faintly off a glossy black surface. Vertical shafts of blue light rise from the grid into the darkness. Translucent holographic data panels and targeting reticles float at mid height in the middle distance, glowing softly, their light bleeding into volumetric fog. A bright horizon bar of teal light marks where the floor meets the void. Faint scanlines and drifting motes of light hang in the air.

Colour grade: near black, deep navy and saturated electric cyan, with tight specular highlights and strong bloom around every emissive surface. Cold, clean, high-technology atmosphere.

${FRAMING}`,
  },
};

const RESPONSES_URL = "https://api.openai.com/v1/responses";
const IMAGES_URL = "https://api.openai.com/v1/images/generations";
const SIZE = "1536x1024";

/** Responses API driven by the chat model, which picks the image model itself. */
async function viaResponses(key, prompt) {
  const res = await fetch(RESPONSES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      input: prompt,
      tools: [
        {
          type: "image_generation",
          size: SIZE,
          quality: "high",
          output_format: "webp",
          output_compression: 82,
        },
      ],
    }),
  });
  if (!res.ok) {
    console.warn(`  · Responses/${MODEL} respondió ${res.status}; probando Images.`);
    return null;
  }
  const data = await res.json();
  const call = (data.output ?? []).find((o) => o?.type === "image_generation_call");
  return typeof call?.result === "string" ? call.result : null;
}

/** Images API with an explicit model. */
async function viaImages(key, model, prompt) {
  const res = await fetch(IMAGES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      prompt,
      size: SIZE,
      n: 1,
      quality: "high",
      output_format: "webp",
      output_compression: 82,
    }),
  });
  if (!res.ok) {
    console.warn(`  · Images/${model} respondió ${res.status}.`);
    return null;
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  return typeof b64 === "string" ? b64 : null;
}

async function generate(key, name, scenario) {
  console.log(`▸ ${name}`);
  let b64 = await viaResponses(key, scenario.prompt);
  for (const model of IMAGE_MODELS) {
    if (b64) break;
    b64 = await viaImages(key, model, scenario.prompt);
  }
  if (!b64) throw new Error(`No se pudo generar «${name}».`);

  const out = join(ROOT, scenario.file);
  mkdirSync(dirname(out), { recursive: true });
  const bytes = Buffer.from(b64, "base64");
  writeFileSync(out, bytes);
  console.log(`  ✓ ${scenario.file} — ${(bytes.length / 1024).toFixed(0)} kB`);
}

const wanted = process.argv.slice(2);
const names = wanted.length ? wanted : Object.keys(SCENARIOS);
const key = apiKey();
for (const name of names) {
  const scenario = SCENARIOS[name];
  if (!scenario) {
    console.error(`Escenario desconocido: «${name}». Hay: ${Object.keys(SCENARIOS).join(", ")}.`);
    process.exitCode = 1;
    continue;
  }
  await generate(key, name, scenario);
}
