/**
 * Contar lo que va a doler, y elegir.
 *
 * `actions` puntúa lo que cada jugada GANA. Aquí se le resta lo que hace
 * ENCAJAR, y se le resta a TODAS por igual — atacar, cambiar y beberse una
 * poción cuestan el golpe que llega después, cada uno el suyo. La primera
 * versión sólo se lo cobraba a los cambios y a los objetos, y el resultado fue
 * un cerebro que se pasaba el combate persiguiendo el emparejamiento perfecto
 * mientras el rival le pegaba gratis: empataba contra una IA que sólo sabía
 * atacar. Es la lección que dejó el banco de pruebas y por eso está escrita.
 *
 * Y es ADEMÁS el eje de habilidad: mirar la respuesta del rival es justo lo
 * que un principiante no hace. `depth: 0` no cuenta nada de esto — Brock ve su
 * ataque y no ve el que viene de vuelta.
 *
 * Todo es aritmética sobre copias de números sueltos: NO se llama a
 * `resolveTurn` ni una vez. El motor muta a los combatientes en el sitio, y los
 * equipos del estado son los mismos objetos que dibuja la arena — una
 * simulación mal clonada no se nota en una prueba, se nota en que al jugador le
 * baja la vida sin que nadie le haya pegado.
 */
import { TWO_TURN_MOVES } from "@/lib/battle/engine";
import type { Battler } from "@/types/battle";
import { koChance, speedEdge, stancePierce } from "./damage";
import { bestAttack } from "./threat";
import type { AiContext, Candidate } from "./actions";
import { W_DMG, W_KO } from "./actions";

/**
 * Lo que cuesta encajar `damage` estando a `hp` de PS, en barras de vida.
 *
 * Perder un Pokémon cuesta en proporción a la vida que le quedaba: al que cae
 * desde el 70% se le pierde un combatiente entero, y al que cae desde el 5% ya
 * se había perdido. Sin esa proporción, el cerebro pagaba cualquier precio por
 * aplazar un K.O. inevitable — cambiaba para «salvar» a uno que iba a caer
 * igualmente dos turnos después, y regalaba la vida del que entraba.
 */
function painOf(damage: number, victim: Battler, hp = victim.hp): number {
  const chip = (Math.min(damage, hp) / victim.maxHp) * W_DMG;
  const lost = damage >= hp ? W_KO * (hp / victim.maxHp) : 0;
  return chip + lost;
}

/** El golpe que devuelve el rival si elijo esto. */
function retaliation(candidate: Candidate, ctx: AiContext): number {
  const incoming = ctx.incoming.ev;

  if (candidate.action.kind === "switch") {
    // El que entra come el golpe entero: los cambios se resuelven antes que
    // los ataques, así que pisa el campo justo a tiempo de recibirlo.
    const entering = ctx.state[ctx.side].team[candidate.action.to];
    const freeHit = bestAttack(ctx.foe, entering, ctx.foeMoves).ev;
    return painOf(freeHit, entering);
  }

  if (candidate.action.kind === "item") {
    // Beber cuesta el turno: el golpe llega igual, sobre los PS ya curados.
    return painOf(incoming, ctx.me);
  }

  const slug = candidate.action.move;
  const move = ctx.me.moves.find((m) => m.slug === slug);
  if (!move) return painOf(incoming, ctx.me);

  // Si lo tumbo antes de que mueva, no hay respuesta que valga.
  const mine = bestAttack(ctx.me, ctx.foe, [move]);
  const silenced = koChance(mine.est, ctx.foe.hp) * speedEdge(ctx.me, ctx.foe);

  // Y si me escondo, el golpe sólo cuenta si sabe dónde buscarme. Es lo que
  // convierte a Excavar en una jugada y no en un turno perdido.
  const stance = TWO_TURN_MOVES[move.slug];
  let exposure = 1;
  if (stance && stance !== "charging") {
    const hidden: Battler = { ...ctx.me, charging: { move: move.slug, stance } };
    exposure = ctx.foeMoves.some((m) => stancePierce(m, hidden) !== null) ? 1 : 0;
  }

  return painOf(incoming, ctx.me) * (1 - silenced) * exposure;
}

/**
 * Un turno más: con la posición ya castigada, cuánto queda por hacer después.
 *
 * Muy descontado, y a propósito. Este motor no tiene clima, ni habilidades en
 * combate, ni prioridad: pegar lo más fuerte posible está muy cerca de ser la
 * jugada óptima, y el banco de pruebas lo enseñó sin ambigüedad — mirando dos
 * turnos adelante el cerebro ganaba MENOS que mirando uno. Así que el horizonte
 * es un desempate entre jugadas parecidas, no una voz con voto propio.
 */
const HORIZON_DISCOUNT = 0.2;

function followUp(candidate: Candidate, ctx: AiContext): number {
  if (candidate.action.kind !== "move") return 0;
  const slug = candidate.action.move;
  const move = ctx.me.moves.find((m) => m.slug === slug);
  if (!move) return 0;

  const mine = bestAttack(ctx.me, ctx.foe, [move]);
  const foeHpAfter = Math.max(0, ctx.foe.hp - mine.ev);
  if (foeHpAfter <= 0) return 0; // Ya no hay turno siguiente contra este.

  const myHpAfter = Math.max(0, ctx.me.hp - ctx.incoming.ev);
  if (myHpAfter <= 0) return 0; // Ni yo estaré para jugarlo.

  const projectedMe: Battler = { ...ctx.me, hp: myHpAfter };
  const projectedFoe: Battler = { ...ctx.foe, hp: foeHpAfter };
  const next = bestAttack(projectedMe, projectedFoe, ctx.me.moves);
  const damage = next.ev / projectedFoe.maxHp;
  const ko = koChance(next.est, foeHpAfter);
  return (damage * W_DMG + ko * W_KO) * HORIZON_DISCOUNT;
}

/** Afina los candidatos según cuánto mira hacia delante el perfil. */
export function refine(candidates: Candidate[], ctx: AiContext): Candidate[] {
  const { depth, breadth } = ctx.profile;
  if (depth === 0 || candidates.length === 0) return candidates;

  const ranked = [...candidates].sort((a, b) => b.value - a.value);
  const deep = new Set(ranked.slice(0, breadth));

  return candidates.map((c) => {
    // Lo que se encaja se cobra SIEMPRE, y a todos igual: si sólo se afinaran
    // los mejores, atacar saldría castigado y cambiar gratis.
    let value = c.value - retaliation(c, ctx);
    if (depth >= 2 && deep.has(c)) value += followUp(c, ctx);
    return { ...c, value };
  });
}

/* ------------------------------------------------------------------ */
/* Elección                                                            */
/* ------------------------------------------------------------------ */

/**
 * Por debajo de esto una jugada no es «peor», es impensable: un movimiento que
 * no puede tocar al rival, o un cambio que entra a morir. El ruido de la
 * temperatura se reparte sólo entre las jugadas de verdad — si no, un
 * Entrenador flojo no parece flojo, parece que no mira el campo.
 */
const PLAUSIBLE = -0.75;

/**
 * Softmax sobre los candidatos ordenados. Es la diferencia entre un Entrenador
 * flojo y uno roto: con temperatura alta elige el segundo o el tercer mejor
 * movimiento — que es lo que hace alguien con poca experiencia —, no uno al
 * azar entre los cuatro, que es lo que hacía el cerebro anterior y lo que
 * producía Pistola Agua contra un Gyarados.
 *
 * La escala importa: los valores están en fracciones de barra de vida, así que
 * las separaciones típicas son de 0.1-0.3. Una temperatura de 0.1 deja al
 * segundo mejor a tiro; una de 1 ya es tirar una moneda.
 */
function softmax(
  candidates: Candidate[],
  temperature: number,
  rng: () => number,
): Candidate {
  const top = Math.max(...candidates.map((c) => c.value));
  const weights = candidates.map((c) => Math.exp((c.value - top) / temperature));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let ticket = rng() * total;
  for (let i = 0; i < candidates.length; i++) {
    ticket -= weights[i];
    if (ticket <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

export function select(
  candidates: Candidate[],
  ctx: AiContext,
  rng: () => number,
): Candidate {
  const ranked = [...candidates].sort((a, b) => b.value - a.value);
  const { temperature, blunderRate } = ctx.profile;
  // Las jugadas impensables se quedan fuera del sorteo, siempre. Sólo se
  // recurre a ellas si literalmente no hay otra cosa que hacer.
  const plausible = ranked.filter((c) => c.value > PLAUSIBLE);
  const pool = plausible.length > 0 ? plausible : ranked;

  // El despiste: el peor MOVIMIENTO que todavía hace algo. Sólo movimientos —
  // un novato se equivoca de ataque, no se dedica a cambiar de Pokémon una y
  // otra vez, que es lo que hacía cuando el despiste miraba todas las jugadas:
  // regalaba un golpe por turno y perdía el 99% de los combates.
  const moves = pool.filter((c) => c.action.kind === "move");
  if (blunderRate > 0 && moves.length > 1 && rng() < blunderRate) {
    return moves[moves.length - 1];
  }
  if (temperature > 0.01 && pool.length > 1) {
    return softmax(pool, temperature, rng);
  }
  return pool[0];
}
