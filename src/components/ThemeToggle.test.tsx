import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";

function stubMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
}

beforeEach(() => stubMatchMedia(false));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.theme;
});

describe("ThemeToggle", () => {
  it("cycles system → light → dark → system", () => {
    const { getByRole } = render(<ThemeToggle />);
    const btn = getByRole("button", { name: "Theme: System" });
    fireEvent.click(btn);
    expect(getByRole("button", { name: "Theme: Light" })).not.toBeNull();
    fireEvent.click(btn);
    expect(getByRole("button", { name: "Theme: Dark" })).not.toBeNull();
    fireEvent.click(btn);
    expect(getByRole("button", { name: "Theme: System" })).not.toBeNull();
  });

  it("persists the preference and applies the resolved theme", () => {
    const { getByRole } = render(<ThemeToggle />);
    fireEvent.click(getByRole("button", { name: "Theme: System" })); // → light
    expect(window.localStorage.getItem("fretboard-theme")).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    fireEvent.click(getByRole("button", { name: "Theme: Light" })); // → dark
    expect(window.localStorage.getItem("fretboard-theme")).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("system mode follows the OS preference on mount", () => {
    stubMatchMedia(true); // OS 다크
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("applies a persisted preference on mount even when it differs from the OS", () => {
    window.localStorage.setItem("fretboard-theme", "dark");
    stubMatchMedia(false); // OS 라이트
    const { getByRole } = render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(getByRole("button", { name: "Theme: Dark" })).not.toBeNull();
  });
});
