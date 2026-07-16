import { describe, it, expect, afterEach, vi } from "vitest";
import { loadLang, saveLang, LANG_KEY, MESSAGES, SCALE_NAMES, CHORD_NAMES } from "./i18n";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("loadLang", () => {
  it("defaults to en when nothing is stored", () => {
    expect(loadLang()).toBe("en");
  });
  it("returns the stored value when valid", () => {
    window.localStorage.setItem(LANG_KEY, "ko");
    expect(loadLang()).toBe("ko");
  });
  it("ignores invalid stored values", () => {
    window.localStorage.setItem(LANG_KEY, "fr");
    expect(loadLang()).toBe("en");
  });
  it("falls back to en when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadLang()).toBe("en");
  });
});

describe("saveLang", () => {
  it("stores the language", () => {
    saveLang("ko");
    expect(window.localStorage.getItem(LANG_KEY)).toBe("ko");
  });
  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveLang("ko")).not.toThrow();
  });
});

describe("dictionaries", () => {
  it("localizes parametrized messages", () => {
    expect(MESSAGES.en.wrong("A")).toBe("Wrong — it was A");
    expect(MESSAGES.ko.wrong("A")).toBe("오답 — 정답은 A");
    expect(MESSAGES.en.findHeadingAsk("A", 1, 2)).toBe("Click every A on the fretboard (1/2)");
    expect(MESSAGES.en.hitLabel(6, 5)).toBe("String 6, fret 5");
    expect(MESSAGES.ko.hitLabel(6, 5)).toBe("6번 줄 5프렛");
  });
  it("maps scale and chord display names per language", () => {
    expect(SCALE_NAMES.en.minorPentatonic).toBe("Minor Pentatonic");
    expect(SCALE_NAMES.ko.minorPentatonic).toBe("마이너 펜타토닉");
    expect(CHORD_NAMES.en["7"]).toBe("Dominant 7");
    expect(CHORD_NAMES.ko.maj7).toBe("메이저 7");
  });
});
