import { describe, it, expect } from "vitest";
import { boxesFor } from "./boxes";

describe("boxesFor", () => {
  it("A minor pentatonic: canonical 5 boxes starting at root anchor", () => {
    expect(boxesFor("A", "minorPentatonic")).toEqual([
      { start: 5, end: 9 },
      { start: 8, end: 12 },
      { start: 10, end: 14 },
      { start: 12, end: 16 },
      { start: 15, end: 19 },
    ]);
  });

  it("E minor pentatonic: box 1 uses open position", () => {
    const boxes = boxesFor("E", "minorPentatonic")!;
    expect(boxes[0]).toEqual({ start: 0, end: 4 });
    expect(boxes).toHaveLength(5);
  });

  it("blues reuses the minor pentatonic anchors (b5 ignored)", () => {
    expect(boxesFor("A", "blues")).toEqual(boxesFor("A", "minorPentatonic"));
  });

  it("7-note scales are not supported in M1", () => {
    expect(boxesFor("C", "major")).toBeNull();
    expect(boxesFor("A", "naturalMinor")).toBeNull();
  });
});
