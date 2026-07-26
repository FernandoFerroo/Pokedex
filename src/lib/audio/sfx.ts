/**
 * Motor de efectos de sonido del Modo Combate.
 *
 * Every cue is synthesized live with the Web Audio API — the app ships no
 * audio assets, so the whole battle soundboard costs zero bytes of download
 * and works offline. The only streamed sounds are the Pokémon cries, which
 * come from PokéAPI's own `cries` URLs and play through plain <audio>
 * elements (no CORS handshake needed, unlike decoding them into the graph).
 *
 * The manager is a browser-only singleton: `getSfx()` returns a no-op stub
 * during SSR, so components can call it unconditionally.
 */

/** Every non-parametric cue the battle can fire. */
export type SfxCue =
  | "menu"
  | "confirm"
  | "cancel"
  | "swing"
  | "charge"
  | "miss"
  | "crit"
  | "superEffective"
  | "notVeryEffective"
  | "noEffect"
  | "faint"
  /** Poké Ball leaving the trainer's hand, before it opens. */
  | "ballThrow"
  /** The ball opening: this is the light the Pokémon comes out of. */
  | "sendOut"
  /** Red beam pulling a Pokémon back into its ball. */
  | "recall"
  /** Chime of the ability window sliding in. */
  | "ability"
  /** Bag pouch: the trainer taking an item out and using it. */
  | "itemUse"
  | "heal"
  | "statUp"
  | "statDown"
  | "victory"
  | "defeat"
  | "tick"
  | "alarm";

/** Impact families: each move type maps to the texture of its hit. */
type ImpactFamily =
  | "slash"
  | "fire"
  | "electric"
  | "water"
  | "ice"
  | "nature"
  | "mystic"
  | "metal"
  | "blunt";

/** Type → impact texture. Physical moves override this with a blunt thud
 *  unless their type has a signature sound of its own (Cut, Fire Punch…). */
const IMPACT_BY_TYPE: Record<string, ImpactFamily> = {
  normal: "blunt",
  fire: "fire",
  water: "water",
  electric: "electric",
  grass: "nature",
  ice: "ice",
  fighting: "blunt",
  poison: "mystic",
  ground: "blunt",
  flying: "slash",
  psychic: "mystic",
  bug: "slash",
  rock: "blunt",
  ghost: "mystic",
  dragon: "mystic",
  dark: "mystic",
  steel: "metal",
  fairy: "mystic",
};

/** Types whose hit keeps its own texture even on a physical contact move. */
const KEEPS_TEXTURE = new Set<ImpactFamily>([
  "slash",
  "fire",
  "electric",
  "ice",
  "metal",
]);

type OscShape = OscillatorType;

interface ToneOptions {
  freq: number;
  /** Target frequency; the pitch glides there over `dur`. */
  to?: number;
  type?: OscShape;
  /** Seconds. */
  dur?: number;
  /** Peak gain (0-1), before the master volume. */
  gain?: number;
  /** Start offset in seconds from "now". */
  at?: number;
}

interface NoiseOptions {
  dur?: number;
  gain?: number;
  at?: number;
  filter?: BiquadFilterType;
  /** Filter cutoff at the start / end of the burst. */
  from?: number;
  to?: number;
  q?: number;
}

/** Clamps a gain into the range `exponentialRampToValueAtTime` accepts. */
const audible = (value: number) => Math.max(0.00001, value);

class SfxManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private alarmTimer: number | null = null;
  private tickTimer: number | null = null;
  /** One <audio> per cry URL, reused across the battle. */
  private cries = new Map<string, HTMLAudioElement>();
  private lastCry: HTMLAudioElement | null = null;

  /** 0-1. The UI exposes it as 0-100. */
  private volume = 0.6;
  private muted = false;

  /* ---------------------------------------------------------------- */
  /* Graph                                                            */
  /* ---------------------------------------------------------------- */

  /**
   * Creates the context on demand. Browsers allow the construction before a
   * gesture but start it suspended, so every entry point also nudges it back
   * to "running" — the first click of the session unlocks the whole board.
   */
  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext;
      if (!Ctor) return null;
      try {
        this.ctx = new Ctor();
      } catch {
        return null; // No Web Audio (or blocked): the battle stays silent.
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Call from a user gesture so the context is running before the first cue. */
  unlock(): void {
    this.ensure();
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.02,
      );
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.alarm(false);
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(
        muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.02,
      );
    }
    if (muted && this.lastCry) this.lastCry.pause();
  }

  /** White-noise bed, generated once and reused by every noisy cue. */
  private noise(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  /* ---------------------------------------------------------------- */
  /* Primitives                                                       */
  /* ---------------------------------------------------------------- */

  /** One enveloped oscillator, optionally gliding between two pitches. */
  private tone({
    freq,
    to,
    type = "sine",
    dur = 0.12,
    gain = 0.3,
    at = 0,
  }: ToneOptions): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted) return;
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (to !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    }
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.00001, t0);
    env.gain.exponentialRampToValueAtTime(
      audible(gain),
      t0 + Math.min(0.015, dur * 0.35),
    );
    env.gain.exponentialRampToValueAtTime(0.00001, t0 + dur);
    osc.connect(env).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /** Filtered noise burst: the percussive half of every impact. */
  private burst({
    dur = 0.2,
    gain = 0.3,
    at = 0,
    filter = "lowpass",
    from = 2000,
    to = 300,
    q = 1,
  }: NoiseOptions): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted) return;
    const t0 = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    src.buffer = this.noise(ctx);
    const band = ctx.createBiquadFilter();
    band.type = filter;
    band.Q.value = q;
    band.frequency.setValueAtTime(Math.max(40, from), t0);
    band.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.00001, t0);
    env.gain.exponentialRampToValueAtTime(audible(gain), t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.00001, t0 + dur);
    src.connect(band).connect(env).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  /* ---------------------------------------------------------------- */
  /* Cues                                                             */
  /* ---------------------------------------------------------------- */

  /** Fires a named cue. Unknown names are ignored, never thrown. */
  play(cue: SfxCue, scale = 1): void {
    switch (cue) {
      // Menus: dry, short blips like the games' cursor and confirm sounds.
      case "menu":
        this.tone({ freq: 880, type: "square", dur: 0.05, gain: 0.09 });
        break;
      case "confirm":
        this.tone({ freq: 740, type: "square", dur: 0.05, gain: 0.14 });
        this.tone({ freq: 1180, type: "square", dur: 0.09, gain: 0.12, at: 0.05 });
        break;
      case "cancel":
        this.tone({ freq: 520, type: "square", dur: 0.06, gain: 0.12 });
        this.tone({ freq: 330, type: "square", dur: 0.1, gain: 0.1, at: 0.05 });
        break;

      // Attack wind-up: air being displaced by the lunge / the projectile.
      case "swing":
        this.burst({
          dur: 0.22,
          gain: 0.16 * scale,
          filter: "bandpass",
          from: 1800,
          to: 320,
          q: 0.8,
        });
        break;
      case "charge":
        this.tone({ freq: 180, to: 900, type: "sawtooth", dur: 0.55, gain: 0.12 });
        this.tone({ freq: 360, to: 1800, type: "sine", dur: 0.55, gain: 0.07 });
        break;
      case "miss":
        this.burst({
          dur: 0.26,
          gain: 0.13,
          filter: "bandpass",
          from: 900,
          to: 200,
          q: 0.7,
        });
        break;

      // Verdict stingers, matching the battle-box lines.
      case "crit":
        this.burst({ dur: 0.12, gain: 0.3, filter: "highpass", from: 900, to: 2600 });
        this.tone({ freq: 1600, to: 420, type: "square", dur: 0.16, gain: 0.16 });
        break;
      case "superEffective":
        // Bright ascending triad: "¡Es súper eficaz!".
        this.tone({ freq: 880, type: "square", dur: 0.07, gain: 0.14 });
        this.tone({ freq: 1174, type: "square", dur: 0.07, gain: 0.14, at: 0.07 });
        this.tone({ freq: 1568, type: "square", dur: 0.16, gain: 0.16, at: 0.14 });
        break;
      case "notVeryEffective":
        // Muffled descending pair: "No es muy eficaz…".
        this.tone({ freq: 420, to: 300, type: "triangle", dur: 0.16, gain: 0.14 });
        this.tone({ freq: 260, to: 180, type: "triangle", dur: 0.22, gain: 0.12, at: 0.1 });
        break;
      case "noEffect":
        this.tone({ freq: 200, to: 120, type: "sine", dur: 0.3, gain: 0.16 });
        this.burst({ dur: 0.14, gain: 0.08, from: 500, to: 120 });
        break;

      // Battler state.
      case "faint":
        // The classic long slide down as the sprite sinks off the platform.
        this.tone({ freq: 720, to: 70, type: "sawtooth", dur: 0.85, gain: 0.17 });
        this.tone({ freq: 360, to: 40, type: "square", dur: 0.85, gain: 0.08 });
        break;
      case "ballThrow":
        // The throw itself: air, then the click of the ball hitting the field.
        this.burst({
          dur: 0.2,
          gain: 0.1 * scale,
          filter: "bandpass",
          from: 2200,
          to: 700,
          q: 0.9,
        });
        this.tone({ freq: 240, type: "square", dur: 0.05, gain: 0.12, at: 0.34 });
        break;
      case "sendOut":
        this.burst({ dur: 0.16, gain: 0.14, filter: "highpass", from: 400, to: 2400 });
        this.tone({ freq: 520, to: 1240, type: "sine", dur: 0.24, gain: 0.16, at: 0.04 });
        break;
      case "recall":
        // The beam: a descending sweep that closes on the ball's click.
        this.tone({ freq: 1400, to: 260, type: "sine", dur: 0.42, gain: 0.13 });
        this.burst({ dur: 0.3, gain: 0.07, filter: "bandpass", from: 2600, to: 500 });
        this.tone({ freq: 200, type: "square", dur: 0.05, gain: 0.1, at: 0.44 });
        break;
      case "ability":
        // Two-note chime under the window that slides in.
        this.tone({ freq: 988, type: "triangle", dur: 0.1, gain: 0.1 });
        this.tone({ freq: 1319, type: "triangle", dur: 0.18, gain: 0.09, at: 0.09 });
        break;
      case "itemUse":
        // Pouch pop: the trainer taking something out of the bag.
        this.tone({ freq: 660, to: 990, type: "square", dur: 0.08, gain: 0.11 });
        this.burst({ dur: 0.12, gain: 0.07, filter: "highpass", from: 1200, to: 3000 });
        break;
      case "heal":
        this.tone({ freq: 523, type: "sine", dur: 0.12, gain: 0.14 });
        this.tone({ freq: 659, type: "sine", dur: 0.12, gain: 0.14, at: 0.1 });
        this.tone({ freq: 784, type: "sine", dur: 0.26, gain: 0.16, at: 0.2 });
        break;
      case "statUp":
        this.tone({ freq: 480, to: 1100, type: "triangle", dur: 0.26, gain: 0.13 });
        break;
      case "statDown":
        this.tone({ freq: 900, to: 320, type: "triangle", dur: 0.3, gain: 0.13 });
        break;

      // End of battle.
      case "victory":
        [
          [784, 0],
          [784, 0.12],
          [784, 0.24],
          [1046, 0.38],
          [932, 0.62],
          [1046, 0.78],
        ].forEach(([freq, at], i) =>
          this.tone({
            freq,
            type: "square",
            dur: i >= 3 ? 0.26 : 0.11,
            gain: 0.15,
            at,
          }),
        );
        break;
      case "defeat":
        [
          [523, 0],
          [466, 0.22],
          [392, 0.44],
          [311, 0.66],
        ].forEach(([freq, at]) =>
          this.tone({ freq, type: "triangle", dur: 0.34, gain: 0.15, at }),
        );
        break;

      // HP bar: the drain rattle and the low-health alarm beep.
      case "tick":
        this.tone({ freq: 1320, type: "square", dur: 0.03, gain: 0.05 });
        break;
      case "alarm":
        this.tone({ freq: 1046, type: "square", dur: 0.09, gain: 0.13 });
        break;
    }
  }

  /**
   * Impact of a landed move: texture from the move's type (cut, fire, bolt…)
   * plus a body thump whose weight scales with `power` (0-1 of the target's
   * max HP), so a big hit sounds heavier than a scratch.
   */
  impact(type: string, damageClass: string, power = 0.3): void {
    const typed = IMPACT_BY_TYPE[type] ?? "blunt";
    const family: ImpactFamily =
      damageClass === "physical" && !KEEPS_TEXTURE.has(typed) ? "blunt" : typed;
    const weight = Math.min(1, Math.max(0.25, power));
    const g = 0.16 + weight * 0.22;

    switch (family) {
      case "slash":
        // Corte: a fast, bright metallic swipe.
        this.burst({ dur: 0.12, gain: g, filter: "bandpass", from: 5200, to: 1400, q: 1.6 });
        this.tone({ freq: 2600, to: 900, type: "triangle", dur: 0.14, gain: g * 0.5 });
        break;
      case "fire":
        // Fuego: a roaring low noise wash with a burning tail.
        this.burst({ dur: 0.5, gain: g, filter: "lowpass", from: 1800, to: 220 });
        this.burst({ dur: 0.34, gain: g * 0.5, filter: "bandpass", from: 900, to: 300, q: 0.6, at: 0.06 });
        this.tone({ freq: 150, to: 60, type: "sawtooth", dur: 0.32, gain: g * 0.5 });
        break;
      case "electric":
        // Rayo: crackle plus a buzzing square that snaps down.
        this.burst({ dur: 0.09, gain: g, filter: "highpass", from: 1800, to: 5200 });
        this.tone({ freq: 1800, to: 240, type: "square", dur: 0.2, gain: g * 0.6 });
        this.tone({ freq: 2400, to: 320, type: "square", dur: 0.12, gain: g * 0.4, at: 0.1 });
        break;
      case "water":
        this.burst({ dur: 0.34, gain: g, filter: "lowpass", from: 2600, to: 400 });
        this.tone({ freq: 620, to: 140, type: "sine", dur: 0.26, gain: g * 0.6 });
        break;
      case "ice":
        this.burst({ dur: 0.2, gain: g * 0.8, filter: "highpass", from: 2400, to: 6000 });
        this.tone({ freq: 2100, to: 1300, type: "triangle", dur: 0.3, gain: g * 0.5 });
        break;
      case "nature":
        this.burst({ dur: 0.26, gain: g * 0.9, filter: "bandpass", from: 3200, to: 700, q: 0.9 });
        break;
      case "metal":
        this.burst({ dur: 0.1, gain: g, filter: "bandpass", from: 4200, to: 1800, q: 2.4 });
        this.tone({ freq: 1400, to: 620, type: "square", dur: 0.3, gain: g * 0.4 });
        break;
      case "mystic":
        // Psíquico / fantasma / hada: two detuned sines shimmering together.
        this.tone({ freq: 880, to: 320, type: "sine", dur: 0.4, gain: g * 0.6 });
        this.tone({ freq: 905, to: 300, type: "sine", dur: 0.4, gain: g * 0.5 });
        this.burst({ dur: 0.3, gain: g * 0.35, filter: "bandpass", from: 1800, to: 600, q: 1.2 });
        break;
      case "blunt":
        // Impacto físico: a dry body blow.
        this.burst({ dur: 0.14, gain: g, filter: "lowpass", from: 1200, to: 160 });
        this.tone({ freq: 180, to: 55, type: "sine", dur: 0.22, gain: g * 0.9 });
        break;
    }
  }

  /** Stinger matching the effectiveness line the box is about to print. */
  effectiveness(multiplier: number): void {
    if (multiplier === 0) this.play("noEffect");
    else if (multiplier > 1) this.play("superEffective");
    else if (multiplier < 1) this.play("notVeryEffective");
  }

  /**
   * Rattle of the HP bar draining. `duration` should match the bar's own
   * transition so sound and motion end together.
   */
  drain(duration: number): void {
    if (typeof window === "undefined") return;
    if (this.tickTimer !== null) window.clearInterval(this.tickTimer);
    const step = 55;
    let left = Math.max(step, duration);
    this.play("tick");
    this.tickTimer = window.setInterval(() => {
      left -= step;
      if (left <= 0) {
        if (this.tickTimer !== null) window.clearInterval(this.tickTimer);
        this.tickTimer = null;
        return;
      }
      this.play("tick");
    }, step);
  }

  /** The low-health alarm: beeps on a loop until HP recovers or the fight ends. */
  alarm(active: boolean): void {
    if (typeof window === "undefined") return;
    if (active) {
      if (this.alarmTimer !== null || this.muted) return;
      this.play("alarm");
      this.alarmTimer = window.setInterval(() => this.play("alarm"), 420);
      return;
    }
    if (this.alarmTimer !== null) {
      window.clearInterval(this.alarmTimer);
      this.alarmTimer = null;
    }
  }

  /** Real cry from PokéAPI. `scale` trims it for the busier attack moments. */
  cry(url: string | null | undefined, scale = 1): void {
    if (!url || this.muted || typeof window === "undefined") return;
    let audio = this.cries.get(url);
    if (!audio) {
      audio = new Audio(url);
      audio.preload = "auto";
      this.cries.set(url, audio);
    }
    audio.volume = Math.min(1, this.volume * scale);
    audio.currentTime = 0;
    this.lastCry = audio;
    void audio.play().catch(() => {
      // Autoplay policy or a missing cry file: silence is fine here.
    });
  }

  /** Warms the browser cache so a cry fires instantly when the battler enters. */
  preloadCry(url: string | null | undefined): void {
    if (!url || typeof window === "undefined" || this.cries.has(url)) return;
    const audio = new Audio(url);
    audio.preload = "auto";
    this.cries.set(url, audio);
  }

  /** Stops every looping sound (leaving a battle, unmounting the screen). */
  stopAll(): void {
    this.alarm(false);
    if (typeof window !== "undefined" && this.tickTimer !== null) {
      window.clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.lastCry?.pause();
  }
}

/** Server-side stub: same surface, does nothing. */
const NOOP: SfxManager = {
  unlock() {},
  setVolume() {},
  setMuted() {},
  play() {},
  impact() {},
  effectiveness() {},
  drain() {},
  alarm() {},
  cry() {},
  preloadCry() {},
  stopAll() {},
} as unknown as SfxManager;

let instance: SfxManager | null = null;

/** The shared soundboard (one AudioContext for the whole app). */
export function getSfx(): SfxManager {
  if (typeof window === "undefined") return NOOP;
  instance ??= new SfxManager();
  return instance;
}

export type { SfxManager };
