import { describe, it, expect } from "vitest";
import { FRET_COUNT, STRINGS, TUNING, pitchAt, posKey } from "./fretboard";

describe("fretboard", () => {
  it("standard tuning open strings", () => {
    expect(TUNING[6]).toBe(4);  // E
    expect(TUNING[5]).toBe(9);  // A
    expect(TUNING[4]).toBe(2);  // D
    expect(TUNING[3]).toBe(7);  // G
    expect(TUNING[2]).toBe(11); // B
    expect(TUNING[1]).toBe(4);  // E
  });

  it("pitchAt: open string equals tuning", () => {
    expect(pitchAt({ str: 6, fret: 0 })).toBe(4);
  });

  it("pitchAt: well-known landmarks", () => {
    expect(pitchAt({ str: 5, fret: 3 })).toBe(0);  // A현 3프렛 = C
    expect(pitchAt({ str: 6, fret: 5 })).toBe(9);  // E현 5프렛 = A
    expect(pitchAt({ str: 6, fret: 12 })).toBe(4); // 12프렛 = 옥타브
    expect(pitchAt({ str: 2, fret: 1 })).toBe(0);  // B현 1프렛 = C
    expect(pitchAt({ str: 1, fret: 22 })).toBe(2); // 1번 줄 22프렛 = D
  });

  it("constants", () => {
    expect(FRET_COUNT).toBe(22);
    expect(STRINGS).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("posKey formats string-fret", () => {
    expect(posKey({ str: 6, fret: 5 })).toBe("6-5");
    expect(posKey({ str: 1, fret: 0 })).toBe("1-0");
  });
});
