import { describe, it, expect } from "vitest";
import { pitchAt } from "@/theory/fretboard";
import {
  DEFAULT_RANGE, canonicalName, positionsInRange,
  makeNameQuestion, makeFindAllTarget,
} from "./engine";

describe("canonicalName", () => {
  it("uses the canonical 12-name vocabulary", () => {
    expect(canonicalName(0)).toBe("C");
    expect(canonicalName(1)).toBe("Db");
    expect(canonicalName(6)).toBe("F#");
    expect(canonicalName(10)).toBe("Bb");
  });
});

describe("positionsInRange", () => {
  it("expands strings × frets 0..fretMax", () => {
    const ps = positionsInRange({ strings: [6], fretMax: 3 });
    expect(ps).toEqual([
      { str: 6, fret: 0 }, { str: 6, fret: 1 }, { str: 6, fret: 2 }, { str: 6, fret: 3 },
    ]);
  });

  it("clamps fretMax to FRET_COUNT and respects DEFAULT_RANGE", () => {
    expect(positionsInRange({ strings: [1], fretMax: 99 })).toHaveLength(23);
    expect(positionsInRange(DEFAULT_RANGE)).toHaveLength(26); // 2現 × 13프렛
  });
});

describe("makeNameQuestion", () => {
  it("holds invariants across random generations", () => {
    for (let i = 0; i < 50; i++) {
      const q = makeNameQuestion(DEFAULT_RANGE);
      expect([6, 5]).toContain(q.pos.str);
      expect(q.pos.fret).toBeGreaterThanOrEqual(0);
      expect(q.pos.fret).toBeLessThanOrEqual(12);
      expect(q.answer).toBe(canonicalName(pitchAt(q.pos)));
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.answer);
    }
  });

  it("throws on an empty range", () => {
    expect(() => makeNameQuestion({ strings: [], fretMax: 12 })).toThrow("퀴즈 범위에 위치가 없습니다");
  });

  it("terminates and stays valid with a constant rng", () => {
    const q = makeNameQuestion({ strings: [6], fretMax: 3 }, () => 0);
    expect(q.pos).toEqual({ str: 6, fret: 0 });
    expect(q.answer).toBe("E");
    expect(new Set(q.choices).size).toBe(4);
    expect(q.choices).toContain("E");
  });
});

describe("makeFindAllTarget", () => {
  it("returns every position of the target pitch in range (deterministic rng)", () => {
    // rng()=0 → 범위 내 첫 pc 선택: 6번 줄 개방 E(pc 4)
    const t = makeFindAllTarget({ strings: [6], fretMax: 12 }, () => 0);
    expect(t.pc).toBe(4);
    expect(t.name).toBe("E");
    expect(t.positions).toEqual([{ str: 6, fret: 0 }, { str: 6, fret: 12 }]);
  });

  it("all positions match the target pitch under random rng", () => {
    for (let i = 0; i < 20; i++) {
      const t = makeFindAllTarget(DEFAULT_RANGE);
      expect(t.positions.length).toBeGreaterThan(0);
      for (const p of t.positions) expect(pitchAt(p)).toBe(t.pc);
    }
  });

  it("throws on an empty range", () => {
    expect(() => makeFindAllTarget({ strings: [], fretMax: 12 })).toThrow("퀴즈 범위에 위치가 없습니다");
  });
});
