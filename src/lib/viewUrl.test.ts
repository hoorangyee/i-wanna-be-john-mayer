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
  progOn: false,
  prog: [],
  progIndex: 0,
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

describe("progression state", () => {
  const PROG: UrlViewState = {
    ...D,
    mode: "chord",
    progOn: true,
    prog: [
      { root: "A", quality: "minor", exts: ["7"] },
      { root: "D", quality: "dominant", exts: ["7", "b9"] },
    ],
    progIndex: 1,
    // 단일 코드 필드는 언제나 지금 보이는 코드를 비춘다
    keySel: "D",
    quality: "dominant",
    exts: ["7", "b9"],
  };

  it("serializes chords and the selected index", () => {
    expect(viewQueryString(PROG, D))
      .toBe("?mode=chord&prog=A%3Aminor%3A7%3BD%3Adominant%3A7%2Cb9&pi=1");
  });

  it("round-trips", () => {
    expect(parseViewQuery(viewQueryString(PROG, D), D)).toEqual(PROG);
  });

  it("omits pi when the first chord is selected", () => {
    const v = { ...PROG, progIndex: 0, keySel: "A" as const, quality: "minor" as const, exts: ["7"] as const };
    expect(viewQueryString(v, D)).toBe("?mode=chord&prog=A%3Aminor%3A7%3BD%3Adominant%3A7%2Cb9");
  });

  it("drops the ext field for chords without tensions", () => {
    const v: UrlViewState = {
      ...D, mode: "chord", progOn: true, keySel: "C", quality: "major", exts: [],
      prog: [{ root: "C", quality: "major", exts: [] }],
    };
    expect(viewQueryString(v, D)).toBe("?mode=chord&prog=C%3Amajor");
    expect(parseViewQuery(viewQueryString(v, D), D)).toEqual(v);
  });

  it("survives sharps in roots and tensions", () => {
    const v: UrlViewState = {
      ...D, mode: "chord", progOn: true, keySel: "F#", quality: "dominant", exts: ["7", "#9"],
      prog: [{ root: "F#", quality: "dominant", exts: ["7", "#9"] }],
    };
    expect(parseViewQuery(viewQueryString(v, D), D)).toEqual(v);
  });

  it("does not serialize outside chord mode or when toggled off", () => {
    expect(viewQueryString({ ...PROG, mode: "overlay" }, D)).not.toContain("prog=");
    expect(viewQueryString({ ...PROG, progOn: false }, D)).not.toContain("prog=");
  });

  it("omits the single-chord params while a progression is active", () => {
    const q = viewQueryString(PROG, D);
    expect(q).not.toContain("key=");
    expect(q).not.toContain("quality=");
    expect(q).not.toContain("ext=");
  });

  it("still serializes the single chord once the progression is off", () => {
    expect(viewQueryString({ ...PROG, progOn: false }, D))
      .toBe("?mode=chord&key=D&ext=7%2Cb9");
  });

  it("turns the progression on when the param is present", () => {
    expect(parseViewQuery("?mode=chord&prog=A%3Aminor%3A7", D))
      .toMatchObject({ progOn: true, prog: [{ root: "A", quality: "minor", exts: ["7"] }] });
  });

  it("ignores the progression outside chord mode", () => {
    expect(parseViewQuery("?mode=overlay&prog=A%3Aminor%3A7", D))
      .toMatchObject({ progOn: false, prog: [] });
  });

  it("drops only the malformed chords", () => {
    expect(parseViewQuery("?mode=chord&prog=A%3Aminor%3BH%3Aminor%3BD%3Anope%3BG%3Amajor", D).prog)
      .toEqual([{ root: "A", quality: "minor", exts: [] }, { root: "G", quality: "major", exts: [] }]);
  });

  it("filters tensions the quality does not allow and normalizes order", () => {
    expect(parseViewQuery("?mode=chord&prog=A%3Aminor%3A13%2Cb9%2C7", D).prog)
      .toEqual([{ root: "A", quality: "minor", exts: ["7", "13"] }]);
  });

  it("truncates past MAX_PROG chords", () => {
    const many = Array.from({ length: 12 }, () => "A%3Aminor").join("%3B");
    expect(parseViewQuery(`?mode=chord&prog=${many}`, D).prog).toHaveLength(8);
  });

  it("clamps pi into range", () => {
    expect(parseViewQuery("?mode=chord&prog=A%3Aminor%3BD%3Adominant&pi=9", D).progIndex).toBe(1);
    expect(parseViewQuery("?mode=chord&prog=A%3Aminor%3BD%3Adominant&pi=-3", D).progIndex).toBe(0);
    expect(parseViewQuery("?mode=chord&prog=A%3Aminor&pi=oops", D).progIndex).toBe(0);
  });

  it("falls back to the single chord when no entry survives", () => {
    expect(parseViewQuery("?mode=chord&prog=H%3Anope", D))
      .toMatchObject({ progOn: false, prog: [], progIndex: 0 });
  });

  it("mirrors the selected chord into the single-chord fields", () => {
    expect(parseViewQuery("?mode=chord&prog=A%3Aminor%3A7%3BD%3Adominant%3A7&pi=1", D))
      .toMatchObject({ keySel: "D", quality: "dominant", exts: ["7"] });
  });
});
