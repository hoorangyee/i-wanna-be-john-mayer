import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ModeTabs } from "./ModeTabs";

afterEach(() => cleanup());

describe("ModeTabs", () => {
  it("marks the active tab as pressed", () => {
    const { getByRole } = render(<ModeTabs mode="quiz" onSelect={vi.fn()} />);
    expect(getByRole("button", { name: "퀴즈" }).getAttribute("aria-pressed")).toBe("true");
    expect(getByRole("button", { name: "스케일" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("selecting another mode emits the mode with a boxIndex reset", () => {
    const onSelect = vi.fn();
    const { getByRole } = render(<ModeTabs mode="scale" onSelect={onSelect} />);
    fireEvent.click(getByRole("button", { name: "코드톤" }));
    expect(onSelect).toHaveBeenCalledWith({ mode: "chord", boxIndex: null });
  });

  it("clicking the already-active tab does not emit", () => {
    const onSelect = vi.fn();
    const { getByRole } = render(<ModeTabs mode="scale" onSelect={onSelect} />);
    fireEvent.click(getByRole("button", { name: "스케일" }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
