import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { Controls } from "./Controls";

afterEach(() => {
  cleanup();
});

const baseProps = {
  mode: "scale" as const,
  keySel: "A" as const,
  scaleId: "minorPentatonic" as const,
  quality: "dominant" as const,
  exts: [] as const,
  labelMode: "name" as const,
  boxIndex: null,
  boxCount: 5,
  overlayRoot: "A" as const,
  onChange: vi.fn(),
};

describe("Controls (scale mode)", () => {
  it("hides the position filter when boxCount is null", () => {
    const { queryByRole, rerender } = render(<Controls {...baseProps} />);
    expect(queryByRole("group", { name: "Position" })).not.toBeNull();
    rerender(<Controls {...baseProps} boxCount={null} />);
    expect(queryByRole("group", { name: "Position" })).toBeNull();
  });

  it("resets boxIndex when the scale changes", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(<Controls {...baseProps} onChange={onChange} />);
    fireEvent.change(getByLabelText("Scale"), { target: { value: "major" } });
    expect(onChange).toHaveBeenCalledWith({ scaleId: "major", boxIndex: null });
  });
});

describe("Controls (chord mode)", () => {
  const chordProps = { ...baseProps, mode: "chord" as const };

  it("shows the quality select and extension toggles, hides scale select and position filter", () => {
    const { queryByLabelText, queryByRole, getByLabelText, getByRole } = render(<Controls {...chordProps} />);
    expect(getByLabelText("Chord")).not.toBeNull();
    expect(getByRole("option", { name: "Dominant" })).not.toBeNull();
    expect(getByRole("group", { name: "Extensions" })).not.toBeNull();
    expect(queryByLabelText("Scale")).toBeNull();
    expect(queryByRole("group", { name: "Position" })).toBeNull();
  });

  it("labels the key select as Root", () => {
    const { getByLabelText } = render(<Controls {...chordProps} />);
    expect(getByLabelText("Root")).not.toBeNull();
  });

  it("extension toggles start unpressed and emit an added extension", () => {
    const onChange = vi.fn();
    const { getByRole } = render(<Controls {...chordProps} onChange={onChange} />);
    const btn = getByRole("button", { name: "9th" });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(btn);
    expect(onChange).toHaveBeenCalledWith({ exts: ["9"] });
  });

  it("toggling an active extension removes it, and additions keep 7→9→11 order", () => {
    const onChange = vi.fn();
    const { getByRole, rerender } = render(
      <Controls {...chordProps} exts={["9"]} onChange={onChange} />
    );
    fireEvent.click(getByRole("button", { name: "9th" }));
    expect(onChange).toHaveBeenCalledWith({ exts: [] });
    rerender(<Controls {...chordProps} exts={["9"]} onChange={onChange} />);
    fireEvent.click(getByRole("button", { name: "7th" }));
    expect(onChange).toHaveBeenCalledWith({ exts: ["7", "9"] });
  });

  it("changing quality emits the new quality with filtered extensions", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(<Controls {...chordProps} onChange={onChange} />);
    fireEvent.change(getByLabelText("Chord"), { target: { value: "minor" } });
    expect(onChange).toHaveBeenCalledWith({ quality: "minor", exts: [] });
  });

  it("dominant shows altered-tension pills, other qualities only naturals", () => {
    const { getByRole, queryByRole, rerender } = render(<Controls {...chordProps} />);
    for (const name of ["7th", "flat ninth", "9th", "sharp ninth", "11th", "sharp eleventh", "13th", "flat thirteenth"]) {
      expect(getByRole("button", { name })).not.toBeNull();
    }
    rerender(<Controls {...chordProps} quality="minor" />);
    expect(queryByRole("button", { name: "flat ninth" })).toBeNull();
    expect(queryByRole("button", { name: "sharp eleventh" })).toBeNull();
    expect(getByRole("button", { name: "13th" })).not.toBeNull();
  });

  it("altered pills display the glyph but expose a spoken accessible name", () => {
    const { getByRole } = render(<Controls {...chordProps} />);
    const btn = getByRole("button", { name: "flat ninth" });
    expect(btn.textContent).toBe("b9");
  });

  it("switching quality away from dominant drops altered extensions but keeps naturals", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <Controls {...chordProps} exts={["7", "b9", "13"]} onChange={onChange} />
    );
    fireEvent.change(getByLabelText("Chord"), { target: { value: "minor" } });
    expect(onChange).toHaveBeenCalledWith({ quality: "minor", exts: ["7", "13"] });
  });

  it("altered pill toggles emit like natural ones", () => {
    const onChange = vi.fn();
    const { getByRole } = render(<Controls {...chordProps} exts={["7"]} onChange={onChange} />);
    fireEvent.click(getByRole("button", { name: "flat ninth" }));
    expect(onChange).toHaveBeenCalledWith({ exts: ["7", "b9"] });
  });
});

describe("Controls (quiz mode)", () => {
  it("renders nothing in quiz mode (settings live in Quiz)", () => {
    const { container } = render(<Controls {...baseProps} mode="quiz" />);
    expect(container.firstChild).toBeNull();
  });
});

describe("Controls (overlay mode)", () => {
  const overlayProps = { ...baseProps, mode: "overlay" as const, overlayRoot: "E" as const };

  it("shows scale, chord-root, quality selects and extension toggles, hides the box filter", () => {
    const { getByLabelText, getByRole, queryByRole } = render(<Controls {...overlayProps} />);
    expect(getByLabelText("Key")).not.toBeNull();
    expect(getByLabelText("Scale")).not.toBeNull();
    expect(getByLabelText("Chord Root")).not.toBeNull();
    expect(getByLabelText("Chord")).not.toBeNull();
    expect(getByRole("group", { name: "Extensions" })).not.toBeNull();
    expect(queryByRole("group", { name: "Position" })).toBeNull();
  });
});
