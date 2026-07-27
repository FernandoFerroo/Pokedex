/**
 * Qué puede hacer el rival este turno y cuánto vale cada cosa.
 *
 * Todas las puntuaciones están en FRACCIONES DE PS MÁXIMOS. Es la única
 * decisión de diseño que hace legibles los pesos: «esto vale 0.35» quiere
 * decir «vale un tercio de barra de vida», y se puede discutir. Con puntos
 * sueltos, un peso es un número que alguien ajustó una tarde.
 */
import { AILMENT_IMMUNE, TWO_TURN_MOVES } from "@/lib/battle/engine";
import { BAG_ITEMS, healValue, type BagItemId } from "@/lib/battle/items";
import type { BattleAction, BattleMove, BattleState, Battler, Side } from "@/types/battle";
import { expectedDamage, koChance, speedEdge, type Estimate } from "./damage";
import { bestAttack, knownMoves, raceScore, type Threat } from "./threat";
import type { AiProfile } from "./profiles";

/**
 * Todo se puntúa en FRACCIONES DE PS, y todo se puntúa igual: cada candidato
 * vale lo que GANA este turno, y en `search` se le resta lo que va a ENCAJAR.
 *
 * Esa simetría es la que costó las primeras versiones. Mientras los cambios y
 * los objetos descontaban el golpe que reciben y los ataques no, cambiar salía
 * barato: el cerebro se pasaba tres o cuatro turnos por combate persiguiendo el
 * emparejamiento perfecto, regalaba un golpe en cada uno y empataba contra una
 * IA que se limitaba a pegar. El banco de pruebas lo enseñó y esto lo arregla.
 */

/** Una barra de vida entera de daño. */
const W_DMG = 1;
/** Dejar K.O. vale casi otra barra por encima del daño que ya cuenta. */
const W_KO = 0.9;
/** Un movimiento que no puede conectar. Nunca, bajo ninguna circunstancia. */
const WASTED = 2;

export interface AiContext {
  state: BattleState;
  side: Side;
  foeSide: Side;
  me: Battler;
  foe: Battler;
  profile: AiProfile;
  /** Los movimientos del rival con los que la IA cree que debe contar. */
  foeMoves: BattleMove[];
  /** La mayor amenaza que le viene encima ahora mismo. */
  incoming: Threat;
  /** Si el rival me tumba este turno pase lo que pase. */
  doomed: boolean;
  /** Turno en que cambió por última vez, para no hacer el yoyó. */
  lastSwitchTurn: number;
}

export type Candidate = { action: BattleAction; value: number; reason: Reason };

/** Por qué se ha elegido lo que se ha elegido; lo usa la frase del rival. */
export type Reason =
  | "finisher"
  | "attack"
  | "setup"
  | "status"
  | "pivot"
  | "sacrifice"
  | "heal"
  | "revive"
  | "stall";

export function buildContext(
  state: BattleState,
  side: Side,
  profile: AiProfile,
  seenFoeMoves: readonly string[],
  lastSwitchTurn: number,
): AiContext {
  const foeSide: Side = side === "player" ? "rival" : "player";
  const me = state[side].team[state[side].active];
  const foe = state[foeSide].team[state[foeSide].active];
  const foeMoves = knownMoves(foe, profile.knowledge, seenFoeMoves);
  const incoming = bestAttack(foe, me, foeMoves);
  return {
    state,
    side,
    foeSide,
    me,
    foe,
    profile,
    foeMoves,
    incoming,
    // Con el rival más rápido y pegando para más de lo que queda, este turno
    // es el último de este Pokémon decida lo que decida.
    doomed: speedEdge(foe, me) > 0.5 && incoming.est.min >= me.hp,
    lastSwitchTurn,
  };
}

/* ------------------------------------------------------------------ */
/* Movimientos                                                         */
/* ------------------------------------------------------------------ */

/**
 * Lo que vale dejar un estado. No es un número fijo: la parálisis vale mucho
 * más si además le roba el turno al rival, y dormir a alguien vale por los
 * turnos que va a estar sin jugar.
 */
function statusValue(move: BattleMove, ctx: AiContext, chance: number): number {
  const e = move.effects;
  if (!e?.ailment || e.target === "self") return 0;
  const { foe, me } = ctx;
  // Un estado por Pokémon, y nunca sobre un tipo inmune.
  if (foe.status) return 0;
  if ((AILMENT_IMMUNE[e.ailment] ?? []).some((t) => foe.types.includes(t))) return 0;
  // A un rival que se cae este turno no hay que dormirlo, hay que rematarlo.
  if (ctx.foe.hp <= 0) return 0;

  const appetite = ctx.profile.statusAppetite;
  let value: number;
  switch (e.ailment) {
    case "paralysis":
      // Si le roba la delantera, cambia el combate entero.
      value = speedEdge(foe, me) > 0.5 ? 0.35 : 0.12;
      break;
    case "sleep":
      value = 0.4;
      break;
    case "burn":
      // Vale por la mitad del ataque físico, así que depende de con qué pegue.
      value = ctx.incoming.move?.damageClass === "physical" ? 0.25 : 0.08;
      break;
    case "poison":
      value = 0.16;
      break;
    case "freeze":
      value = 0.35;
      break;
    case "confusion":
      value = 0.15;
      break;
    default:
      value = 0.05;
  }
  return value * appetite * chance;
}

/** Lo que valen unos números más altos (o los del rival más bajos). */
function boostValue(move: BattleMove, ctx: AiContext, chance: number): number {
  const e = move.effects;
  if (!e || e.statChanges.length === 0) return 0;
  const stages = e.statChanges.reduce((sum, s) => sum + s.change, 0);
  if (stages === 0) return 0;
  // Subirse sólo compensa si queda combate por delante para aprovecharlo.
  const room = ctx.me.hp / ctx.me.maxHp;
  const survives = ctx.incoming.ev > 0 ? ctx.me.hp / ctx.incoming.ev : 4;
  const horizon = Math.min(3, survives) / 3;
  return 0.14 * stages * ctx.profile.setupAppetite * room * horizon * chance;
}

/** Curarse a sí mismo (Recuperación, Descanso). */
function healMoveValue(move: BattleMove, ctx: AiContext): number {
  const pct = move.effects?.healingPct ?? 0;
  if (pct <= 0) return 0;
  const missing = ctx.me.maxHp - ctx.me.hp;
  const restored = Math.min(missing, (ctx.me.maxHp * pct) / 100);
  return (restored / ctx.me.maxHp) * W_DMG;
}

/**
 * Lo que cuesta un movimiento de dos turnos: el daño llega un turno tarde. Lo
 * que GANA — que Excavar y Vuelo anulan el turno del rival — se cobra en
 * `search`, junto al resto de los golpes encajados.
 */
function twoTurnCost(move: BattleMove, ctx: AiContext): number {
  if (!TWO_TURN_MOVES[move.slug]) return 0;
  const best = bestAttack(ctx.me, ctx.foe, ctx.me.moves);
  // Se pierde un turno de daño: el que se pasa cargando.
  return (best.ev / ctx.foe.maxHp) * W_DMG * 0.5;
}

/**
 * Guardarse el último ataque útil. El motor no tiene Forcejeo: quedarse sin PP
 * usables no es «pegar flojito», es no poder jugar el turno.
 */
function ppPenalty(move: BattleMove, ctx: AiContext): number {
  if (move.pp > 2) return 0;
  const others = ctx.me.moves.filter(
    (m) => m.slug !== move.slug && m.pp > 0 && m.damageClass !== "status",
  );
  return others.length === 0 ? 0 : 0.04;
}

export function scoreMove(move: BattleMove, ctx: AiContext): Candidate {
  const action: BattleAction = { kind: "move", move: move.slug };
  const est: Estimate = expectedDamage(ctx.me, ctx.foe, move);

  if (move.damageClass !== "status" && est.wasted) {
    return { action, value: -WASTED, reason: "attack" };
  }

  const damage = (est.avg * est.hit) / ctx.foe.maxHp;
  const ko = koChance(est, ctx.foe.hp);
  const accuracy = move.accuracy === null ? 1 : est.hit || 1;
  const e = move.effects;
  const secondaryChance =
    move.damageClass === "status"
      ? accuracy
      : accuracy * ((e?.ailmentChance || 100) / 100);
  const statChance =
    move.damageClass === "status"
      ? accuracy
      : accuracy * ((e?.statChance || 100) / 100);

  const value =
    damage * W_DMG * ctx.profile.aggression +
    ko * W_KO +
    statusValue(move, ctx, secondaryChance) +
    boostValue(move, ctx, statChance) +
    healMoveValue(move, ctx) -
    twoTurnCost(move, ctx) -
    ppPenalty(move, ctx) +
    ctx.profile.signature(move, {
      me: ctx.me,
      foe: ctx.foe,
      myHp: ctx.me.hp / ctx.me.maxHp,
      foeHp: ctx.foe.hp / ctx.foe.maxHp,
    });

  const reason: Reason =
    ko > 0.5
      ? "finisher"
      : move.damageClass !== "status"
        ? "attack"
        : e?.ailment
          ? "status"
          : (e?.healingPct ?? 0) > 0
            ? "heal"
            : e && e.statChanges.length > 0
              ? "setup"
              : "stall";

  return { action, value, reason };
}

export function moveCandidates(ctx: AiContext): Candidate[] {
  const usable = ctx.me.moves.filter((m) => m.pp > 0);
  const pool = usable.length > 0 ? usable : ctx.me.moves.slice(0, 1);
  return pool.map((m) => scoreMove(m, ctx));
}

/* ------------------------------------------------------------------ */
/* Cambios                                                             */
/* ------------------------------------------------------------------ */

/**
 * Cuánto vale, en barras de vida, mejorar del todo el emparejamiento.
 *
 * Es un premio de POSICIÓN, y la posición no es daño: sin este freno el
 * cerebro cambiaba cinco veces por combate persiguiendo la ventaja de tipos
 * perfecta, regalaba un golpe en cada cambio y perdía contra una IA que se
 * limitaba a pegar. Tener mejor emparejamiento vale como un tercio de barra,
 * no como una barra entera.
 */
const W_MATCHUP = 0.35;

export function switchCandidates(ctx: AiContext): Candidate[] {
  // Nada de yoyó: dos cambios seguidos son dos turnos regalados.
  if (ctx.lastSwitchTurn === ctx.state.turn - 1) return [];
  const team = ctx.state[ctx.side].team;
  const myRace = raceScore(ctx.me, ctx.foe, ctx.me.moves, ctx.foeMoves);
  const out: Candidate[] = [];

  team.forEach((b, index) => {
    if (index === ctx.state[ctx.side].active || b.hp <= 0) return;
    // El que entra come un golpe gratis: los cambios se resuelven antes que
    // los ataques, así que el rival le pega nada más pisar el campo. El coste
    // lo cobra `search`; aquí sólo se descarta entrar directamente a morir.
    const freeHit = bestAttack(ctx.foe, b, ctx.foeMoves).ev;
    if (freeHit >= b.hp) return;

    const gain = raceScore(b, ctx.foe, b.moves, ctx.foeMoves) - myRace;
    let value = gain * W_MATCHUP * ctx.profile.switchiness;

    // Si el que está delante se cae este turno igualmente, el cambio no cuesta
    // el ataque que ya no iba a llegar a dar.
    if (ctx.doomed) {
      value +=
        (bestAttack(ctx.me, ctx.foe, ctx.me.moves).ev / ctx.foe.maxHp) *
        W_DMG *
        ctx.profile.sacrifice;
    }

    out.push({
      action: { kind: "switch", to: index },
      value,
      reason: ctx.doomed ? "sacrifice" : "pivot",
    });
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Mochila                                                             */
/* ------------------------------------------------------------------ */

export function itemCandidates(ctx: AiContext): Candidate[] {
  const bag = ctx.state[ctx.side].bag;
  const ids = (Object.keys(bag) as BagItemId[]).filter((id) => (bag[id] ?? 0) > 0);
  if (ids.length === 0) return [];

  const myBest = bestAttack(ctx.me, ctx.foe, ctx.me.moves);
  const finishing = koChance(myBest.est, ctx.foe.hp) > 0.6;
  const incoming = ctx.incoming.ev;
  const out: Candidate[] = [];

  for (const id of ids) {
    const spec = BAG_ITEMS[id];

    if (spec.revives) {
      // Revivir regala el turno entero. Sólo compensa cuando ya no queda banco
      // en pie, y sólo si se sobrevive a lo que viene.
      const fallen = ctx.state[ctx.side].team.findIndex((b) => b.hp <= 0);
      const standing = ctx.state[ctx.side].team.filter((b) => b.hp > 0).length;
      if (fallen === -1 || standing > 1 || ctx.me.hp <= incoming) continue;
      out.push({
        action: { kind: "item", item: id, target: fallen },
        value: 0.5 * ctx.profile.itemDiscipline,
        reason: "revive",
      });
      continue;
    }

    if (spec.heal > 0 || spec.healAll) {
      if (finishing) continue; // Rematar antes que beber.
      const missing = ctx.me.maxHp - ctx.me.hp;
      if (missing <= 0) continue;
      const restored = Math.min(missing, healValue(id, ctx.me.maxHp));
      // Curarse para morir igual es tirar el objeto y el turno.
      if (ctx.me.hp + restored <= incoming) continue;
      // Curarse sólo compensa de verdad cuando EVITA un K.O.: los PS que
      // devuelve una poción valen menos que el turno de daño que cuesta,
      // salvo que sin ella no hubiera turno siguiente.
      const saves = ctx.me.hp <= incoming && ctx.me.hp + restored > incoming;
      // Beberse una poción cuesta el turno entero, así que sólo compensa
      // cuando EVITA un K.O. o cuando devuelve media barra de golpe. Sin esta
      // puerta el cerebro se curaba arañazos y perdía el turno por veinte PS.
      const worthIt = saves || (restored / ctx.me.maxHp > 0.45 && ctx.me.hp / ctx.me.maxHp < 0.5);
      if (!worthIt) continue;
      // Y gastar una Restaura Todo en un arañazo, también.
      const waste = spec.healAll ? Math.max(0, 1 - missing / ctx.me.maxHp) * 0.4 : 0;
      out.push({
        action: { kind: "item", item: id },
        value:
          (restored / ctx.me.maxHp) * W_DMG * 0.5 +
          (saves ? W_KO : 0) -
          waste,
        reason: "heal",
      });
      continue;
    }

    if (spec.curesStatus && ctx.me.status) {
      out.push({
        action: { kind: "item", item: id },
        value: 0.12 * ctx.profile.itemDiscipline,
        reason: "heal",
      });
      continue;
    }

    if (spec.stage) {
      // Una X vale por el daño extra de los próximos turnos, si los hay.
      const survives = incoming > 0 ? ctx.me.hp / incoming : 4;
      if (survives < 2) continue;
      out.push({
        action: { kind: "item", item: id },
        value:
          0.1 * spec.stage.change * Math.min(3, survives) * ctx.profile.setupAppetite,
        reason: "setup",
      });
    }
  }
  return out;
}

export { W_DMG, W_KO, WASTED };
