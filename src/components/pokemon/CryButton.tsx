"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";

interface CryButtonProps {
  /** URL of the cry audio (OGG from PokéAPI). */
  src: string;
  /** Display name, used for the accessible label. */
  name: string;
}

/** Plays the creature's cry. Styled like the rest of the HUD chrome. */
export function CryButton({ src, name }: CryButtonProps) {
  const d = useT().detail;
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
      aria-label={d.cryAria(name)}
      className={`glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[13px] font-medium tracking-widest uppercase ${
        playing ? "glass-btn-on" : ""
      }`}
    >
      <Volume2 size={13} className={playing ? "animate-pulse" : undefined} />
      {d.cry}
    </button>
  );
}
