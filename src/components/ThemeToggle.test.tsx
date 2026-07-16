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
    const btn = getByRole("button", { name: "테마: 시스템" });
    fireEvent.click(btn);
    expect(getByRole("button", { name: "테마: 라이트" })).not.toBeNull();
    fireEvent.click(btn);
    expect(getByRole("button", { name: "테마: 다크" })).not.toBeNull();
    fireEvent.click(btn);
    expect(getByRole("button", { name: "테마: 시스템" })).not.toBeNull();
  });

  it("persists the preference and applies the resolved theme", () => {
    const { getByRole } = render(<ThemeToggle />);
    fireEvent.click(getByRole("button", { name: "테마: 시스템" })); // → light
    expect(window.localStorage.getItem("fretboard-theme")).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    fireEvent.click(getByRole("button", { name: "테마: 라이트" })); // → dark
    expect(window.localStorage.getItem("fretboard-theme")).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("system mode follows the OS preference on mount", () => {
    stubMatchMedia(true); // OS 다크
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
