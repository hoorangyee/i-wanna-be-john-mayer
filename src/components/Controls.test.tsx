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
    expect(queryByRole("group", { name: "포지션" })).not.toBeNull();
    rerender(<Controls {...baseProps} boxCount={null} />);
    expect(queryByRole("group", { name: "포지션" })).toBeNull();
  });

  it("resets boxIndex when the scale changes", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(<Controls {...baseProps} onChange={onChange} />);
    fireEvent.change(getByLabelText("스케일"), { target: { value: "major" } });
    expect(onChange).toHaveBeenCalledWith({ scaleId: "major", boxIndex: null });
  });

  it("clicking the already-active mode tab does not fire onChange", () => {
    const onChange = vi.fn();
    const { getByRole } = render(<Controls {...baseProps} onChange={onChange} />);
    fireEvent.click(getByRole("button", { name: "스케일" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Controls (chord mode)", () => {
  const chordProps = { ...baseProps, mode: "chord" as const };

  it("shows the chord select and hides scale select and position filter", () => {
    const { queryByLabelText, queryByRole, getByLabelText } = render(<Controls {...chordProps} />);
    expect(getByLabelText("코드")).not.toBeNull();
    expect(queryByLabelText("스케일")).toBeNull();
    expect(queryByRole("group", { name: "포지션" })).toBeNull();
  });

  it("labels the key select as 루트 and composes chord option text", () => {
    const { getByLabelText, getByRole } = render(<Controls {...chordProps} />);
    expect(getByLabelText("루트")).not.toBeNull();
    expect(getByRole("option", { name: "A7 · 도미넌트 7" })).not.toBeNull();
  });

  it("switching mode resets boxIndex", () => {
    const onChange = vi.fn();
    const { getByRole } = render(<Controls {...baseProps} onChange={onChange} />);
    fireEvent.click(getByRole("button", { name: "코드톤" }));
    expect(onChange).toHaveBeenCalledWith({ mode: "chord", boxIndex: null });
  });
});

describe("Controls (quiz mode)", () => {
  it("shows only the mode tabs in quiz mode", () => {
    const { queryByLabelText, queryByRole, getByRole } = render(
      <Controls {...baseProps} mode="quiz" />
    );
    expect(getByRole("button", { name: "퀴즈" }).getAttribute("aria-pressed")).toBe("true");
    expect(queryByLabelText("키")).toBeNull();
    expect(queryByLabelText("스케일")).toBeNull();
    expect(queryByRole("group", { name: "라벨 표시" })).toBeNull();
    expect(queryByRole("group", { name: "포지션" })).toBeNull();
  });
});

describe("Controls (overlay mode)", () => {
  const overlayProps = { ...baseProps, mode: "overlay" as const, overlayRoot: "E" as const };

  it("shows scale, chord-root and chord selects and hides the box filter", () => {
    const { getByLabelText, queryByRole } = render(<Controls {...overlayProps} />);
    expect(getByLabelText("키")).not.toBeNull();
    expect(getByLabelText("스케일")).not.toBeNull();
    expect(getByLabelText("코드 루트")).not.toBeNull();
    expect(getByLabelText("코드")).not.toBeNull();
    expect(queryByRole("group", { name: "포지션" })).toBeNull();
  });

  it("chord option text uses the overlay chord root", () => {
    const { getByRole } = render(<Controls {...overlayProps} />);
    expect(getByRole("option", { name: "E7 · 도미넌트 7" })).not.toBeNull();
  });
});
