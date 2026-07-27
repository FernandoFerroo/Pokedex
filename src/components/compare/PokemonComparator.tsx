"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { parseAsString, useQueryStates } from "nuqs";
import { ArrowLeftRight, ClipboardList, Dices, Gauge } from "lucide-react";
import { AiVerdict } from "@/components/compare/AiVerdict";
import { DualRadar, SIDE_A_COLOR, SIDE_B_COLOR } from "@/components/compare/DualRadar";
import { PokemonPicker } from "@/components/compare/PokemonPicker";
import { Scoreboard } from "@/components/compare/Scoreboard";
import { StatFaceOff } from "@/components/compare/StatFaceOff";
import { VerdictHero } from "@/components/compare/VerdictHero";
import { VersusStage } from "@/components/compare/VersusStage";
import { useTeamIndex } from "@/components/team/TeamDrawer";
import { compare } from "@/lib/compare";
import { useI18n } from "@/lib/i18n/client";
import type { Lang } from "@/lib/i18n/config";
import type { CSSProperties } from "react";
import type {
  ComparePokemon,
  CompareResponse,
  CompareVerdict,
  CompareVerdictResponse,
} from "@/types/compare";
import type { TeamMember } from "@/types/team";

const SLUG_PATTERN = /^[a-z0-9-]{1,40}$/;

/** Sheets already fetched this session, keyed by language + species. */
const sheetCache = new Map<string, ComparePokemon>();

/**
 * Loads one side's versus sheet, reusing anything already fetched. The cache
 * is the source of truth and is read during render, so the only state this
 * hook writes happens inside the fetch callbacks — no cascading renders.
 */
function useSheet(name: string | null, lang: Lang) {
  const key = name && SLUG_PATTERN.test(name) ? `${lang}|${name}` : null;
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [, onLoaded] = useReducer((tick: number) => tick + 1, 0);

  useEffect(() => {
    if (!key || sheetCache.has(key)) return;
    const species = key.slice(key.indexOf("|") + 1);
    let alive = true;
    fetch(`/api/compare?name=${encodeURIComponent(species)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
      .then((data: CompareResponse) => {
        sheetCache.set(key, data.pokemon);
        if (alive) onLoaded();
      })
      .catch(() => {
        if (alive) setFailedKey(key);
      });
    return () => {
      alive = false;
    };
  }, [key]);

  const sheet = key ? (sheetCache.get(key) ?? null) : null;
  const failed = key !== null && failedKey === key;
  return { sheet, pending: key !== null && !sheet && !failed, failed };
}

/** Framed section of the comparator, matching the detail sheet's panels. */
function Panel({
  icon,
  title,
  intro,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  /** Optional line under the heading explaining what the section reads. */
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-700/70 bg-hud-3/80 px-5 py-6 shadow-[0_0_36px_rgba(0,0,0,0.45)] sm:px-7 sm:py-7">
      <h2 className="flex items-center gap-2.5 font-display text-base font-bold tracking-wide text-slate-100 sm:text-lg">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-400/50 bg-sky-400/10 text-sky-300">
          {icon}
        </span>
        {title}
      </h2>
      {intro && (
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{intro}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/**
 * Pokémon comparator: two independent autocomplete selectors, a versus stage
 * lit by each fighter's type, an overlaid dual radar with facing stat bars,
 * the computed technical read (type advantage, BST gap, initiative) and an
 * optional AI verdict on top of those very numbers.
 *
 * Both picks live in the URL (?a=&b=), so a duel is shareable and survives a
 * refresh.
 */
export function PokemonComparator() {
  const { lang, dict } = useI18n();
  const t = dict.compare;
  const { entries } = useTeamIndex();
  const [{ a: slugA, b: slugB }, setSlugs] = useQueryStates(
    { a: parseAsString, b: parseAsString },
    { history: "replace" },
  );

  const sideA = useSheet(slugA, lang);
  const sideB = useSheet(slugB, lang);

  // The verdict is tagged with the duel it belongs to, so changing either
  // corner drops it without an effect: it simply stops matching the pair.
  const pairKey = `${slugA ?? ""}|${slugB ?? ""}`;
  const [analysis, setAnalysis] = useState<{
    key: string;
    verdict: CompareVerdict | null;
    error: string | null;
  } | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const current = analysis?.key === pairKey ? analysis : null;
  const verdict = current?.verdict ?? null;
  const verdictError = current?.error ?? null;
  const verdictPending = pendingKey === pairKey;

  const result = useMemo(
    () =>
      sideA.sheet && sideB.sheet ? compare(sideA.sheet, sideB.sheet) : null,
    [sideA.sheet, sideB.sheet],
  );

  const pickRandom = () => {
    if (!entries || entries.length < 2) return;
    const first = Math.floor(Math.random() * entries.length);
    let second = Math.floor(Math.random() * entries.length);
    if (second === first) second = (first + 1) % entries.length;
    void setSlugs({ a: entries[first].name, b: entries[second].name });
  };

  const swap = () => void setSlugs({ a: slugB, b: slugA });

  const askVerdict = async () => {
    if (verdictPending || !sideA.sheet || !sideB.sheet) return;
    const key = pairKey;
    setPendingKey(key);
    setAnalysis(null);
    try {
      const res = await fetch("/api/compare/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: sideA.sheet, b: sideB.sheet }),
      });
      const data = (await res.json().catch(() => null)) as
        | (CompareVerdictResponse & { error?: string })
        | null;
      setAnalysis(
        !res.ok || !data?.verdict
          ? { key, verdict: null, error: data?.error ?? t.aiUpstream }
          : { key, verdict: data.verdict, error: null },
      );
    } catch {
      setAnalysis({ key, verdict: null, error: t.aiOffline });
    } finally {
      setPendingKey(null);
    }
  };

  const bothPending = sideA.pending || sideB.pending;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* ---------------------------------------------------------------- */}
      {/* Selector dual + botón VS central                                  */}
      {/* ---------------------------------------------------------------- */}
      <div className="rounded-2xl border border-sky-400/30 bg-hud-3/80 px-4 py-5 shadow-[0_0_36px_rgba(0,0,0,0.45)] sm:px-6">
        <div className="grid items-start gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-6">
          <PokemonPicker
            side="a"
            sideLabel={t.sideA}
            value={slugA}
            valueLabel={sideA.sheet?.label ?? null}
            valueId={sideA.sheet?.id ?? null}
            onSelect={(entry: TeamMember) => void setSlugs({ a: entry.name })}
            onClear={() => void setSlugs({ a: null })}
          />

          {/* The interactive VS: an energy clash that swaps both corners. */}
          <button
            type="button"
            onClick={swap}
            disabled={!slugA && !slugB}
            aria-label={t.swapAria}
            title={t.swap}
            style={
              {
                "--aura-a": SIDE_A_COLOR,
                "--aura-b": SIDE_B_COLOR,
              } as CSSProperties
            }
            className="vs-clash relative mx-auto flex h-16 w-16 items-center justify-center self-center rounded-full border border-sky-400/60 bg-black/70 font-display text-xl font-black tracking-tighter text-sky-300 shadow-[0_0_26px_-6px_rgba(56,189,248,0.9)] transition enabled:hover:scale-105 enabled:hover:text-sky-500 disabled:opacity-40 md:mt-7"
          >
            <span className="relative">VS</span>
            <ArrowLeftRight
              size={13}
              aria-hidden
              className="absolute bottom-2 text-slate-500"
            />
          </button>

          <PokemonPicker
            side="b"
            sideLabel={t.sideB}
            value={slugB}
            valueLabel={sideB.sheet?.label ?? null}
            valueId={sideB.sheet?.id ?? null}
            onSelect={(entry: TeamMember) => void setSlugs({ b: entry.name })}
            onClear={() => void setSlugs({ b: null })}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={pickRandom}
            disabled={!entries}
            aria-label={t.randomAria}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-400/50 bg-cyan-400/10 px-4 font-mono text-sm tracking-wider text-cyan-300 uppercase transition enabled:hover:bg-cyan-400/20 enabled:hover:shadow-[0_0_20px_-2px_rgba(34,211,238,0.7)] disabled:opacity-40"
          >
            <Dices size={16} />
            {t.random}
          </button>
          {bothPending && (
            <span className="font-mono text-sm text-slate-300">
              {t.loadingSheet}
            </span>
          )}
          {(sideA.failed || sideB.failed) && (
            <span className="font-mono text-xs text-red-400">
              {t.sheetFailed}
            </span>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Escenario versus                                                  */}
      {/* ---------------------------------------------------------------- */}
      <VersusStage
        a={sideA.sheet}
        b={sideB.sheet}
        index={result?.index ?? null}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Veredicto: quién gana la pelea, el bloque que manda en la página.   */}
      {/* ------------------------------------------------------------------ */}
      {result && sideA.sheet && sideB.sheet && (
        <VerdictHero a={sideA.sheet} b={sideB.sheet} result={result} />
      )}

      {!result && (
        <p className="rounded-2xl border border-slate-700/70 bg-hud-3/60 px-6 py-8 text-center">
          <span className="block font-display text-lg font-bold text-slate-200">
            {t.emptyTitle}
          </span>
          <span className="mt-1.5 block font-mono text-sm text-slate-300">
            {t.emptyBody}
          </span>
        </p>
      )}

      {result && sideA.sheet && sideB.sheet && (
        <>
          {/* -------------------------------------------------------------- */}
          {/* Marcador: el porqué del veredicto, factor a factor.             */}
          {/* -------------------------------------------------------------- */}
          <Panel
            icon={<ClipboardList size={19} />}
            title={t.scoreTitle}
            intro={t.scoreIntro}
          >
            <Scoreboard a={sideA.sheet} b={sideB.sheet} result={result} />
          </Panel>

          {/* -------------------------------------------------------------- */}
          {/* Comparativa estadística                                        */}
          {/* -------------------------------------------------------------- */}
          <Panel icon={<Gauge size={19} />} title={t.statsTitle}>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,430px)_1fr] lg:items-center">
              <div>
                <p className="mb-3 text-center font-mono text-sm font-semibold tracking-[0.2em] text-slate-300 uppercase">
                  {t.radarTitle}
                </p>
                <DualRadar a={sideA.sheet} b={sideB.sheet} />
                {/* Leyenda: qué color es quién. */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
                  {[
                    { color: SIDE_A_COLOR, label: sideA.sheet.label },
                    { color: SIDE_B_COLOR, label: sideB.sheet.label },
                  ].map(({ color, label }) => (
                    <span
                      key={color}
                      className="inline-flex items-center gap-2 font-mono text-xs text-slate-300"
                    >
                      <span
                        aria-hidden
                        style={{ background: color }}
                        className="h-2.5 w-2.5 rounded-sm"
                      />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <p className="text-center font-mono text-sm font-semibold tracking-[0.2em] text-slate-300 uppercase">
                  {t.barsTitle}
                </p>
                <StatFaceOff
                  duels={result.duels}
                  labelA={sideA.sheet.label}
                  labelB={sideB.sheet.label}
                />
                <p className="text-center font-mono text-sm text-emerald-300">
                  {result.wins.a === result.wins.b
                    ? t.winsTie
                    : t.winsSummary(
                        result.wins.a > result.wins.b
                          ? sideA.sheet.label
                          : sideB.sheet.label,
                        Math.max(result.wins.a, result.wins.b),
                        result.duels.length,
                      )}
                </p>
              </div>
            </div>
          </Panel>

          {/* -------------------------------------------------------------- */}
          {/* Veredicto IA                                                   */}
          {/* -------------------------------------------------------------- */}
          <AiVerdict
            a={sideA.sheet}
            b={sideB.sheet}
            verdict={verdict}
            pending={verdictPending}
            error={verdictError}
            onAsk={() => void askVerdict()}
          />
        </>
      )}
    </div>
  );
}
