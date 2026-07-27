"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  pickFallbackMove,
  pickRivalItem,
  pickRivalReplacement,
  resolveTurn,
} from "@/lib/battle/engine";
import {
  createRivalMemory,
  pickTieredAction,
  type RivalMemory,
} from "@/lib/battle/rival-ai";
import { announcesOnEntry } from "@/lib/battle/abilities";
import {
  BAG_ITEMS,
  DEFAULT_BAG,
  itemSpriteUrl,
  type Bag,
  type BagItemId,
} from "@/lib/battle/items";
import { useT } from "@/lib/i18n/client";
import { artworkUrl, typeAura } from "@/lib/pokemon-meta";
import { useSfx } from "@/components/audio/SfxProvider";
import type {
  BattleAction,
  BattleEvent,
  BattleState,
  Battler,
  RivalTurnResponse,
  Side,
} from "@/types/battle";
import type { RivalTier, TrainerLines } from "@/types/tournament";
import { SfxControl } from "./SfxControl";
import {
  BattleStage2D,
  GEN7,
  type SpriteView,
  type StageHandle,
} from "./BattleStage2D";
import {
  ActionMenu,
  BagMenu,
  Databox,
  DialogueBubble,
  MessageBox,
  MoveMenu,
  SwitchMenu,
} from "./BattleHud";

/** What the arena hands back to whoever started the battle. */
export interface ArenaResult {
  won: boolean;
  /** True when the player ran away instead of finishing the fight. */
  fled: boolean;
  /** The player's roster as the battle left it (HP, PP and status kept). */
  playerTeam: Battler[];
  /** Damage each of the player's Pokémon dealt, by team index. */
  damageByMember: number[];
  turns: number;
}

/** The trainer on the other side of the field. */
export interface ArenaTrainer {
  nombre: string;
  lema: string;
}

export interface BattleArenaProps {
  /** Hydrated rosters; the engine mutates them in place as the battle runs. */
  player: Battler[];
  rival: Battler[];
  trainer: ArenaTrainer;
  /** What the player packed in the lobby. */
  bag: Bag;
  /** What the rival carries; defaults to the standard trainer kit. */
  rivalBag?: Bag;
  /** Portrait for the intro and the speech bubble. */
  avatar?: string | null;
  /**
   * Full-body cut-out of the trainer, drawn on the field beside their
   * Pokémon. The figure is always there — without this the stage falls back
   * to a silhouette — because the trainer standing across from you is part of
   * the scene, not of the artwork that decorates it.
   */
  trainerSprite?: string | null;
  /**
   * Offline brain tier. When set the rival decides locally with the tiered
   * heuristics (predictable difficulty, no network); when omitted it asks
   * /api/battle/turn each turn, which is what the classic mode does.
   */
  tier?: RivalTier;
  /** Fixed battle lines; replaces the per-turn dialogue the model writes. */
  lines?: TrainerLines;
  /** Chip drawn over the top-right of the stage (round counter, streak…). */
  hud?: ReactNode;
  /** Extra content above the rival card in the intro overlay. */
  introHeader?: ReactNode;
  /** Label of the intro's confirm button. */
  introCta?: string;
  /** Controls rendered next to the SFX toggle (usually a "back" link). */
  toolbar?: ReactNode;
  /** Modal the parent draws over the arena once it has a verdict. */
  overlay?: ReactNode;
  /** Fired once, as soon as the battle is decided. */
  onFinish: (result: ArenaResult) => void;
}

type Phase =
  | "intro"
  | "select"
  | "moves"
  | "bag"
  /** Party screen opened by Revive: pick which fainted Pokémon comes back. */
  | "revive"
  | "switch"
  | "busy"
  | "forced"
  | "over";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * The arena draws the animated Showdown sprites: your Pokémon from behind,
 * the rival's facing you — the framing of the 2D games. The official artwork
 * stays behind them as the fallback for entries Showdown never animated.
 */
const spriteView = (b: Battler, side: Side, slot: number): SpriteView => ({
  // Slot included: two members of the same species would otherwise share a
  // key, and the stage would keep the first one's sprite on the field.
  key: `${side}-${slot}-${b.id}`,
  art: b.sprites.art,
  url: side === "player" ? b.sprites.back : b.sprites.front,
  aura: typeAura(b.types[0]),
  label: b.label,
});

/**
 * Classic 2D battle: themed stage, animated front and back sprites, message
 * box with progressive text and the menus of the games. The rival either
 * thinks through /api/battle/turn (classic AI mode) or with the local tiered
 * brain (tournament), and the shared engine resolves every turn.
 *
 * The component owns one battle from the intro to the verdict and then hands
 * control back through `onFinish`; mounting it with a fresh `key` starts a
 * new one.
 */
export function BattleArena({
  player,
  rival,
  trainer,
  bag,
  rivalBag,
  avatar = null,
  trainerSprite = null,
  tier,
  lines,
  hud,
  introHeader,
  introCta,
  toolbar,
  overlay,
  onFinish,
}: BattleArenaProps) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("intro");
  const [dialogue, setDialogue] = useState<string | null>(null);
  /** Current battle-box text (one message at a time, like the games). */
  const [message, setMessage] = useState("");
  const [confirmFlee, setConfirmFlee] = useState(false);
  /** Item awaiting a target (Revive), while the party screen is open. */
  const [pendingItem, setPendingItem] = useState<BagItemId | null>(null);

  // The engine mutates battleRef in place inside callbacks; `battle` is the
  // render mirror, refreshed via sync() after every mutation.
  const battleRef = useRef<BattleState>({
    // Fresh bag copies: the engine spends items in place, and a rematch must
    // start from the packed bag again, not from what was left over.
    player: { team: player, active: 0, bag: { ...bag } },
    rival: { team: rival, active: 0, bag: { ...(rivalBag ?? DEFAULT_BAG) } },
    turn: 0,
  });
  const [battle, setBattle] = useState<BattleState>(battleRef.current);
  /**
   * Quién está sobre la plataforma. Arranca vacío en los dos lados: los
   * Pokémon no aparecen hasta que su bola se abre, que es como empieza un
   * combate en los juegos.
   */
  const [onField, setOnField] = useState<Record<Side, boolean>>({
    player: false,
    rival: false,
  });
  /**
   * Ranura que la escena dibuja, por lado — y no siempre la que está activa
   * en el motor.
   *
   * `battle` es una copia superficial de `battleRef`: sus dos bandos son el
   * MISMO objeto que el motor muta, así que en cuanto un cambio se resuelve,
   * cualquier repintado ya vería al Pokémon nuevo. Sin esta ranura propia, el
   * rayo de retirada se dibujaría sobre el que acaba de entrar en vez de sobre
   * el que se va. La escena y las fichas van por aquí; los menús, por el
   * activo real, que es de quien se dan las órdenes.
   */
  const [shown, setShown] = useState<Record<Side, number>>({
    player: 0,
    rival: 0,
  });
  const shownRef = useRef<Record<Side, number>>({ player: 0, rival: 0 });
  const showSlot = useCallback((side: Side, index: number) => {
    shownRef.current = { ...shownRef.current, [side]: index };
    setShown((s) => ({ ...s, [side]: index }));
  }, []);
  const stageRef = useRef<StageHandle>(null);
  const aliveRef = useRef(true);
  /** Recent battle lines, fed to the rival AI as context. */
  const historyRef = useRef<string[]>([]);
  /** Damage dealt by each of the player's Pokémon, for the round summary. */
  const damageRef = useRef<number[]>(player.map(() => 0));
  /** Memory of the tiered brain (switch cooldown, set-up moves spent). */
  const memoryRef = useRef<RivalMemory>(createRivalMemory());
  /** The scripted "pinch" line only lands once per battle. */
  const pinchSaidRef = useRef(false);
  /** Guards against a double verdict (flee racing the last faint). */
  const finishedRef = useRef(false);

  /* ---------------------------------------------------------------- */
  /* Sound                                                            */
  /* ---------------------------------------------------------------- */

  const sfx = useSfx();
  /** Pending sound cues, cancelled if the player leaves mid-animation. */
  const cueTimers = useRef<number[]>([]);
  /**
   * Type and class of the move being resolved. The engine's `damage` event
   * carries no move data, so the impact texture is remembered here when the
   * matching `use-move` event plays.
   */
  const lastMoveRef = useRef<{ type: string; damageClass: string } | null>(null);

  const later = useCallback((ms: number, fn: () => void) => {
    cueTimers.current.push(window.setTimeout(fn, ms));
  }, []);

  /** Low-health alarm: beeps while your active Pokémon sits under 20% PS. */
  const updateAlarm = useCallback(() => {
    const state = battleRef.current;
    const active = state.player.team[state.player.active];
    sfx.alarm(!!active && active.hp > 0 && active.hp / active.maxHp <= 0.2);
  }, [sfx]);

  const sync = useCallback(() => {
    setBattle({ ...battleRef.current });
  }, []);

  /* ---------------------------------------------------------------- */
  /* Poké Ball choreography (Gen 7)                                   */
  /* ---------------------------------------------------------------- */

  /**
   * Saca al Pokémon de ese lado como en Sol y Luna: la bola vuela, se abre y
   * el Pokémon aparece de la luz, grita y — si su habilidad es de las que se
   * anuncian al entrar — abre su ventana.
   *
   * Sincroniza el estado justo al revelarlo, así el cambio de ficha y el
   * sprite nuevo entran a la vez que la bola se abre y no antes.
   */
  const enter = useCallback(
    async (side: Side) => {
      stageRef.current?.sendOut(side);
      sfx.play("ballThrow");
      await sleep(GEN7.ballFlight);
      if (!aliveRef.current) return;
      sfx.play("sendOut");
      const state = battleRef.current;
      // La escena pasa a mirar al recién llegado justo al abrirse la bola.
      showSlot(side, state[side].active);
      sync();
      setOnField((f) => ({ ...f, [side]: true }));
      const battler = state[side].team[state[side].active];
      later(200, () => sfx.cry(battler?.cry));
      if (announcesOnEntry(battler?.ability?.slug)) {
        later(GEN7.ballOpen + 260, () => {
          stageRef.current?.ability(
            side,
            battler.label,
            battler.ability?.label ?? "",
          );
          sfx.play("ability");
        });
      }
      await sleep(GEN7.ballOpen);
    },
    [sfx, sync, later, showSlot],
  );

  /** Devuelve al Pokémon a su bola con el rayo rojo, y deja el hueco vacío. */
  const leave = useCallback(
    async (side: Side) => {
      sfx.play("recall");
      stageRef.current?.recall(side);
      await sleep(GEN7.recall);
      if (!aliveRef.current) return;
      setOnField((f) => ({ ...f, [side]: false }));
    },
    [sfx],
  );

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Leaving the arena silences everything the battle had in flight.
  useEffect(() => {
    const pending = cueTimers.current;
    return () => {
      pending.forEach(clearTimeout);
      sfx.stopAll();
    };
  }, [sfx]);

  const pushMsg = useCallback((text: string) => {
    if (!text) return;
    setMessage(text);
    historyRef.current = [...historyRef.current.slice(-11), text];
  }, []);

  /** Reports the verdict to the parent exactly once. */
  const finish = useCallback(
    (won: boolean, fled: boolean) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setPhase("over");
      onFinish({
        won,
        fled,
        playerTeam: battleRef.current.player.team,
        damageByMember: damageRef.current,
        turns: battleRef.current.turn,
      });
    },
    [onFinish],
  );

  /* ---------------------------------------------------------------- */
  /* Opening                                                          */
  /* ---------------------------------------------------------------- */

  const startBattle = useCallback(async () => {
    const state = battleRef.current;
    setPhase("busy");
    pushMsg(t.battle.challenge(trainer.nombre));
    await sleep(1300);
    if (!aliveRef.current) return;
    // Cada entrenador lanza su bola por turnos y el Pokémon sale de la luz,
    // el orden de apertura de los juegos: primero el rival, luego el tuyo.
    pushMsg(t.battle.trainerSendsOut(trainer.nombre, state.rival.team[0].label));
    await enter("rival");
    if (!aliveRef.current) return;
    await sleep(620);
    if (!aliveRef.current) return;
    pushMsg(t.battle.engine.sendOut(state.player.team[0].label, "player"));
    await enter("player");
    if (!aliveRef.current) return;
    // Scripted trainers open with their own line, like in the games.
    if (lines) setDialogue(lines.start);
    await sleep(760);
    if (!aliveRef.current) return;
    setPhase("select");
  }, [trainer, pushMsg, t, lines, enter]);

  /* ---------------------------------------------------------------- */
  /* Rival brain                                                      */
  /* ---------------------------------------------------------------- */

  /** Scripted line for the moment the battle is in, or null to keep quiet. */
  const scriptedLine = useCallback(
    (state: BattleState): string | null => {
      if (!lines || pinchSaidRef.current) return null;
      const active = state.rival.team[state.rival.active];
      const standing = state.rival.team.filter((b) => b.hp > 0).length;
      if (standing <= 1 || active.hp / active.maxHp <= 0.25) {
        pinchSaidRef.current = true;
        return lines.pinch;
      }
      return null;
    },
    [lines],
  );

  const askRival = useCallback(
    async (state: BattleState): Promise<RivalTurnResponse> => {
      // Tournament rounds think locally: the tier is the difficulty contract,
      // and it must not change because a network call failed.
      if (tier) {
        return {
          action: pickTieredAction(state, tier, memoryRef.current),
          dialogue: scriptedLine(state) ?? "",
        };
      }

      const rActive = state.rival.team[state.rival.active];
      const pActive = state.player.team[state.player.active];
      const benchIdx = state.rival.team
        .map((_, i) => i)
        .filter((i) => i !== state.rival.active && state.rival.team[i].hp > 0);

      // The rival carries a bag too: when its Pokémon is about to drop it
      // heals instead of asking the model for a move, exactly like a trainer
      // in the games would.
      const item = pickRivalItem(state);
      if (item) {
        return { action: item, dialogue: t.battle.dialogueDefault };
      }

      try {
        const res = await fetch("/api/battle/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trainer: trainer.nombre,
            rivalActive: {
              name: rActive.name,
              label: rActive.label,
              hpPct: (rActive.hp / rActive.maxHp) * 100,
              types: rActive.types,
              moves: rActive.moves.map((m) => ({
                slug: m.slug,
                label: m.label,
                type: m.type,
                damageClass: m.damageClass,
                power: m.power,
                pp: m.pp,
              })),
            },
            rivalBench: benchIdx.map((i) => {
              const b = state.rival.team[i];
              return {
                name: b.name,
                label: b.label,
                hpPct: (b.hp / b.maxHp) * 100,
                types: b.types,
              };
            }),
            playerActive: {
              name: pActive.name,
              label: pActive.label,
              hpPct: (pActive.hp / pActive.maxHp) * 100,
              types: pActive.types,
            },
            lastEvents: historyRef.current.slice(-6),
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as RivalTurnResponse;
          let action: BattleAction | null = null;
          if (data.action?.kind === "switch") {
            // The route answers with the BENCH index; map to team index.
            const teamIndex = benchIdx[data.action.to];
            if (teamIndex !== undefined) action = { kind: "switch", to: teamIndex };
          } else if (data.action?.kind === "move") {
            const slug = (data.action as { move?: string }).move;
            const move = rActive.moves.find((m) => m.slug === slug && m.pp > 0);
            if (move) action = { kind: "move", move: move.slug };
          }
          if (action) {
            return {
              action,
              dialogue:
                typeof data.dialogue === "string"
                  ? data.dialogue
                  : t.battle.dialogueDefault,
            };
          }
        }
      } catch {
        // Network hiccup: the heuristic below keeps the battle moving.
      }
      return {
        action: pickFallbackMove(state),
        dialogue: t.battle.dialogueFallback,
      };
    },
    [trainer, t, tier, scriptedLine],
  );

  /* ---------------------------------------------------------------- */
  /* Event replay                                                     */
  /* ---------------------------------------------------------------- */

  /**
   * Pause matched to the typewriter (MessageBox reveals ~2 chars/18 ms): the
   * next event never cuts a line short, and long lines get a reading beat —
   * the official games' rhythm. `extra` adds animation time on top.
   */
  const msgWait = useCallback(
    (text: string, extra = 0) =>
      sleep(Math.min(2800, Math.max(900, text.length * 9 + 500)) + extra),
    [],
  );

  const replay = useCallback(
    async (events: BattleEvent[]) => {
      for (const event of events) {
        if (!aliveRef.current) return;
        const state = battleRef.current;
        switch (event.kind) {
          case "switch": {
            // Relevo completo de los juegos: el que sale vuelve a su bola con
            // el rayo rojo y su línea, y solo entonces se lanza la siguiente.
            const leaving = state[event.side].team[shownRef.current[event.side]];
            if (leaving && leaving.hp > 0) {
              pushMsg(t.battle.recall(leaving.label, event.side));
              await leave(event.side);
              if (!aliveRef.current) return;
              await sleep(220);
              if (!aliveRef.current) return;
            }
            pushMsg(event.text);
            await enter(event.side);
            if (!aliveRef.current) return;
            await msgWait(event.text);
            break;
          }
          case "heal":
            pushMsg(event.text);
            sync();
            sfx.play("heal");
            await msgWait(event.text);
            break;
          case "use-move": {
            pushMsg(event.text);
            stageRef.current?.attack(event.side, {
              slug: event.move.slug,
              type: event.move.type,
              damageClass: event.move.damageClass,
              release: event.release,
              selfTarget: event.move.effects?.target === "self",
            });
            // The attacker roars as it lunges, then the swing itself.
            const attacker = state[event.side].team[state[event.side].active];
            sfx.cry(attacker?.cry, 0.55);
            // Attacks whoosh; a status move just shimmers into effect.
            if (event.move.damageClass === "status") {
              sfx.play("statUp");
            } else {
              sfx.play("swing", event.move.damageClass === "special" ? 0.8 : 1);
            }
            // Remembered so the "damage" event knows which texture to hit
            // with — the engine's damage event carries no move data.
            lastMoveRef.current = {
              type: event.move.type,
              damageClass: event.move.damageClass,
            };
            // A release re-entry (Dig resurfacing…) takes an extra beat.
            await msgWait(event.text, event.release ? 400 : 100);
            break;
          }
          case "charge":
            // Turn 1 of a two-turn move: the sprite hides or gathers light.
            pushMsg(event.text);
            stageRef.current?.charge(event.side, event.stance);
            sfx.play("charge");
            await msgWait(event.text, 300);
            break;
          case "reappear":
            // Interrupted charge: silent return, no battle line.
            stageRef.current?.reappear(event.side);
            await sleep(500);
            break;
          case "damage": {
            const defender = state[event.side].team[state[event.side].active];
            const ratio = defender ? event.amount / defender.maxHp : 0.3;
            // Damage landing on the rival was dealt by whoever the player has
            // out — that's the tally the round summary picks its MVP from.
            if (event.side === "rival") {
              const index = state.player.active;
              damageRef.current[index] =
                (damageRef.current[index] ?? 0) + event.amount;
            }
            stageRef.current?.hit(event.side, {
              effectiveness: event.effectiveness,
              ratio,
              crit: event.crit,
            });
            const move = lastMoveRef.current;
            sfx.impact(move?.type ?? "normal", move?.damageClass ?? "physical", ratio);
            // The bar rattles as it drains, then the verdict stinger lands
            // over the battle line that announces it.
            sfx.drain(520);
            if (event.crit) later(240, () => sfx.play("crit"));
            if (event.effectiveness !== 1) {
              later(event.crit ? 460 : 300, () =>
                sfx.effectiveness(event.effectiveness),
              );
            }
            sync(); // HP bar drains to the new value.
            // Low-health alarm, on the same 20% threshold as the pulsing bar.
            updateAlarm();
            if (event.text) pushMsg(event.text);
            await (event.text ? msgWait(event.text) : sleep(750));
            break;
          }
          case "miss":
            pushMsg(event.text);
            sfx.play("miss");
            await msgWait(event.text);
            break;
          case "note":
            // Stat changes, conditions, skipped turns… text plus a beat.
            pushMsg(event.text);
            // Objeto usado: cae sobre el Pokémon y lo envuelve — verde si
            // cura, ámbar si sube una característica — antes de que el efecto
            // se cuente en la línea siguiente.
            if (event.item) {
              const spec = BAG_ITEMS[event.item];
              stageRef.current?.useItem(event.side, {
                sprite: itemSpriteUrl(event.item),
                kind: spec?.stage ? "boost" : "heal",
              });
              sfx.play("itemUse");
            }
            sync(); // Stages/status may have changed HP-adjacent UI state.
            updateAlarm(); // Burn/poison chip damage can cross the threshold.
            await msgWait(event.text, event.item ? 250 : 0);
            break;
          case "faint": {
            await sleep(250);
            stageRef.current?.faint(event.side);
            sfx.alarm(false);
            sfx.play("faint");
            // El Pokémon se queja al caer, como en los juegos, y solo después
            // se hunde tras la plataforma.
            const victim = state[event.side].team[shownRef.current[event.side]];
            sfx.cry(victim?.cry, 0.5);
            pushMsg(event.text);
            await msgWait(event.text, 300);
            // El hueco queda vacío: quien venga después llegará en su bola.
            setOnField((f) => ({ ...f, [event.side]: false }));
            break;
          }
          case "end":
            pushMsg(event.text);
            sfx.alarm(false);
            sfx.play(event.winner === "player" ? "victory" : "defeat");
            // A beaten scripted trainer signs off with its own line.
            if (lines && event.winner === "player") setDialogue(lines.defeat);
            await msgWait(event.text, 400);
            break;
        }
      }
    },
    [pushMsg, sync, msgWait, sfx, later, updateAlarm, lines, t, enter, leave],
  );

  /* ---------------------------------------------------------------- */
  /* One full turn                                                    */
  /* ---------------------------------------------------------------- */

  const runTurn = useCallback(
    async (playerAction: BattleAction) => {
      const state = battleRef.current;
      setPhase("busy");

      // Loop instead of recursion: while the player is locked into a
      // two-turn move (Dig, Fly…) the release turn chains automatically,
      // with no menus in between, like the games.
      let action = playerAction;
      for (;;) {
        // A charging rival is locked too: no point asking the AI — the
        // engine would override its answer anyway.
        const rivalCharge = state.rival.team[state.rival.active].charging;
        const decision = rivalCharge
          ? {
              action: {
                kind: "move",
                move: rivalCharge.move,
              } as BattleAction,
              dialogue: null,
            }
          : await askRival(state);
        if (!aliveRef.current) return;
        if (decision.dialogue) setDialogue(decision.dialogue);

        const events = resolveTurn(
          state,
          action,
          decision.action,
          Math.random,
          t.battle.engine,
          t.bag.engine,
          (id) => t.bag.itemName[id],
        );
        await replay(events);
        if (!aliveRef.current) return;

        const ended = events.find((e) => e.kind === "end");
        if (ended) {
          finish(ended.winner === "player", false);
          return;
        }

        // Forced replacements after faints.
        if (state.rival.team[state.rival.active].hp <= 0) {
          const next = pickRivalReplacement(state);
          if (next !== null) {
            state.rival.active = next;
            const b = state.rival.team[next];
            pushMsg(t.battle.trainerSendsOut(trainer.nombre, b.label));
            // El relevo llega en su bola, igual que el titular.
            await enter("rival");
            if (!aliveRef.current) return;
            // Down to its last Pokémon: the scripted line lands here.
            const pinch = scriptedLine(state);
            if (pinch) setDialogue(pinch);
            await sleep(700);
          }
        }
        if (state.player.team[state.player.active].hp <= 0) {
          pushMsg(t.battle.whichSwitch);
          setPhase("forced");
          return;
        }

        const playerCharge = state.player.team[state.player.active].charging;
        if (!playerCharge) break;
        await sleep(650);
        if (!aliveRef.current) return;
        action = { kind: "move", move: playerCharge.move };
      }

      setPhase("select");
    },
    [
      askRival,
      replay,
      pushMsg,
      trainer,
      t,
      finish,
      scriptedLine,
      enter,
    ],
  );

  const forcedSwitch = useCallback(
    async (index: number) => {
      const state = battleRef.current;
      if (state.player.team[index].hp <= 0) return;
      setPhase("busy");
      state.player.active = index;
      const next = state.player.team[index];
      pushMsg(t.battle.engine.sendOut(next.label, "player"));
      // El sustituto sale de su bola: el hueco estaba vacío desde la caída.
      await enter("player");
      if (!aliveRef.current) return;
      // The replacement may itself be in the red: re-arm the alarm for it.
      updateAlarm();
      setPhase("select");
    },
    [pushMsg, t, updateAlarm, enter],
  );

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */

  const state = battle;
  const pActive = state.player.team[state.player.active] ?? null;
  const rActive = state.rival.team[state.rival.active] ?? null;
  // Quien está en el campo ahora mismo: durante una retirada sigue siendo el
  // que se va, y por eso escena y fichas se leen de aquí y no del activo.
  const pShown = state.player.team[shown.player] ?? null;
  const rShown = state.rival.team[shown.rival] ?? null;

  const boxText =
    (phase === "select" || phase === "moves" || phase === "bag") && pActive
      ? phase === "bag"
        ? t.battle.whichItem
        : t.battle.whatWillDo(pActive.label)
      : message;

  return (
    // Sin max-width: la arena toma el mayor rectángulo que quepa bajo la
    // cabecera (el alto la limita en monitores anchos vía max-h).
    <div className="relative mx-auto flex h-[calc(100dvh-5rem)] min-h-[32rem] w-full flex-col overflow-hidden sm:px-3 sm:py-1.5">
      {/* The arena is a canvas of absolutely positioned pieces with no visible
          title, so the page would otherwise reach a screen reader with no
          top-level heading at all. */}
      <h1 className="sr-only">{t.a11y.battleTitle}</h1>
      {/* Escape hatch back to the dex, always visible during the battle, and
          the SFX control next to it (the BGM keeps its own player). */}
      <div className="flex shrink-0 items-center gap-2 px-2 pb-1.5 sm:px-0">
        {toolbar}
        <SfxControl />
      </div>

      {/* Game frame: panoramic 16:9 "console screen" on desktop (mobile keeps
          the full column height), with the HUD floating over the stage. */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="relative flex h-full w-full flex-col overflow-hidden border border-slate-800 bg-black shadow-[0_0_40px_rgba(0,0,0,0.8)] sm:aspect-video sm:h-auto sm:max-h-full sm:rounded-2xl sm:border-2 sm:border-slate-700/70">
          {/* Stage */}
          <div className="relative min-h-0 flex-1">
            <BattleStage2D
              ref={stageRef}
              scenario="estadio"
              // Las plataformas están vacías hasta que la bola se abre: es
              // esa luz la que pone al Pokémon en el campo, no el render.
              player={
                onField.player && pShown
                  ? spriteView(pShown, "player", shown.player)
                  : null
              }
              enemy={
                onField.rival && rShown
                  ? spriteView(rShown, "rival", shown.rival)
                  : null
              }
              trainer={{ image: trainerSprite, name: trainer.nombre }}
            />

            {/* Enemy databox, top-left like in the games. Va con su Pokémon:
                se marcha cuando la bola se lo lleva y vuelve con el siguiente,
                nunca con el hueco vacío. */}
            {onField.rival && rShown && (
              <div className="absolute top-3 left-3">
                <Databox battler={rShown} side="enemy" team={state.rival.team} />
              </div>
            )}

            {/* Tournament chip (round + streak) or whatever the parent adds. */}
            {hud && phase !== "intro" && (
              <div className="pointer-events-none absolute top-3 right-3">
                {hud}
              </div>
            )}

            {/* Rival trainer speech bubble. */}
            {dialogue && phase !== "intro" && phase !== "over" && (
              <div
                className={`absolute right-3 max-w-[55%] ${hud ? "top-14" : "top-3"}`}
              >
                <DialogueBubble
                  avatar={avatar}
                  name={trainer.nombre}
                  text={dialogue}
                />
              </div>
            )}

            {/* Right rail: player databox above the contextual command column,
                bottom-right like the SwSh command menu. */}
            <div className="absolute right-2 bottom-[5.25rem] flex w-60 max-w-[62vw] flex-col items-end gap-2 sm:right-4 sm:w-64">
              {onField.player && pShown && (
                <Databox battler={pShown} side="player" team={state.player.team} />
              )}
              {phase === "select" && (
                <div className="w-full">
                  <ActionMenu
                    bag={state.player.bag}
                    canSwitch={state.player.team.some(
                      (b, i) => b.hp > 0 && i !== state.player.active,
                    )}
                    onFight={() => setPhase("moves")}
                    onBag={() => setPhase("bag")}
                    onSwitch={() => setPhase("switch")}
                    onFlee={() => setConfirmFlee(true)}
                  />
                </div>
              )}
              {phase === "moves" && pActive && rActive && (
                <div className="w-full">
                  <MoveMenu
                    moves={pActive.moves}
                    targetTypes={rActive.types}
                    onBack={() => setPhase("select")}
                    onPick={(m) => void runTurn({ kind: "move", move: m.slug })}
                  />
                </div>
              )}
              {phase === "bag" && pActive && (
                <div className="w-full">
                  <BagMenu
                    bag={state.player.bag}
                    active={pActive}
                    hasFaintedAlly={state.player.team.some((b) => b.hp <= 0)}
                    onBack={() => setPhase("select")}
                    onUse={(item) => {
                      // Revive needs a target, so it opens the party screen
                      // first; everything else acts on whoever is out.
                      if (BAG_ITEMS[item].revives) {
                        setPendingItem(item);
                        setPhase("revive");
                      } else {
                        void runTurn({ kind: "item", item });
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Message bar along the bottom, like the Switch text window. */}
            <div className="absolute inset-x-2 bottom-2 sm:inset-x-3 sm:bottom-3">
              <MessageBox text={boxText} />
            </div>
          </div>

          {/* Party screen: full overlay over the whole frame. It doubles as
              the target picker for Revive, where only the fainted count. */}
          {(phase === "switch" || phase === "forced" || phase === "revive") && (
            <SwitchMenu
              team={state.player.team}
              active={state.player.active}
              forced={phase === "forced"}
              mode={phase === "revive" ? "revive" : "switch"}
              onBack={() => {
                setPendingItem(null);
                setPhase(phase === "revive" ? "bag" : "select");
              }}
              onPick={(i) => {
                if (phase === "revive") {
                  const item = pendingItem;
                  setPendingItem(null);
                  if (item) void runTurn({ kind: "item", item, target: i });
                  return;
                }
                return phase === "forced"
                  ? void forcedSwitch(i)
                  : void runTurn({ kind: "switch", to: i });
              }}
            />
          )}
        </div>
      </div>

      {/* Intro overlay: the rival presents itself. */}
      {phase === "intro" && (
        <Overlay label={t.a11y.introDialogAria}>
          {introHeader ?? (
            <p className="font-pixel text-[10px] tracking-[0.3em] text-red-400 uppercase">
              {t.battle.introChallenge}
            </p>
          )}
          <div className="flex items-center gap-4">
            <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-red-500/70 bg-hud-1 shadow-[0_0_28px_rgba(239,68,68,0.6)]">
              {avatar ? (
                // Generated portrait: named rather than empty, since the rival
                // it depicts is the whole point of this screen.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={t.a11y.rivalPortraitOf(trainer.nombre)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-display text-3xl font-bold text-red-400">
                  {trainer.nombre.charAt(0)}
                </span>
              )}
            </span>
            <div className="text-left">
              <h2 className="font-display text-xl font-bold text-slate-100">
                {trainer.nombre}
              </h2>
              <p className="mt-1 text-sm text-red-200/90 italic">
                {t.battle.motto(trainer.lema)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {state.rival.team.map((b) => (
              <span key={b.id} className="relative h-12 w-12">
                <Image
                  src={artworkUrl(b.id)}
                  alt={b.label}
                  title={b.label}
                  fill
                  sizes="48px"
                  className="object-contain opacity-90"
                />
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void startBattle()}
            className="mx-auto rounded-md border border-red-500/70 bg-red-500/15 px-8 py-3 font-display text-base font-bold tracking-widest text-red-300 uppercase transition hover:bg-red-500/30 hover:shadow-[0_0_28px_-4px_rgba(239,68,68,0.9)]"
          >
            {introCta ?? t.battle.fight}
          </button>
        </Overlay>
      )}

      {/* Flee confirmation. */}
      {confirmFlee && (
        <Overlay
          label={t.a11y.fleeDialogAria}
          onEscape={() => setConfirmFlee(false)}
        >
          <p className="text-slate-100">{t.battle.fleeConfirm}</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setConfirmFlee(false);
                pushMsg(t.battle.fledMsg);
                // Running away ends the fight: no alarm, no fanfare.
                sfx.alarm(false);
                sfx.play("cancel");
                finish(false, true);
              }}
              className="rounded-md border border-red-500/60 bg-red-500/10 px-5 py-2 font-mono text-sm text-red-300 uppercase hover:bg-red-500/20"
            >
              {t.battle.fleeYes}
            </button>
            <button
              type="button"
              onClick={() => setConfirmFlee(false)}
              className="rounded-md border border-slate-600 px-5 py-2 font-mono text-sm text-slate-300 uppercase hover:bg-slate-500/10"
            >
              {t.battle.fleeNo}
            </button>
          </div>
        </Overlay>
      )}

      {overlay}
    </div>
  );
}

/**
 * Modal panel over the arena (rival intro, flee confirmation, result).
 *
 * Each one is a real `dialog`: it names itself, moves the keyboard onto its
 * first control so the choice is immediately reachable, and — when it is
 * dismissible — closes on Escape. Without the initial focus move, a keyboard
 * user landing on the victory screen would still be somewhere behind it, in
 * the now-inert arena.
 */
export function Overlay({
  label,
  onEscape,
  wide,
  children,
}: {
  /** Accessible name of the dialog. */
  label: string;
  /** Escape handler; omitted for the overlays that require a decision. */
  onEscape?: () => void;
  /** Roomier panel, for the bracket and the round summary. */
  wide?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current
      ?.querySelector<HTMLElement>(
        "button:not([disabled]), a[href], input, select, textarea",
      )
      ?.focus();
  }, []);

  useEffect(() => {
    if (!onEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onEscape]);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`fx-bubble-pop my-auto flex w-full flex-col gap-5 rounded-2xl border border-slate-700/70 bg-hud-3/95 px-8 py-8 text-center shadow-[0_0_64px_rgba(0,0,0,0.9)] ${
          wide ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
