import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { LangProvider } from "@/lib/LangContext";
import { LangToggle } from "./LangToggle";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.lang = "";
});

describe("LangToggle", () => {
  it("defaults to English and toggles to Korean", () => {
    const { getByRole } = render(<LangProvider><LangToggle /></LangProvider>);
    const btn = getByRole("button", { name: "Language: English" });
    fireEvent.click(btn);
    expect(getByRole("button", { name: "언어: 한국어" })).not.toBeNull();
    expect(window.localStorage.getItem("fretboard-lang")).toBe("ko");
    expect(document.documentElement.lang).toBe("ko");
  });

  it("restores a persisted language on mount", () => {
    window.localStorage.setItem("fretboard-lang", "ko");
    const { getByRole } = render(<LangProvider><LangToggle /></LangProvider>);
    expect(getByRole("button", { name: "언어: 한국어" })).not.toBeNull();
  });

  it("renders in English without a provider", () => {
    const { getByRole } = render(<LangToggle />);
    expect(getByRole("button", { name: "Language: English" })).not.toBeNull();
  });
});
