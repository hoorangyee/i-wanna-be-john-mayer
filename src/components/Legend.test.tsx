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

  it("chord mode shows degree swatches", () => {
    const { getByText, queryByText } = render(<Legend mode="chord" />);
    for (const label of ["Root (1)", "3rd", "5th", "7th"]) {
      expect(getByText(label)).not.toBeNull();
    }
    expect(queryByText("Scale notes")).toBeNull();
  });

  it("overlay mode adds the dimmed scale-note swatch", () => {
    const { getByText } = render(<Legend mode="overlay" />);
    for (const label of ["Root (1)", "3rd", "5th", "7th", "Scale notes"]) {
      expect(getByText(label)).not.toBeNull();
    }
  });
});
