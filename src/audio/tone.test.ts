import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  midiAt, freqOf, isSoundEnabled, setSoundEnabled, playPosition,
  type AudioContextLike,
} from "./tone";

beforeEach(() => {
  window.localStorage.clear();
});

describe("midiAt", () => {
  it("maps open strings to standard-tuning MIDI numbers", () => {
    expect(midiAt({ str: 6, fret: 0 })).toBe(40); // E2
    expect(midiAt({ str: 5, fret: 0 })).toBe(45); // A2
    expect(midiAt({ str: 1, fret: 0 })).toBe(64); // E4
    expect(midiAt({ str: 5, fret: 12 })).toBe(57); // A3 — 옥타브
  });
});

describe("freqOf", () => {
  it("computes equal-temperament frequencies", () => {
    expect(freqOf(69)).toBe(440);
    expect(freqOf(57)).toBeCloseTo(220, 5);
    expect(freqOf(40)).toBeCloseTo(82.4069, 3);
  });
});

describe("sound preference", () => {
  it("defaults to enabled and persists the toggle", () => {
    expect(isSoundEnabled()).toBe(true);
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
  });

  it("survives blocked storage access", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(isSoundEnabled()).toBe(true);
    expect(() => playPosition({ str: 6, fret: 0 })).not.toThrow();
    spy.mockRestore();
  });
});

function fakeContext() {
  const gain = {
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  };
  const osc = {
    type: "sine",
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const ctx: AudioContextLike = {
    currentTime: 0,
    destination: {},
    createOscillator: () => osc,
    createGain: () => gain,
  };
  return { ctx, osc, gain };
}

describe("playPosition", () => {
  it("schedules a decaying oscillator at the position's frequency", () => {
    const { ctx, osc } = fakeContext();
    playPosition({ str: 5, fret: 0 }, ctx); // A2 = MIDI 45 = 110Hz
    expect(osc.frequency.value).toBeCloseTo(110, 3);
    expect(osc.type).toBe("triangle");
    expect(osc.start).toHaveBeenCalled();
    expect(osc.stop).toHaveBeenCalled();
  });

  it("is a no-op when sound is disabled", () => {
    setSoundEnabled(false);
    const { ctx, osc } = fakeContext();
    playPosition({ str: 5, fret: 0 }, ctx);
    expect(osc.start).not.toHaveBeenCalled();
  });
});
