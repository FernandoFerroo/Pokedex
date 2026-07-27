"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HeartPulse,
  Hourglass,
  Rocket,
  Skull,
  Sparkles,
  Star,
  Swords,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import { BagBuilder } from "@/components/battle/BagBuilder";
import { BattleArena, type ArenaResult } from "@/components/battle/BattleArena";
import { loadBag, saveBag } from "@/lib/battle/bag-storage";
import { useSfx } from "@/components/audio/SfxProvider";
import { useTeam } from "@/components/team/TeamProvider";
import { useTcg } from "@/components/tcg/TcgProvider";
import {
  rewardForRun,
  titlePeFor,
  type RunOutcome,
  type RunReward,
} from "@/lib/tcg/rewards";
import {
  bagForTier,
  CUP_EDGE,
  ladderArt,
  ladderTrainer,
  rosterSizeFor,
  speedFor,
} from "@/lib/tournament/config";
import { formatClock, roundScore } from "@/lib/tournament/score";
import {
  arcadeMark,
  clearRun,
  healTeam,
  loadRecord,
  loadRun,
  saveRecord,
  saveRun,
  withArcadeMark,
  type StoredRun,
} from "@/lib/tournament/run";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { Bag } from "@/lib/battle/items";
import type { Battler } from "@/types/battle";
import type { TeamMember } from "@/types/team";
import type {
  ArcadePace,
  TournamentBracketResponse,
  TournamentFormat,
  TournamentPace,
  TournamentRecord,
  TournamentRoundResponse,
  TournamentTrainer,
} from "@/types/tournament";
import {
  ARCADE_PACES,
  CUPS,
  DEFAULT_PACE,
  isArcadePace,
} from "@/types/tournament";
import { Bracket, TrainerCard, useRoundLabel } from "./Bracket";
import { ChampionScreen } from "./ChampionScreen";
import { CupCard } from "./CupCard";
import { Gauntlet } from "./Gauntlet";
import { RunClock } from "./RunClock";
import type { CSSProperties } from "react";

/** The two healing rules, as arcade cards: the nurse or the war of attrition. */
const RULE_CARDS = [
  { on: true, edge: "#34d399", Icon: HeartPulse },
  { on: false, edge: "#fb7185", Icon: Skull },
] as const;

/**
 * Los tres ritmos, con la misma forma de mando de recreativa que las reglas de
 * curación: no es una casilla que se marca, es una de tres puertas.
 *
 * Van en orden de duración y el color sube con ella — cian, naranja, gris —,
 * que es lo que deja leer la fila de un vistazo: el Turbo está literalmente en
 * medio de los otros dos, que es exactamente lo que es.
 */
const PACE_CARDS = [
  { pace: "blitz", edge: "#38bdf8", Icon: Zap },
  { pace: "turbo", edge: "#fb923c", Icon: Rocket },
  { pace: "classic", edge: "#94a3b8", Icon: Hourglass },
] as const satisfies ReadonlyArray<{
  pace: TournamentPace;
  edge: string;
  Icon: typeof Zap;
}>;

/** El color de un ritmo, para la marca del vestíbulo y el reloj del HUD. */
const PACE_EDGE = Object.fromEntries(
  PACE_CARDS.map(({ pace, edge }) => [pace, edge]),
) as Record<TournamentPace, string>;

type Phase =
  | "loading"
  | "no-team"
  | "lobby"
  | "drawing"
  | "error"
  | "bracket"
  | "battle"
  | "rest"
  | "champion"
  | "eliminated";

/**
 * Modo Torneo: la escalada por rondas. El vestíbulo elige formato y reglas,
 * el cuadro revela al siguiente rival y cada ronda se juega en la misma
 * <BattleArena> que el Modo Combate, con el cerebro rival escalado por tier.
 */
export function TournamentScreen() {
  const t = useT();
  const tt = t.tournament;
  const sfx = useSfx();
  const roundLabel = useRoundLabel();
  const { team, hydrated } = useTeam();

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<TournamentFormat>(4);
  const [pace, setPace] = useState<TournamentPace>(DEFAULT_PACE);
  const [heal, setHeal] = useState(true);
  const [bag, setBag] = useState<Bag>(loadBag);
  const [record, setRecord] = useState<TournamentRecord>({
    titles: 0,
    bestStreak: 0,
  });
  const [saved, setSaved] = useState<StoredRun | null>(null);

  /** The ladder and where the player stands on it. */
  const [trainers, setTrainers] = useState<TournamentTrainer[]>([]);
  const [round, setRound] = useState(1);
  const [wins, setWins] = useState(0);
  const [playerTeam, setPlayerTeam] = useState<Battler[] | null>(null);
  const [rivalTeam, setRivalTeam] = useState<Battler[] | null>(null);
  const [inspected, setInspected] = useState(1);
  /** Result of the round just fought, shown in the rest phase. */
  const [lastResult, setLastResult] = useState<ArenaResult | null>(null);
  const [healed, setHealed] = useState(false);

  /**
   * El reloj y el marcador de las partidas con reloj — Relámpago y Turbo.
   *
   * `anchor` es el instante de salida, no los milisegundos transcurridos: así
   * el minutero puede correr dentro de <RunClock> sin que esta pantalla — que
   * tiene el combate colgando debajo — se vuelva a pintar cada segundo. Se
   * pone en marcha al entrar al PRIMER combate y no al sortear el cuadro,
   * porque el sorteo incluye la llamada al modelo y cronometrar la latencia
   * del servidor no mide a nadie.
   */
  const [anchor, setAnchor] = useState<number | null>(null);
  /** Duración final, congelada en cuanto la partida tiene veredicto. */
  const [runMs, setRunMs] = useState(0);
  const [score, setScore] = useState(0);
  /** Puntos de la última ronda, los que enseña el descanso. */
  const [lastScore, setLastScore] = useState(0);

  /**
   * Los ritmos con reloj —Relámpago y Turbo— comparten TODO lo que los hace de
   * recreativa: cronómetro, marcador, enfermería automática, cero pantallas
   * entre combates y ningún «guardar y salir». Lo único que los separa es el
   * tamaño del plantel, así que este booleano —y no el nombre del ritmo— es lo
   * que decide en el resto de la pantalla.
   */
  const arcade = isArcadePace(pace);
  const rosterSize = rosterSizeFor(pace);
  /**
   * Una partida con reloj juega siempre con enfermería. No es una regla que se
   * esconde: es que el Modo Desafío — arrastrar el desgaste ronda tras ronda —
   * es exactamente la mecánica de una partida larga, y aquí no hay partida
   * larga que aguantar.
   */
  const healing = arcade || heal;

  /**
   * El equipo con el que se entra de verdad. En Relámpago son los tres
   * primeros: el recorte se hace aquí, en el cliente, porque el equipo viene
   * del banco compartido con el Modo Combate y el servidor no puede
   * reproducirlo al reanudar una partida. En Turbo y Clásico el corte es de
   * seis, que es justo el tope del banco: no recorta a nadie.
   */
  const entered = useMemo(
    () => team.slice(0, rosterSize),
    [rosterSize, team],
  );

  /**
   * Botín de la carrera. `flawlessRef` se apaga en cuanto cae un Pokémon en
   * cualquier ronda, y `rewardedRef` garantiza que se cobra una sola vez.
   */
  const { applyRunReward } = useTcg();
  const flawlessRef = useRef(true);
  const rewardedRef = useRef(false);
  const [reward, setReward] = useState<RunReward | null>(null);

  /**
   * La ronda siguiente, pedida MIENTRAS se pelea la actual.
   *
   * Vive en un ref y no en estado a propósito: un `setState` a media pelea
   * volvería a pintar la arena y le reiniciaría las animaciones. Aquí el
   * resultado se deja caer en un campo del ref y React no se entera de nada
   * hasta que alguien lo consume.
   */
  const prefetchRef = useRef<{
    round: number;
    data: TournamentRoundResponse | null;
    promise: Promise<TournamentRoundResponse | null>;
  } | null>(null);

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Hydration: the persisted team decides whether there is anything to enter
  // with, and a saved run offers to be resumed.
  const started = useRef(false);
  useEffect(() => {
    if (!hydrated || started.current) return;
    started.current = true;
    setRecord(loadRecord());
    setSaved(loadRun());
    setPhase(team.length === 0 ? "no-team" : "lobby");
  }, [hydrated, team]);

  const trainer = trainers[round - 1] ?? null;
  const total = trainers.length || format;

  /**
   * Sprite del Entrenador de la ronda: el mismo para el cuadro del torneo, el
   * bocadillo de diálogo y la figura que se planta en el campo.
   *
   * Es el oficial del juego — son Líderes de Gimnasio, no personajes de una
   * partida —, así que está en el primer fotograma. Antes se pedía a un
   * generador de imágenes en cada ronda: costaba dinero, tardaba casi un
   * minuto en llegar y devolvía a alguien distinto cada vez.
   */
  const art = ladderArt(round);
  const inspectedArt = ladderArt(inspected);

  /**
   * Mientras se pelea una ronda, se va pidiendo la siguiente. Es lo que borra
   * la rueda de carga entre combates, que en una partida de tres minutos es
   * tiempo muerto puro.
   *
   * Cuidado con el desfase de uno: `onFinish` incrementa `round` al ganar, así
   * que este efecto —que corre ANTES, con el combate en pantalla— tiene que
   * precargar `round + 1`, y el consumidor comparar con `round` a secas. Si se
   * equivoca, la caché no acierta nunca y nadie se entera: sólo vuelve la
   * rueda, silenciosamente.
   */
  useEffect(() => {
    if (phase !== "battle") return;
    const nextRound = round + 1;
    const next = trainers[nextRound - 1];
    if (!next || prefetchRef.current?.round === nextRound) return;
    // `catch` obligatorio: un fallo de red resolviéndose a media pelea sería,
    // si no, un rechazo sin capturar.
    const promise = fetchRound(next.species, [], false)
      .then((r) => (r.ok ? r.data : null))
      .catch(() => null);
    const slot: NonNullable<typeof prefetchRef.current> = {
      round: nextRound,
      data: null,
      promise,
    };
    prefetchRef.current = slot;
    void promise.then((data) => {
      if (prefetchRef.current === slot) slot.data = data;
    });
  }, [phase, round, trainers]);

  /**
   * Entra al campo, poniendo el reloj en marcha la primera vez.
   *
   * Arranca aquí y no al sortear el cuadro porque el sorteo incluye la llamada
   * al modelo que escribe a los Entrenadores: cronometrar la latencia del
   * servidor no mediría al jugador, y haría irrepetible cualquier récord.
   */
  const enterBattle = useCallback(() => {
    setAnchor((current) => current ?? Date.now());
    setPhase("battle");
  }, []);

  /** Deja las plantillas hidratadas listas para el combate. */
  const applyRound = useCallback(
    (data: TournamentRoundResponse) => {
      setRivalTeam(data.rival);
      if (data.player) setPlayerTeam(data.player);
      [...data.rival, ...(data.player ?? [])].forEach((b) =>
        sfx.preloadCry(b.cry),
      );
    },
    [sfx],
  );

  /** Hydrates one round's rosters. Returns false when the request failed. */
  const loadRound = useCallback(
    async (
      next: TournamentTrainer,
      opts: { withPlayer: boolean },
    ): Promise<boolean> => {
      const result = await fetchRound(next.species, entered, opts.withPlayer);
      if (!aliveRef.current) return false;
      if (!result.ok) {
        setError(result.error ?? t.battle.noServer);
        setPhase("error");
        return false;
      }
      applyRound(result.data);
      return true;
    },
    [entered, t, applyRound],
  );

  /** Draws a fresh ladder and hydrates its first round. */
  const startRun = useCallback(async () => {
    setPhase("drawing");
    setError(null);
    setLastResult(null);
    setWins(0);
    setRound(1);
    setInspected(1);
    // Carrera nueva: la racha impecable vuelve a estar intacta y el botín de
    // la anterior no puede colarse en la ceremonia de ésta.
    flawlessRef.current = true;
    rewardedRef.current = false;
    setReward(null);
    // Reloj y marcador a cero. El reloj no arranca aquí: lo hace al entrar al
    // primer combate, para que el sorteo no cuente.
    prefetchRef.current = null;
    setAnchor(null);
    setRunMs(0);
    setScore(0);
    setLastScore(0);
    try {
      const res = await fetch("/api/tournament/bracket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // El equipo va ENTERO aunque en Relámpago sólo jueguen tres: el
        // servidor lo usa para que ninguna de tus especies salga enfrente, y
        // los tres del banquillo tampoco deberían cruzarse en el camino.
        body: JSON.stringify({ team, format, pace }),
      });
      const data = (await res.json().catch(() => null)) as
        | (TournamentBracketResponse & { error?: string })
        | null;
      if (!aliveRef.current) return;
      if (!res.ok || !data || data.error || !data.trainers?.length) {
        setError(data?.error ?? tt.errorTitle);
        setPhase("error");
        return;
      }
      setTrainers(data.trainers);
      const ok = await loadRound(data.trainers[0], { withPlayer: true });
      if (ok && aliveRef.current) {
        clearRun();
        setSaved(null);
        setPhase("bracket");
      }
    } catch {
      if (aliveRef.current) {
        setError(t.battle.noServer);
        setPhase("error");
      }
    }
  }, [team, format, pace, tt, t, loadRound]);

  /** Picks a saved run back up where the rest phase left it. */
  const resumeRun = useCallback(
    async (run: StoredRun) => {
      setPhase("drawing");
      setError(null);
      setFormat(run.format);
      setPace(run.pace);
      setHeal(run.heal);
      setTrainers(run.trainers);
      setRound(run.round);
      setWins(run.wins);
      setInspected(run.round);
      setPlayerTeam(run.playerTeam);
      setLastResult(null);
      // Una partida guardada antes de que existiera este campo no puede
      // demostrar que fue impecable, así que se asume que no lo fue: es la
      // dirección segura, la que nunca regala un Sobre Divino de más.
      flawlessRef.current = run.flawless ?? false;
      rewardedRef.current = false;
      setReward(null);
      // Sólo se guardan partidas Clásicas, que no llevan reloj ni marcador;
      // aun así se reinician, para que una Relámpago anterior no deje sus
      // cifras colgadas en el HUD.
      prefetchRef.current = null;
      setAnchor(null);
      setRunMs(0);
      setScore(0);
      setLastScore(0);
      const ok = await loadRound(run.trainers[run.round - 1], {
        withPlayer: false,
      });
      if (ok && aliveRef.current) setPhase("bracket");
    },
    [loadRound],
  );

  /** Verdict of one round: advance, crown or eliminate. */
  const onFinish = useCallback(
    (result: ArenaResult) => {
      setLastResult(result);
      setPlayerTeam(result.playerTeam);

      // El reloj se lee UNA vez, aquí, y se congela: a partir de este punto la
      // partida ya está decidida y lo que tarde el jugador en leer la
      // ceremonia no es parte de su marca.
      const elapsed = anchor === null ? 0 : Date.now() - anchor;
      setRunMs(elapsed);
      const earnedPoints = roundScore(
        result,
        trainers[round - 1]?.tier ?? "rookie",
        rosterSize,
      );
      setLastScore(earnedPoints);
      const totalPoints = score + earnedPoints;
      setScore(totalPoints);

      // Una sola baja en cualquier ronda rompe la racha impecable. Hay que
      // anotarlo AQUÍ y no al final: en Modo Estándar `healTeam` revive al
      // equipo entre rondas, así que mirar el HP tras la final no diría nada
      // de lo que pasó en la segunda.
      if (result.playerTeam.some((b) => b.hp <= 0)) flawlessRef.current = false;

      // `onFinish` es una prop de <BattleArena>: un render de más lo volvería
      // a disparar y el botín se pagaría dos veces. Se cobra una y sólo una.
      const pay = (outcome: RunOutcome) => {
        if (rewardedRef.current) return;
        rewardedRef.current = true;
        const earned = rewardForRun(outcome);
        applyRunReward(earned);
        setReward(earned);
      };

      if (!result.won) {
        prefetchRef.current = null;
        clearRun();
        setSaved(null);
        setRecord((prev) => {
          const streak = {
            ...prev,
            bestStreak: Math.max(prev.bestStreak, wins),
          };
          // La puntuación parcial también cuenta: haber caído en la segunda
          // ronda deja una marca que batir, y es lo que hace que apetezca
          // volver a entrar en vez de cerrar la pestaña. Sin tiempo, eso sí:
          // un tiempo significa una copa terminada.
          const next = arcade
            ? withArcadeMark(streak, pace as ArcadePace, { score: totalPoints })
            : streak;
          saveRecord(next);
          return next;
        });
        pay({
          format,
          pace,
          wins,
          won: false,
          fled: result.fled,
          flawless: false,
        });
        setPhase("eliminated");
        return;
      }
      const nextWins = wins + 1;
      setWins(nextWins);
      if (nextWins >= total) {
        clearRun();
        setSaved(null);
        setRecord((prev) => {
          const crowned: TournamentRecord = {
            ...prev,
            titles: prev.titles + 1,
            bestStreak: Math.max(prev.bestStreak, nextWins),
            byCup: { ...prev.byCup, [format]: (prev.byCup?.[format] ?? 0) + 1 },
            flawless: flawlessRef.current
              ? {
                  ...prev.flawless,
                  [format]: (prev.flawless?.[format] ?? 0) + 1,
                }
              : { ...prev.flawless },
          };
          // El mejor tiempo sólo se apunta al levantar la copa: un tiempo
          // significa una partida terminada. Y cada ritmo guarda el suyo — seis
          // Pokémon tardan el doble que tres, así que compartir marca dejaría
          // el récord del Turbo congelado el día de su primera copa.
          const next = arcade
            ? withArcadeMark(crowned, pace as ArcadePace, {
                ms: elapsed,
                score: totalPoints,
              })
            : crowned;
          saveRecord(next);
          return next;
        });
        pay({
          format,
          pace,
          wins: nextWins,
          won: true,
          fled: false,
          flawless: flawlessRef.current,
        });
        setPhase("champion");
        return;
      }
      // Con el reloj corriendo la enfermería no se pide: se aplica. Un botón
      // que sólo tiene una respuesta sensata no es una decisión, es un peaje —
      // y en una partida que se mide en minutos se nota.
      if (arcade) {
        setPlayerTeam((prev) => (prev ? healTeam(prev) : prev));
        setHealed(true);
      } else {
        setHealed(false);
      }
      setRound((r) => r + 1);
      setPhase("rest");
    },
    [
      wins,
      total,
      format,
      applyRunReward,
      anchor,
      trainers,
      round,
      score,
      arcade,
      pace,
      rosterSize,
    ],
  );

  /** Leaves the rest phase and walks up to the next rung. */
  const continueRun = useCallback(async () => {
    const next = trainers[round - 1];
    if (!next) return;
    setInspected(round);
    // Con el reloj corriendo el cuadro sólo se enseña al empezar: ya se ha
    // visto la escalera entera, y volver a ella cada ronda son dos toques y una
    // pantalla entre tú y el combate siguiente.
    const land = () => (arcade ? enterBattle() : setPhase("bracket"));

    // La ronda ya venía precargada desde el combate anterior: se entra sin
    // rueda de carga. Hay que comprobarlo de forma SÍNCRONA — esperar a una
    // petición en vuelo sin enseñar la rueda deja el botón como muerto.
    const pre = prefetchRef.current?.round === round ? prefetchRef.current : null;
    if (pre?.data) {
      prefetchRef.current = null;
      applyRound(pre.data);
      land();
      return;
    }

    setPhase("drawing");
    const inFlight = pre ? await pre.promise : null;
    prefetchRef.current = null;
    if (inFlight && aliveRef.current) {
      applyRound(inFlight);
      land();
      return;
    }
    const ok = await loadRound(next, { withPlayer: false });
    if (ok && aliveRef.current) land();
  }, [trainers, round, loadRound, applyRound, arcade, enterBattle]);

  /**
   * Guardar y salir. No existe en los ritmos con reloj: una partida que se mide
   * en minutos se termina o se abandona, y guardar a mitad dejaría además un
   * cronómetro parado que ya no mide a nadie.
   */
  const persistAndExit = useCallback(() => {
    if (playerTeam && !arcade) {
      saveRun({
        format,
        pace,
        heal,
        round,
        wins,
        trainers,
        playerTeam,
        flawless: flawlessRef.current,
      });
    }
  }, [format, pace, arcade, heal, round, wins, trainers, playerTeam]);

  /* ---------------------------------------------------------------- */
  /* Screens                                                          */
  /* ---------------------------------------------------------------- */

  if (phase === "no-team") {
    return (
      <CenterCard>
        <Trophy size={40} className="mx-auto text-amber-300" />
        <h1 className="font-display text-2xl font-bold text-slate-100">
          {tt.noTeamTitle}
        </h1>
        <p className="text-slate-300">{tt.noTeamBody}</p>
        <Link
          href="/"
          className="mx-auto rounded-md border border-amber-300/60 bg-amber-400/10 px-5 py-2.5 font-mono text-sm tracking-wider text-amber-200 uppercase transition hover:bg-amber-400/20"
        >
          {tt.noTeamCta}
        </Link>
      </CenterCard>
    );
  }

  if (phase === "loading" || phase === "drawing") {
    return (
      <CenterCard>
        <span className="mx-auto block h-14 w-14 animate-spin rounded-full border-4 border-slate-700 border-t-amber-300" />
        <p className="font-mono text-sm tracking-widest text-slate-300 uppercase">
          {phase === "drawing" && trainers.length > 0
            ? tt.loadingRound
            : tt.loadingBracket}
        </p>
        <BackLink />
      </CenterCard>
    );
  }

  if (phase === "error") {
    return (
      <CenterCard>
        <p className="text-red-400">{error ?? tt.errorTitle}</p>
        <button
          type="button"
          onClick={() => void startRun()}
          className="mx-auto rounded-md border border-amber-300/60 bg-amber-400/10 px-5 py-2.5 font-mono text-sm tracking-wider text-amber-200 uppercase transition hover:bg-amber-400/20"
        >
          {tt.retry}
        </button>
        <BackLink />
      </CenterCard>
    );
  }

  if (phase === "lobby") {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-5xl flex-col gap-4 px-4 py-5">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-black/50 px-3 py-1.5 font-mono text-xs tracking-wider text-slate-300 uppercase transition hover:border-amber-300/60 hover:text-amber-200"
          >
            {tt.backToDex}
          </Link>
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-mono text-[11px] tracking-[0.18em] text-amber-200/70 uppercase">
              {tt.recordLabel(record.titles, record.bestStreak)}
            </span>
            {/* Una marca por ritmo con reloj, y sólo una vez que existe: un
                «0:00 · 0 pts» de fábrica no es una marca, es ruido.
                Basta con tener UNA de las dos cifras: caer eliminado deja
                puntos pero no tiempo — un tiempo significa una copa terminada
                —, y esa puntuación parcial es justo la que invita a volver a
                entrar. */}
            {ARCADE_PACES.map((option) => {
              const mark = arcadeMark(record, option);
              if (mark.ms <= 0 && mark.score <= 0) return null;
              return (
                <span
                  key={option}
                  style={{ "--edge": PACE_EDGE[option] } as CSSProperties}
                  className="font-mono text-[11px] tracking-[0.18em] text-[var(--edge)] uppercase opacity-80"
                >
                  {tt.paceRecordLabel(
                    tt.paceName[option],
                    mark.ms > 0 ? formatClock(mark.ms) : "—",
                    mark.score,
                  )}
                </span>
              );
            })}
          </div>
        </div>

        <section className="premium-frame premium-sweep relative flex flex-col gap-4 overflow-hidden rounded-xl px-4 py-4 sm:px-6 sm:py-6">
          <header className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-300/50 bg-gradient-to-b from-amber-300/25 to-amber-300/5 text-amber-200 shadow-[0_0_14px_-4px_rgba(251,191,36,0.8)] max-sm:h-8 max-sm:w-8">
              <Trophy size={22} className="max-sm:h-4 max-sm:w-4" />
            </span>
            <div>
              <h1 className="premium-text font-display text-xl font-bold tracking-wide max-sm:text-sm">
                {tt.lobbyTitle}
              </h1>
              <p className="text-sm text-amber-100/70 max-sm:text-[10px] max-sm:leading-snug">
                {tt.lobbySubtitle}
              </p>
            </div>
          </header>

          {saved && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300/40 bg-amber-400/10 px-4 py-3">
              <div className="text-left">
                <p className="font-display text-base font-bold text-amber-100">
                  {tt.resumeTitle}
                </p>
                <p className="font-mono text-xs text-amber-200/70">
                  {tt.resumeBody(saved.round, saved.trainers.length)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void resumeRun(saved)}
                  className="rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-4 py-2 font-mono text-sm font-bold tracking-wider text-amber-50 uppercase transition hover:from-amber-300 hover:to-amber-500"
                >
                  {tt.resumeCta}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearRun();
                    setSaved(null);
                  }}
                  className="rounded-md border border-slate-600 px-4 py-2 font-mono text-sm tracking-wider text-slate-300 uppercase transition hover:bg-slate-500/10"
                >
                  {tt.discardCta}
                </button>
              </div>
            </div>
          )}

        </section>

        {/* El ritmo, antes que la copa: decide cuánto va a durar esto, que es
            la primera pregunta que se hace quien entra. */}
        <fieldset className="flex flex-col gap-3">
          {/* El ritmo multiplica los PE, así que cada tarjeta enseña los suyos.
              La cifra depende TAMBIÉN de la copa, y eso lo aclara la coletilla:
              sin ella, tres números sueltos no dirían de qué torneo hablan. */}
          <legend className="mb-1 flex flex-wrap items-baseline gap-x-2 font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase">
            {tt.paceLabel}
            <span className="tracking-[0.14em] text-amber-200/70">
              · {t.tcg.xpNote(tt.cupName[format])}
            </span>
          </legend>
          {/* Los tres, en fila también en el móvil: un ritmo se elige
              comparándolo con los otros dos, igual que una copa. */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {PACE_CARDS.map(({ pace: option, edge, Icon }) => (
              <button
                key={option}
                type="button"
                onClick={() => setPace(option)}
                aria-pressed={pace === option}
                style={{ "--edge": edge } as CSSProperties}
                className={cn(
                  "lobby-panel lobby-bracket relative flex items-start gap-3.5 overflow-hidden rounded-2xl border p-4 text-left backdrop-blur-md transition duration-200 max-sm:gap-2 max-sm:rounded-xl max-sm:p-2",
                  pace === option
                    ? "border-[var(--edge)] bg-[color-mix(in_srgb,var(--edge)_10%,var(--color-hud-3))] opacity-100 shadow-[0_0_28px_-10px_var(--edge)] ring-2 ring-[var(--edge)] ring-offset-2 ring-offset-hud-0"
                    : "border-[color-mix(in_srgb,var(--edge)_25%,transparent)] bg-hud-3/55 opacity-70 hover:opacity-100",
                )}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--edge)_45%,transparent)] bg-[color-mix(in_srgb,var(--edge)_16%,transparent)] text-[var(--edge)] shadow-[0_0_18px_-6px_var(--edge)] max-sm:h-7 max-sm:w-7 max-sm:rounded-lg">
                  <Icon size={24} className="max-sm:h-4 max-sm:w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-bold text-slate-100 max-sm:text-[11px] max-sm:leading-tight">
                    {tt.paceName[option]}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-slate-400 max-sm:text-[9px] max-sm:leading-snug">
                    {tt.paceHint[option]}
                  </span>
                  {/* La experiencia del ritmo, para la copa seleccionada. */}
                  {/* Es la cifra por la que se elige un ritmo y no otro, así
                      que se lee de lejos: tipografía de titular, no chapita. */}
                  <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-amber-300/50 bg-amber-400/15 px-2 py-0.5 font-display text-xl leading-none font-black tracking-tight text-amber-200 drop-shadow-[0_0_14px_rgba(251,191,36,0.5)] max-sm:mt-1 max-sm:gap-0.5 max-sm:px-1 max-sm:py-0.5 max-sm:text-[11px]">
                    <Sparkles
                      size={14}
                      aria-hidden
                      className="shrink-0 text-amber-300 max-sm:h-2 max-sm:w-2"
                    />
                    {t.tcg.rewardPe(titlePeFor(format, option))}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Las tres copas, de menor a mayor dificultad. */}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase">
            {tt.formatLabel}
          </legend>
          {/* Las tres, en fila, también en el móvil: una copa se elige
              comparándola con las otras dos — apiladas de una en una hay que
              recordar lo que decía la anterior. */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {CUPS.map((cup) => (
              <CupCard
                key={cup.format}
                format={cup.format}
                difficulty={cup.difficulty}
                pace={pace}
                selected={format === cup.format}
                onSelect={() => setFormat(cup.format)}
              />
            ))}
          </div>
        </fieldset>

        {/* El cartel del torneo: quién te espera en cada ronda de la copa
            elegida, de Brock al Campeón. Se redibuja al cambiar de copa, que
            es lo que hace que elegir una signifique algo. */}
        <Gauntlet key={format} format={format} />

        {/* Reglas de curación: dos mandos de recreativa, no dos casillas.
            Con el reloj corriendo no se ofrecen — la enfermería es automática
            entre rondas —, así que el vestíbulo no crece al ganar el ritmo. */}
        <fieldset className={cn("flex flex-col gap-3", arcade && "hidden")}>
          <legend className="mb-1 font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase">
            {tt.rulesLabel}
          </legend>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
            {RULE_CARDS.map(({ on, edge, Icon }) => (
              <button
                key={String(on)}
                type="button"
                onClick={() => setHeal(on)}
                aria-pressed={heal === on}
                style={{ "--edge": edge } as CSSProperties}
                className={cn(
                  "lobby-panel lobby-bracket relative flex items-start gap-3.5 overflow-hidden rounded-2xl border p-4 text-left backdrop-blur-md transition duration-200 max-sm:gap-2 max-sm:rounded-xl max-sm:p-2",
                  heal === on
                    ? "border-[var(--edge)] bg-[color-mix(in_srgb,var(--edge)_10%,var(--color-hud-3))] opacity-100 shadow-[0_0_28px_-10px_var(--edge)] ring-2 ring-[var(--edge)] ring-offset-2 ring-offset-hud-0"
                    : "border-[color-mix(in_srgb,var(--edge)_25%,transparent)] bg-hud-3/55 opacity-70 hover:opacity-100",
                )}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--edge)_45%,transparent)] bg-[color-mix(in_srgb,var(--edge)_16%,transparent)] text-[var(--edge)] shadow-[0_0_18px_-6px_var(--edge)] max-sm:h-7 max-sm:w-7 max-sm:rounded-lg">
                  <Icon size={24} className="max-sm:h-4 max-sm:w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-bold text-slate-100 max-sm:text-[11px] max-sm:leading-tight">
                    {on ? tt.healOn : tt.healOff}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-slate-400 max-sm:text-[9px] max-sm:leading-snug">
                    {on ? tt.healOnHint : tt.healOffHint}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <BagBuilder
          bag={bag}
          onChange={(next) => {
            setBag(next);
            saveBag(next);
          }}
        />

        {/* Lanzamiento: ancho, centrado y latiendo en el color de la copa. */}
        <button
          type="button"
          onClick={() => void startRun()}
          style={{ "--edge": CUP_EDGE[format] } as CSSProperties}
          className="lobby-ready mx-auto inline-flex h-16 w-full max-w-xl items-center justify-center gap-3 rounded-2xl border-2 border-[var(--edge)] bg-[color-mix(in_srgb,var(--edge)_16%,var(--color-hud-3))] px-8 font-display text-lg font-bold tracking-[0.12em] text-[var(--edge)] uppercase transition hover:bg-[color-mix(in_srgb,var(--edge)_26%,var(--color-hud-3))] active:scale-[0.99]"
        >
          <Trophy size={24} className="shrink-0" />
          {tt.startCta}
        </button>
      </div>
    );
  }

  // From here on a ladder exists.
  if (phase === "bracket" && trainer) {
    const shown = trainers[inspected - 1] ?? trainer;
    const roster = playerTeam?.length ?? team.length;
    return (
      // Pantalla ancha: el cuadro necesita sitio para desplegar sus llaves.
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-6xl flex-col gap-4 px-3 py-5 sm:px-4">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <Link
            href="/"
            onClick={persistAndExit}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-black/50 px-3 py-1.5 font-mono text-xs tracking-wider text-slate-300 uppercase transition hover:border-amber-300/60 hover:text-amber-200"
          >
            {tt.backToDex}
          </Link>
          <span className="font-mono text-[11px] tracking-[0.18em] text-amber-200/70 uppercase">
            {tt.recordLabel(record.titles, record.bestStreak)}
          </span>
        </div>

        <section className="premium-frame premium-sweep relative flex flex-col gap-5 overflow-hidden rounded-2xl px-4 py-5 backdrop-blur-md sm:px-7 sm:py-7">
          {/* Cabecera: en qué ronda estás y de qué copa, a tamaño de marquesina. */}
          <header className="flex flex-col items-center gap-1 text-center">
            <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-amber-300/80 uppercase">
              <Trophy size={13} />
              {tt.bracketTitle}
            </span>
            {/* Una sola marquesina: en qué ronda vas Y de qué copa, como el
                rótulo de un campeonato. El guion sólo aparece cuando las dos
                mitades caben en la misma línea; en móvil se apilan. */}
            <h1 className="premium-text font-display flex flex-wrap items-baseline justify-center gap-x-3 text-3xl leading-tight font-bold tracking-[0.06em] uppercase sm:text-5xl">
              {tt.bracketSubtitle(round, total)}
              <span aria-hidden className="hidden text-amber-300/60 sm:inline">
                —
              </span>
              <span className="w-full text-2xl text-amber-200/90 sm:w-auto sm:text-4xl">
                {tt.cupName[format]}
              </span>
            </h1>
          </header>

          <Bracket
            trainers={trainers}
            current={round}
            wins={wins}
            selected={inspected}
            onSelect={setInspected}
          />

          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase">
              {inspected === round
                ? tt.nextRivalTitle
                : roundLabel(inspected, total)}
            </p>
            <TrainerCard
              trainer={shown}
              total={total}
              avatar={inspectedArt}
            />
            {roster < rosterSize && (
              <p className="cup-note text-center font-mono text-[11px] text-amber-200/70">
                {tt.rosterNote(roster, rosterSize)}
              </p>
            )}
          </div>

          {/* Lanzamiento: ancho, centrado y latiendo en el oro de la copa. */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={enterBattle}
              disabled={!rivalTeam || !playerTeam}
              style={{ "--edge": "#fbbf24" } as CSSProperties}
              className="lobby-ready inline-flex h-16 w-full max-w-xl items-center justify-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-400/15 px-8 font-display text-lg font-bold tracking-[0.12em] text-amber-200 uppercase transition hover:bg-amber-400/25 active:scale-[0.99] disabled:animate-none disabled:opacity-50 sm:text-xl"
            >
              <Swords size={24} className="shrink-0" />
              {tt.fightCta}
            </button>
            {/* Guardar y salir sólo tiene sentido en una partida larga. */}
            {!arcade && (
              <Link
                href="/"
                onClick={persistAndExit}
                className="rounded-md border border-slate-600 px-6 py-2 font-mono text-sm tracking-wider text-slate-300 uppercase transition hover:bg-slate-500/10"
              >
                {tt.saveExitCta}
              </Link>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (phase === "battle" && trainer && playerTeam && rivalTeam) {
    return (
      <BattleArena
        key={`${round}-${trainer.name}`}
        player={playerTeam}
        rival={rivalTeam}
        trainer={{ nombre: `${trainer.trainerClass} ${trainer.name}`, lema: trainer.lines.start }}
        bag={bag}
        rivalBag={bagForTier(trainer.tier, pace)}
        tier={trainer.tier}
        speed={speedFor(pace)}
        // La manera de jugar se saca de la RONDA, no de la partida guardada:
        // así una partida empezada antes de que existieran las personalidades
        // sigue cargando, y el Entrenador de cada peldaño es siempre el mismo
        // sin necesidad de migrar nada.
        brain={ladderTrainer(round).brain}
        lines={trainer.lines}
        avatar={art}
        rivalFigure={ladderTrainer(round)}
        introCta={tt.fightCta}
        introHeader={
          <div className="fx-round-banner flex flex-col items-center gap-1">
            <span className="font-pixel text-[11px] tracking-[0.35em] text-amber-300 uppercase">
              {tt.bannerRound(round)}
            </span>
            <span className="premium-text font-display text-2xl font-bold tracking-widest">
              {tt.bannerVs(`${trainer.trainerClass} ${trainer.name}`.toUpperCase())}
            </span>
          </div>
        }
        hud={
          // Reloj y marcador en cifras, bajo sus iconos: no cuestan ni una
          // cadena traducida, y el minutero corre dentro de <RunClock> para
          // que la arena no se vuelva a pintar cada segundo.
          <span className="flex items-center gap-2 rounded-md border border-amber-300/50 bg-black/70 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-amber-200 uppercase">
            <Trophy size={12} />
            {tt.hudRound(round, total)}
            <span className="text-amber-100/60">·</span>
            {tt.hudStreak(wins)}
            {arcade && anchor !== null && (
              // El reloj se tiñe del color del ritmo: es la misma pista que
              // encendió la tarjeta del vestíbulo, y basta para saber a qué se
              // está jugando sin leer nada.
              <span
                style={{ "--edge": PACE_EDGE[pace] } as CSSProperties}
                className="flex items-center gap-2 text-[var(--edge)]"
              >
                <span className="text-amber-100/60">·</span>
                <Timer size={12} />
                <RunClock anchor={anchor} />
                <Star size={12} />
                {score}
              </span>
            )}
          </span>
        }
        toolbar={
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-black/50 px-3 py-1 font-mono text-xs tracking-wider text-slate-300 uppercase transition hover:border-amber-300/60 hover:text-amber-200"
          >
            {tt.backToDex}
          </Link>
        }
        onFinish={onFinish}
      />
    );
  }

  if (phase === "rest" && lastResult && playerTeam) {
    const mvpIndex = lastResult.damageByMember.reduce(
      (best, value, i, all) => (value > (all[best] ?? -1) ? i : best),
      0,
    );
    const mvpDamage = lastResult.damageByMember[mvpIndex] ?? 0;
    const totalDamage = lastResult.damageByMember.reduce((a, b) => a + b, 0);
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-3xl flex-col justify-center gap-4 px-4 py-5">
        <section className="premium-frame premium-sweep relative flex flex-col gap-5 overflow-hidden rounded-xl px-6 py-6 text-center">
          <h1 className="premium-text font-display text-2xl font-bold tracking-widest">
            {tt.restTitle}
          </h1>
          <p className="text-slate-200">{tt.restBody(wins, total)}</p>

          <div
            className={cn(
              "grid gap-2 text-left max-sm:gap-1",
              arcade ? "grid-cols-4" : "grid-cols-3",
            )}
          >
            <Stat label={tt.statMvp} value={playerTeam[mvpIndex]?.label ?? tt.statNone} hint={`${mvpDamage} PS`} />
            <Stat label={tt.statDamage} value={String(totalDamage)} />
            <Stat label={tt.statTurns} value={String(lastResult.turns)} />
            {arcade && (
              <Stat
                label={tt.championStatScore}
                value={`+${lastScore}`}
                hint={String(score)}
              />
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            {healing ? (
              healed ? (
                <p className="font-mono text-sm text-emerald-300">
                  {tt.healedNote}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPlayerTeam((prev) => (prev ? healTeam(prev) : prev));
                    setHealed(true);
                    sfx.play("heal");
                  }}
                  className="rounded-md border border-emerald-400/60 bg-emerald-400/10 px-6 py-2.5 font-mono text-sm tracking-wider text-emerald-200 uppercase transition hover:bg-emerald-400/20"
                >
                  {tt.healCta}
                </button>
              )
            ) : (
              <p className="font-mono text-sm text-amber-200/80">
                {tt.challengeNote}
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void continueRun()}
              className="rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-6 py-2.5 font-mono text-sm font-bold tracking-wider text-amber-50 uppercase transition hover:from-amber-300 hover:to-amber-500"
            >
              {tt.continueCta}
            </button>
            {!arcade && (
              <Link
                href="/"
                onClick={persistAndExit}
                className="rounded-md border border-slate-600 px-6 py-2.5 font-mono text-sm tracking-wider text-slate-300 uppercase transition hover:bg-slate-500/10"
              >
                {tt.saveExitCta}
              </Link>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (phase === "champion") {
    return (
      <ChampionScreen
        format={format}
        heal={healing}
        pace={pace}
        runMs={runMs}
        score={score}
        trainers={trainers}
        // El equipo con el que se ganó: si la partida perdió su referencia
        // (recarga en la última ronda), la ceremonia cae al equipo guardado.
        team={playerTeam ?? []}
        record={record}
        onAgain={() => setPhase("lobby")}
        reward={reward ?? undefined}
      />
    );
  }

  if (phase === "eliminated" && lastResult) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-3xl flex-col justify-center gap-4 px-4 py-5">
        <section className="elite-frame relative flex flex-col items-center gap-4 overflow-hidden rounded-xl px-6 py-8 text-center">
          <h1 className="neon-red font-display text-3xl font-bold tracking-widest">
            {lastResult.fled ? tt.fledTitle : tt.eliminatedTitle}
          </h1>
          <p className="text-slate-200">
            {lastResult.fled
              ? tt.fledBody
              : tt.eliminatedBody(
                  round,
                  `${trainer?.trainerClass ?? ""} ${trainer?.name ?? ""}`.trim(),
                )}
          </p>
          <p className="font-mono text-sm text-amber-200/80">
            {tt.eliminatedStreak(wins)}
          </p>
          {/* Caer luchando también paga: es lo único que mueve el álbum de
              quien todavía no ha levantado una copa. Huir no cuenta. */}
          {reward && reward.pe > 0 && (
            <p className="font-mono text-sm text-violet-200/80">
              {t.tcg.rewardConsolation(reward.pe)}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setPhase("lobby")}
              className="rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-6 py-2.5 font-mono text-sm font-bold tracking-wider text-amber-50 uppercase transition hover:from-amber-300 hover:to-amber-500"
            >
              {tt.againCta}
            </button>
            <Link
              href="/"
              className="rounded-md border border-slate-600 px-6 py-2.5 font-mono text-sm tracking-wider text-slate-300 uppercase transition hover:bg-slate-500/10"
            >
              {tt.homeCta}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // Any state the machine can't render (a run that lost its ladder) falls
  // back to the lobby rather than to a blank screen.
  return (
    <CenterCard>
      <p className="text-slate-300">{tt.errorTitle}</p>
      <button
        type="button"
        onClick={() => setPhase("lobby")}
        className="mx-auto rounded-md border border-amber-300/60 bg-amber-400/10 px-5 py-2.5 font-mono text-sm tracking-wider text-amber-200 uppercase transition hover:bg-amber-400/20"
      >
        {tt.retry}
      </button>
      <BackLink />
    </CenterCard>
  );
}

/**
 * Pide al servidor las plantillas de una ronda.
 *
 * Vive fuera del componente y no toca estado a propósito: es lo que permite
 * lanzarla en segundo plano DURANTE un combate para precargar la ronda
 * siguiente. Un `setState` a media pelea reiniciaría las animaciones de la
 * arena, así que lo único que puede hacer esta función es devolver datos.
 */
type RoundFetch =
  | { ok: true; data: TournamentRoundResponse }
  /** `error: null` significa que no se llegó a hablar con el servidor. */
  | { ok: false; error: string | null };

async function fetchRound(
  rival: TournamentTrainer["species"],
  team: TeamMember[],
  withPlayer: boolean,
): Promise<RoundFetch> {
  try {
    const res = await fetch("/api/tournament/round", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rival, team, withPlayer }),
    });
    const data = (await res.json().catch(() => null)) as
      | (TournamentRoundResponse & { error?: string })
      | null;
    if (!res.ok || !data || data.error || !data.rival?.length) {
      return { ok: false, error: data?.error ?? null };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: null };
  }
}

/** Centred card for the states with nothing else on screen. */
function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100dvh-5rem)] items-center justify-center px-4">
      <div className="flex max-w-md flex-col gap-4 rounded-2xl border border-slate-700/70 bg-hud-3/90 px-8 py-10 text-center shadow-[0_0_48px_rgba(0,0,0,0.8)]">
        {children}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-700/70 bg-black/40 px-3 py-2">
      <p className="font-mono text-[10px] tracking-[0.18em] text-slate-400 uppercase">
        {label}
      </p>
      <p className="font-display text-base font-bold text-slate-100">{value}</p>
      {hint && <p className="font-mono text-[11px] text-amber-200/70">{hint}</p>}
    </div>
  );
}

function BackLink() {
  const tt = useT().tournament;
  return (
    <Link
      href="/"
      className="mx-auto font-mono text-xs tracking-wider text-slate-500 uppercase transition hover:text-amber-200"
    >
      {tt.backToDex}
    </Link>
  );
}
