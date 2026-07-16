import { describe, it, expect } from "vitest";
import { KEYS, keyToPc, spell, preference, spellWith } from "./notes";

describe("keyToPc", () => {
  it("maps canonical keys to pitch classes", () => {
    expect(keyToPc("C")).toBe(0);
    expect(keyToPc("Db")).toBe(1);
    expect(keyToPc("F#")).toBe(6);
    expect(keyToPc("Bb")).toBe(10);
    expect(keyToPc("B")).toBe(11);
  });

  it("KEYS has all 12 pitch classes exactly once", () => {
    const pcs = KEYS.map(keyToPc).sort((a, b) => a - b);
    expect(pcs).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});

describe("spell", () => {
  it("uses flats in flat keys", () => {
    expect(spell(10, "F")).toBe("Bb");   // F키의 4음
    expect(spell(3, "Eb")).toBe("Eb");
    expect(spell(1, "Ab")).toBe("Db");
  });

  it("uses sharps in sharp keys", () => {
    expect(spell(6, "G")).toBe("F#");
    expect(spell(1, "A")).toBe("C#");
    expect(spell(10, "E")).toBe("A#");
  });

  it("naturals are identical in both preferences", () => {
    expect(spell(0, "F")).toBe("C");
    expect(spell(0, "G")).toBe("C");
  });
});

describe("preference", () => {
  it("major family follows the existing flat-key set", () => {
    expect(preference("F", "major")).toBe("flat");
    expect(preference("G", "major")).toBe("sharp");
  });

  it("minor family: explicit accidental in key name wins", () => {
    expect(preference("Eb", "minor")).toBe("flat");
    expect(preference("F#", "minor")).toBe("sharp");
  });

  it("minor family: natural keys inherit relative major preference", () => {
    expect(preference("G", "minor")).toBe("flat");  // 나란한조 Bb
    expect(preference("D", "minor")).toBe("flat");  // 나란한조 F
    expect(preference("E", "minor")).toBe("sharp"); // 나란한조 G
    expect(preference("A", "minor")).toBe("sharp"); // 나란한조 C
    expect(preference("B", "minor")).toBe("sharp"); // 나란한조 D
  });
});

describe("spellWith", () => {
  it("spells by explicit accidental, normalizing out-of-range pc", () => {
    expect(spellWith(10, "flat")).toBe("Bb");
    expect(spellWith(10, "sharp")).toBe("A#");
    expect(spellWith(-2, "flat")).toBe("Bb");
    expect(spellWith(13, "sharp")).toBe("C#");
  });
});
