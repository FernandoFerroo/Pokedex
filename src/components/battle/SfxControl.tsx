"use client";

import { useState } from "react";
import { Volume1, Volume2, VolumeX } from "lucide-react";
import { useSfx, useSfxSettings } from "@/components/audio/SfxProvider";
import { useT } from "@/lib/i18n/client";

/**
 * Control de sonido de la arena: un botón redondo de cristal que despliega
 * el volumen de los efectos (gritos, impactos, alarma de PS…). Vive dentro
 * del marco del combate, no como un widget de página, para que la pantalla
 * se lea como una consola. La música tiene su propio reproductor.
 */
export function SfxControl() {
  const t = useT().battle;
  const sfx = useSfx();
  const { volume, muted, setVolume, toggleMuted } = useSfxSettings();
  const [open, setOpen] = useState(false);
  const off = muted || volume === 0;
  const Icon = off ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div
      role="group"
      aria-label={t.sfxGroupAria}
      className="relative flex items-center"
      onPointerLeave={() => setOpen(false)}
    >
      {/* Slider slides out to the left so it never covers the arena's
          top-right corner; it stays mounted for keyboard users. */}
      <div
        className={`mr-1.5 flex items-center overflow-hidden rounded-full border border-white/15 bg-[#0b1220]/80 backdrop-blur-md transition-all ${
          open ? "w-28 px-2.5 py-1 opacity-100" : "w-0 border-transparent px-0 opacity-0"
        }`}
      >
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={off ? 0 : volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          onPointerUp={() => sfx.play("menu")}
          aria-label={t.sfxVolumeAria}
          tabIndex={open ? 0 : -1}
          className="h-1 w-full cursor-pointer accent-cyan-400"
        />
      </div>
      <button
        type="button"
        onClick={() => {
          if (off) sfx.play("confirm");
          toggleMuted();
        }}
        onPointerEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        aria-pressed={off}
        aria-label={off ? t.sfxOnAria : t.sfxOffAria}
        title={off ? t.sfxOnAria : t.sfxOffAria}
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-[#0b1220]/70 backdrop-blur-md transition ${
          off
            ? "border-white/20 text-slate-400 hover:text-slate-200"
            : "border-cyan-400/50 text-cyan-300 shadow-[0_0_16px_-4px_#22d3ee] hover:text-cyan-200"
        }`}
      >
        <Icon size={14} />
      </button>
    </div>
  );
}
