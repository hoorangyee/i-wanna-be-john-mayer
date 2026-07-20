import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Legend } from "./Legend";

afterEach(() => cleanup());

describe("Legend", () => {
  it("scale mode shows root and scale-note swatches", () => {
    const { getByText, queryByText } = render(<Legend mode="scale" />);
    expect(getByText("Root")).not.toBeNull();
    expect(getByText("Scale notes")).not.toBeNull();
    expect(queryByText("3rd")).toBeNull();
  });

  it("chord mode shows only the triad by default", () => {
    const { getByText, queryByText } = render(<Legend mode="chord" />);
    for (const label of ["Root (1)", "3rd", "5th"]) {
      expect(getByText(label)).not.toBeNull();
    }
    expect(queryByText("7th")).toBeNull();
    expect(queryByText("9th")).toBeNull();
    expect(queryByText("11th")).toBeNull();
  });

  it("chord mode adds swatches for active extensions only", () => {
    const { getByText, queryByText } = render(<Legend mode="chord" exts={["7", "11"]} />);
    expect(getByText("7th")).not.toBeNull();
    expect(getByText("11th")).not.toBeNull();
    expect(queryByText("9th")).toBeNull();
  });

  it("overlay mode keeps the dimmed scale-note swatch after extensions", () => {
    const { getByText } = render(<Legend mode="overlay" exts={["9"]} />);
    for (const label of ["Root (1)", "3rd", "5th", "9th", "Scale notes"]) {
      expect(getByText(label)).not.toBeNull();
    }
  });

  it("groups variant tensions under their slot swatch", () => {
    const { getByText, queryByText } = render(<Legend mode="chord" exts={["b9", "#11"]} />);
    expect(getByText("9th")).not.toBeNull();
    expect(getByText("11th")).not.toBeNull();
    expect(queryByText("7th")).toBeNull();
  });

  it("shows the 13th swatch when 13 or b13 is active", () => {
    const { getByText, rerender } = render(<Legend mode="chord" exts={["13"]} />);
    expect(getByText("13th")).not.toBeNull();
    rerender(<Legend mode="chord" exts={["b13"]} />);
    expect(getByText("13th")).not.toBeNull();
  });
});
