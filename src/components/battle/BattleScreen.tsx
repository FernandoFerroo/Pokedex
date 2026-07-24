"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Swords } from "lucide-react";
import {
  BAG_POTIONS,
  pickFallbackMove,
  pickRivalReplacement,
  resolveTurn,
} from "@/lib/battle/engine";
import { artworkUrl, typeAura } from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";
import { useTeam } from "@/components/team/TeamProvider";
import type { TeamMember } from "@/types/team";
import { RivalBuilder } from "./RivalBuilder";
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
  scenarioForTypes,
  type ScenarioKey,
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

type Phase =
  | "loading"
  | "no-team"
  | "prepare"
  | "error"
  | "intro"
  | "select"
  | "moves"
  | "bag"
  | "switch"
  | "busy"
  | "forced"
  | "over";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const spriteView = (b: Battler, side: Side): SpriteView => ({
  key: `${side}-${b.id}`,
  url: side === "player" ? b.sprites.back : b.sprites.front,
  aura: typeAura(b.types[0]),
});

/**
 * Modo Combate en 2D clásico: escenario temático, sprites animados de frente
 * y de espaldas, caja de mensajes con texto progresivo y los menús de los
 * juegos. El rival sigue pensando cada turno vía /api/battle/turn y el motor
 * local resuelve daños.
 */
export function BattleScreen() {
  const { team, hydrated } = useTeam();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [rival, setRival] = useState<RivalProfile | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<string | null>(null);
  /** Current battle-box text (one message at a time, like the games). */
  const [message, setMessage] = useState("");
  const [scenario, setScenario] = useState<ScenarioKey>("pradera");
  const [confirmFlee, setConfirmFlee] = useState(false);
  const [fled, setFled] = useState(false);

  // The engine mutates battleRef in place inside callbacks; `battle` is the
  // render mirror, refreshed via sync() after every mutation.
  const battleRef = useRef<BattleState | null>(null);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const stageRef = useRef<StageHandle>(null);
  const aliveRef = useRef(true);
  /** Recent battle lines, fed to the rival AI as context. */
  const historyRef = useRef<string[]>([]);
  /** Last rival choice (null = aleatorio), so «Revancha» repeats it. */
  const lastRivalRef = useRef<TeamMember[] | null>(null);

  const sync = useCallback(() => {
    setBattle(battleRef.current ? { ...battleRef.current } : null);
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

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
        setError(data?.error ?? "No se pudo preparar el combate.");
        setPhase("error");
        return;
      }
      battleRef.current = {
        player: { team: data.player, active: 0, potions: BAG_POTIONS },
        rival: { team: data.rival.team, active: 0, potions: BAG_POTIONS },
        turn: 0,
      };
      sync();
      setRival(data.rival);
      setScenario(scenarioForTypes(data.rival.team[0].types));
      setPhase("intro");

      // Non-blocking flourish: portrait of the rival via image generation.
      fetch("/api/battle/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: data.rival.nombre,
          estilo: data.rival.estilo,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (aliveRef.current && typeof d?.image === "string") {
            setAvatar(d.image);
          }
        })
        .catch(() => {});
    } catch {
      if (aliveRef.current) {
        setError("Sin conexión con el servidor de combate.");
        setPhase("error");
      }
    }
    },
    [team, sync],
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
    pushMsg(`¡${rival.nombre} te desafía!`);
    await sleep(1300);
    if (!aliveRef.current) return;
    pushMsg(`¡${rival.nombre} envía a ${state.rival.team[0].label}!`);
    await sleep(1100);
    if (!aliveRef.current) return;
    pushMsg(`¡Adelante, ${state.player.team[0].label}!`);
    await sleep(1000);
    if (!aliveRef.current) return;
    setPhase("select");
  }, [rival, pushMsg]);

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
      try {
        const res = await fetch("/api/battle/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trainer: rival?.nombre,
            rivalActive: {
              name: rActive.name,
              label: rActive.label,
              hpPct: (rActive.hp / rActive.maxHp) * 100,
              types: rActive.types,
              moves: rActive.moves.map((m) => ({
                slug: m.slug,
                label: m.label,
                type: m.type,
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
                typeof data.dialogue === "string" ? data.dialogue : "¡Vamos!",
            };
          }
        }
      } catch {
        // Network hiccup: the heuristic below keeps the battle moving.
      }
      return {
        action: pickFallbackMove(state),
        dialogue: "¡No pienso ponértelo fácil!",
      };
    },
    [rival],
  );

  /* ---------------------------------------------------------------- */
  /* Event replay                                                     */
  /* ---------------------------------------------------------------- */

  const replay = useCallback(
    async (events: BattleEvent[]) => {
      for (const event of events) {
        if (!aliveRef.current) return;
        switch (event.kind) {
          case "switch":
          case "heal":
            pushMsg(event.text);
            sync();
            await sleep(1000);
            break;
          case "use-move": {
            pushMsg(event.text);
            stageRef.current?.attack(event.side, {
              type: event.move.type,
              damageClass: event.move.damageClass,
            });
            await sleep(1000);
            break;
          }
          case "damage": {
            stageRef.current?.hit(event.side, event.effectiveness);
            sync(); // HP bar drains to the new value.
            if (event.text) pushMsg(event.text);
            await sleep(event.text ? 1000 : 750);
            break;
          }
          case "miss":
            pushMsg(event.text);
            await sleep(900);
            break;
          case "faint":
            await sleep(250);
            stageRef.current?.faint(event.side);
            pushMsg(event.text);
            await sleep(1100);
            break;
          case "end":
            pushMsg(event.text);
            await sleep(1300);
            break;
        }
      }
    },
    [pushMsg, sync],
  );

  /* ---------------------------------------------------------------- */
  /* One full turn                                                    */
  /* ---------------------------------------------------------------- */

  const runTurn = useCallback(
    async (playerAction: BattleAction) => {
      const state = battleRef.current;
      if (!state) return;
      setPhase("busy");

      const decision = await askRival(state);
      if (!aliveRef.current) return;
      setDialogue(decision.dialogue);

      const events = resolveTurn(state, playerAction, decision.action);
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
          pushMsg(`¡${rival?.nombre ?? "El rival"} envía a ${b.label}!`);
          sync();
          await sleep(1000);
        }
      }
      if (state.player.team[state.player.active].hp <= 0) {
        pushMsg("¿A qué Pokémon envías ahora?");
        setPhase("forced");
        return;
      }
      setPhase("select");
    },
    [askRival, replay, pushMsg, rival, sync],
  );

  const forcedSwitch = useCallback(
    async (index: number) => {
      const state = battleRef.current;
      if (!state || state.player.team[index].hp <= 0) return;
      state.player.active = index;
      pushMsg(`¡Adelante, ${state.player.team[index].label}!`);
      sync();
      setPhase("select");
    },
    [pushMsg, sync],
  );

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */

  const state = battle;
  const pActive = state?.player.team[state.player.active] ?? null;
  const rActive = state?.rival.team[state.rival.active] ?? null;
  const playerWon =
    !fled && state !== null && !state.rival.team.some((b) => b.hp > 0);

  if (phase === "no-team") {
    return (
      <CenterCard>
        <Swords size={40} className="mx-auto text-red-400" />
        <h1 className="font-display text-2xl font-bold text-slate-100">
          MODO COMBATE
        </h1>
        <p className="text-slate-300">
          Necesitas al menos un Pokémon en tu equipo para entrar en la arena.
        </p>
        <Link
          href="/"
          className="mx-auto rounded-md border border-cyan-400/60 bg-cyan-400/10 px-5 py-2.5 font-mono text-sm tracking-wider text-cyan-300 uppercase transition hover:bg-cyan-400/20"
        >
          Montar mi equipo
        </Link>
      </CenterCard>
    );
  }

  if (phase === "prepare") {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-7xl flex-col gap-4 px-4 py-5">
        <div className="flex shrink-0 items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-black/50 px-3 py-1.5 font-mono text-xs tracking-wider text-slate-300 uppercase transition hover:border-cyan-400/60 hover:text-cyan-300"
          >
            ← Volver a la Pokédex
          </Link>
        </div>
        <RivalBuilder
          onFight={(members) => void setup(members)}
          onRandom={() => void setup(null)}
        />
      </div>
    );
  }

  if (phase === "loading" || (!state && phase !== "error")) {
    return (
      <CenterCard>
        <span className="mx-auto block h-14 w-14 animate-spin rounded-full border-4 border-slate-700 border-t-red-500" />
        <p className="font-mono text-sm tracking-widest text-slate-300 uppercase">
          Generando rival y preparando la arena…
        </p>
        <p className="font-mono text-xs text-slate-500">
          La IA está montando un equipo a tu altura.
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
          Reintentar
        </button>
        <button
          type="button"
          onClick={() => setPhase("prepare")}
          className="mx-auto font-mono text-xs tracking-wider text-slate-400 uppercase transition hover:text-red-300"
        >
          Cambiar rival
        </button>
        <BackToDexLink />
      </CenterCard>
    );
  }

  const boxText =
    (phase === "select" || phase === "moves" || phase === "bag") && pActive
      ? phase === "bag"
        ? "¿Qué objeto usarás?"
        : `¿Qué hará ${pActive.label}?`
      : message;

  return (
    <div className="relative mx-auto flex h-[calc(100dvh-5rem)] min-h-[32rem] w-full max-w-5xl flex-col overflow-hidden sm:px-4 sm:py-3">
      {/* Escape hatch back to the dex, always visible during the battle. */}
      <div className="flex shrink-0 items-center px-2 pb-2 sm:px-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-black/50 px-3 py-1.5 font-mono text-xs tracking-wider text-slate-300 uppercase transition hover:border-cyan-400/60 hover:text-cyan-300"
        >
          ← Volver a la Pokédex
        </Link>
      </div>

      {/* Game frame: full-bleed stage with the HUD floating over it, like the
          single-screen Switch games. */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden border border-slate-800 bg-black shadow-[0_0_40px_rgba(0,0,0,0.8)] sm:rounded-2xl">
        {/* Stage */}
        <div className="relative min-h-0 flex-1">
          <BattleStage2D
            ref={stageRef}
            scenario={scenario}
            player={pActive ? spriteView(pActive, "player") : null}
            enemy={rActive ? spriteView(rActive, "rival") : null}
          />

          {/* Enemy databox, top-left like in the games. */}
          {rActive && state && (
            <div className="absolute top-3 left-3">
              <Databox battler={rActive} side="enemy" team={state.rival.team} />
            </div>
          )}

          {/* Rival trainer speech bubble. */}
          {dialogue && rival && phase !== "intro" && phase !== "over" && (
            <div className="absolute top-3 right-3 max-w-[55%]">
              <DialogueBubble avatar={avatar} name={rival.nombre} text={dialogue} />
            </div>
          )}

          {/* Right rail: player databox above the contextual command column,
              bottom-right like the SwSh command menu. */}
          <div className="absolute right-2 bottom-[5.25rem] flex w-60 max-w-[62vw] flex-col items-end gap-2 sm:right-4 sm:w-64">
            {pActive && state && (
              <Databox battler={pActive} side="player" team={state.player.team} />
            )}
            {phase === "select" && state && (
              <div className="w-full">
                <ActionMenu
                  potions={state.player.potions}
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
            {phase === "bag" && state && (
              <div className="w-full">
                <BagMenu
                  potions={state.player.potions}
                  onBack={() => setPhase("select")}
                  onPotion={() => void runTurn({ kind: "potion" })}
                />
              </div>
            )}
          </div>

          {/* Message bar along the bottom, like the Switch text window. */}
          <div className="absolute inset-x-2 bottom-2 sm:inset-x-3 sm:bottom-3">
            <MessageBox text={boxText} />
          </div>
        </div>

        {/* Party screen: full overlay over the whole frame. */}
        {(phase === "switch" || phase === "forced") && state && (
          <SwitchMenu
            team={state.player.team}
            active={state.player.active}
            forced={phase === "forced"}
            onBack={() => setPhase("select")}
            onPick={(i) =>
              phase === "forced"
                ? void forcedSwitch(i)
                : void runTurn({ kind: "switch", to: i })
            }
          />
        )}
      </div>

      {/* Intro overlay: the rival presents itself. */}
      {phase === "intro" && rival && state && (
        <Overlay>
          <p className="font-pixel text-[10px] tracking-[0.3em] text-red-400 uppercase">
            ¡Un entrenador quiere luchar!
          </p>
          <div className="flex items-center gap-4">
            <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-red-500/70 bg-[#0a101d] shadow-[0_0_28px_rgba(239,68,68,0.6)]">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-3xl font-bold text-red-400">
                  {rival.nombre.charAt(0)}
                </span>
              )}
            </span>
            <div className="text-left">
              <h1 className="font-display text-xl font-bold text-slate-100">
                {rival.nombre}
              </h1>
              <p className="mt-1 text-sm text-red-200/90 italic">
                «{rival.lema}»
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
            ¡Al combate!
          </button>
        </Overlay>
      )}

      {/* Flee confirmation. */}
      {confirmFlee && (
        <Overlay>
          <p className="text-slate-100">¿Seguro que quieres huir del combate?</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setConfirmFlee(false);
                setFled(true);
                pushMsg("Has huido del combate…");
                setPhase("over");
              }}
              className="rounded-md border border-red-500/60 bg-red-500/10 px-5 py-2 font-mono text-sm text-red-300 uppercase hover:bg-red-500/20"
            >
              Huir
            </button>
            <button
              type="button"
              onClick={() => setConfirmFlee(false)}
              className="rounded-md border border-slate-600 px-5 py-2 font-mono text-sm text-slate-300 uppercase hover:bg-slate-500/10"
            >
              Seguir luchando
            </button>
          </div>
        </Overlay>
      )}

      {/* End of battle. */}
      {phase === "over" && (
        <Overlay>
          <h1
            className={cn(
              "font-display text-3xl font-bold tracking-widest",
              playerWon ? "premium-text" : "neon-red",
            )}
          >
            {fled ? "COMBATE ABANDONADO" : playerWon ? "¡VICTORIA!" : "DERROTA"}
          </h1>
          {!fled && (
            <p className="text-slate-200">
              {playerWon
                ? `Has derrotado a ${rival?.nombre ?? "tu rival"}. ¡Tu equipo puede con todo!`
                : `${rival?.nombre ?? "Tu rival"} se lleva el combate. ¡Entrena y vuelve a por la revancha!`}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void setup(lastRivalRef.current)}
              className="rounded-md border border-red-500/70 bg-red-500/15 px-6 py-2.5 font-mono text-sm tracking-wider text-red-300 uppercase transition hover:bg-red-500/30"
            >
              Revancha
            </button>
            <button
              type="button"
              onClick={() => setPhase("prepare")}
              className="rounded-md border border-slate-600 px-6 py-2.5 font-mono text-sm tracking-wider text-slate-300 uppercase transition hover:bg-slate-500/10"
            >
              Cambiar rival
            </button>
            <Link
              href="/"
              className="rounded-md border border-cyan-400/60 bg-cyan-400/10 px-6 py-2.5 font-mono text-sm tracking-wider text-cyan-300 uppercase transition hover:bg-cyan-400/20"
            >
              Volver a la Pokédex
            </Link>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function BackToDexLink() {
  return (
    <Link
      href="/"
      className="mx-auto font-mono text-xs tracking-wider text-slate-500 uppercase transition hover:text-cyan-300"
    >
      ← Volver a la Pokédex
    </Link>
  );
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100dvh-5rem)] items-center justify-center px-4">
      <div className="flex max-w-md flex-col gap-4 rounded-2xl border border-slate-700/70 bg-[#050810]/90 px-8 py-10 text-center shadow-[0_0_48px_rgba(0,0,0,0.8)]">
        {children}
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="fx-bubble-pop flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-slate-700/70 bg-[#050810]/95 px-8 py-8 text-center shadow-[0_0_64px_rgba(0,0,0,0.9)]">
        {children}
      </div>
    </div>
  );
}
