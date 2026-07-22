import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ProgressionBar } from "./ProgressionBar";
import { MAX_PROG, type ProgChord } from "@/theory/progression";

afterEach(() => cleanup());

const AM7: ProgChord = { root: "A", quality: "minor", exts: ["7"] };
const D7: ProgChord = { root: "D", quality: "dominant", exts: ["7"] };
const GMAJ7: ProgChord = { root: "G", quality: "major", exts: ["7"] };

const props = (over: Partial<Parameters<typeof ProgressionBar>[0]> = {}) => ({
  prog: [AM7, D7, GMAJ7],
  index: 1,
  onSelect: vi.fn(),
  onInsert: vi.fn(),
  onRemove: vi.fn(),
  ...over,
});

describe("ProgressionBar", () => {
  it("renders a chip per chord with its symbol", () => {
    const { getByText } = render(<ProgressionBar {...props()} />);
    for (const symbol of ["Am7", "D7", "Gmaj7"]) {
      expect(getByText(symbol)).not.toBeNull();
    }
  });

  it("marks the selected chip and names chips for screen readers", () => {
    const { getByLabelText } = render(<ProgressionBar {...props()} />);
    expect(getByLabelText("Chord 2: D7").getAttribute("aria-pressed")).toBe("true");
    expect(getByLabelText("Chord 1: Am7").getAttribute("aria-pressed")).toBe("false");
  });

  it("selects the clicked chip", () => {
    const p = props();
    const { getByText } = render(<ProgressionBar {...p} />);
    fireEvent.click(getByText("Gmaj7"));
    expect(p.onSelect).toHaveBeenCalledWith(2);
  });

  it("adds and removes through the toolbar", () => {
    const p = props();
    const { getByLabelText } = render(<ProgressionBar {...p} />);
    fireEvent.click(getByLabelText("Add a chord after the selected one"));
    expect(p.onInsert).toHaveBeenCalled();
    fireEvent.click(getByLabelText("Remove the selected chord"));
    expect(p.onRemove).toHaveBeenCalled();
  });

  it("disables adding at the cap", () => {
    const full = Array.from({ length: MAX_PROG }, () => AM7);
    const { getByLabelText } = render(<ProgressionBar {...props({ prog: full, index: 0 })} />);
    expect((getByLabelText("Add a chord after the selected one") as HTMLButtonElement).disabled).toBe(true);
  });

  it("disables removing the last remaining chord and shows the hint", () => {
    const { getByLabelText, getByText } = render(<ProgressionBar {...props({ prog: [AM7], index: 0 })} />);
    expect((getByLabelText("Remove the selected chord") as HTMLButtonElement).disabled).toBe(true);
    expect(getByText("Add one more chord to see how the two connect.")).not.toBeNull();
  });

  it("hides the hint once a second chord exists", () => {
    const { queryByText } = render(<ProgressionBar {...props()} />);
    expect(queryByText("Add one more chord to see how the two connect.")).toBeNull();
  });
});

describe("ProgressionBar keyboard navigation", () => {
  it("moves with the arrow keys", () => {
    const p = props();
    render(<ProgressionBar {...p} />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(p.onSelect).toHaveBeenCalledWith(2);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(p.onSelect).toHaveBeenCalledWith(0);
  });

  it("wraps around both ends", () => {
    const last = props({ index: 2 });
    render(<ProgressionBar {...last} />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(last.onSelect).toHaveBeenCalledWith(0);
    cleanup();

    const first = props({ index: 0 });
    render(<ProgressionBar {...first} />);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(first.onSelect).toHaveBeenCalledWith(2);
  });

  it("leaves the arrow keys to focused form controls", () => {
    const p = props();
    render(<ProgressionBar {...p} />);
    const select = document.createElement("select");
    document.body.appendChild(select);
    fireEvent.keyDown(select, { key: "ArrowRight" });
    expect(p.onSelect).not.toHaveBeenCalled();
    select.remove();
  });

  it("ignores arrows pressed with a modifier", () => {
    const p = props();
    render(<ProgressionBar {...p} />);
    fireEvent.keyDown(window, { key: "ArrowRight", metaKey: true });
    fireEvent.keyDown(window, { key: "ArrowLeft", ctrlKey: true });
    fireEvent.keyDown(window, { key: "ArrowRight", altKey: true });
    expect(p.onSelect).not.toHaveBeenCalled();
  });

  it("does nothing with a single chord", () => {
    const p = props({ prog: [AM7], index: 0 });
    render(<ProgressionBar {...p} />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(p.onSelect).not.toHaveBeenCalled();
  });
});
