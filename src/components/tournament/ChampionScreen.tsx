"use client";

import Link from "next/link";
import { Crown, RotateCcw } from "lucide-react";
import type { CSSProperties } from "react";
import { Scenery } from "@/components/battle/scene/Scenery";
import { useT } from "@/lib/i18n/client";
import { typeAura } from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";
import type { Battler } from "@/types/battle";
import type {
  TournamentFormat,
  TournamentRecord,
  TournamentTrainer,
} from "@/types/tournament";
import { difficultyOf, drawSize } from "@/types/tournament";

/**
 * Ceremonia de campeón: lo último que ve quien gana el torneo, así que es la
 * pantalla más trabajada del modo.
 *
 * Se monta en tres tiempos, como la entrega de una copa de verdad:
 *
 *   1. El estadio sigue ahí — es el mismo decorado sobre el que se acaba de
 *      jugar la final, no un fondo nuevo —, atenuado y con papelillos.
 *   2. La copa sube al centro sobre un abanico de focos, con el nombre del
 *      torneo grabado en la peana.
 *   3. El Salón de la Fama va revelando al equipo de uno en uno, con quien
 *      cayó en combate retratado en gris, y debajo el registro de la carrera.
 *
 * Todo el movimiento se apaga con `prefers-reduced-motion`.
 */

/** Metal de cada copa: el oro es común, la piedra la firma cada torneo. */
const CUP_GEM: Record<TournamentFormat, string> = {
  3: "#22c55e",
  4: "#fbbf24",
  5: "#a855f7",
};

interface ChampionScreenProps {
  /** Formato jugado: da nombre, dificultad y color de la copa. */
  format: TournamentFormat;
  /** Regla de curación con la que se disputó el torneo. */
  heal: boolean;
  /** La escalera completa; el último peldaño es el finalista. */
  trainers: TournamentTrainer[];
  /** El equipo tal y como acabó la final, heridas incluidas. */
  team: Battler[];
  /** Marca histórica ya actualizada con este título. */
  record: TournamentRecord;
  /** Vuelve al vestíbulo a inscribirse en otra copa. */
  onAgain: () => void;
}

export function ChampionScreen({
  format,
  heal,
  trainers,
  team,
  record,
  onAgain,
}: ChampionScreenProps) {
  const t = useT();
  const tt = t.tournament;
  const gem = CUP_GEM[format];
  const cup = tt.cupName[format];
  const finalist = trainers[trainers.length - 1];
  const finalistName = `${finalist?.trainerClass ?? ""} ${
    finalist?.name ?? ""
  }`.trim();

  return (
    <div
      className="relative flex min-h-[calc(100dvh-5rem)] w-full flex-col items-center justify-center overflow-hidden px-4 py-5"
      style={{ "--gem": gem } as CSSProperties}
    >
      {/* El estadio de la final, en penumbra: la ceremonia ocurre donde se
          ganó, no en una pantalla aparte. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Scenery scenario="estadio" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(0,0,0,0.35),rgba(0,0,0,0.88)_72%)]" />
      </div>
      <Confetti gem={gem} />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-4 sm:gap-5">
        {/* ---- Copa ---- */}
        <div className="champ-trophy relative flex flex-col items-center">
          <span aria-hidden className="champ-rays absolute -z-10 h-[26rem] w-[26rem] max-sm:h-60 max-sm:w-60" />
          {/* Charco de luz de los focos del estadio, justo detrás del metal. */}
          <span
            aria-hidden
            className="absolute -z-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(253,230,138,0.28),transparent_70%)] blur-xl max-sm:h-40 max-sm:w-40"
          />
          <TrophyCup gem={gem} label={cup} />
        </div>

        {/* ---- Título ---- */}
        <div className="champ-in flex flex-col items-center gap-2 text-center" style={{ animationDelay: "260ms" }}>
          <h1 className="premium-text font-display text-4xl font-black tracking-[0.16em] sm:text-5xl">
            {tt.championTitle}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge tone="gem">{cup}</Badge>
            <Badge>{tt.difficultyBadge[difficultyOf(format)]}</Badge>
            <Badge>{heal ? tt.healOn : tt.healOff}</Badge>
          </div>
          <p className="max-w-xl text-balance text-slate-200">
            {tt.championBody(finalistName)}
          </p>
        </div>

        {/* ---- Salón de la Fama ---- */}
        <section
          className="champ-in premium-frame premium-sweep relative w-full overflow-hidden rounded-2xl px-4 py-4 sm:px-6"
          style={{ animationDelay: "420ms" }}
        >
          <h2 className="mb-4 flex items-center justify-center gap-2 font-mono text-[11px] tracking-[0.32em] text-amber-200/80 uppercase sm:text-xs">
            <Crown size={14} className="text-amber-300" />
            {tt.hallOfFame}
          </h2>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            {team.map((member, i) => (
              <HallOfFameSlot key={member.id} member={member} index={i} />
            ))}
          </ul>
        </section>

        {/* ---- Registro de la carrera ---- */}
        <div
          className="champ-in grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
          style={{ animationDelay: "560ms" }}
        >
          <Stat label={tt.roundsWord} value={`${trainers.length}`} />
          {/* El cuadro completo del que se sale campeón: 8, 16 o 32. */}
          <Stat label={tt.championStatTrainers} value={`${drawSize(format)}`} />
          <Stat label={tt.championStatTitles} value={`${record.titles}`} highlight />
          <Stat label={tt.championStatStreak} value={`${record.bestStreak}`} />
        </div>

        {/* ---- Salidas ---- */}
        <div
          className="champ-in flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "700ms" }}
        >
          <button
            type="button"
            onClick={onAgain}
            className="inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-6 py-3 font-mono text-sm font-bold tracking-wider text-amber-950 uppercase shadow-[0_0_24px_-6px_rgba(251,191,36,0.9)] transition hover:from-amber-300 hover:to-amber-500 hover:shadow-[0_0_30px_rgba(251,191,36,0.55)]"
          >
            <RotateCcw size={15} />
            {tt.againCta}
          </button>
          <Link
            href="/"
            className="rounded-md border border-slate-600 px-6 py-3 font-mono text-sm tracking-wider text-slate-300 uppercase transition hover:border-amber-300/60 hover:bg-amber-400/10 hover:text-amber-200"
          >
            {tt.homeCta}
          </Link>
        </div>

        <p
          className="champ-in font-mono text-[11px] tracking-widest text-amber-200/60"
          style={{ animationDelay: "820ms" }}
        >
          {tt.championRecord(record.titles)}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Piezas                                                              */
/* ------------------------------------------------------------------ */

/** Chapa de datos del torneo bajo el título. */
function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "gem";
}) {
  return (
    <span
      className={cn(
        "rounded-sm border px-2.5 py-1 font-mono text-[11px] font-bold tracking-[0.18em] uppercase",
        tone === "gem"
          ? "border-[var(--gem)] bg-[color-mix(in_srgb,var(--gem)_18%,transparent)] text-[var(--gem)]"
          : "border-slate-600/80 bg-black/40 text-slate-300",
      )}
    >
      {children}
    </span>
  );
}

/**
 * Un Pokémon en su hornacina. Quien acabó la final en pie sale iluminado por
 * el aura de su tipo; quien cayó, en gris y con la peana apagada — el equipo
 * cuenta cómo se ganó la copa, no solo quién estaba apuntado.
 */
function HallOfFameSlot({ member, index }: { member: Battler; index: number }) {
  const t = useT();
  const fainted = member.hp <= 0;
  const aura = typeAura(member.types[0]);
  const art = member.sprites.art ?? member.sprites.front;
  const hpRatio = member.maxHp > 0 ? Math.max(0, member.hp / member.maxHp) : 0;

  return (
    <li
      className="champ-hof relative flex flex-col items-center gap-1 rounded-lg border border-amber-300/20 bg-black/40 px-1.5 pt-2 pb-1.5"
      style={
        {
          "--aura": aura,
          animationDelay: `${560 + index * 90}ms`,
        } as CSSProperties
      }
    >
      <div className="relative mx-auto aspect-square w-full max-w-[5.5rem]">
        <span
          aria-hidden
          className="absolute inset-x-2 bottom-0 h-2 rounded-[50%] bg-[radial-gradient(ellipse,var(--aura),transparent_70%)] opacity-60"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={art}
          alt={t.a11y.artOf(member.label)}
          className={cn(
            "h-full w-full object-contain transition duration-500",
            fainted && "opacity-45 grayscale",
          )}
          style={{
            filter: fainted
              ? undefined
              : `drop-shadow(0 0 14px color-mix(in srgb, ${aura} 55%, transparent))`,
          }}
        />
      </div>
      <p className="w-full truncate text-center font-display text-[11px] font-bold text-slate-100 sm:text-sm">
        {member.label}
      </p>
      {/* Cómo llegó al final: la barra es la salud con la que levantó la copa,
          y en Modo Estándar sale siempre llena porque así se jugó. */}
      <span aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
        <span
          className="block h-full rounded-full"
          style={{
            width: `${Math.round(hpRatio * 100)}%`,
            background: fainted ? "#64748b" : "var(--aura)",
          }}
        />
      </span>
    </li>
  );
}

/** Cifra del registro de la carrera. */
function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-black/50 px-3 py-2.5 text-center",
        highlight
          ? "border-amber-300/60 shadow-[0_0_20px_-8px_rgba(251,191,36,0.8)]"
          : "border-slate-700/70",
      )}
    >
      <p className="font-mono text-[10px] tracking-[0.2em] text-slate-400 uppercase">
        {label}
      </p>
      <p
        className={cn(
          "font-display text-2xl font-black",
          highlight ? "premium-text" : "text-slate-100",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * La copa, dibujada en vector: cuenco de oro con asas, piedra del torneo
 * engastada y peana con el nombre grabado. Es la única ilustración de la
 * pantalla, así que carga con el peso de la celebración.
 */
function TrophyCup({ gem, label }: { gem: string; label: string }) {
  return (
    <svg
      viewBox="0 0 220 240"
      role="img"
      aria-label={label}
      className="h-36 w-auto drop-shadow-[0_18px_28px_rgba(0,0,0,0.65)] sm:h-52"
    >
      <defs>
        <linearGradient id="champ-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="28%" stopColor="#fbbf24" />
          <stop offset="55%" stopColor="#b45309" />
          <stop offset="78%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="champ-gold-soft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
        <radialGradient id="champ-gem">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="45%" stopColor={gem} />
          <stop offset="100%" stopColor={gem} stopOpacity="0.75" />
        </radialGradient>
      </defs>

      {/* Asas */}
      <path
        d="M56 62c-30 0-38 22-30 42 7 18 24 26 40 28"
        fill="none"
        stroke="url(#champ-gold)"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d="M164 62c30 0 38 22 30 42-7 18-24 26-40 28"
        fill="none"
        stroke="url(#champ-gold)"
        strokeWidth="11"
        strokeLinecap="round"
      />

      {/* Cuenco */}
      <path
        d="M52 48h116l-8 62c-4 30-24 48-50 48s-46-18-50-48z"
        fill="url(#champ-gold)"
      />
      {/* Brillo del cuenco */}
      <path
        d="M70 58h16l-4 52c-2 16-4 26-8 32-8-10-10-26-8-46z"
        fill="#fff7d6"
        opacity="0.5"
      />
      {/* Aro superior */}
      <rect x="44" y="38" width="132" height="16" rx="7" fill="url(#champ-gold-soft)" />

      {/* Piedra del torneo */}
      <circle cx="110" cy="96" r="20" fill="url(#champ-gem)" />
      <circle cx="110" cy="96" r="20" fill="none" stroke="#fde68a" strokeWidth="3" />
      <circle cx="103" cy="89" r="5" fill="#ffffff" opacity="0.75" />

      {/* Vástago y peana */}
      <path d="M100 158h20v20h-20z" fill="url(#champ-gold-soft)" />
      <path d="M78 178h64l8 18H70z" fill="url(#champ-gold)" />
      <rect x="52" y="196" width="116" height="26" rx="5" fill="url(#champ-gold-soft)" />
      <rect x="52" y="196" width="116" height="26" rx="5" fill="none" stroke="#78350f" strokeWidth="2" />
      {/* Grabado de la peana: el nombre del torneo levantado. */}
      <text
        x="110"
        y="213"
        textAnchor="middle"
        fill="#3b2503"
        fontSize="13"
        fontWeight="700"
        letterSpacing="1.5"
        fontFamily="var(--font-display, system-ui)"
      >
        {label.toUpperCase()}
      </text>
    </svg>
  );
}

/** Lluvia de papelillos sobre la ceremonia, con el color del torneo. */
function Confetti({ gem }: { gem: string }) {
  const colors = ["#fde68a", "#fbbf24", "#f59e0b", gem, "#ffffff"];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 44 }, (_, i) => (
        <span
          key={i}
          className="fx-confetti"
          style={{
            left: `${(i * 17) % 100}%`,
            animationDelay: `${(i % 11) * 0.42}s`,
            animationDuration: `${5 + (i % 5)}s`,
            background: colors[i % colors.length],
          }}
        />
      ))}
    </div>
  );
}
