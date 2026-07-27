import { BrandLink } from "@/components/layout/BrandLink";
import { LangToggle, ThemeToggle } from "@/components/layout/HeaderToggles";
import { TeamHeaderButton } from "@/components/team/TeamCta";
import { PeHeaderChip } from "@/components/tcg/PeHeaderChip";
import { getDict } from "@/lib/i18n";
import type { Lang, Theme } from "@/lib/i18n/config";

/** Blink phases for the classic Pokédex indicator LEDs. */
const LEDS = [
  { color: "bg-red-500 shadow-[0_0_6px_1px_rgba(239,68,68,0.8)]", delay: "0s" },
  {
    color: "bg-yellow-400 shadow-[0_0_6px_1px_rgba(250,204,21,0.8)]",
    delay: "0.7s",
  },
  {
    color: "bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.8)]",
    delay: "1.4s",
  },
];

export function Header({ lang, theme }: { lang: Lang; theme: Theme }) {
  const t = getDict(lang).layout;
  // z-[35]: por encima de los chips de los banners (z-[32]) para que al
  // hacer scroll pasen por debajo, y por debajo del chat y el cajón del
  // equipo (z-40).
  return (
    <header className="sticky top-0 z-[35] border-b border-red-500/20 bg-black/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:h-20 sm:px-4">
        <BrandLink className="group flex min-w-0 items-center gap-2 sm:gap-3.5">
          {/* Poké Ball + LEDs on the Kanto Pokédex lid */}
          <span aria-hidden className="flex items-center gap-2">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 ring-slate-600/80 shadow-[0_0_14px_1px_rgba(239,68,68,0.35)] transition duration-300 group-hover:rotate-12 group-hover:ring-red-400/80 group-hover:shadow-[0_0_22px_3px_rgba(239,68,68,0.55)] sm:h-12 sm:w-12">
              <svg viewBox="0 0 36 36" className="h-full w-full">
                {/* Lower half: white */}
                <circle cx="18" cy="18" r="16.5" fill="#f8fafc" />
                {/* Upper half: red */}
                <path d="M1.5 18 A16.5 16.5 0 0 1 34.5 18 Z" fill="#ef4444" />
                {/* Sheen on the red dome */}
                <ellipse
                  cx="11"
                  cy="9.5"
                  rx="4.5"
                  ry="2.8"
                  fill="#fca5a5"
                  opacity="0.8"
                  transform="rotate(-25 11 9.5)"
                />
                {/* Horizontal band */}
                <path
                  d="M1.57 16.5 h32.86 a16.5 16.5 0 0 1 0 3 H1.57 a16.5 16.5 0 0 1 0 -3 Z"
                  fill="#1e293b"
                />
                {/* Center button */}
                <circle cx="18" cy="18" r="6" fill="#1e293b" />
                <circle cx="18" cy="18" r="4" fill="#f8fafc" />
                <circle
                  cx="18"
                  cy="18"
                  r="2.2"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                {/* Outline */}
                <circle
                  cx="18"
                  cy="18"
                  r="16.5"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />
              </svg>
            </span>
            {/* Pure decoration: on phones the ~14px they cost is better spent
                on the wordmark and the controls opposite. */}
            <span className="flex flex-col gap-1.5 max-sm:hidden">
              {LEDS.map(({ color, delay }) => (
                <span
                  key={delay}
                  className={`led h-2 w-2 rounded-full ${color}`}
                  style={{ animationDelay: delay }}
                />
              ))}
            </span>
          </span>
          <span className="flex min-w-0 flex-col">
            {/* One step smaller under 360px (SE-class screens), where the
                controls opposite leave the wordmark ~60px and it would
                otherwise ellipse to "POK…". */}
            <span className="hero-title truncate font-display text-lg font-extrabold tracking-[0.14em] uppercase max-[359px]:text-sm max-[359px]:tracking-normal sm:text-3xl sm:tracking-[0.18em]">
              Pokédex
            </span>
            <span className="mt-1 hidden font-mono text-xs tracking-[0.32em] text-slate-400 uppercase sm:block">
              {t.headerTagline}
            </span>
          </span>
        </BrandLink>

        <span className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {/* Saldo de PE: abre la fila de estado, antes del "Online". */}
          <PeHeaderChip />
          <span className="hidden items-center gap-2 font-mono text-xs tracking-[0.2em] text-emerald-400 uppercase md:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_1px_rgba(52,211,153,0.8)]" />
            </span>
            {t.online}
          </span>
          <TeamHeaderButton />
          <ThemeToggle initial={theme} />
          <LangToggle />
        </span>
      </div>
      {/* Tricolor energy strip echoing the LED row */}
      <div
        aria-hidden
        className="h-0.5 w-full bg-gradient-to-r from-red-500/80 via-yellow-400/60 to-emerald-400/80 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
      />
    </header>
  );
}
