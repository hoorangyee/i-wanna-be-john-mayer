import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, screen, cleanup } from "@testing-library/react";
import { Controls } from "./Controls";

afterEach(() => {
  cleanup();
});

const baseProps = {
  keySel: "A" as const,
  scaleId: "minorPentatonic" as const,
  labelMode: "name" as const,
  boxIndex: null,
  boxCount: 5,
  onChange: vi.fn(),
};

describe("Controls", () => {
  it("hides the position filter when boxCount is null", () => {
    const { queryByRole, rerender } = render(<Controls {...baseProps} />);
    expect(queryByRole("group", { name: "포지션" })).not.toBeNull();
    rerender(<Controls {...baseProps} boxCount={null} />);
    expect(queryByRole("group", { name: "포지션" })).toBeNull();
  });

  it("resets boxIndex when the scale changes", () => {
    const onChange = vi.fn();
    render(<Controls {...baseProps} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue("마이너 펜타토닉"), { target: { value: "major" } });
    expect(onChange).toHaveBeenCalledWith({ scaleId: "major", boxIndex: null });
  });
});
