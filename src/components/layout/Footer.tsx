import { getDict } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n/config";

/** HUD system footer: data-source credits styled as a terminal readout. */
export function Footer({ lang }: { lang: Lang }) {
  const t = getDict(lang).layout;
  return (
    <footer className="relative z-10 mt-12 border-t border-red-500/20 bg-black/70">
      {/* Tricolor energy strip echoing the header's LED row */}
      <div
        aria-hidden
        className="h-0.5 w-full bg-gradient-to-r from-red-500/70 via-yellow-400/50 to-emerald-400/70 opacity-80"
      />
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5">
        <p className="font-mono text-xs tracking-[0.2em] text-slate-500 uppercase">
          <span aria-hidden className="mr-2 text-red-500/80">
            ►
          </span>
          {t.footerSystem}
          <span aria-hidden className="cursor-blink ml-1.5 text-emerald-500/80">
            ▊
          </span>
        </p>
        <p className="font-mono text-xs tracking-wider text-slate-500">
          {t.footerData}{" "}
          <a
            href="https://pokeapi.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 underline decoration-slate-700 underline-offset-4 transition hover:text-cyan-300 hover:decoration-cyan-400/60"
          >
            PokéAPI
          </a>
          {" · "}
          {t.footerCards}{" "}
          <a
            href="https://tcgdex.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 underline decoration-slate-700 underline-offset-4 transition hover:text-cyan-300 hover:decoration-cyan-400/60"
          >
            TCGdex
          </a>
        </p>
        <p className="font-mono text-xs tracking-wider text-slate-600">
          {t.footerLegal}
        </p>
      </div>
    </footer>
  );
}
