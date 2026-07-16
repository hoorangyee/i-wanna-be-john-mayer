import { describe, it, expect } from "vitest";
import { CHORDS, CHORD_IDS, chordNoteMap } from "./chords";

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
