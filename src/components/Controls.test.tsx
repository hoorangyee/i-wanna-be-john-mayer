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
  chordId: "7" as const,
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

  it("shows the chord select and hides scale select and position filter", () => {
    const { queryByLabelText, queryByRole, getByLabelText } = render(<Controls {...chordProps} />);
    expect(getByLabelText("Chord")).not.toBeNull();
    expect(queryByLabelText("Scale")).toBeNull();
    expect(queryByRole("group", { name: "Position" })).toBeNull();
  });

  it("labels the key select as Root and composes chord option text", () => {
    const { getByLabelText, getByRole } = render(<Controls {...chordProps} />);
    expect(getByLabelText("Root")).not.toBeNull();
    expect(getByRole("option", { name: "A7 · Dominant 7" })).not.toBeNull();
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

  it("shows scale, chord-root and chord selects and hides the box filter", () => {
    const { getByLabelText, queryByRole } = render(<Controls {...overlayProps} />);
    expect(getByLabelText("Key")).not.toBeNull();
    expect(getByLabelText("Scale")).not.toBeNull();
    expect(getByLabelText("Chord Root")).not.toBeNull();
    expect(getByLabelText("Chord")).not.toBeNull();
    expect(queryByRole("group", { name: "Position" })).toBeNull();
  });

  it("chord option text uses the overlay chord root", () => {
    const { getByRole } = render(<Controls {...overlayProps} />);
    expect(getByRole("option", { name: "E7 · Dominant 7" })).not.toBeNull();
  });
});
