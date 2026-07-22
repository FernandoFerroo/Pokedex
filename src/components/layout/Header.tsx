import Link from "next/link";

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

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-red-500/20 bg-black/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-3">
          {/* Blue camera lens + LEDs, straight off the Kanto Pokédex lid */}
          <span aria-hidden className="flex items-center gap-2">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 via-blue-500 to-blue-800 ring-2 ring-slate-600/80 transition group-hover:ring-sky-400/80 group-hover:shadow-[0_0_18px_2px_rgba(56,189,248,0.5)]">
              <span className="absolute top-1.5 left-2 h-2.5 w-2.5 rounded-full bg-white/80 blur-[1px]" />
            </span>
            <span className="flex flex-col gap-1">
              {LEDS.map(({ color, delay }) => (
                <span
                  key={delay}
                  className={`led h-1.5 w-1.5 rounded-full ${color}`}
                  style={{ animationDelay: delay }}
                />
              ))}
            </span>
          </span>
          <span className="flex flex-col gap-1">
            <span className="neon-red font-pixel text-sm tracking-wide">
              POKéDEX
            </span>
            <span className="hidden font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase sm:block">
              Sistema Nacional · Gen I–IX
            </span>
          </span>
        </Link>

        <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-emerald-400 uppercase">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_1px_rgba(52,211,153,0.8)]" />
          </span>
          Online
        </span>
      </div>
      {/* Tricolor energy strip echoing the LED row */}
      <div
        aria-hidden
        className="h-px w-full bg-gradient-to-r from-red-500/70 via-yellow-400/50 to-emerald-400/70"
      />
    </header>
  );
}
