"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CryButtonProps {
  /** URL of the cry audio (OGG from PokéAPI). */
  src: string;
  /** Display name, used for the accessible label. */
  name: string;
}

/** Plays the creature's cry. Styled like the rest of the HUD chrome. */
export function CryButton({ src, name }: CryButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const play = () => {
    if (!audioRef.current) {
      const audio = new Audio(src);
      audio.volume = 0.35;
      audio.addEventListener("ended", () => setPlaying(false));
      audioRef.current = audio;
    }
    audioRef.current.currentTime = 0;
    void audioRef.current
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

  return (
    <button
      type="button"
      onClick={play}
      aria-label={`Reproducir el grito de ${name}`}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[13px] font-medium tracking-widest uppercase transition ${
        playing
          ? "border-[var(--aura)] text-[var(--aura)] shadow-[0_0_14px_-4px_var(--aura)]"
          : "border-slate-700 bg-black/40 text-slate-300 hover:border-[var(--aura)] hover:text-[var(--aura)]"
      }`}
    >
      <Volume2 size={13} className={playing ? "animate-pulse" : undefined} />
      Grito
    </button>
  );
}
