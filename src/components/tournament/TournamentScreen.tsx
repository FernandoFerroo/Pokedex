"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { HeartPulse, Skull, Swords, Trophy } from "lucide-react";
import { BagBuilder } from "@/components/battle/BagBuilder";
import { BattleArena, type ArenaResult } from "@/components/battle/BattleArena";
import { loadBag, saveBag } from "@/lib/battle/bag-storage";
import { useSfx } from "@/components/audio/SfxProvider";
import { useTeam } from "@/components/team/TeamProvider";
import { bagForTier, ladderArt, RIVAL_ROSTER_SIZE } from "@/lib/tournament/config";
import {
  clearRun,
  healTeam,
  loadRecord,
  loadRun,
  saveRecord,
  saveRun,
  type StoredRun,
} from "@/lib/tournament/run";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { Bag } from "@/lib/battle/items";
import type { Battler } from "@/types/battle";
import type {
  TournamentBracketResponse,
  TournamentFormat,
  TournamentRecord,
  TournamentRoundResponse,
  TournamentTrainer,
} from "@/types/tournament";
import { CUPS } from "@/types/tournament";
import { Bracket, TrainerCard, useRoundLabel } from "./Bracket";
import { ChampionScreen } from "./ChampionScreen";
import { CupCard } from "./CupCard";
import type { CSSProperties } from "react";

/** Neon of each cup, mirrored in CupCard — drives the launch button's pulse. */
const CUP_EDGE: Record<TournamentFormat, string> = {
  3: "#22c55e",
  4: "#fbbf24",
  5: "#a855f7",
};

/** The two healing rules, as arcade cards: the nurse or the war of attrition. */
const RULE_CARDS = [
  { on: true, edge: "#34d399", Icon: HeartPulse },
  { on: false, edge: "#fb7185", Icon: Skull },
] as const;

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
   * Arte del Entrenador de la ronda: el busto que llena el cuadro y el
   * bocadillo, y el recorte de cuerpo entero que se planta junto a su Pokémon.
   *
   * Ya está pintado — son cinco personajes fijos, uno por ronda —, así que
   * aquí sólo se eligen las rutas. Antes se pedían al generador en cada ronda:
   * costaba dinero, tardaba casi un minuto en llegar y devolvía a alguien
   * distinto cada vez, iluminado a su aire. Ahora está en el primer fotograma
   * y los cinco comparten la luz del estadio.
   */
  const art = ladderArt(round);
  const inspectedArt = ladderArt(inspected);

  /** Hydrates one round's rosters. Returns false when the request failed. */
  const loadRound = useCallback(
    async (
      next: TournamentTrainer,
      opts: { withPlayer: boolean },
    ): Promise<boolean> => {
      try {
        const res = await fetch("/api/tournament/round", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rival: next.species,
            team,
            withPlayer: opts.withPlayer,
          }),
        });
        const data = (await res.json().catch(() => null)) as
          | (TournamentRoundResponse & { error?: string })
          | null;
        if (!aliveRef.current) return false;
        if (!res.ok || !data || data.error || !data.rival?.length) {
          setError(data?.error ?? tt.errorTitle);
          setPhase("error");
          return false;
        }
        setRivalTeam(data.rival);
        if (data.player) setPlayerTeam(data.player);
        [...data.rival, ...(data.player ?? [])].forEach((b) =>
          sfx.preloadCry(b.cry),
        );
        return true;
      } catch {
        if (aliveRef.current) {
          setError(t.battle.noServer);
          setPhase("error");
        }
        return false;
      }
    },
    [team, tt, t, sfx],
  );

  /** Draws a fresh ladder and hydrates its first round. */
  const startRun = useCallback(async () => {
    setPhase("drawing");
    setError(null);
    setLastResult(null);
    setWins(0);
    setRound(1);
    setInspected(1);
    try {
      const res = await fetch("/api/tournament/bracket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team, format }),
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
  }, [team, format, tt, t, loadRound]);

  /** Picks a saved run back up where the rest phase left it. */
  const resumeRun = useCallback(
    async (run: StoredRun) => {
      setPhase("drawing");
      setError(null);
      setFormat(run.format);
      setHeal(run.heal);
      setTrainers(run.trainers);
      setRound(run.round);
      setWins(run.wins);
      setInspected(run.round);
      setPlayerTeam(run.playerTeam);
      setLastResult(null);
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
      if (!result.won) {
        clearRun();
        setSaved(null);
        setRecord((prev) => {
          const next = { ...prev, bestStreak: Math.max(prev.bestStreak, wins) };
          saveRecord(next);
          return next;
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
          const next = {
            titles: prev.titles + 1,
            bestStreak: Math.max(prev.bestStreak, nextWins),
          };
          saveRecord(next);
          return next;
        });
        setPhase("champion");
        return;
      }
      setHealed(false);
      setRound((r) => r + 1);
      setPhase("rest");
    },
    [wins, total],
  );

  /** Leaves the rest phase and walks up to the next rung. */
  const continueRun = useCallback(async () => {
    const next = trainers[round - 1];
    if (!next) return;
    setPhase("drawing");
    setInspected(round);
    const ok = await loadRound(next, { withPlayer: false });
    if (ok && aliveRef.current) setPhase("bracket");
  }, [trainers, round, loadRound]);

  const persistAndExit = useCallback(() => {
    if (playerTeam) {
      saveRun({ format, heal, round, wins, trainers, playerTeam });
    }
  }, [format, heal, round, wins, trainers, playerTeam]);

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
          <span className="font-mono text-[11px] tracking-[0.18em] text-amber-200/70 uppercase">
            {tt.recordLabel(record.titles, record.bestStreak)}
          </span>
        </div>

        <section className="premium-frame premium-sweep relative flex flex-col gap-4 overflow-hidden rounded-xl px-4 py-4 sm:px-6 sm:py-6">
          <header className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-300/50 bg-gradient-to-b from-amber-300/25 to-amber-300/5 text-amber-200 shadow-[0_0_14px_-4px_rgba(251,191,36,0.8)]">
              <Trophy size={22} />
            </span>
            <div>
              <h1 className="premium-text font-display text-xl font-bold tracking-wide">
                {tt.lobbyTitle}
              </h1>
              <p className="text-sm text-amber-100/70">{tt.lobbySubtitle}</p>
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

        {/* Las tres copas, de menor a mayor dificultad. */}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase">
            {tt.formatLabel}
          </legend>
          <div className="grid gap-3 md:grid-cols-3">
            {CUPS.map((cup) => (
              <CupCard
                key={cup.format}
                format={cup.format}
                difficulty={cup.difficulty}
                selected={format === cup.format}
                onSelect={() => setFormat(cup.format)}
              />
            ))}
          </div>
        </fieldset>

        {/* Reglas de curación: dos mandos de recreativa, no dos casillas. */}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase">
            {tt.rulesLabel}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {RULE_CARDS.map(({ on, edge, Icon }) => (
              <button
                key={String(on)}
                type="button"
                onClick={() => setHeal(on)}
                aria-pressed={heal === on}
                style={{ "--edge": edge } as CSSProperties}
                className={cn(
                  "lobby-panel lobby-bracket relative flex items-start gap-3.5 overflow-hidden rounded-2xl border p-4 text-left backdrop-blur-md transition duration-200",
                  heal === on
                    ? "border-[var(--edge)] bg-[color-mix(in_srgb,var(--edge)_10%,var(--color-hud-3))] opacity-100 shadow-[0_0_28px_-10px_var(--edge)] ring-2 ring-[var(--edge)] ring-offset-2 ring-offset-hud-0"
                    : "border-[color-mix(in_srgb,var(--edge)_25%,transparent)] bg-hud-3/55 opacity-70 hover:opacity-100",
                )}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--edge)_45%,transparent)] bg-[color-mix(in_srgb,var(--edge)_16%,transparent)] text-[var(--edge)] shadow-[0_0_18px_-6px_var(--edge)]">
                  <Icon size={24} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-bold text-slate-100">
                    {on ? tt.healOn : tt.healOff}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-slate-400">
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
            <h1 className="premium-text font-display text-3xl leading-tight font-bold tracking-[0.06em] uppercase sm:text-5xl">
              {tt.bracketSubtitle(round, total)}
            </h1>
            <p className="font-display text-lg font-bold tracking-[0.14em] text-amber-200/90 uppercase sm:text-xl">
              {tt.cupName[format]}
            </p>
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
              avatar={inspectedArt.bust}
            />
            {roster < RIVAL_ROSTER_SIZE && (
              <p className="cup-note text-center font-mono text-[11px] text-amber-200/70">
                {tt.rosterNote(roster)}
              </p>
            )}
          </div>

          {/* Lanzamiento: ancho, centrado y latiendo en el oro de la copa. */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setPhase("battle")}
              disabled={!rivalTeam || !playerTeam}
              style={{ "--edge": "#fbbf24" } as CSSProperties}
              className="lobby-ready inline-flex h-16 w-full max-w-xl items-center justify-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-400/15 px-8 font-display text-lg font-bold tracking-[0.12em] text-amber-200 uppercase transition hover:bg-amber-400/25 active:scale-[0.99] disabled:animate-none disabled:opacity-50 sm:text-xl"
            >
              <Swords size={24} className="shrink-0" />
              {tt.fightCta}
            </button>
            <Link
              href="/"
              onClick={persistAndExit}
              className="rounded-md border border-slate-600 px-6 py-2 font-mono text-sm tracking-wider text-slate-300 uppercase transition hover:bg-slate-500/10"
            >
              {tt.saveExitCta}
            </Link>
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
        rivalBag={bagForTier(trainer.tier)}
        tier={trainer.tier}
        lines={trainer.lines}
        avatar={art.bust}
        trainerSprite={art.field}
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
          <span className="flex items-center gap-2 rounded-md border border-amber-300/50 bg-black/70 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-amber-200 uppercase">
            <Trophy size={12} />
            {tt.hudRound(round, total)}
            <span className="text-amber-100/60">·</span>
            {tt.hudStreak(wins)}
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

          <div className="grid gap-2 text-left sm:grid-cols-3">
            <Stat label={tt.statMvp} value={playerTeam[mvpIndex]?.label ?? tt.statNone} hint={`${mvpDamage} PS`} />
            <Stat label={tt.statDamage} value={String(totalDamage)} />
            <Stat label={tt.statTurns} value={String(lastResult.turns)} />
          </div>

          <div className="flex flex-col items-center gap-2">
            {heal ? (
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
            <Link
              href="/"
              onClick={persistAndExit}
              className="rounded-md border border-slate-600 px-6 py-2.5 font-mono text-sm tracking-wider text-slate-300 uppercase transition hover:bg-slate-500/10"
            >
              {tt.saveExitCta}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (phase === "champion") {
    return (
      <ChampionScreen
        format={format}
        heal={heal}
        trainers={trainers}
        // El equipo con el que se ganó: si la partida perdió su referencia
        // (recarga en la última ronda), la ceremonia cae al equipo guardado.
        team={playerTeam ?? []}
        record={record}
        onAgain={() => setPhase("lobby")}
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
