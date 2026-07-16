import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { SoundToggle } from "./SoundToggle";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("SoundToggle", () => {
  it("toggles the sound preference and its pressed state", () => {
    const { getByRole } = render(<SoundToggle />);
    const btn = getByRole("button", { name: /소리/ });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(window.localStorage.getItem("fretboard-sound-enabled")).toBe("off");
  });
});
