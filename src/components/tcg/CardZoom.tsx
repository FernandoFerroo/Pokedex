"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import type { PoolCard } from "@/types/tcg";
import { useT } from "@/lib/i18n/client";
import { RARITY_EDGE } from "@/lib/tcg/style";
import { TcgCardFace } from "./TcgCardFace";

/**
 * La carta a tamaño completo, con el acabado al máximo: aquí sí se inclina al
 * puntero y el arcoíris se mueve, porque es la única carta en pantalla.
 */
export function CardZoom({
  card,
  aura,
  onClose,
}: {
  card: PoolCard;
  aura: string;
  onClose: () => void;
}) {
  const t = useT().tcg;
  const closeRef = useRef<HTMLButtonElement>(null);

  // El visor se abre sobre la rejilla pero el foco se queda detrás, así que
  // sin esto Escape sería la única salida para quien navega con teclado.
  useEffect(() => closeRef.current?.focus(), []);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.zoomAria(card.name)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm motion-safe:animate-[fade-in_200ms_ease-out]"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t.closeZoom}
        className="absolute top-4 right-4 rounded-full bg-slate-100/10 p-2 text-slate-100/80 transition hover:bg-slate-100/20 hover:text-slate-100"
      >
        <X size={20} />
      </button>

      <figure
        className="flex max-h-full flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pedestal holográfico: el halo del tipo por debajo y la carta
            flotando encima. Con el dedo también se inclina — aquí la carta ES
            la pantalla, así que no hay desplazamiento que robarle. */}
        <div className="holo-stage" style={{ "--aura": aura } as CSSProperties}>
          <span aria-hidden className="holo-stage__glow" />
          <TcgCardFace
            card={card}
            aura={aura}
            motion="live"
            high
            priority
            holo
            tilt={16}
            sizes="380px"
            className="holo-stage__card w-[min(78vw,380px)] max-h-[78vh] touch-none shadow-2xl shadow-black/60"
          />
          <span aria-hidden className="holo-stage__pad" />
        </div>
        <figcaption className="text-center text-sm font-medium text-slate-100/90">
          {card.name}
          <span
            className="ml-2 rounded-full px-2 py-0.5 font-mono text-[10px]"
            style={{
              color: RARITY_EDGE[card.rarity],
              background: `color-mix(in srgb, ${RARITY_EDGE[card.rarity]} 15%, transparent)`,
            }}
          >
            {t.rarityName[card.rarity]}
          </span>
          <span className="mt-1 block font-mono text-[10px] text-slate-500">
            {t.holoHint}
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
