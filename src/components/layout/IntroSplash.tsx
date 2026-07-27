"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n/config";
import { layoutDict } from "@/lib/i18n/dictionaries/layout";

/** Shown once per browser session. */
const SEEN_KEY = "intro-seen";

/**
 * Mini intro al entrar en la web: una Poké Ball neón cae sobre el HUD, se
 * agita como en una captura y estalla en un anillo de luz antes de desvelar
 * la Pokédex. Dura ~2 s, se muestra una vez por sesión y se omite por
 * completo con `prefers-reduced-motion`.
 */
export function IntroSplash({ lang }: { lang: Lang }) {
  const [phase, setPhase] = useState<"hidden" | "playing" | "leaving">(
    "hidden",
  );

  // One-time kick-off after mount (same pattern as SoundtrackPlayer).
  /* eslint-disable react-hooks/set-state-in-effect -- one-time session check */
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY) === "1") return;
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Storage unavailable: show the intro anyway.
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPhase("playing");
    const leave = setTimeout(() => setPhase("leaving"), 1750);
    const done = setTimeout(() => setPhase("hidden"), 2300);
    return () => {
      clearTimeout(leave);
      clearTimeout(done);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (phase === "hidden") return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8 bg-[#020204] transition-opacity duration-500 ${
        phase === "leaving" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Red lens glow, same as the app backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_45%,rgba(239,68,68,0.14),transparent_70%)]" />

      <div className="relative flex items-center justify-center">
        {/* Ring burst when the ball "opens" */}
        <span className="intro-ring absolute h-40 w-40 rounded-full border-2 border-red-400/90 shadow-[0_0_30px_6px_rgba(239,68,68,0.55),inset_0_0_18px_rgba(239,68,68,0.4)]" />
        {/* Drop + bounce, then capture wobble */}
        <div className="intro-ball">
          <div className="intro-wobble">
            <svg viewBox="0 0 36 36" className="h-28 w-28">
              <circle cx="18" cy="18" r="16.5" fill="#f8fafc" />
              <path d="M1.5 18 A16.5 16.5 0 0 1 34.5 18 Z" fill="#ef4444" />
              <ellipse
                cx="11"
                cy="9.5"
                rx="4.5"
                ry="2.8"
                fill="#fca5a5"
                opacity="0.8"
                transform="rotate(-25 11 9.5)"
              />
              <path
                d="M1.57 16.5 h32.86 a16.5 16.5 0 0 1 0 3 H1.57 a16.5 16.5 0 0 1 0 -3 Z"
                fill="#1e293b"
              />
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
              <circle
                cx="18"
                cy="18"
                r="16.5"
                fill="none"
                stroke="#1e293b"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>
      </div>

      <p className="motion-safe:animate-[fade-in_500ms_ease_300ms_both] font-pixel text-xs tracking-widest text-red-400 [text-shadow:0_0_10px_rgba(239,68,68,0.7)]">
        {layoutDict[lang].introBooting}
        <span className="cursor-blink ml-1 inline-block h-3 w-2 translate-y-0.5 bg-red-400" />
      </p>
    </div>
  );
}
