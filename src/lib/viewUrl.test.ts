import { describe, it, expect } from "vitest";
import { parseViewQuery, viewQueryString, type UrlViewState } from "./viewUrl";

const D: UrlViewState = {
  mode: "scale",
  keySel: "A",
  scaleId: "minorPentatonic",
  quality: "dominant",
  exts: [],
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

  it("encodes quality and ext only in chord/overlay modes", () => {
    expect(viewQueryString({ ...D, mode: "chord", quality: "major", exts: ["7"] }, D))
      .toBe("?mode=chord&quality=major&ext=7");
    expect(viewQueryString({ ...D, quality: "major", exts: ["7"] }, D)).toBe(""); // scale 모드에선 생략
  });

  it("normalizes ext order and omits empty ext", () => {
    expect(viewQueryString({ ...D, mode: "chord", exts: ["11", "7"] }, D))
      .toBe("?mode=chord&ext=7%2C11");
    expect(viewQueryString({ ...D, mode: "chord" }, D)).toBe("?mode=chord");
  });

  it("encodes only mode for quiz view", () => {
    expect(viewQueryString({ ...D, mode: "quiz", keySel: "Bb", labelMode: "degree" }, D)).toBe("?mode=quiz");
  });

  it("encodes overlay mode with scale, chord root, quality and ext", () => {
    expect(viewQueryString({ ...D, mode: "overlay", scaleId: "blues", overlayRoot: "E", exts: ["9"] }, D))
      .toBe("?mode=overlay&scale=blues&croot=E&ext=9");
  });
});

describe("parseViewQuery", () => {
  it("round-trips a non-default view", () => {
    const v: UrlViewState = { ...D, mode: "chord", keySel: "Bb", quality: "major", exts: ["7", "9"] };
    expect(parseViewQuery(viewQueryString(v, D), D)).toEqual(v);
  });

  it("falls back to defaults on invalid values", () => {
    expect(parseViewQuery("?mode=nope&key=H&quality=aug&ext=b7&box=99", D)).toEqual(D);
  });

  it("normalizes ext order and duplicates", () => {
    expect(parseViewQuery("?mode=chord&ext=11,7,7", D).exts).toEqual(["7", "11"]);
  });

  it("parses box to 0-based index within 1..5", () => {
    expect(parseViewQuery("?box=3", D).boxIndex).toBe(2);
    expect(parseViewQuery("?box=0", D).boxIndex).toBeNull();
    expect(parseViewQuery("?box=6", D).boxIndex).toBeNull();
  });

  it("round-trips an overlay view", () => {
    const v: UrlViewState = { ...D, mode: "overlay", overlayRoot: "Bb", quality: "minor", exts: ["7", "11"] };
    expect(parseViewQuery(viewQueryString(v, D), D)).toEqual(v);
  });

  it("round-trips new qualities and the 13th", () => {
    const v: UrlViewState = { ...D, mode: "chord", quality: "halfDiminished", exts: ["7", "13"] };
    expect(viewQueryString(v, D)).toBe("?mode=chord&quality=halfDiminished&ext=7%2C13");
    expect(parseViewQuery(viewQueryString(v, D), D)).toEqual(v);
  });

  it("round-trips altered tensions with URL encoding (# → %23)", () => {
    const v: UrlViewState = { ...D, mode: "chord", exts: ["7", "b9", "#9"] };
    expect(viewQueryString(v, D)).toBe("?mode=chord&ext=7%2Cb9%2C%239");
    expect(parseViewQuery(viewQueryString(v, D), D)).toEqual(v);
  });

  it("drops altered tensions for non-dominant qualities on parse", () => {
    expect(parseViewQuery("?mode=chord&quality=minor&ext=7,b9,13", D).exts).toEqual(["7", "13"]);
  });

  it("drops altered tensions for non-dominant qualities on serialize", () => {
    expect(viewQueryString({ ...D, mode: "chord", quality: "minor", exts: ["7", "b9"] }, D))
      .toBe("?mode=chord&quality=minor&ext=7");
  });

  it("drops the 13th for diminished (same pitch as bb7)", () => {
    expect(parseViewQuery("?mode=chord&quality=diminished&ext=7,13", D).exts).toEqual(["7"]);
  });

  it("round-trips the diminished quality", () => {
    const v: UrlViewState = { ...D, mode: "chord", quality: "diminished", exts: ["7"] };
    expect(viewQueryString(v, D)).toBe("?mode=chord&quality=diminished&ext=7");
    expect(parseViewQuery(viewQueryString(v, D), D)).toEqual(v);
  });
});

describe("parseViewQuery — legacy chord param", () => {
  it("maps the 5 legacy chords preserving what they displayed", () => {
    expect(parseViewQuery("?mode=chord&chord=maj", D)).toMatchObject({ quality: "major", exts: [] });
    expect(parseViewQuery("?mode=chord&chord=m", D)).toMatchObject({ quality: "minor", exts: [] });
    expect(parseViewQuery("?mode=chord&chord=7", D)).toMatchObject({ quality: "dominant", exts: ["7"] });
    expect(parseViewQuery("?mode=chord&chord=maj7", D)).toMatchObject({ quality: "major", exts: ["7"] });
    expect(parseViewQuery("?mode=chord&chord=m7", D)).toMatchObject({ quality: "minor", exts: ["7"] });
  });

  it("ignores legacy chord when a new param is present", () => {
    expect(parseViewQuery("?mode=chord&quality=minor&chord=maj7", D))
      .toMatchObject({ quality: "minor", exts: [] });
    expect(parseViewQuery("?mode=chord&ext=9&chord=maj7", D))
      .toMatchObject({ quality: "dominant", exts: ["9"] });
  });

  it("ignores unknown legacy values", () => {
    expect(parseViewQuery("?mode=chord&chord=dim", D)).toMatchObject({ quality: "dominant", exts: [] });
  });
});
