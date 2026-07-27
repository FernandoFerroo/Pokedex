/**
 * Banco de pruebas del cerebro rival: pone dos IA a jugar combates completos
 * 6 contra 6 y cuenta quién gana.
 *
 *   node --import ./scripts/lib/alias-hook.mjs scripts/ai-selfplay.mts
 *   node --import ./scripts/lib/alias-hook.mjs scripts/ai-selfplay.mts --battles 500
 *   node --import ./scripts/lib/alias-hook.mjs scripts/ai-selfplay.mts --assert-damage
 *   node --import ./scripts/lib/alias-hook.mjs scripts/ai-selfplay.mts --ladder
 *
 * Por qué existe: «la IA ahora es mejor» no se puede comprobar jugando tres
 * combates a mano. Y sobre todo, los pesos del cerebro NO se ajustan a ojo —
 * se ajustan mirando el porcentaje de victorias y los contadores de turnos
 * tirados que salen aquí abajo.
 *
 * Los equipos son sintéticos a propósito: no hace falta PokéAPI ni red, y así
 * el banco corre en dos segundos y siempre da lo mismo para la misma semilla.
 */
import {
  computeStats,
  pickRivalReplacement,
  resolveTurn,
  rollDamage,
  damageWith,
} from "@/lib/battle/engine";
import {
  createRivalMemory,
  pickAction,
  profileFor,
  rememberMove,
  scaleProfile,
  type AiProfileKey,
  type RivalMemory,
} from "@/lib/battle/ai";
import { expectedDamage } from "@/lib/battle/ai/damage";
import { estimatePower } from "@/lib/battle/engine";
import { effectiveness } from "@/lib/battle/type-chart";
import type {
  BattleAction,
  BattleMove,
  BattleState,
  Battler,
  Side,
} from "@/types/battle";
import type { RivalTier } from "@/types/tournament";

/* ------------------------------------------------------------------ */
/* Azar reproducible                                                   */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Equipos sintéticos                                                  */
/* ------------------------------------------------------------------ */

const TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting",
  "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
  "dragon", "dark", "steel", "fairy",
];

/** Movimientos reales, para que la tabla de tipos y el motor trabajen. */
const MOVE_POOL: Array<Omit<BattleMove, "pp" | "maxPp">> = [
  { slug: "flamethrower", label: "Lanzallamas", type: "fire", damageClass: "special", power: 90, accuracy: 100 },
  { slug: "surf", label: "Surf", type: "water", damageClass: "special", power: 90, accuracy: 100 },
  { slug: "thunderbolt", label: "Rayo", type: "electric", damageClass: "special", power: 90, accuracy: 100 },
  { slug: "energy-ball", label: "Energibola", type: "grass", damageClass: "special", power: 90, accuracy: 100 },
  { slug: "ice-beam", label: "Rayo Hielo", type: "ice", damageClass: "special", power: 90, accuracy: 100 },
  { slug: "earthquake", label: "Terremoto", type: "ground", damageClass: "physical", power: 100, accuracy: 100 },
  { slug: "rock-slide", label: "Avalancha", type: "rock", damageClass: "physical", power: 75, accuracy: 90 },
  { slug: "close-combat", label: "A Bocajarro", type: "fighting", damageClass: "physical", power: 120, accuracy: 100 },
  { slug: "shadow-ball", label: "Bola Sombra", type: "ghost", damageClass: "special", power: 80, accuracy: 100 },
  { slug: "crunch", label: "Triturar", type: "dark", damageClass: "physical", power: 80, accuracy: 100 },
  { slug: "iron-head", label: "Cabeza de Hierro", type: "steel", damageClass: "physical", power: 80, accuracy: 100 },
  { slug: "play-rough", label: "Carantoña", type: "fairy", damageClass: "physical", power: 90, accuracy: 90 },
  { slug: "dragon-claw", label: "Garra Dragón", type: "dragon", damageClass: "physical", power: 80, accuracy: 100 },
  { slug: "sludge-bomb", label: "Bomba Lodo", type: "poison", damageClass: "special", power: 90, accuracy: 100 },
  { slug: "x-scissor", label: "Tijera X", type: "bug", damageClass: "physical", power: 80, accuracy: 100 },
  { slug: "air-slash", label: "Tajo Aéreo", type: "flying", damageClass: "special", power: 75, accuracy: 95 },
  { slug: "psychic", label: "Psíquico", type: "psychic", damageClass: "special", power: 90, accuracy: 100 },
  { slug: "body-slam", label: "Golpe Cuerpo", type: "normal", damageClass: "physical", power: 85, accuracy: 100 },
  { slug: "dig", label: "Excavar", type: "ground", damageClass: "physical", power: 80, accuracy: 100 },
  { slug: "solar-beam", label: "Rayo Solar", type: "grass", damageClass: "special", power: 120, accuracy: 100 },
];

/** Un par de movimientos de estado, para que el banco los ejercite. */
const STATUS_POOL: Array<Omit<BattleMove, "pp" | "maxPp">> = [
  {
    slug: "thunder-wave", label: "Onda Trueno", type: "electric",
    damageClass: "status", power: null, accuracy: 90,
    effects: { target: "foe", statChanges: [], statChance: 0, ailment: "paralysis", ailmentChance: 0, healingPct: 0, drainPct: 0 },
  },
  {
    slug: "swords-dance", label: "Danza Espada", type: "normal",
    damageClass: "status", power: null, accuracy: null,
    effects: { target: "self", statChanges: [{ stat: "atk", change: 2 }], statChance: 0, ailment: null, ailmentChance: 0, healingPct: 0, drainPct: 0 },
  },
  {
    slug: "hypnosis", label: "Hipnosis", type: "psychic",
    damageClass: "status", power: null, accuracy: 60,
    effects: { target: "foe", statChanges: [], statChance: 0, ailment: "sleep", ailmentChance: 0, healingPct: 0, drainPct: 0 },
  },
  {
    slug: "recover", label: "Recuperación", type: "normal",
    damageClass: "status", power: null, accuracy: null,
    effects: { target: "self", statChanges: [], statChance: 0, ailment: null, ailmentChance: 0, healingPct: 50, drainPct: 0 },
  },
];

const LEVEL = 50;

function makeBattler(rng: () => number, index: number, withStatus: boolean): Battler {
  const primary = TYPES[Math.floor(rng() * TYPES.length)];
  const dual = rng() < 0.45;
  const secondary = TYPES[Math.floor(rng() * TYPES.length)];
  const types = dual && secondary !== primary ? [primary, secondary] : [primary];

  const roll = () => 55 + Math.floor(rng() * 75);
  const base = { hp: roll(), atk: roll(), def: roll(), spa: roll(), spd: roll(), spe: roll() };
  const stats = computeStats(base, LEVEL);

  // Cuatro movimientos: uno con ventaja de su propio tipo siempre que exista.
  const pool = [...MOVE_POOL].sort(() => rng() - 0.5);
  const stab = pool.find((m) => types.includes(m.type));
  const picked = [stab, ...pool.filter((m) => m !== stab)].filter(Boolean).slice(0, withStatus ? 3 : 4);
  const moves: BattleMove[] = picked.map((m) => ({ ...m!, pp: 16, maxPp: 16 }));
  if (withStatus) {
    const s = STATUS_POOL[Math.floor(rng() * STATUS_POOL.length)];
    moves.push({ ...s, pp: 12, maxPp: 12 });
  }

  return {
    id: index,
    name: `mon-${index}`,
    label: `Mon${index}`,
    level: LEVEL,
    types,
    weight: 20 + rng() * 200,
    height: 0.4 + rng() * 3,
    stats,
    maxHp: stats.hp,
    hp: stats.hp,
    ability: null,
    moves,
    gender: null,
    sprites: { front: "", back: "", art: null },
    cry: null,
    modelUrl: "",
  };
}

function makeTeam(rng: () => number, offset: number, withStatus: boolean): Battler[] {
  return Array.from({ length: 6 }, (_, i) => makeBattler(rng, offset + i, withStatus));
}

/** Copia profunda de lo que el motor muta. Cada combate arranca limpio. */
function freshTeam(team: Battler[]): Battler[] {
  return team.map((b) => ({
    ...b,
    hp: b.maxHp,
    stages: {},
    status: null,
    sleepTurns: 0,
    confusedTurns: 0,
    charging: null,
    moves: b.moves.map((m) => ({ ...m, pp: m.maxPp })),
  }));
}

/* ------------------------------------------------------------------ */
/* Los dos cerebros que se enfrentan                                   */
/* ------------------------------------------------------------------ */

export interface Brain {
  name: string;
  pick(state: BattleState, side: Side, memory: RivalMemory, rng: () => number): BattleAction;
}

/** El cerebro nuevo, con el perfil y el tier que se le pidan. */
function brain(key: AiProfileKey, tier?: RivalTier): Brain {
  const profile = tier ? scaleProfile(profileFor(key), tier) : profileFor(key);
  return {
    name: tier ? `${key}@${tier}` : key,
    pick: (state, side, memory, rng) => pickAction(state, side, profile, memory, rng),
  };
}

/**
 * El cerebro ANTERIOR, reproducido aquí tal y como estaba en `rival-ai.ts`
 * antes de la reescritura. Vive en el banco de pruebas y no en la aplicación
 * porque su único trabajo ya es servir de listón: si el nuevo no le gana con
 * holgura, la reescritura no valía la pena.
 */
function legacyBrain(tier: RivalTier): Brain {
  const usable = (b: Battler) => b.moves.filter((m) => m.pp > 0);
  const score = (m: BattleMove, a: Battler, d: Battler) =>
    estimatePower(m) *
    effectiveness(m.type, d.types) *
    (a.types.includes(m.type) ? 1.5 : 1);

  return {
    name: `legacy-${tier}`,
    pick(state, side, memory, rng) {
      const foeSide: Side = side === "player" ? "rival" : "player";
      const attacker = state[side].team[state[side].active];
      const defender = state[foeSide].team[state[foeSide].active];

      // Curarse por debajo del 35%, antes de mirar nada más.
      if (tier !== "rookie" && attacker.hp / attacker.maxHp <= 0.35) {
        const bag = state[side].bag;
        const healer = (Object.keys(bag) as Array<keyof typeof bag>).find(
          (id) => (bag[id] ?? 0) > 0 && (id === "potion" || id === "super-potion" || id === "hyper-potion" || id === "full-restore"),
        );
        if (healer) return { kind: "item", item: healer };
      }

      const pool = usable(attacker).filter((m) => m.damageClass !== "status");
      const shortlist = pool.length > 0 ? pool : usable(attacker);
      if (shortlist.length === 0) {
        return { kind: "move", move: attacker.moves[0]?.slug ?? "" };
      }
      if (tier === "rookie" && rng() < 0.55) {
        return { kind: "move", move: shortlist[Math.floor(rng() * shortlist.length)].slug };
      }
      const best = [...shortlist].sort(
        (a, b) => score(b, attacker, defender) - score(a, attacker, defender),
      )[0];
      void memory;
      return { kind: "move", move: best.slug };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Un combate                                                          */
/* ------------------------------------------------------------------ */

interface Counters {
  switches: number;
  items: number;
  /** Turnos tirados: atacar a quien no se puede alcanzar. Lo que más duele. */
  wasted: number;
}

interface BattleOutcome {
  winner: Side | null;
  turns: number;
  survivors: number;
  counters: Record<Side, Counters>;
}

const MAX_TURNS = 300;

function runBattle(
  playerBrain: Brain,
  rivalBrain: Brain,
  playerTeam: Battler[],
  rivalTeam: Battler[],
  seed: number,
): BattleOutcome {
  const rng = mulberry32(seed);
  const state: BattleState = {
    player: { team: freshTeam(playerTeam), active: 0, bag: { potion: 2, "super-potion": 1 } },
    rival: { team: freshTeam(rivalTeam), active: 0, bag: { potion: 2, "super-potion": 1 } },
    turn: 0,
  };
  const memory: Record<Side, RivalMemory> = {
    player: createRivalMemory(),
    rival: createRivalMemory(),
  };
  const counters: Record<Side, Counters> = {
    player: { switches: 0, items: 0, wasted: 0 },
    rival: { switches: 0, items: 0, wasted: 0 },
  };

  let winner: Side | null = null;
  while (state.turn < MAX_TURNS && !winner) {
    const actions: Record<Side, BattleAction> = {
      player: playerBrain.pick(state, "player", memory.player, rng),
      rival: rivalBrain.pick(state, "rival", memory.rival, rng),
    };

    for (const side of ["player", "rival"] as Side[]) {
      const action = actions[side];
      if (action.kind === "switch") counters[side].switches++;
      if (action.kind === "item") counters[side].items++;
      if (action.kind === "move") {
        const foeSide: Side = side === "player" ? "rival" : "player";
        const me = state[side].team[state[side].active];
        const foe = state[foeSide].team[state[foeSide].active];
        const move = me.moves.find((m) => m.slug === action.move);
        if (move && expectedDamage(me, foe, move).wasted && move.damageClass !== "status") {
          counters[side].wasted++;
        }
        // Lo que el otro enseña es lo único que la IA puede «haber visto».
        if (move) rememberMove(memory[foeSide], move.slug);
      }
    }

    const events = resolveTurn(state, actions.player, actions.rival, rng);
    const end = events.find((e) => e.kind === "end");
    if (end && end.kind === "end") {
      winner = end.winner;
      break;
    }

    // Reemplazos forzosos, que es lo que hace la arena tras reproducir.
    for (const side of ["player", "rival"] as Side[]) {
      if (state[side].team[state[side].active].hp > 0) continue;
      const next = pickRivalReplacement(state, side);
      if (next === null) {
        winner = side === "player" ? "rival" : "player";
        break;
      }
      state[side].active = next;
    }
  }

  const survivors = winner
    ? state[winner].team.filter((b) => b.hp > 0).length
    : 0;
  return { winner, turns: state.turn, survivors, counters };
}

/* ------------------------------------------------------------------ */
/* Informe                                                             */
/* ------------------------------------------------------------------ */

/** Intervalo de Wilson al 95%: un 60% de 20 combates no dice nada. */
function wilson(wins: number, total: number): [number, number] {
  if (total === 0) return [0, 0];
  const z = 1.96;
  const p = wins / total;
  const denom = 1 + (z * z) / total;
  const centre = p + (z * z) / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return [(centre - spread) / denom, (centre + spread) / denom];
}

interface MatchReport {
  label: string;
  winRate: number;
  low: number;
  high: number;
  turns: number;
  wasted: number;
  switches: number;
  items: number;
}

/**
 * Enfrenta dos cerebros N veces. Los asientos se intercambian en combates
 * alternos: quien empieza a la izquierda tiene una ventaja pequeña pero real,
 * y sin cambiarlos se estaría midiendo eso en vez del cerebro.
 */
function match(a: Brain, b: Brain, battles: number, seed = 1): MatchReport {
  const rng = mulberry32(seed);
  let winsA = 0;
  let turns = 0;
  let wasted = 0;
  let switches = 0;
  let items = 0;

  for (let i = 0; i < battles; i++) {
    const teamRng = mulberry32(seed * 7919 + i);
    // Movimientos de estado en la mitad de los combates: si no, la mitad del
    // cerebro nuevo no se ejercita nunca.
    const withStatus = i % 2 === 0;
    // Equipos ESPEJO: los dos bandos llevan exactamente los mismos seis
    // Pokémon. Con equipos distintos, la mitad de los combates los decide el
    // reparto y no el cerebro, y el ruido se come la señal — un jugador
    // perfecto pierde el 30% de las veces sólo por el sorteo. Espejados, lo
    // único que queda entre los dos es cómo juegan.
    const left = makeTeam(teamRng, 0, withStatus);
    const right = freshTeam(left).map((b) => ({ ...b, id: b.id + 100 }));
    const swap = i % 2 === 1;
    const outcome = runBattle(
      swap ? b : a,
      swap ? a : b,
      left,
      right,
      Math.floor(rng() * 2 ** 31),
    );
    const aSide: Side = swap ? "rival" : "player";
    if (outcome.winner === aSide) winsA++;
    turns += outcome.turns;
    wasted += outcome.counters[aSide].wasted;
    switches += outcome.counters[aSide].switches;
    items += outcome.counters[aSide].items;
  }

  const [low, high] = wilson(winsA, battles);
  return {
    label: `${a.name} vs ${b.name}`,
    winRate: winsA / battles,
    low,
    high,
    turns: turns / battles,
    wasted: wasted / battles,
    switches: switches / battles,
    items: items / battles,
  };
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function printMatch(r: MatchReport, gate?: (r: MatchReport) => boolean): boolean {
  const ok = gate ? gate(r) : true;
  console.log(
    `${ok ? "✓" : "✗"} ${r.label.padEnd(34)} ${pct(r.winRate).padStart(6)} ` +
      `[${pct(r.low)}–${pct(r.high)}]  turnos ${r.turns.toFixed(1).padStart(5)}  ` +
      `tirados ${r.wasted.toFixed(2)}  cambios ${r.switches.toFixed(1)}  objetos ${r.items.toFixed(1)}`,
  );
  return ok;
}

/* ------------------------------------------------------------------ */
/* Modos                                                               */
/* ------------------------------------------------------------------ */

/**
 * La estimación de daño de la IA tiene que ser la media real de la fórmula. Si
 * alguien toca `damageWith` y la estimación se desvía, la IA sigue jugando —
 * pero jugando a otro juego. Esto lo pilla.
 */
function assertDamage(): boolean {
  const rng = mulberry32(99);
  let worst = 0;
  let checks = 0;
  for (let i = 0; i < 40; i++) {
    const attacker = makeBattler(rng, i, false);
    const defender = makeBattler(rng, 500 + i, false);
    for (const move of attacker.moves) {
      const est = expectedDamage(attacker, defender, move);
      if (est.wasted || est.avg === 0) continue;
      let total = 0;
      const samples = 4000;
      const sampleRng = mulberry32(i * 31 + 7);
      for (let s = 0; s < samples; s++) {
        total += rollDamage(attacker, defender, move, sampleRng).damage;
      }
      const mean = total / samples;
      const drift = Math.abs(mean - est.avg) / mean;
      worst = Math.max(worst, drift);
      checks++;
    }
  }
  const ok = worst < 0.02;
  console.log(
    `${ok ? "✓" : "✗"} estimación vs media real: desvío máximo ${pct(worst)} sobre ${checks} casos`,
  );
  // Y que la fórmula fijada siga siendo la fórmula: mismo daño con los mismos
  // dados, tirados a mano o por el motor.
  const a = makeBattler(mulberry32(3), 1, false);
  const d = makeBattler(mulberry32(4), 2, false);
  const fixed = damageWith(a, d, a.moves[0], { crit: false, roll: 0.925, powerRoll: 0.5 });
  console.log(`  golpe medio de referencia: ${fixed.damage} PS (×${fixed.effectiveness})`);
  return ok;
}

/** La escalera: el porcentaje de victorias del jugador tiene que ir bajando. */
function ladder(battles: number): boolean {
  const rungs: Array<[AiProfileKey, RivalTier]> = [
    ["brock", "veteran"],
    ["misty", "veteran"],
    ["ltsurge", "champion"],
    ["sabrina", "champion"],
    ["lance", "champion"],
  ];
  console.log("\nEscalera de la Copa Maestra (el jugador es el cerebro «ace»):");
  const rates: number[] = [];
  for (const [key, tier] of rungs) {
    const r = match(brain("ace"), brain(key, tier), battles, 4242);
    printMatch(r);
    rates.push(r.winRate);
  }
  const monotone = rates.every((r, i) => i === 0 || r <= rates[i - 1] + 0.08);
  console.log(
    `${monotone ? "✓" : "✗"} la dificultad sube ronda a ronda (${rates.map(pct).join(" → ")})`,
  );
  return monotone;
}

/* ------------------------------------------------------------------ */

const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(`--${name}`);
const value = (name: string, fallback: number) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(argv[i + 1]) || fallback;
};

const battles = value("battles", 200);
let passed = true;

if (flag("assert-damage")) {
  passed = assertDamage() && passed;
} else if (flag("ladder")) {
  passed = ladder(Math.min(battles, 120)) && passed;
} else {
  console.log(`Cerebro nuevo contra el anterior · ${battles} combates por cruce\n`);
  passed = assertDamage() && passed;
  console.log("");
  // El techo: el Campeón tiene que ganarle con holgura al cerebro anterior.
  passed =
    printMatch(match(brain("lance"), legacyBrain("champion"), battles), (r) => r.low > 0.55) &&
    passed;
  passed =
    printMatch(match(brain("lance"), legacyBrain("rookie"), battles), (r) => r.winRate >= 0.8) &&
    passed;
  // El SUELO, medido contra quien toca: el rival fácil de antes. La primera
  // ronda no debe volverse un muro — y tampoco un paseo. Compararla contra un
  // atacante impecable no diría nada: un novato pierde contra eso, y debe.
  passed =
    printMatch(
      match(brain("brock", "rookie"), legacyBrain("rookie"), battles),
      (r) => r.winRate >= 0.35 && r.winRate <= 0.8,
    ) && passed;
  // Y la escalera propia tiene que ordenarse sola.
  passed =
    printMatch(match(brain("lance"), brain("brock", "rookie"), battles), (r) => r.winRate > 0.7) &&
    passed;
  passed =
    printMatch(
      match(brain("sabrina", "champion"), brain("misty", "veteran"), battles),
      (r) => r.winRate > 0.55,
    ) && passed;
}

console.log(passed ? "\nTodo en verde." : "\nHay puertas en rojo.");
process.exit(passed ? 0 : 1);
