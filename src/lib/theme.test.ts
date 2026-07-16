import { describe, it, expect, afterEach, vi } from "vitest";
import {
  loadThemePref, saveThemePref, resolveTheme, nextThemePref, applyTheme, THEME_KEY,
} from "./theme";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.theme;
});

describe("loadThemePref", () => {
  it("returns system when nothing is stored", () => {
    expect(loadThemePref()).toBe("system");
  });

  it("returns the stored value when valid", () => {
    window.localStorage.setItem(THEME_KEY, "dark");
    expect(loadThemePref()).toBe("dark");
  });

  it("ignores invalid stored values", () => {
    window.localStorage.setItem(THEME_KEY, "neon");
    expect(loadThemePref()).toBe("system");
  });

  it("falls back to system when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadThemePref()).toBe("system");
  });
});

describe("saveThemePref", () => {
  it("stores light/dark and removes the key for system", () => {
    saveThemePref("dark");
    expect(window.localStorage.getItem(THEME_KEY)).toBe("dark");
    saveThemePref("system");
    expect(window.localStorage.getItem(THEME_KEY)).toBeNull();
  });

  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveThemePref("light")).not.toThrow();
  });
});

describe("resolveTheme / nextThemePref / applyTheme", () => {
  it("resolves system by the OS preference", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("explicit prefs override the OS preference", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("cycles system → light → dark → system", () => {
    expect(nextThemePref("system")).toBe("light");
    expect(nextThemePref("light")).toBe("dark");
    expect(nextThemePref("dark")).toBe("system");
  });

  it("applyTheme stamps the resolved theme on <html>", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
