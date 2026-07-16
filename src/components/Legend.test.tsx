import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Legend } from "./Legend";

afterEach(() => cleanup());

describe("Legend", () => {
  it("scale mode shows root and scale-note swatches", () => {
    const { getByText, queryByText } = render(<Legend mode="scale" />);
    expect(getByText("루트")).not.toBeNull();
    expect(getByText("스케일음")).not.toBeNull();
    expect(queryByText("3도")).toBeNull();
  });

  it("chord mode shows degree swatches", () => {
    const { getByText, queryByText } = render(<Legend mode="chord" />);
    for (const label of ["루트 (1)", "3도", "5도", "7도"]) {
      expect(getByText(label)).not.toBeNull();
    }
    expect(queryByText("스케일음")).toBeNull();
  });

  it("overlay mode adds the dimmed scale-note swatch", () => {
    const { getByText } = render(<Legend mode="overlay" />);
    for (const label of ["루트 (1)", "3도", "5도", "7도", "스케일음"]) {
      expect(getByText(label)).not.toBeNull();
    }
  });
});
