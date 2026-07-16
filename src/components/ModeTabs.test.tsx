import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ModeTabs } from "./ModeTabs";

afterEach(() => cleanup());

describe("ModeTabs", () => {
  it("marks the active tab as pressed", () => {
    const { getByRole } = render(<ModeTabs mode="quiz" onSelect={vi.fn()} />);
    expect(getByRole("button", { name: "Quiz" }).getAttribute("aria-pressed")).toBe("true");
    expect(getByRole("button", { name: "Scale" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("selecting another mode emits the mode with a boxIndex reset", () => {
    const onSelect = vi.fn();
    const { getByRole } = render(<ModeTabs mode="scale" onSelect={onSelect} />);
    fireEvent.click(getByRole("button", { name: "Chord Tones" }));
    expect(onSelect).toHaveBeenCalledWith({ mode: "chord", boxIndex: null });
  });

  it("clicking the already-active tab does not emit", () => {
    const onSelect = vi.fn();
    const { getByRole } = render(<ModeTabs mode="scale" onSelect={onSelect} />);
    fireEvent.click(getByRole("button", { name: "Scale" }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
