import { describe, it, expect } from "vitest";
import { CHORDS, CHORD_IDS, chordNoteMap, chordToneMap, chordSymbol, normalizeExts } from "./chords";

describe("CHORDS", () => {
  it("has the 5 v1 chord types with correct formulas", () => {
    expect(CHORDS.maj.intervals).toEqual([0, 4, 7]);
    expect(CHORDS.m.intervals).toEqual([0, 3, 7]);
    expect(CHORDS["7"].intervals).toEqual([0, 4, 7, 10]);
    expect(CHORDS.maj7.intervals).toEqual([0, 4, 7, 11]);
    expect(CHORDS.m7.intervals).toEqual([0, 3, 7, 10]);
    expect(CHORD_IDS).toHaveLength(5);
  });

  it("symbols compose chord names", () => {
    expect(CHORDS.maj.symbol).toBe("");
    expect(CHORDS.m.symbol).toBe("m");
    expect(CHORDS.maj7.symbol).toBe("maj7");
  });

  it("CHORD_IDS preserves declaration order (maj first)", () => {
    expect(CHORD_IDS).toEqual(["maj", "m", "7", "maj7", "m7"]);
  });

  it("CHORD_IDS covers every chord in CHORDS", () => {
    expect([...CHORD_IDS].sort()).toEqual(Object.keys(CHORDS).sort());
  });
});

describe("chordNoteMap", () => {
  it("E7 = E G# B D with degrees 1 3 5 b7", () => {
    const map = chordNoteMap("E", "7");
    expect(map.get(4)).toEqual({ name: "E", degree: "1", isRoot: true });
    expect(map.get(8)).toEqual({ name: "G#", degree: "3", isRoot: false });
    expect(map.get(11)).toEqual({ name: "B", degree: "5", isRoot: false });
    expect(map.get(2)).toEqual({ name: "D", degree: "b7", isRoot: false });
    expect(map.size).toBe(4);
  });

  it("Gm7 spells Bb via minor-family preference", () => {
    const map = chordNoteMap("G", "m7");
    expect(map.get(10)).toEqual({ name: "Bb", degree: "b3", isRoot: false });
    expect(map.get(5)!.name).toBe("F");
  });

  it("Bb maj7 spells with flats (major-family flat key)", () => {
    const map = chordNoteMap("Bb", "maj7");
    expect(map.get(2)!.name).toBe("D");
    expect(map.get(9)!.name).toBe("A");
    expect(map.get(9)!.degree).toBe("7");
  });
});

describe("chordToneMap", () => {
  it("shows only the triad by default (A major = A C# E)", () => {
    const map = chordToneMap("A", "major", []);
    expect(map.size).toBe(3);
    expect(map.get(9)).toEqual({ name: "A", degree: "1", isRoot: true });
    expect(map.get(1)).toEqual({ name: "C#", degree: "3", isRoot: false });
    expect(map.get(4)).toEqual({ name: "E", degree: "5", isRoot: false });
  });

  it("minor third is labeled b3 (A minor → C)", () => {
    const map = chordToneMap("A", "minor", []);
    expect(map.get(0)).toEqual({ name: "C", degree: "b3", isRoot: false });
  });

  it("7th kind follows quality", () => {
    expect(chordToneMap("A", "major", ["7"]).get(8)).toEqual({ name: "G#", degree: "7", isRoot: false });
    expect(chordToneMap("A", "dominant", ["7"]).get(7)).toEqual({ name: "G", degree: "b7", isRoot: false });
    expect(chordToneMap("A", "minor", ["7"]).get(7)).toEqual({ name: "G", degree: "b7", isRoot: false });
  });

  it("9th and 11th are independent of the 7th toggle (A: B=9, D=11)", () => {
    const map = chordToneMap("A", "dominant", ["9", "11"]);
    expect(map.get(11)).toEqual({ name: "B", degree: "9", isRoot: false });
    expect(map.get(2)).toEqual({ name: "D", degree: "11", isRoot: false });
    expect(map.size).toBe(5); // 트라이어드 + 9 + 11 (7은 꺼짐 — 독립 토글)
  });

  it("flat keys spell extensions with flats (Bb dominant 7,9)", () => {
    const map = chordToneMap("Bb", "dominant", ["7", "9"]);
    expect(map.get(8)!.name).toBe("Ab"); // b7
    expect(map.get(0)!.name).toBe("C");  // 9
  });
});

describe("chordSymbol", () => {
  it("base symbols per quality", () => {
    expect(chordSymbol("major", [])).toBe("");
    expect(chordSymbol("minor", [])).toBe("m");
    expect(chordSymbol("dominant", [])).toBe("");
  });

  it("7 toggles the seventh symbol", () => {
    expect(chordSymbol("major", ["7"])).toBe("maj7");
    expect(chordSymbol("minor", ["7"])).toBe("m7");
    expect(chordSymbol("dominant", ["7"])).toBe("7");
  });

  it("upper extensions: parens with 7, add-notation without 7", () => {
    expect(chordSymbol("dominant", ["7", "9"])).toBe("7(9)");
    expect(chordSymbol("major", ["7", "9", "11"])).toBe("maj7(9,11)");
    expect(chordSymbol("major", ["9"])).toBe("(add9)");
    expect(chordSymbol("minor", ["9", "11"])).toBe("m(add9,add11)");
  });
});

describe("normalizeExts", () => {
  it("dedupes and orders 7 → 9 → 11", () => {
    expect(normalizeExts(["11", "7", "7", "9"])).toEqual(["7", "9", "11"]);
  });
});
