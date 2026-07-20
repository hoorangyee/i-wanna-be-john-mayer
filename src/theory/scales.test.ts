import { describe, it, expect } from "vitest";
import { SCALES, SCALE_IDS, degreeLabel, scaleNoteMap } from "./scales";

describe("SCALES", () => {
  it("has the 5 v1 scales with correct formulas", () => {
    expect(SCALES.major.intervals).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(SCALES.naturalMinor.intervals).toEqual([0, 2, 3, 5, 7, 8, 10]);
    expect(SCALES.minorPentatonic.intervals).toEqual([0, 3, 5, 7, 10]);
    expect(SCALES.majorPentatonic.intervals).toEqual([0, 2, 4, 7, 9]);
    expect(SCALES.blues.intervals).toEqual([0, 3, 5, 6, 7, 10]);
    expect(SCALE_IDS).toHaveLength(5);
  });
});

describe("degreeLabel", () => {
  it("maps intervals to degree names", () => {
    expect(degreeLabel(0)).toBe("1");
    expect(degreeLabel(3)).toBe("b3");
    expect(degreeLabel(4)).toBe("3");
    expect(degreeLabel(6)).toBe("b5");
    expect(degreeLabel(7)).toBe("5");
    expect(degreeLabel(10)).toBe("b7");
    expect(degreeLabel(11)).toBe("7");
  });
});

describe("scaleNoteMap", () => {
  it("A minor pentatonic = A C D E G", () => {
    const map = scaleNoteMap("A", "minorPentatonic");
    expect([...map.keys()].sort((a, b) => a - b)).toEqual([0, 2, 4, 7, 9]);
    expect(map.get(9)).toEqual({ name: "A", degree: "1", isRoot: true });
    expect(map.get(0)).toEqual({ name: "C", degree: "b3", isRoot: false });
    expect(map.get(7)).toEqual({ name: "G", degree: "b7", isRoot: false });
  });

  it("F major spells Bb as flat", () => {
    const map = scaleNoteMap("F", "major");
    expect(map.get(10)!.name).toBe("Bb");
    expect(map.get(10)!.degree).toBe("4");
  });

  it("E blues includes the b5", () => {
    const map = scaleNoteMap("E", "blues");
    expect(map.get(10)).toEqual({ name: "Bb", degree: "b5", isRoot: false });
    expect(map.size).toBe(6);
  });

  it("G minor pentatonic spells Bb (not A#) via relative-major preference", () => {
    const map = scaleNoteMap("G", "minorPentatonic");
    expect(map.get(10)!.name).toBe("Bb");
  });

  it("E blues b5 is spelled Bb by degree, regardless of relative-major sharp preference", () => {
    const map = scaleNoteMap("E", "blues");
    expect(map.get(10)!.name).toBe("Bb");
  });

  it("C natural minor spells Eb Ab Bb with flats", () => {
    const map = scaleNoteMap("C", "naturalMinor");
    expect(map.get(3)!.name).toBe("Eb");
    expect(map.get(8)!.name).toBe("Ab");
    expect(map.get(10)!.name).toBe("Bb");
  });
});
