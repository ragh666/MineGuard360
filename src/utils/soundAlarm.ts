/**
 * MineGuard360 In-Cab & Control Room Audio Warning Synthesizer
 * Uses Web Audio API to produce authentic industrial collision warning alarms.
 * Automatically stops sound playback 10 seconds after a warning is triggered.
 */

export type AlarmSeverity = "CRITICAL" | "WARNING" | "NONE";

export interface AlarmEngineState {
  isPlaying: boolean;
  isAutoSilenced: boolean;
  isMuted: boolean;
  currentSeverity: AlarmSeverity;
}

type Listener = (state: AlarmEngineState) => void;

class SoundAlarmEngine {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private isAutoSilenced = false;
  private currentSeverity: AlarmSeverity = "NONE";
  private intervalId: any = null;
  private autoSilenceTimeoutId: any = null;
  private isMutedState = false;
  private listeners: Set<Listener> = new Set();
  private maxDurationMs = 10000; // 10 seconds maximum alarm sound duration

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("mineguard_sound_muted");
        this.isMutedState = saved === "true";
      } catch {
        this.isMutedState = false;
      }

      // Auto-unlock audio context on first user interaction
      const unlockAudio = () => {
        if (this.audioCtx && this.audioCtx.state === "suspended") {
          this.audioCtx.resume().catch(() => {});
        }
        window.removeEventListener("click", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
        window.removeEventListener("touchstart", unlockAudio);
      };

      window.addEventListener("click", unlockAudio, { once: true });
      window.addEventListener("keydown", unlockAudio, { once: true });
      window.addEventListener("touchstart", unlockAudio, { once: true });
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  public getState(): AlarmEngineState {
    return {
      isPlaying: this.isPlaying && !this.isMutedState,
      isAutoSilenced: this.isAutoSilenced,
      isMuted: this.isMutedState,
      currentSeverity: this.currentSeverity,
    };
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  /**
   * Generates an individual synthesized warning beep
   */
  private playTone(frequency: number, durationSec: number, type: OscillatorType = "sawtooth", gainLevel: number = 0.25): void {
    if (this.isMutedState) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Warm lowpass filter to produce authentic in-cab rugged buzzer tone
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2400, ctx.currentTime);

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Volume envelope to prevent audio clicking
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(gainLevel, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationSec);
    } catch {
      // Audio playback error or autoplay blocked
    }
  }

  /**
   * Starts the alarm loop for a maximum of 10 seconds, then auto-stops
   */
  public triggerAlarm(severity: "CRITICAL" | "WARNING", durationMs: number = this.maxDurationMs): void {
    // If already playing the same severity, don't restart
    if (this.isPlaying && this.currentSeverity === severity) {
      return;
    }

    // Stop previous timer and audio interval
    this.clearTimers();

    this.isPlaying = true;
    this.isAutoSilenced = false;
    this.currentSeverity = severity;

    // Wake audio context if suspended
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    if (severity === "CRITICAL") {
      // Urgent, alternating dual-tone alarm pattern (960Hz & 1400Hz)
      let toggle = false;
      this.playTone(960, 0.12, "sawtooth", 0.35);

      this.intervalId = setInterval(() => {
        toggle = !toggle;
        const freq = toggle ? 1400 : 960;
        this.playTone(freq, 0.12, "sawtooth", 0.35);
      }, 190);
    } else {
      // Warning chime (single 850Hz beep every 650ms)
      this.playTone(850, 0.18, "sine", 0.2);
      this.intervalId = setInterval(() => {
        this.playTone(850, 0.18, "sine", 0.2);
      }, 650);
    }

    // Auto-stop sound alarm after 10 seconds
    this.autoSilenceTimeoutId = setTimeout(() => {
      this.silenceAfter10Seconds();
    }, durationMs);

    this.notify();
  }

  /**
   * Automatically silences the audio sound after the 10-second timeout,
   * while preserving the knowledge that a warning/critical state is still active.
   */
  private silenceAfter10Seconds(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.autoSilenceTimeoutId !== null) {
      clearTimeout(this.autoSilenceTimeoutId);
      this.autoSilenceTimeoutId = null;
    }

    this.isPlaying = false;
    this.isAutoSilenced = true;
    this.notify();
  }

  private clearTimers(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.autoSilenceTimeoutId !== null) {
      clearTimeout(this.autoSilenceTimeoutId);
      this.autoSilenceTimeoutId = null;
    }
  }

  /**
   * Completely stops alarm and resets state to normal (e.g. when situation becomes SAFE)
   */
  public stopAlarm(): void {
    this.clearTimers();
    this.isPlaying = false;
    this.isAutoSilenced = false;
    this.currentSeverity = "NONE";
    this.notify();
  }

  /**
   * Replay alarm if user clicks to re-alert while danger persists
   */
  public replay(): void {
    if (this.currentSeverity !== "NONE") {
      const sev = this.currentSeverity;
      this.stopAlarm();
      this.triggerAlarm(sev);
    }
  }

  /**
   * Mute / Unmute audio controls
   */
  public toggleMute(): boolean {
    this.setMuted(!this.isMutedState);
    return this.isMutedState;
  }

  public setMuted(muted: boolean): void {
    this.isMutedState = muted;
    try {
      localStorage.setItem("mineguard_sound_muted", String(muted));
    } catch {
      // localStorage error ignore
    }

    if (muted && this.isPlaying) {
      this.clearTimers();
      this.isPlaying = false;
    } else if (!muted && !this.isPlaying && this.currentSeverity !== "NONE" && !this.isAutoSilenced) {
      const prevSeverity = this.currentSeverity;
      this.triggerAlarm(prevSeverity);
    }
    this.notify();
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying && !this.isMutedState;
  }

  public getIsAutoSilenced(): boolean {
    return this.isAutoSilenced;
  }

  public getCurrentSeverity(): AlarmSeverity {
    return this.currentSeverity;
  }
}

export const soundAlarm = new SoundAlarmEngine();
