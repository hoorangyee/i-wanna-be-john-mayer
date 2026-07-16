import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadStats, recordResult, accuracy, avgMs, emptyStats } from "./stats";

beforeEach(() => {
  window.localStorage.clear();
});

describe("stats", () => {
  it("loads empty stats when storage is empty", () => {
    expect(loadStats()).toEqual(emptyStats());
  });

  it("records and accumulates results per mode", () => {
    recordResult("nameThatNote", true, 1000);
    const s = recordResult("nameThatNote", false, 3000);
    expect(s.nameThatNote).toEqual({ attempts: 2, correct: 1, totalMs: 4000 });
    expect(s.findAll).toEqual({ attempts: 0, correct: 0, totalMs: 0 });
  });

  it("persists across loads", () => {
    recordResult("findAll", true, 8000);
    expect(loadStats().findAll).toEqual({ attempts: 1, correct: 1, totalMs: 8000 });
  });

  it("survives corrupt storage", () => {
    window.localStorage.setItem("fretboard-quiz-stats-v1", "{not json");
    expect(loadStats()).toEqual(emptyStats());
  });

  it("derives accuracy and average, null when no attempts", () => {
    expect(accuracy({ attempts: 0, correct: 0, totalMs: 0 })).toBeNull();
    expect(avgMs({ attempts: 0, correct: 0, totalMs: 0 })).toBeNull();
    expect(accuracy({ attempts: 4, correct: 3, totalMs: 8000 })).toBe(0.75);
    expect(avgMs({ attempts: 4, correct: 3, totalMs: 8000 })).toBe(2000);
  });

  it("does not throw when storage write fails", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const s = recordResult("nameThatNote", true, 100);
    expect(s.nameThatNote).toEqual({ attempts: 1, correct: 1, totalMs: 100 });
    spy.mockRestore();
  });
});
