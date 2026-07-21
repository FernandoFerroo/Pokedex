"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TcgCard } from "@/lib/tcgdex";

interface CardGridProps {
  cards: TcgCard[];
}

export function CardGrid({ cards }: CardGridProps) {
  const [active, setActive] = useState<TcgCard | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {cards.map((card) => (
          <li key={card.id}>
            <button
              type="button"
              onClick={() => setActive(card)}
              aria-label={`Ampliar carta ${card.name}`}
              className="group relative block aspect-63/88 w-full cursor-zoom-in overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none motion-safe:hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-800"
            >
              <Image
                src={card.imageUrl}
                alt={`Carta ${card.name}`}
                fill
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 160px"
                className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <HoloLightbox card={active} onClose={() => setActive(null)} />
      )}
    </>
  );
}

/**
 * Enlarged card with a pointer-tracked "holo" treatment: the card tilts in 3D
 * toward the cursor while a rainbow sheen + glare sweep across the foil,
 * driven by CSS vars so pointer moves never re-render React.
 */
function HoloLightbox({
  card,
  onClose,
}: {
  card: TcgCard;
  onClose: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const handleMove = useCallback((e: React.PointerEvent) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    frame.style.setProperty("--px", String(px));
    frame.style.setProperty("--py", String(py));
    frame.style.setProperty("--holo", "1");
  }, []);

  const handleLeave = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;
    frame.style.setProperty("--px", "0.5");
    frame.style.setProperty("--py", "0.5");
    frame.style.setProperty("--holo", "0");
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Carta ${card.name} ampliada`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm motion-safe:animate-[fade-in_200ms_ease-out]"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
      >
        <X size={20} />
      </button>

      <figure
        className="flex max-h-full flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ perspective: "1200px" }}>
          <div
            ref={frameRef}
            onPointerMove={handleMove}
            onPointerLeave={handleLeave}
            className="holo-card relative aspect-63/88 w-[min(78vw,380px)] max-h-[78vh] overflow-hidden rounded-xl shadow-2xl shadow-black/60"
          >
            <Image
              src={card.imageHighUrl}
              alt={`Carta ${card.name}`}
              fill
              priority
              sizes="380px"
              className="object-cover"
            />
            <div aria-hidden className="holo-card-sheen absolute inset-0" />
            <div aria-hidden className="holo-card-glare absolute inset-0" />
          </div>
        </div>
        <figcaption className="text-sm font-medium text-white/90">
          {card.name}
          <span className="ml-2 text-xs font-normal text-white/50">
            Mueve el cursor sobre la carta
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
