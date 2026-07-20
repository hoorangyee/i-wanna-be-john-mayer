import { describe, it, expect } from "vitest";
import { chordToneMap, chordSymbol, normalizeExts, allowedExts } from "./chords";

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

  it("orders the 8 extensions as 7 → b9 → 9 → #9 → 11 → #11 → 13 → b13", () => {
    expect(normalizeExts(["13", "b9", "7", "b9"])).toEqual(["7", "b9", "13"]);
  });
});

describe("chordToneMap — new qualities", () => {
  it("diminished triad is 1 b3 b5 (A: A C Eb)", () => {
    const map = chordToneMap("A", "diminished", []);
    expect(map.size).toBe(3);
    expect(map.get(9)).toEqual({ name: "A", degree: "1", isRoot: true });
    expect(map.get(0)).toEqual({ name: "C", degree: "b3", isRoot: false });
    expect(map.get(3)).toEqual({ name: "Eb", degree: "b5", isRoot: false });
  });

  it("diminished 7th is bb7 (A: Gb)", () => {
    expect(chordToneMap("A", "diminished", ["7"]).get(6)).toEqual({ name: "Gb", degree: "bb7", isRoot: false });
  });

  it("halfDiminished shares the dim triad but takes b7 (A: G)", () => {
    expect(chordToneMap("A", "halfDiminished", []).get(3)!.degree).toBe("b5");
    expect(chordToneMap("A", "halfDiminished", ["7"]).get(7)).toEqual({ name: "G", degree: "b7", isRoot: false });
  });

  it("augmented triad is 1 3 #5 and takes b7 (A: A C# E#, G)", () => {
    const map = chordToneMap("A", "augmented", []);
    expect(map.get(1)).toEqual({ name: "C#", degree: "3", isRoot: false });
    expect(map.get(5)).toEqual({ name: "E#", degree: "#5", isRoot: false });
    expect(chordToneMap("A", "augmented", ["7"]).get(7)!.degree).toBe("b7");
  });
});

describe("chordSymbol — new qualities", () => {
  it("dim/halfDim/aug base and with-7 symbols", () => {
    expect(chordSymbol("diminished", [])).toBe("dim");
    expect(chordSymbol("diminished", ["7"])).toBe("dim7");
    expect(chordSymbol("halfDiminished", [])).toBe("dim"); // 7 꺼짐 시 dim 트라이어드와 동일 표시 (스펙 §2)
    expect(chordSymbol("halfDiminished", ["7"])).toBe("m7b5");
    expect(chordSymbol("augmented", [])).toBe("aug");
    expect(chordSymbol("augmented", ["7"])).toBe("aug7");
  });
});

describe("altered tensions & 13th", () => {
  it("natural 13 is +9 (A major add13: F#)", () => {
    expect(chordToneMap("A", "major", ["13"]).get(6)).toEqual({ name: "F#", degree: "13", isRoot: false });
  });

  it("altered tensions on dominant (A: b9=Bb, #9=B#, #11=D#, b13=F)", () => {
    const map = chordToneMap("A", "dominant", ["b9", "#9", "#11", "b13"]);
    expect(map.get(10)).toEqual({ name: "Bb", degree: "b9", isRoot: false });
    expect(map.get(0)).toEqual({ name: "B#", degree: "#9", isRoot: false });
    expect(map.get(3)).toEqual({ name: "D#", degree: "#11", isRoot: false });
    expect(map.get(5)).toEqual({ name: "F", degree: "b13", isRoot: false });
    expect(map.size).toBe(7); // 트라이어드 3 + 텐션 4
  });

  it("keeps the first tone on pitch-class collision (dim7 + 13 → bb7 wins)", () => {
    const map = chordToneMap("A", "diminished", ["7", "13"]);
    expect(map.size).toBe(4);
    expect(map.get(6)!.degree).toBe("bb7");
  });
});

describe("allowedExts", () => {
  it("dominant allows all 8, others only naturals", () => {
    expect(allowedExts("dominant")).toEqual(["7", "b9", "9", "#9", "11", "#11", "13", "b13"]);
    expect(allowedExts("minor")).toEqual(["7", "9", "11", "13"]);
    expect(allowedExts("diminished")).toEqual(["7", "9", "11", "13"]);
  });
});

describe("chordSymbol — altered tensions & 13th", () => {
  it("lists uppers in EXTENSIONS order, add-notation without 7", () => {
    expect(chordSymbol("dominant", ["7", "b9", "#9"])).toBe("7(b9,#9)");
    expect(chordSymbol("dominant", ["#9", "b9", "7"])).toBe("7(b9,#9)"); // 순서 정규화
    expect(chordSymbol("dominant", ["7", "13"])).toBe("7(13)");
    expect(chordSymbol("dominant", ["b9"])).toBe("(addb9)");
    expect(chordSymbol("major", ["7", "9", "13"])).toBe("maj7(9,13)");
  });
});
