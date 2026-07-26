"use client";

import { Music2, Volume1, Volume2, VolumeX, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";

/** Soundtrack lo-fi que suena en bucle (embed oficial de YouTube). */
const VIDEO_ID = "gvi0H2E-XcI";

const STORAGE_KEY = "pokedex-bgm-yt";

/** Volumen inicial suave (escala 0-100 de YouTube). */
const DEFAULT_VOLUME = 20;

interface StoredPrefs {
  volume: number;
  muted: boolean;
}

/** Minimal surface of the YouTube IFrame API that we actually use. */
interface YTPlayer {
  playVideo(): void;
  mute(): void;
  unMute(): void;
  setVolume(volume: number): void;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      width: string;
      height: string;
      playerVars: Record<string, string | number>;
      events: { onReady: (event: { target: YTPlayer }) => void };
    },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace & { loaded?: number };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Loads the official IFrame API once and resolves with the YT namespace. */
let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  apiPromise ??= new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return apiPromise;
}

/**
 * BGM del sitio: el soundtrack de YouTube en bucle, embebido con el player
 * oficial (el audio se sirve desde YouTube — sin archivos locales). Píldora
 * flotante sobre el cajón del equipo; expandida muestra el vídeo en miniatura
 * con silenciar y control de volumen. Al minimizar, la música sigue sonando.
 *
 * Autoplay: arranca silenciado (lo único que permiten los navegadores) y se
 * activa el sonido en la primera interacción del usuario, salvo que él mismo
 * lo hubiera silenciado en una visita anterior.
 */
export function SoundtrackPlayer() {
  const { home: t, a11y } = useT();
  // Inside the arena the floating pill would sit on top of the battlefield
  // and break the console illusion, so it hides there — the iframe stays
  // mounted and the music keeps playing through the fight.
  const inArena = usePathname()?.startsWith("/battle") ?? false;
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  /** El usuario silenció explícitamente: no auto-activar el sonido. */
  const userMutedRef = useRef(false);
  /** Prefs are read after mount (SSR-safe); don't persist until then. */
  const [loaded, setLoaded] = useState(false);

  // Restore saved prefs once on mount (same pattern as TeamProvider).
  /* eslint-disable react-hooks/set-state-in-effect -- one-time restore */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<StoredPrefs>;
        if (typeof saved.volume === "number") {
          setVolume(Math.min(100, Math.max(0, Math.round(saved.volume))));
        }
        userMutedRef.current = saved.muted === true;
      }
    } catch {
      // Corrupt prefs: fall back to defaults.
    }
    setLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist prefs on every change (after the initial restore). `muted` here
  // is the user's explicit choice, NOT the transient muted-autoplay state —
  // otherwise a saved first visit would permanently silence the player.
  useEffect(() => {
    if (!loaded || !ready) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        volume,
        muted: userMutedRef.current,
      } satisfies StoredPrefs),
    );
  }, [loaded, ready, volume, muted]);

  // Create the looping player once. `playlist: VIDEO_ID` is how the IFrame
  // API loops a single video.
  useEffect(() => {
    if (!loaded) return;
    const mount = mountRef.current;
    if (!mount) return;
    let player: YTPlayer | null = null;
    let cancelled = false;
    const holder = document.createElement("div");
    mount.appendChild(holder);
    loadYouTubeApi().then((yt) => {
      if (cancelled) return;
      player = new yt.Player(holder, {
        videoId: VIDEO_ID,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          loop: 1,
          playlist: VIDEO_ID,
          controls: 0,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
            event.target.playVideo();
            setReady(true);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      playerRef.current = null;
      player?.destroy();
      holder.remove();
    };
  }, [loaded]);

  // Apply volume/mute to the player whenever they change.
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !ready) return;
    player.setVolume(volume);
    if (muted) {
      player.mute();
    } else {
      player.unMute();
      player.playVideo();
    }
  }, [ready, muted, volume]);

  // Muted autoplay is all browsers allow, so the sound switches on at the
  // user's first interaction — unless they muted it themselves last visit.
  useEffect(() => {
    if (!ready || userMutedRef.current) return;
    const unmute = () => setMuted(false);
    window.addEventListener("pointerdown", unmute, { once: true });
    window.addEventListener("keydown", unmute, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unmute);
      window.removeEventListener("keydown", unmute);
    };
  }, [ready]);

  const toggleMute = () => {
    setMuted((m) => {
      userMutedRef.current = !m;
      return !m;
    });
  };

  const changeVolume = (next: number) => {
    setVolume(next);
    // Dragging the slider up counts as wanting sound.
    if (next > 0 && muted) {
      userMutedRef.current = false;
      setMuted(false);
    }
  };

  const audible = ready && !muted && volume > 0;
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    // `hidden` (not unmounted) during the battle: tearing the component down
    // would destroy the YouTube player and cut the soundtrack.
    <div
      // `--float-bottom` clears the sticky pager that the dex parks at the
      // bottom edge, plus the iPhone home indicator underneath it.
      className={`fixed bottom-[var(--float-bottom)] left-3 z-30 sm:bottom-20 sm:left-5 ${inArena ? "hidden" : ""}`}
      inert={inArena}
    >
      {/* Collapsed pill: mute + volume always at hand, no need to expand. */}
      <div
        role="group"
        aria-label={t.playerGroupAria}
        // Expanded, the pill is only faded out (`opacity-0`), which hides it
        // from the eye but not from Tab or a screen reader: `inert` keeps the
        // two states from both being reachable at once.
        inert={open}
        className={`flex items-center gap-2 rounded-full border border-slate-700/80 bg-hud-1/80 py-1.5 pr-1.5 pl-1.5 shadow-[0_0_18px_-2px_rgba(34,211,238,0.4)] backdrop-blur-md transition hover:border-cyan-400/60 hover:shadow-[0_0_24px_-2px_rgba(34,211,238,0.65)] sm:pr-3.5 ${open ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.openPlayerAria}
          aria-expanded={open}
          title={t.openPlayerTitle}
          className="flex items-center gap-1.5 rounded-full p-1.5 transition hover:bg-white/5"
        >
          <Music2 size={16} className="text-cyan-300" />
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${audible ? "animate-pulse bg-[#34d399] shadow-[0_0_8px_rgba(52,211,153,0.9)]" : "bg-slate-600"}`}
          />
        </button>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? t.unmuteAria : t.muteAria}
          aria-pressed={muted}
          className={`rounded-full p-1 transition ${muted ? "text-slate-500 hover:text-slate-300" : "text-cyan-300 hover:text-cyan-200"}`}
        >
          <VolumeIcon size={15} />
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={muted ? 0 : volume}
          onChange={(e) => changeVolume(Number(e.target.value))}
          aria-label={t.volumeAria}

          aria-valuetext={a11y.volumeValueText(muted ? 0 : volume)}
          // Dragging a 1px-tall slider is a desktop gesture anyway; on phones
          // the collapsed pill keeps only play-state + mute, and the full
          // volume control lives one tap away in the expanded panel.
          className="h-1 w-20 cursor-pointer accent-cyan-400 max-sm:hidden"
        />
        <span className="w-8 text-right font-mono text-xs text-slate-400 tabular-nums max-sm:hidden">
          {muted ? 0 : volume}%
        </span>
      </div>

      {/* Expanded panel — the iframe stays mounted while minimized so the
          music keeps playing; only the panel's visibility changes. */}
      <div
        role="group"
        aria-label={a11y.playerPanelAria}
        inert={!open}
        className={`absolute bottom-0 left-0 w-72 rounded-xl border border-slate-700/70 bg-hud-1/75 p-4 shadow-[0_0_28px_-4px_rgba(34,211,238,0.45)] backdrop-blur-xl transition ${open ? "visible opacity-100" : "invisible translate-y-2 opacity-0"}`}
      >
        <div className="flex items-center justify-between">
          <p className="font-pixel text-xs text-cyan-300">
            <span aria-hidden className="mr-1.5 text-red-500">
              ►
            </span>
            {t.bgmTitle}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t.minimizeAria}
            className="rounded p-1 text-slate-400 transition hover:text-slate-50"
          >
            <X size={15} />
          </button>
        </div>

        {/* Mini player. The iframe is non-interactive (so the hover UI never
            appears) and zoom-cropped so the title/logo overlays at the edges
            stay outside the visible frame — only the imagery shows. */}
        <div
          ref={mountRef}
          className="relative mt-3 aspect-video w-full overflow-hidden rounded-md border border-slate-700/60 bg-black/70 [&_iframe]:pointer-events-none [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:scale-[1.45]"
        >
          {!ready && (
            <p className="flex h-full items-center justify-center font-mono text-xs text-slate-500">
              {t.loadingSoundtrack}
            </p>
          )}
        </div>

        {/* Mute + volume */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? t.unmuteAria : t.muteAria}
            aria-pressed={muted}
            className={`rounded-full border p-2 transition ${
              muted
                ? "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
                : "border-cyan-400/50 bg-cyan-400/10 text-cyan-300 shadow-[0_0_14px_-2px_rgba(34,211,238,0.6)]"
            }`}
          >
            <VolumeIcon size={15} />
          </button>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            aria-label={t.volumeAria}

            aria-valuetext={a11y.volumeValueText(muted ? 0 : volume)}
            className="h-1 w-full cursor-pointer accent-cyan-400"
          />
          <span className="w-9 text-right font-mono text-xs text-slate-400 tabular-nums">
            {muted ? 0 : volume}%
          </span>
        </div>

        {muted && ready && (
          <p className="mt-2 font-mono text-xs text-amber-300/90">
            {t.mutedHint}
          </p>
        )}

        <p className="mt-2 font-mono text-[11px] leading-snug text-slate-500">
          {t.minimizeHint}
        </p>
      </div>
    </div>
  );
}
