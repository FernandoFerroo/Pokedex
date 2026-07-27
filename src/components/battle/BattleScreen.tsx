"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { LogOut, Swords } from "lucide-react";
import { pickRivalReplacement, resolveTurn } from "@/lib/battle/engine";
import {
  createRivalMemory,
  pickAction,
  profileFor,
  rememberMove,
  type RivalMemory,
} from "@/lib/battle/rival-ai";
import { announcesOnEntry } from "@/lib/battle/abilities";
import {
  BAG_ITEMS,
  DEFAULT_BAG,
  itemSpriteUrl,
  normalizeBag,
  type Bag,
  type BagItemId,
} from "@/lib/battle/items";
import { useT } from "@/lib/i18n/client";
import { AI_TRAINER, PLAYER_TRAINER, trainerArt } from "@/lib/trainers/roster";
import { artworkUrl, typeAura } from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";
import { useSfx } from "@/components/audio/SfxProvider";
import { useTeam } from "@/components/team/TeamProvider";
import type { TeamMember } from "@/types/team";
import { BagBuilder } from "./BagBuilder";
import { RivalBuilder } from "./RivalBuilder";
import { SfxControl } from "./SfxControl";
import type {
  BattleAction,
  BattleEvent,
  BattleSetupResponse,
  BattleState,
  Battler,
  RivalProfile,
  RivalTurnResponse,
  Side,
} from "@/types/battle";
import {
  BattleStage2D,
  GEN7,
  type SpriteView,
  type StageHandle,
  type TrainerStance,
} from "./BattleStage2D";
import {
  ActionMenu,
  BagMenu,
  ComboMeter,
  Databox,
  DamageNumber,
  DialogueBubble,
  MessageBox,
  MoveMenu,
  Stinger,
  SwitchMenu,
  type StingerKind,
} from "./BattleHud";

type Phase =
  | "loading"
  | "no-team"
  | "prepare"
  | "error"
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
 * Compás del guion, como multiplicador de la velocidad normal: el mismo que el
 * «Modo Estándar» del torneo, que es `speedFor("turbo")` en
 * `lib/tournament/config` — 2, o sea, cada pausa de lectura a la mitad.
 *
 * Aquí es una constante y no una prop porque el Modo Combate no ofrece elegir
 * ritmo: se juega siempre al estándar. La copia del número es deliberada — el
 * torneo lo elige por copa y esto no —, pero si allí se retoca, hay que
 * retocarlo aquí para que un combate suelto y uno de torneo sigan sonando
 * igual.
 *
 * Sólo se acortan las esperas de LECTURA. Las que están casadas con una
 * animación CSS — la bola, la retirada, el momento del impacto — se quedan como
 * están: son un contrato con `globals.css`, y adelantarlas no acelera nada,
 * sólo descuadra el golpe de su fogonazo.
 */
const SPEED = 2;

/** Una pausa de lectura, ya escalada por el compás del combate. */
const wait = (ms: number) => sleep(ms / SPEED);

/** The packed bag survives reloads and rematches, like the roster does. */
const BAG_STORAGE_KEY = "pokedex-bag-v1";

function loadBag(): Bag {
  if (typeof window === "undefined") return { ...DEFAULT_BAG };
  try {
    const saved = localStorage.getItem(BAG_STORAGE_KEY);
    return saved ? normalizeBag(JSON.parse(saved)) : { ...DEFAULT_BAG };
  } catch {
    return { ...DEFAULT_BAG };
  }
}

/**
 * La jugada del rival, contada en una línea para que el modelo escriba encima.
 *
 * Es todo lo que necesita: qué se hace y con qué intención. Antes se le pasaba
 * el estado entero y se le pedía que decidiera, y la mayor parte del presupuesto
 * del prompt se iba en enseñarle una táctica que se le da mal; ahora la
 * decisión ya está tomada y sólo se le pide aquello que sí se le da bien.
 */
function describeDecision(
  action: BattleAction,
  state: BattleState,
  reason: string | null,
): { play: string; reason: string | null } {
  const rival = state.rival.team[state.rival.active];
  if (action.kind === "move") {
    const move = rival.moves.find((m) => m.slug === action.move);
    return { play: `${rival.label} usa ${move?.label ?? action.move}`, reason };
  }
  if (action.kind === "switch") {
    const to = state.rival.team[action.to];
    return { play: `cambia a ${rival.label} por ${to?.label ?? "otro"}`, reason };
  }
  return { play: `usa un objeto sobre ${rival.label}`, reason };
}

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
  height: b.height,
});

/**
 * Modo Combate en 2D clásico: cámara de simulación, sprites animados de frente
 * y de espaldas, caja de mensajes con texto progresivo y los menús de los
 * juegos. El rival sigue pensando cada turno vía /api/battle/turn y el motor
 * local resuelve daños.
 */
export function BattleScreen() {
  const t = useT();
  /**
   * Cómo se le llama al rival: su clase y su nombre, igual que en el torneo
   * («Líder de Gimnasio Brock» allí, «Científico Colress» aquí). La clase se
   * traduce desde el catálogo del torneo, que es donde vive el diccionario de
   * clases de Entrenador para los nueve idiomas.
   */
  const rivalName = `${t.tournament.trainerClass[AI_TRAINER.classKey]} ${AI_TRAINER.name}`;
  /** Su retrato es el propio sprite oficial, así que está desde el fotograma uno. */
  const avatar = trainerArt(AI_TRAINER.slug);
  const { team, hydrated } = useTeam();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [rival, setRival] = useState<RivalProfile | null>(null);
  const [dialogue, setDialogue] = useState<string | null>(null);
  /** Current battle-box text (one message at a time, like the games). */
  const [message, setMessage] = useState("");
  const [confirmFlee, setConfirmFlee] = useState(false);
  const [fled, setFled] = useState(false);
  /** Bag packed in the lobby; it's what the player can reach for in combat. */
  const [bag, setBag] = useState<Bag>(loadBag);
  /** Item awaiting a target (Revive), while the party screen is open. */
  const [pendingItem, setPendingItem] = useState<BagItemId | null>(null);

  // The engine mutates battleRef in place inside callbacks; `battle` is the
  // render mirror, refreshed via sync() after every mutation.
  const battleRef = useRef<BattleState | null>(null);
  const [battle, setBattle] = useState<BattleState | null>(null);
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
   * Dónde está cada Entrenador. Los dos empiezan fuera del encuadre y sólo
   * entran para la presentación y el lanzamiento: mientras se eligen ataques,
   * el campo es de los Pokémon.
   */
  const [stance, setStance] = useState<Record<Side, TrainerStance>>({
    player: "off",
    rival: "off",
  });
  /**
   * Quién se planta a cada lado.
   *
   * Enfrente hay UNO, siempre el mismo: Colress, el científico de los juegos
   * (ver `AI_TRAINER`). Antes se sorteaba entre los once del plantel de Kanto
   * a partir del nombre que hubiera inventado el modelo, así que el Modo
   * Combate no tenía cara propia — cada partida traía a un Líder distinto sin
   * que ninguno significase nada. El equipo y la labia los sigue escribiendo
   * el modelo; quien los juega es él.
   */
  const trainers = useMemo(
    () => ({
      player: {
        sprite: trainerArt(PLAYER_TRAINER.slug),
        name: PLAYER_TRAINER.name,
        foot: PLAYER_TRAINER.foot,
      },
      rival: rival
        ? {
            sprite: trainerArt(AI_TRAINER.slug),
            name: AI_TRAINER.name,
            foot: AI_TRAINER.foot,
          }
        : null,
      stance,
    }),
    [rival, stance],
  );
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
  /** Last rival choice (null = aleatorio), so «Revancha» repeats it. */
  const lastRivalRef = useRef<TeamMember[] | null>(null);
  /**
   * Lo que el rival recuerda: qué le has enseñado y cuándo cambió por última
   * vez. Dura todo el combate, y se renueva con cada rival nuevo.
   */
  const memoryRef = useRef<RivalMemory>(createRivalMemory());

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

  /** Rótulo de impacto sobre el campo; ver `Stinger` en el HUD. */
  const [stinger, setStinger] = useState<{
    seq: number;
    kind: StingerKind;
    text: string;
  } | null>(null);
  const stingerSeq = useRef(0);

  /** Cifra de daño y racha de golpes encadenados; ver `hud/HitFx`. */
  const [hit, setHit] = useState<{
    seq: number;
    side: Side;
    amount: number;
    effectiveness: number;
    crit: boolean;
  } | null>(null);
  const [combo, setCombo] = useState(0);
  const comboRef = useRef(0);

  /** Sube con cada golpe tuyo que duela; se rompe al fallar o al encajar uno. */
  const bumpCombo = useCallback(
    (good: boolean) => {
      const next = good ? comboRef.current + 1 : 0;
      comboRef.current = next;
      setCombo(next);
      if (next >= 2) sfx.play("combo", next);
    },
    [sfx],
  );

  const showStinger = useCallback(
    (eff: number, crit: boolean) => {
      const pick = (): { kind: StingerKind; text: string } | null => {
        if (crit) return { kind: "crit", text: t.battle.engine.crit };
        if (eff === 0) return { kind: "immune", text: t.battle.hintNoEffect };
        if (eff > 1) return { kind: "super", text: t.battle.engine.superEffective };
        if (eff < 1) return { kind: "resist", text: t.battle.engine.notVeryEffective };
        return null;
      };
      const next = pick();
      if (!next) return;
      const seq = ++stingerSeq.current;
      setStinger({ seq, ...next });
      later(950, () =>
        setStinger((current) => (current?.seq === seq ? null : current)),
      );
    },
    [later, t],
  );

  /** Low-health alarm: beeps while your active Pokémon sits under 20% PS. */
  const updateAlarm = useCallback(() => {
    const state = battleRef.current;
    const active = state?.player.team[state.player.active];
    sfx.alarm(!!active && active.hp > 0 && active.hp / active.maxHp <= 0.2);
  }, [sfx]);

  const sync = useCallback(() => {
    setBattle(battleRef.current ? { ...battleRef.current } : null);
  }, []);

  /* ---------------------------------------------------------------- */
  /* Poké Ball choreography (Gen 7)                                   */
  /* ---------------------------------------------------------------- */

  /**
   * Saca al Pokémon de ese lado como en Sol y Luna: la bola vuela, se abre y
   * el Pokémon aparece de la luz, grita y — si su habilidad es de las que se
   * anuncian al entrar — abre su ventana. El estado se sincroniza justo al
   * revelarlo, para que ficha y sprite entren con la apertura.
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
      if (state) showSlot(side, state[side].active);
      sync();
      setOnField((f) => ({ ...f, [side]: true }));
      const battler = state?.[side].team[state[side].active];
      later(200, () => sfx.cry(battler?.cry));
      if (battler && announcesOnEntry(battler.ability?.slug)) {
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

  /* ---------------------------------------------------------------- */
  /* Setup                                                            */
  /* ---------------------------------------------------------------- */

  const setup = useCallback(
    async (rivalMembers: TeamMember[] | null) => {
    lastRivalRef.current = rivalMembers;
    setPhase("loading");
    setError(null);
    setMessage("");
    historyRef.current = [];
    setDialogue(null);
    setFled(false);
    setStance({ player: "off", rival: "off" });
    try {
      const res = await fetch("/api/battle/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team,
          // Equipo rival elegido a mano o por mensaje; sin él, aleatorio.
          rival: rivalMembers ?? undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | (BattleSetupResponse & { error?: string })
        | null;
      if (!aliveRef.current) return;
      if (!res.ok || !data || data.error || !data.rival?.team?.length) {
        setError(data?.error ?? t.battle.setupFailed);
        setPhase("error");
        return;
      }
      battleRef.current = {
        // Fresh copies: the engine spends items in place, and a rematch must
        // start from the packed bag again, not from what was left over.
        player: { team: data.player, active: 0, bag: { ...bag } },
        rival: { team: data.rival.team, active: 0, bag: { ...DEFAULT_BAG } },
        turn: 0,
      };
      sync();
      setRival(data.rival);
      setPhase("intro");
      // Warm every cry now: the first one has to fire the instant the
      // Pokémon lands on the platform, not after a round-trip.
      [...data.player, ...data.rival.team].forEach((b) => sfx.preloadCry(b.cry));

      // Ya no se le pide un retrato al generador de imágenes: el rival es
      // siempre el mismo Entrenador oficial, así que su cara es su sprite y
      // está desde el primer fotograma — sin esperar medio minuto, sin gastar
      // una llamada y sin que el bocadillo enseñe una inicial mientras tanto.
    } catch {
      if (aliveRef.current) {
        setError(t.battle.noServer);
        setPhase("error");
      }
    }
    },
    [team, bag, sync, t, sfx],
  );

  // Once the persisted team hydrates, open the rival-builder lobby.
  const started = useRef(false);
  useEffect(() => {
    if (!hydrated || started.current) return;
    started.current = true;
    // Deliberate one-shot setState after hydration, mirroring TeamProvider.
     
    setPhase(team.length === 0 ? "no-team" : "prepare");
  }, [hydrated, team]);

  /** Classic opening sequence after «¡Al combate!». */
  const startBattle = useCallback(async () => {
    const state = battleRef.current;
    if (!state || !rival) return;
    setPhase("busy");
    // 1 · Presentación: los dos Entrenadores entran de fuera de cuadro, cada
    //     uno por su lado, con el campo todavía vacío.
    setStance({ player: "ready", rival: "ready" });
    pushMsg(t.battle.challenge(rivalName));
    await wait(1500);
    if (!aliveRef.current) return;
    // 2 · Lanzamiento: los dos sueltan su bola a la vez.
    setStance({ player: "throw", rival: "throw" });
    // Lo que dura el propio lanzamiento: se sale de escena con el gesto
    // terminado, no a medio soltar la bola. Con suelo, porque por debajo de un
    // tercio de segundo el gesto deja de leerse como un lanzamiento y parece
    // un tic.
    await sleep(Math.max(350, 620 / SPEED));
    if (!aliveRef.current) return;
    // 3 · Entrada: cada Pokémon sale de la luz de su bola y grita, por turnos,
    //     y los Entrenadores SE QUEDAN junto al suyo — como en los combates de
    //     los juegos, donde quien da las órdenes está en el campo.
    setStance({ player: "ready", rival: "ready" });
    pushMsg(t.battle.trainerSendsOut(rivalName, state.rival.team[0].label));
    await enter("rival");
    if (!aliveRef.current) return;
    await wait(620);
    if (!aliveRef.current) return;
    pushMsg(t.battle.engine.sendOut(state.player.team[0].label, "player"));
    await enter("player");
    if (!aliveRef.current) return;
    await wait(760);
    if (!aliveRef.current) return;
    setPhase("select");
  }, [rival, pushMsg, t, rivalName, enter]);

  /* ---------------------------------------------------------------- */
  /* Rival brain                                                      */
  /* ---------------------------------------------------------------- */

  const askRival = useCallback(
    async (state: BattleState): Promise<RivalTurnResponse> => {
      const rActive = state.rival.team[state.rival.active];
      const pActive = state.player.team[state.player.active];
      const benchIdx = state.rival.team
        .map((_, i) => i)
        .filter((i) => i !== state.rival.active && state.rival.team[i].hp > 0);

      // La JUGADA la decide el cerebro de casa, siempre.
      //
      // Antes la elegía el modelo, y cuando contestaba con un movimiento que
      // no existía —o tardaba, o fallaba la red— el combate caía en
      // `pickFallbackMove`, la heurística más simple que hay aquí: el rival
      // pasaba de listo a torpe sin avisar. Ahora el suelo es el techo, la
      // animación no espera a ninguna petición, y al modelo se le pide sólo
      // aquello en lo que es mejor que cualquier heurística: la frase.
      const action = pickAction(
        state,
        "rival",
        profileFor("ace"),
        memoryRef.current,
      );
      const reason = memoryRef.current.lastReason;

      try {
        const res = await fetch("/api/battle/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Quién habla. Va el nombre fijo y no el que devolviera el modelo
            // al montar la partida: el rival es siempre el mismo, y si el
            // reparto de personas falló y cayó en una frase de reserva, la
            // voz del combate no tiene por qué irse con ella.
            trainer: rivalName,
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
            // Al modelo se le dice lo que se va a jugar y por qué, y sólo se
            // le pide la frase. Reaccionar a una decisión que ya está tomada
            // da mucho mejor texto que adivinarla.
            decision: describeDecision(action, state, reason),
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as RivalTurnResponse;
          if (typeof data.dialogue === "string" && data.dialogue) {
            return { action, dialogue: data.dialogue };
          }
        }
      } catch {
        // Se cae la red y no pasa nada: la jugada ya está decidida, y lo único
        // que se pierde es la frase.
      }
      return { action, dialogue: t.battle.dialogueDefault };
    },
    [rivalName, t],
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
      wait(Math.min(2800, Math.max(900, text.length * 9 + 500)) + extra),
    [],
  );

  /**
   * Lo que tarda una línea en escribirse sola, sin el tiempo de lectura que
   * añade `msgWait`. Es lo que se espera antes de lanzar una animación: en los
   * juegos el nombre del movimiento acaba de aparecer y ENTONCES se ve el
   * ataque, nunca los dos a la vez.
   */
  const typeWait = useCallback(
    (text: string) => wait(Math.min(1200, text.length * 9 + 160)),
    [],
  );

  const replay = useCallback(
    async (events: BattleEvent[]) => {
      // Recorrido por índice para poder mirar el evento siguiente: es lo que
      // distingue el turno de carga de un movimiento de dos turnos del turno
      // en que por fin golpea.
      for (let i = 0; i < events.length; i++) {
        if (!aliveRef.current) return;
        const event = events[i];
        const next = events[i + 1];
        const state = battleRef.current;
        switch (event.kind) {
          case "switch": {
            // Relevo completo de los juegos: el que sale vuelve a su bola con
            // el rayo rojo y su línea, y solo entonces se lanza la siguiente.
            const leaving =
              state?.[event.side].team[shownRef.current[event.side]];
            if (leaving && leaving.hp > 0) {
              pushMsg(t.battle.recall(leaving.label, event.side));
              await leave(event.side);
              if (!aliveRef.current) return;
              await wait(220);
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
            // Compás de los juegos: primero se lee «¡X usó Y!» hasta el
            // final, y solo entonces arranca la animación. Escribir el
            // nombre del movimiento POR ENCIMA de su propia animación es lo
            // que hacía que esto no se sintiera como un combate.
            pushMsg(event.text);
            await typeWait(event.text);
            if (!aliveRef.current) return;
            // The attacker roars as it lunges, then the swing itself.
            const attacker = state
              ? state[event.side].team[state[event.side].active]
              : null;
            sfx.cry(attacker?.cry, 0.55);
            // Turno 1 de un movimiento de dos: el motor manda el «usó» y
            // acto seguido la carga. Ahí NO se anima el ataque — el Pokémon
            // solo se eleva o se hunde, y el golpe llega al turno siguiente.
            if (next?.kind === "charge" && next.side === event.side) {
              await wait(160);
              break;
            }
            const timing = stageRef.current?.attack(event.side, {
              slug: event.move.slug,
              type: event.move.type,
              damageClass: event.move.damageClass,
              release: event.release,
              selfTarget: event.move.effects?.target === "self",
            });
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
            // Se cede el turno EXACTAMENTE cuando el golpe conecta: el evento
            // de daño que viene detrás trae el respingo, la barra y el
            // estallido, y así los tres caen en el mismo fotograma.
            await sleep(timing?.impactAt ?? 340);
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
            const defender = state
              ? state[event.side].team[state[event.side].active]
              : null;
            const ratio = defender ? event.amount / defender.maxHp : 0.3;
            stageRef.current?.hit(event.side, {
              effectiveness: event.effectiveness,
              ratio,
              crit: event.crit,
            });
            // La cifra salta en el fotograma del impacto; la barra tarda medio
            // segundo en contar lo mismo. `seq` la vuelve a montar en cada
            // golpe para que dos seguidos no compartan nodo ni animación.
            const hitSeq = ++stingerSeq.current;
            setHit({
              seq: hitSeq,
              side: event.side,
              amount: event.amount,
              effectiveness: event.effectiveness,
              crit: event.crit,
            });
            later(1000, () =>
              setHit((current) => (current?.seq === hitSeq ? null : current)),
            );
            bumpCombo(
              event.side === "rival" && (event.crit || event.effectiveness > 1),
            );
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
            showStinger(event.effectiveness, event.crit);
            sync(); // HP bar drains to the new value.
            // Low-health alarm, on the same 20% threshold as the pulsing bar.
            updateAlarm();
            if (event.text) pushMsg(event.text);
            await (event.text ? msgWait(event.text) : wait(750));
            break;
          }
          case "miss":
            pushMsg(event.text);
            sfx.play("miss");
            // Fallar es lo que rompe una racha; que falle el rival, no.
            if (event.side === "player") bumpCombo(false);
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
            await wait(250);
            // El K.O. se anuncia a lo grande y en el compás del porrazo, antes
            // de que el Pokémon se hunda tras la plataforma.
            const koSeq = ++stingerSeq.current;
            setStinger({ seq: koSeq, kind: "ko", text: t.battle.koStinger });
            later(1200, () =>
              setStinger((current) => (current?.seq === koSeq ? null : current)),
            );
            sfx.play("ko");
            stageRef.current?.faint(event.side);
            sfx.alarm(false);
            later(220, () => sfx.play("faint"));
            // El Pokémon se queja al caer, como en los juegos, y solo después
            // se hunde tras la plataforma.
            const victim = state?.[event.side].team[shownRef.current[event.side]];
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
            // Quien pierde vuelve al campo a dar la cara, y se queda: el
            // combate ha terminado, así que ya no tapa nada.
            setStance((s) =>
              event.winner === "player"
                ? { ...s, rival: "ready" }
                : { ...s, player: "ready" },
            );
            await msgWait(event.text, 400);
            break;
        }
      }
    },
    [
      pushMsg,
      sync,
      msgWait,
      typeWait,
      sfx,
      later,
      updateAlarm,
      showStinger,
      bumpCombo,
      t,
      enter,
      leave,
    ],
  );

  /* ---------------------------------------------------------------- */
  /* One full turn                                                    */
  /* ---------------------------------------------------------------- */

  const runTurn = useCallback(
    async (playerAction: BattleAction) => {
      const state = battleRef.current;
      if (!state) return;
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

        // Lo que el jugador ENSEÑA es lo único que el rival puede haber visto.
        if (action.kind === "move") rememberMove(memoryRef.current, action.move);

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

        if (events.some((e) => e.kind === "end")) {
          setPhase("over");
          return;
        }

        // Forced replacements after faints.
        if (state.rival.team[state.rival.active].hp <= 0) {
          const next = pickRivalReplacement(state);
          if (next !== null) {
            state.rival.active = next;
            const b = state.rival.team[next];
            pushMsg(
              t.battle.trainerSendsOut(
                rival?.nombre ?? t.battle.fallbackRival,
                b.label,
              ),
            );
            // El relevo llega en su bola, igual que el titular.
            await enter("rival");
            if (!aliveRef.current) return;
            await wait(700);
          }
        }
        if (state.player.team[state.player.active].hp <= 0) {
          pushMsg(t.battle.whichSwitch);
          setPhase("forced");
          return;
        }

        const playerCharge = state.player.team[state.player.active].charging;
        if (!playerCharge) break;
        await wait(650);
        if (!aliveRef.current) return;
        action = { kind: "move", move: playerCharge.move };
      }

      setPhase("select");
    },
    [askRival, replay, pushMsg, rival, t, enter],
  );

  const forcedSwitch = useCallback(
    async (index: number) => {
      const state = battleRef.current;
      if (!state || state.player.team[index].hp <= 0) return;
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
  const pActive = state?.player.team[state.player.active] ?? null;
  const rActive = state?.rival.team[state.rival.active] ?? null;
  // Quien está en el campo ahora mismo: durante una retirada sigue siendo el
  // que se va, y por eso escena y fichas se leen de aquí y no del activo.
  const pShown = state?.player.team[shown.player] ?? null;
  const rShown = state?.rival.team[shown.rival] ?? null;
  const playerWon =
    !fled && state !== null && !state.rival.team.some((b) => b.hp > 0);

  if (phase === "no-team") {
    return (
      <CenterCard>
        <Swords size={40} className="mx-auto text-red-400" />
        <h1 className="font-display text-2xl font-bold text-slate-100">
          {t.battle.noTeamTitle}
        </h1>
        <p className="text-slate-300">{t.battle.noTeamBody}</p>
        <Link
          href="/"
          className="mx-auto rounded-md border border-cyan-400/60 bg-cyan-400/10 px-5 py-2.5 font-mono text-sm tracking-wider text-cyan-300 uppercase transition hover:bg-cyan-400/20"
        >
          {t.battle.noTeamCta}
        </Link>
      </CenterCard>
    );
  }

  if (phase === "prepare") {
    return (
      // El hueco inferior deja respirar el muelle de lanzamiento, que va fijo.
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-7xl flex-col gap-4 px-4 pt-5 pb-32">
        <div className="flex shrink-0 items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-black/50 px-3 py-1.5 font-mono text-xs tracking-wider text-slate-300 uppercase transition hover:border-cyan-400/60 hover:text-cyan-300"
          >
            {t.battle.backToDex}
          </Link>
        </div>
        <RivalBuilder
          onFight={(members) => void setup(members)}
          onRandom={() => void setup(null)}
        />
        <BagBuilder
          bag={bag}
          onChange={(next) => {
            setBag(next);
            try {
              localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(next));
            } catch {
              // Storage unavailable: the bag still works for this battle.
            }
          }}
        />
      </div>
    );
  }

  if (phase === "loading" || (!state && phase !== "error")) {
    return (
      <CenterCard>
        <span className="mx-auto block h-14 w-14 animate-spin rounded-full border-4 border-slate-700 border-t-red-500" />
        <p className="font-mono text-sm tracking-widest text-slate-300 uppercase">
          {t.battle.loadingTitle}
        </p>
        <p className="font-mono text-xs text-slate-500">
          {t.battle.loadingHint}
        </p>
        <BackToDexLink />
      </CenterCard>
    );
  }

  if (phase === "error") {
    return (
      <CenterCard>
        <p className="text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => void setup(lastRivalRef.current)}
          className="mx-auto rounded-md border border-red-500/60 bg-red-500/10 px-5 py-2.5 font-mono text-sm tracking-wider text-red-300 uppercase transition hover:bg-red-500/20"
        >
          {t.battle.retry}
        </button>
        <button
          type="button"
          onClick={() => setPhase("prepare")}
          className="mx-auto font-mono text-xs tracking-wider text-slate-400 uppercase transition hover:text-red-300"
        >
          {t.battle.changeRival}
        </button>
        <BackToDexLink />
      </CenterCard>
    );
  }

  const boxText =
    (phase === "select" || phase === "moves" || phase === "bag") && pActive
      ? phase === "bag"
        ? t.battle.whichItem
        : t.battle.whatWillDo(pActive.label)
      : message;

  return (
    // Sin max-width: la arena toma el mayor rectángulo que quepa bajo la
    // cabecera (el alto la limita en monitores anchos vía max-h).
    <div
      className="relative mx-auto flex h-[calc(100dvh-5rem)] min-h-[32rem] w-full flex-col overflow-hidden sm:px-3 sm:py-1.5"
      // Las mismas tres alturas del HUD que usa el torneo, en un solo sitio:
      // la caja de texto, la ficha que se apoya justo encima y la fila desde
      // la que crecen los menús. El Modo Combate se había quedado con un
      // carril de 16rem, y en él las cápsulas de «Mochila» y «Huir» salían con
      // el rótulo cortado; son las mismas teclas, así que van al mismo ancho.
      style={
        {
          // Franja que ocupa la caja de texto abajo del todo.
          "--hud-msg": "5.4rem",
          // Alto reservado para los mandos, medido sobre el menú MÁS ALTO —los
          // cuatro ataques más «Volver»—, no sobre el que esté abierto: así tu
          // ficha no salta media pantalla cada vez que se pulsa «Lucha».
          "--hud-slot": "12.5rem",
        } as CSSProperties
      }
    >
      {/* The arena is a canvas of absolutely positioned pieces with no visible
          title, so the page would otherwise reach a screen reader with no
          top-level heading at all. */}
      <h1 className="sr-only">{t.a11y.battleTitle}</h1>
      {/* Game frame: panoramic 16:9 "console screen" on desktop, and on the
          phone a portrait console — pantalla 16:9 arriba y mandos debajo, que
          es como se juega a esto en vertical. */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="relative flex h-full w-full flex-col overflow-hidden border border-slate-800 bg-black shadow-[0_0_40px_rgba(0,0,0,0.8)] max-sm:h-auto max-sm:max-h-full max-sm:rounded-xl sm:aspect-video sm:h-full sm:w-auto sm:max-h-full sm:max-w-full sm:rounded-2xl sm:border-2 sm:border-slate-700/70">
        {/* Escenario. En el teléfono es una pantalla 16:9 fija en la parte
            alta: así la escena conserva su encuadre (rival arriba a la derecha,
            tu Pokémon abajo a la izquierda) en vez de estirarse por una columna
            vertical y dejar medio cielo vacío. */}
        <div className="relative w-full max-sm:aspect-[4/3] max-sm:shrink-0 sm:min-h-0 sm:flex-1">
          <BattleStage2D
            ref={stageRef}
            scenario="simulacion"
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
            trainers={trainers}
          />

          {/* Enemy databox, top-left like in the games. Va con su Pokémon: se
              marcha cuando la bola se lo lleva y vuelve con el siguiente,
              nunca con el hueco vacío. */}
          {onField.rival && rShown && state && (
            <div className="absolute top-3 left-3 max-sm:top-2 max-sm:left-2">
              <Databox battler={rShown} side="enemy" team={state.rival.team} />
            </div>
          )}

          {/* Tu ficha, ABAJO A LA DERECHA sobre el campo — su sitio en los
              juegos, enfrentada en diagonal a la del rival. En el teléfono se
              dibuja aquí, dentro de la pantalla; de `sm` en adelante la de la
              columna de mandos (que va con el menú) ocupa su lugar, y esta se
              retira para no duplicarla. */}
          {onField.player && pShown && state && (
            <div className="absolute right-2 bottom-2 sm:hidden">
              <Databox battler={pShown} side="player" team={state.player.team} />
            </div>
          )}

          {/* In-world chrome: leave the arena and the sound control, docked
              in the frame's corner instead of sitting above it as web links.
              The exit carries its label at every size — an unlabelled icon read
              as "no way out" mid-battle — shortened on narrow screens, where
              the enemy databox leaves no room for the whole sentence. */}
          <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5">
            <SfxControl />
            <Link
              href="/"
              aria-label={t.battle.backToDex}
              title={t.battle.backToDex}
              className="flex h-8 items-center gap-1.5 rounded-full border border-white/20 bg-[#0b1220]/70 px-2 text-slate-300 backdrop-blur-md transition hover:border-red-400/70 hover:text-red-300 hover:shadow-[0_0_16px_-4px_#f87171] sm:px-3"
            >
              <LogOut size={14} className="shrink-0" />
              <span className="font-mono text-[10px] tracking-wider whitespace-nowrap uppercase sm:hidden">
                {t.battle.backToDexShort}
              </span>
              <span className="hidden font-mono text-[11px] tracking-wider whitespace-nowrap uppercase sm:inline">
                {t.battle.backToDexPlain}
              </span>
            </Link>
          </div>

          {stinger && (
              <Stinger key={stinger.seq} kind={stinger.kind} text={stinger.text} />
            )}

          {/* Cifra de daño saltando del que la ha recibido. */}
          {hit && (
            <DamageNumber
              key={hit.seq}
              amount={hit.amount}
              side={hit.side}
              effectiveness={hit.effectiveness}
              crit={hit.crit}
            />
          )}

          {/* Racha de golpes encadenados, sobre el centro del campo. */}
          {phase !== "intro" && phase !== "over" && <ComboMeter count={combo} />}

            {/* Rival trainer speech bubble. */}
          {dialogue && rival && phase !== "intro" && phase !== "over" && (
            <div className="absolute top-12 right-3 max-w-[50%]">
              <DialogueBubble avatar={avatar} name={rivalName} text={dialogue} pixel />
            </div>
          )}

        </div>

        {/* Consola. En el teléfono es una franja real bajo la pantalla —
            ficha, texto y mandos, en ese orden, sin taparse entre sí ni
            taparle el campo al combate. De `sm` en adelante el envoltorio
            desaparece (`contents`) y sus piezas vuelven a flotar sobre el
            escenario, que es la vista de sobremesa de siempre. */}
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto border-t border-white/10 bg-gradient-to-b from-[#0d1626] to-black p-1.5 sm:contents">
          {/* Right rail: player databox above the contextual command column,
              bottom-right like the SwSh command menu. */}
          <div className="max-sm:contents sm:absolute sm:right-4 sm:bottom-[var(--hud-msg)] sm:flex sm:w-[27rem] sm:flex-col sm:items-end sm:gap-2">
            {onField.player && pShown && state && (
              // Tu ficha va CLAVADA justo encima de la caja de texto, como en
              // los juegos, y no apilada sobre el menú: colgando del menú
              // saltaba media pantalla cada vez que se abría «Lucha», porque
              // cuatro ataques miden el triple que los cuatro comandos.
              <div className="max-sm:hidden">
                <Databox battler={pShown} side="player" team={state.player.team} />
              </div>
            )}
            {/* Hueco de mandos de alto FIJO, con el menú pegado abajo: lo
                único que cambia al cambiar de menú es el menú. */}
            <div className="w-full max-sm:order-3 sm:flex sm:h-[var(--hud-slot)] sm:flex-col sm:justify-end">
            {phase === "select" && state && (
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
            {phase === "bag" && state && pActive && (
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
          </div>

          {/* Message bar: bajo la pantalla en el teléfono, sobre ella en el
              escritorio — el mismo sitio de siempre en cada formato.
              De borde a borde, como la ventana de diálogo de una consola: no
              es un panel flotando sobre el campo, es el marco inferior de la
              pantalla. */}
          <div className="max-sm:order-2 max-sm:mt-auto sm:absolute sm:inset-x-0 sm:bottom-0">
            <MessageBox text={boxText} speed={SPEED} />
          </div>
        </div>

          {/* Party screen: full overlay over the whole frame. It doubles as
              the target picker for Revive, where only the fainted count. */}
          {(phase === "switch" || phase === "forced" || phase === "revive") &&
            state && (
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
      {phase === "intro" && rival && state && (
        <Overlay label={t.a11y.introDialogAria}>
          <p className="font-pixel text-[10px] tracking-[0.3em] text-red-400 uppercase">
            {t.battle.introChallenge}
          </p>
          <div className="flex items-center gap-4">
            <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-red-500/70 bg-hud-1 shadow-[0_0_28px_rgba(239,68,68,0.6)]">
              {/* Su sprite oficial, acercado a la cara y sin suavizar: es
                  pixel art de 80×80, y el retrato es el mismo que después se
                  planta en el campo. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar}
                alt={t.a11y.rivalPortraitOf(rivalName)}
                className="h-full w-full origin-top scale-[2.1] object-contain object-top"
                style={{ imageRendering: "pixelated" }}
              />
            </span>
            <div className="text-left">
              <h2 className="font-display text-xl font-bold text-slate-100">
                {rivalName}
              </h2>
              <p className="mt-1 text-sm text-red-200/90 italic">
                {t.battle.motto(rival.lema)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            {rival.team.map((b) => (
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
            {t.battle.fight}
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
                setFled(true);
                pushMsg(t.battle.fledMsg);
                // Running away ends the fight: no alarm, no fanfare.
                sfx.alarm(false);
                sfx.play("cancel");
                setPhase("over");
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

      {/* End of battle. */}
      {phase === "over" && (
        <Overlay label={t.a11y.resultDialogAria}>
          <h2
            className={cn(
              "font-display text-3xl font-bold tracking-widest",
              playerWon ? "premium-text" : "neon-red",
            )}
          >
            {fled
              ? t.battle.overFled
              : playerWon
                ? t.battle.victory
                : t.battle.defeat}
          </h2>
          {!fled && (
            <p className="text-slate-200">
              {playerWon
                ? t.battle.victoryBody(rival?.nombre ?? t.battle.yourRivalLower)
                : t.battle.defeatBody(rival?.nombre ?? t.battle.yourRivalUpper)}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void setup(lastRivalRef.current)}
              className="rounded-md border border-red-500/70 bg-red-500/15 px-6 py-2.5 font-mono text-sm tracking-wider text-red-300 uppercase transition hover:bg-red-500/30"
            >
              {t.battle.rematch}
            </button>
            <button
              type="button"
              onClick={() => setPhase("prepare")}
              className="rounded-md border border-slate-600 px-6 py-2.5 font-mono text-sm tracking-wider text-slate-300 uppercase transition hover:bg-slate-500/10"
            >
              {t.battle.changeRival}
            </button>
            <Link
              href="/"
              className="rounded-md border border-cyan-400/60 bg-cyan-400/10 px-6 py-2.5 font-mono text-sm tracking-wider text-cyan-300 uppercase transition hover:bg-cyan-400/20"
            >
              {t.battle.backToDexPlain}
            </Link>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function BackToDexLink() {
  const t = useT();
  return (
    <Link
      href="/"
      className="mx-auto font-mono text-xs tracking-wider text-slate-500 uppercase transition hover:text-cyan-300"
    >
      {t.battle.backToDex}
    </Link>
  );
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100dvh-5rem)] items-center justify-center px-4">
      <div className="flex max-w-md flex-col gap-4 rounded-2xl border border-slate-700/70 bg-hud-3/90 px-8 py-10 text-center shadow-[0_0_48px_rgba(0,0,0,0.8)]">
        {children}
      </div>
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
function Overlay({
  label,
  onEscape,
  children,
}: {
  /** Accessible name of the dialog. */
  label: string;
  /** Escape handler; omitted for the overlays that require a decision. */
  onEscape?: () => void;
  children: React.ReactNode;
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
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="fx-bubble-pop flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-slate-700/70 bg-hud-3/95 px-8 py-8 text-center shadow-[0_0_64px_rgba(0,0,0,0.9)]"
      >
        {children}
      </div>
    </div>
  );
}
