import { describe, it, expect } from "vitest";
import { parseViewQuery, viewQueryString, type UrlViewState } from "./viewUrl";

const D: UrlViewState = {
  mode: "scale",
  keySel: "A",
  scaleId: "minorPentatonic",
  chordId: "7",
  labelMode: "name",
  boxIndex: null,
  overlayRoot: "A",
};

describe("viewQueryString", () => {
  it("returns empty string for the default view", () => {
    expect(viewQueryString(D, D)).toBe("");
  });

  it("encodes only non-default fields", () => {
    expect(viewQueryString({ ...D, mode: "chord", keySel: "E" }, D)).toBe("?mode=chord&key=E");
  });

  it("encodes box 1-based and only in scale mode", () => {
    expect(viewQueryString({ ...D, boxIndex: 1 }, D)).toBe("?box=2");
    expect(viewQueryString({ ...D, mode: "chord", boxIndex: 1 }, D)).toBe("?mode=chord");
  });

  it("omits scale in chord mode and chord in scale mode", () => {
    expect(viewQueryString({ ...D, scaleId: "blues" }, D)).toBe("?scale=blues");
    expect(viewQueryString({ ...D, mode: "chord", chordId: "maj7" }, D)).toBe("?mode=chord&chord=maj7");
    expect(viewQueryString({ ...D, chordId: "maj7" }, D)).toBe(""); // scale 모드에선 chord 생략
  });

  it("encodes only mode for quiz view", () => {
    expect(viewQueryString({ ...D, mode: "quiz", keySel: "Bb", labelMode: "degree" }, D)).toBe("?mode=quiz");
  });

  it("encodes overlay mode with scale, chord root and chord", () => {
    expect(viewQueryString({ ...D, mode: "overlay", scaleId: "blues", overlayRoot: "E" }, D))
      .toBe("?mode=overlay&scale=blues&croot=E");
  });
});

describe("parseViewQuery", () => {
  it("round-trips a non-default view", () => {
    const v: UrlViewState = { ...D, mode: "chord", keySel: "Bb", chordId: "maj7" };
    expect(parseViewQuery(viewQueryString(v, D), D)).toEqual(v);
  });

  it("falls back to defaults on invalid values", () => {
    expect(parseViewQuery("?mode=nope&key=H&scale=phrygian&box=99", D)).toEqual(D);
  });

  it("parses box to 0-based index within 1..5", () => {
    expect(parseViewQuery("?box=3", D).boxIndex).toBe(2);
    expect(parseViewQuery("?box=0", D).boxIndex).toBeNull();
    expect(parseViewQuery("?box=6", D).boxIndex).toBeNull();
  });

  it("restores quiz mode from the URL", () => {
    expect(parseViewQuery("?mode=quiz", D).mode).toBe("quiz");
  });

  it("round-trips an overlay view", () => {
    const v: UrlViewState = { ...D, mode: "overlay", overlayRoot: "Bb", chordId: "m7" };
    expect(parseViewQuery(viewQueryString(v, D), D)).toEqual(v);
  });
});
