"use client";

export type BgmTheme = "town" | "house" | "agl" | "driving";

// Note frequencies (Hz)
const N: Record<string, number> = {
  _: 0,
  A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
};

// Cheerful 16-bar town theme (eighth-note steps at ~136 BPM)
const TOWN_MELODY: string[] = [
  "E5", "G5", "A5", "G5", "E5", "D5", "C5", "D5",
  "E5", "G5", "A5", "E5", "D5", "_", "G4", "_",
  "C5", "D5", "E5", "G5", "A5", "G5", "E5", "C5",
  "D5", "E5", "D5", "B4", "C5", "_", "_", "_",
  "A4", "C5", "E5", "A5", "G5", "E5", "C5", "D5",
  "E5", "F5", "E5", "D5", "C5", "A4", "G4", "_",
  "F4", "A4", "C5", "F5", "E5", "D5", "C5", "E5",
  "D5", "C5", "B4", "D5", "C5", "_", "_", "_",
];

const TOWN_BASS: string[] = [
  "C3", "_", "G3", "_", "C3", "_", "G3", "_",
  "G3", "_", "D3", "_", "G3", "_", "B3", "_",
  "A3", "_", "E3", "_", "F3", "_", "C3", "_",
  "G3", "_", "D3", "_", "C3", "_", "G3", "_",
  "A3", "_", "E3", "_", "C3", "_", "G3", "_",
  "F3", "_", "C3", "_", "C3", "_", "E3", "_",
  "F3", "_", "C3", "_", "C3", "_", "A3", "_",
  "G3", "_", "G3", "_", "C3", "_", "C3", "_",
];

// Warm, relaxed cozy house theme (slower, softer triangle/sine tones)
const HOUSE_MELODY: string[] = [
  "E4", "_", "G4", "A4", "B4", "_", "A4", "G4",
  "E4", "_", "D4", "E4", "C4", "_", "_", "_",
  "F4", "_", "A4", "C5", "B4", "_", "G4", "E4",
  "D4", "_", "E4", "F4", "G4", "_", "_", "_",
  "A4", "_", "C5", "B4", "G4", "_", "E4", "G4",
  "F4", "_", "E4", "D4", "E4", "_", "C4", "_",
  "D4", "_", "F4", "A4", "G4", "_", "E4", "D4",
  "C4", "_", "E4", "D4", "C4", "_", "_", "_",
];

const HOUSE_BASS: string[] = [
  "C3", "_", "_", "_", "G3", "_", "_", "_",
  "A3", "_", "_", "_", "E3", "_", "_", "_",
  "F3", "_", "_", "_", "C3", "_", "_", "_",
  "D3", "_", "_", "_", "G3", "_", "_", "_",
  "F3", "_", "_", "_", "E3", "_", "_", "_",
  "D3", "_", "_", "_", "A3", "_", "_", "_",
  "F3", "_", "_", "_", "G3", "_", "_", "_",
  "C3", "_", "_", "_", "C3", "_", "_", "_",
];

// Pumping 8-bit disco/electronic theme for AGL bar
const AGL_MELODY: string[] = [
  "A4", "C5", "E5", "A5", "G5", "E5", "D5", "E5",
  "A4", "C5", "E5", "G5", "F5", "E5", "D5", "C5",
  "D5", "F5", "A5", "G5", "F5", "D5", "E5", "F5",
  "E5", "D5", "C5", "B4", "A4", "B4", "C5", "E5",
  "A5", "A5", "G5", "E5", "G5", "G5", "E5", "D5",
  "F5", "F5", "E5", "D5", "E5", "D5", "C5", "B4",
  "A4", "E5", "A5", "G5", "E5", "D5", "C5", "D5",
  "E5", "D5", "C5", "B4", "A4", "_", "E5", "_",
];

const AGL_BASS: string[] = [
  "A2", "A3", "A2", "A3", "A2", "A3", "G3", "E3",
  "F3", "F3", "F3", "E3", "D3", "D3", "E3", "G3",
  "D3", "D3", "F3", "A3", "G3", "G3", "B3", "D4",
  "E3", "E3", "G3", "B3", "A2", "A3", "A2", "A3",
  "A2", "A3", "A2", "A3", "C3", "C4", "C3", "C4",
  "D3", "D4", "D3", "D4", "E3", "E4", "E3", "E4",
  "F3", "F3", "G3", "G3", "A3", "A3", "G3", "E3",
  "E3", "E3", "E3", "E3", "A2", "A3", "A2", "_",
];

// Fast arcade driving theme (OutRun / Mario Kart style)
const DRIVING_MELODY: string[] = [
  "C5", "E5", "G5", "A5", "G5", "E5", "C5", "D5",
  "E5", "G5", "A5", "G5", "F5", "E5", "D5", "_",
  "D5", "F5", "A5", "G5", "F5", "D5", "B4", "D5",
  "G5", "F5", "E5", "D5", "C5", "_", "G4", "_",
];

const DRIVING_BASS: string[] = [
  "C3", "G3", "C3", "G3", "A2", "E3", "A2", "E3",
  "F3", "C4", "F3", "C4", "G3", "D4", "G3", "D4",
  "D3", "A3", "D3", "A3", "G3", "D4", "G3", "D4",
  "C3", "G3", "A2", "E3", "C3", "G3", "C3", "_",
];

class ChiptuneManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private started = false;
  private theme: BgmTheme = "town";
  private step = 0;
  private timer: number | null = null;
  private lastStepSfx = 0;
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.muted = window.localStorage.getItem("azzam_town_muted") === "1";
      } catch {
        // ignore storage errors
      }
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): boolean => {
    return this.muted;
  };

  getServerSnapshot = (): boolean => {
    return false;
  };

  isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.22;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  unlockAndStart(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.started) {
      this.started = true;
      this.scheduleLoop();
    }
  }

  setMuted(mute: boolean): boolean {
    this.muted = mute;
    try {
      window.localStorage.setItem("azzam_town_muted", mute ? "1" : "0");
    } catch {
      // ignore
    }
    if (!mute) this.unlockAndStart();
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.22, this.ctx.currentTime, 0.04);
    }
    this.listeners.forEach((l) => l());
    return this.muted;
  }

  toggleMute(): boolean {
    return this.setMuted(!this.muted);
  }

  setTheme(theme: BgmTheme): void {
    if (this.theme === theme) return;
    this.theme = theme;
    this.step = 0;
    if (this.started) {
      this.scheduleLoop();
    }
  }

  private scheduleLoop(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    const stepMs =
      this.theme === "driving"
        ? 135
        : this.theme === "agl"
          ? 145
          : this.theme === "town"
            ? 195
            : 240;
    this.timer = window.setInterval(() => this.tick(), stepMs);
  }

  private tick(): void {
    if (this.muted || !this.ctx || !this.masterGain || this.ctx.state !== "running") return;
    const mel =
      this.theme === "driving"
        ? DRIVING_MELODY
        : this.theme === "agl"
          ? AGL_MELODY
          : this.theme === "town"
            ? TOWN_MELODY
            : HOUSE_MELODY;
    const bas =
      this.theme === "driving"
        ? DRIVING_BASS
        : this.theme === "agl"
          ? AGL_BASS
          : this.theme === "town"
            ? TOWN_BASS
            : HOUSE_BASS;
    const idx = this.step % mel.length;
    this.step++;

    const mNote = mel[idx];
    const bNote = bas[idx];
    const stepSec =
      this.theme === "driving"
        ? 0.12
        : this.theme === "agl"
          ? 0.13
          : this.theme === "town"
            ? 0.18
            : 0.22;

    if (mNote && N[mNote]) {
      this.playTone(
        N[mNote],
        stepSec * 0.9,
        this.theme === "agl" || this.theme === "driving"
          ? "sawtooth"
          : this.theme === "town"
            ? "square"
            : "triangle",
        this.theme === "agl" || this.theme === "driving"
          ? 0.16
          : this.theme === "town"
            ? 0.14
            : 0.22,
      );
    }
    if (bNote && N[bNote]) {
      this.playTone(
        N[bNote],
        stepSec * 1.3,
        "triangle",
        this.theme === "agl" || this.theme === "driving" ? 0.24 : 0.18,
      );
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    slideTo?: number,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playStep(): void {
    const now = performance.now();
    if (now - this.lastStepSfx < 230) return;
    this.lastStepSfx = now;
    const f = this.theme === "house" ? 150 : 120;
    this.playTone(f + (Math.random() * 25 - 12), 0.045, "triangle", 0.12);
  }

  playBlip(): void {
    this.playTone(540, 0.06, "square", 0.18, 720);
  }

  playDoor(entering: boolean): void {
    if (entering) {
      this.playTone(330, 0.1, "square", 0.2, 520);
      window.setTimeout(() => this.playTone(660, 0.14, "square", 0.2), 90);
    } else {
      this.playTone(520, 0.1, "square", 0.2, 330);
      window.setTimeout(() => this.playTone(262, 0.14, "square", 0.2), 90);
    }
  }

  playMeow(pitch = 1): void {
    this.playTone(520 * pitch, 0.14, "triangle", 0.25, 760 * pitch);
    window.setTimeout(
      () => this.playTone(740 * pitch, 0.22, "triangle", 0.22, 460 * pitch),
      120,
    );
  }

  playShaker(): void {
    const f = 900 + Math.random() * 400;
    this.playTone(f, 0.035, "square", 0.08, f - 220);
  }

  playSip(): void {
    const start = 320 + Math.random() * 30;
    this.playTone(start, 0.08, "triangle", 0.22, start + 180);
  }

  playSparkle(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      window.setTimeout(() => {
        this.playTone(freq, 0.12, "sine", 0.18);
      }, idx * 60);
    });
  }

  playHorn(isMoto = false): void {
    const f1 = isMoto ? 580 : 392;
    const f2 = isMoto ? 660 : 493.88;
    this.playTone(f1, 0.1, "sawtooth", 0.2);
    window.setTimeout(() => {
      this.playTone(f2, 0.14, "sawtooth", 0.22);
    }, 105);
  }

  playBoost(): void {
    this.playTone(280, 0.22, "sawtooth", 0.2, 880);
  }
}

export const sound = new ChiptuneManager();

