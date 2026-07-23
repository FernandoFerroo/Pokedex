"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

/**
 * Windowed page list: first, last and the pages around the current one,
 * with "gap" markers where runs are elided — 1 … 5 6 [7] 8 9 … 18.
 */
function pageWindow(current: number, total: number): (number | "gap")[] {
  const wanted = new Set([1, total, current - 1, current, current + 1]);
  const pages = [...wanted]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const out: (number | "gap")[] = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev === 2) out.push(prev + 1);
    else if (p - prev > 2) out.push("gap");
    out.push(p);
    prev = p;
  }
  return out;
}

const buttonBase =
  "inline-flex h-8 min-w-8 items-center justify-center rounded border px-1.5 font-mono text-xs transition select-none";
const buttonIdle =
  "border-slate-700/80 bg-black/40 text-slate-300 hover:border-cyan-400/70 hover:text-cyan-300 hover:shadow-[0_0_14px_rgba(34,211,238,0.3)]";
const buttonActive =
  "border-red-400/90 bg-red-500/10 font-pixel text-xs text-red-300 shadow-[0_0_16px_rgba(248,113,113,0.45)]";

/**
 * Compact single-row pager for the sticky bottom bar: neon active section,
 * cyan hover, elided runs and a small readout on wider screens.
 */
export function Pagination({ current, total, onChange }: PaginationProps) {
  if (total <= 1) return null;

  return (
    <nav
      aria-label="Paginación de resultados"
      className="flex flex-wrap items-center justify-center gap-1.5 py-2.5"
    >
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        aria-label="Página anterior"
        className={`${buttonBase} ${buttonIdle} disabled:pointer-events-none disabled:opacity-35`}
      >
        <ChevronLeft size={14} />
      </button>

      {pageWindow(current, total).map((item, i) =>
        item === "gap" ? (
          <span
            key={`gap-${i}`}
            aria-hidden
            className="px-0.5 font-mono text-xs text-slate-600"
          >
            ···
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-label={`Ir a la página ${item}`}
            aria-current={item === current ? "page" : undefined}
            className={`${buttonBase} ${item === current ? buttonActive : buttonIdle}`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        aria-label="Página siguiente"
        className={`${buttonBase} ${buttonIdle} disabled:pointer-events-none disabled:opacity-35`}
      >
        <ChevronRight size={14} />
      </button>

      <span className="ml-3 hidden font-mono text-xs tracking-[0.25em] text-slate-400 uppercase sm:inline">
        Pág {String(current).padStart(2, "0")}/{String(total).padStart(2, "0")}
      </span>
    </nav>
  );
}
