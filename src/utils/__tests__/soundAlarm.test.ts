import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { soundAlarm } from "../soundAlarm";

describe("MineGuard360 Sound Alarm Engine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    soundAlarm.stopAlarm();
    soundAlarm.setMuted(false);
  });

  afterEach(() => {
    soundAlarm.stopAlarm();
    vi.useRealTimers();
  });

  it("should initialize with default unmuted state and inactive alarm", () => {
    expect(soundAlarm.getCurrentSeverity()).toBe("NONE");
    expect(soundAlarm.isMuted()).toBe(false);
  });

  it("should trigger critical alarm when in critical or high-risk state", () => {
    soundAlarm.triggerAlarm("CRITICAL");
    expect(soundAlarm.getCurrentSeverity()).toBe("CRITICAL");
    expect(soundAlarm.getIsPlaying()).toBe(true);
  });

  it("should trigger warning alarm when in warning state", () => {
    soundAlarm.triggerAlarm("WARNING");
    expect(soundAlarm.getCurrentSeverity()).toBe("WARNING");
    expect(soundAlarm.getIsPlaying()).toBe(true);
  });

  it("should automatically stop alarm sound 10 seconds after warning", () => {
    soundAlarm.triggerAlarm("CRITICAL", 10000);
    expect(soundAlarm.getIsPlaying()).toBe(true);
    expect(soundAlarm.getIsAutoSilenced()).toBe(false);

    // Fast-forward 5 seconds - still sounding
    vi.advanceTimersByTime(5000);
    expect(soundAlarm.getIsPlaying()).toBe(true);
    expect(soundAlarm.getIsAutoSilenced()).toBe(false);

    // Fast-forward remaining 5 seconds (10s total elapsed)
    vi.advanceTimersByTime(5000);

    // Alarm sound MUST stop automatically after 10 seconds
    expect(soundAlarm.getIsPlaying()).toBe(false);
    expect(soundAlarm.getIsAutoSilenced()).toBe(true);
    // Severity stays known for UI indication
    expect(soundAlarm.getCurrentSeverity()).toBe("CRITICAL");
  });

  it("should allow replaying the alarm after auto-silence", () => {
    soundAlarm.triggerAlarm("CRITICAL", 10000);
    vi.advanceTimersByTime(10000);
    expect(soundAlarm.getIsPlaying()).toBe(false);
    expect(soundAlarm.getIsAutoSilenced()).toBe(true);

    soundAlarm.replay();
    expect(soundAlarm.getIsPlaying()).toBe(true);
    expect(soundAlarm.getIsAutoSilenced()).toBe(false);
  });

  it("should stop alarm immediately when danger resolves to safe before 10s", () => {
    soundAlarm.triggerAlarm("CRITICAL", 10000);
    expect(soundAlarm.getIsPlaying()).toBe(true);

    vi.advanceTimersByTime(3000);
    soundAlarm.stopAlarm();

    expect(soundAlarm.getCurrentSeverity()).toBe("NONE");
    expect(soundAlarm.getIsPlaying()).toBe(false);
    expect(soundAlarm.getIsAutoSilenced()).toBe(false);
  });

  it("should toggle mute and unmute correctly", () => {
    expect(soundAlarm.isMuted()).toBe(false);

    soundAlarm.toggleMute();
    expect(soundAlarm.isMuted()).toBe(true);
    expect(soundAlarm.getIsPlaying()).toBe(false);

    soundAlarm.toggleMute();
    expect(soundAlarm.isMuted()).toBe(false);
  });

  it("should mute output immediately if alarm is actively sounding", () => {
    soundAlarm.triggerAlarm("CRITICAL");
    expect(soundAlarm.getIsPlaying()).toBe(true);

    soundAlarm.setMuted(true);
    expect(soundAlarm.isMuted()).toBe(true);
    expect(soundAlarm.getIsPlaying()).toBe(false);
  });
});
