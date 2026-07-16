import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Fretboard, type QuizMark } from "./Fretboard";
import { scaleNoteMap } from "@/theory/scales";
import { chordNoteMap } from "@/theory/chords";

describe("Fretboard", () => {
  const notes = scaleNoteMap("A", "minorPentatonic");

  it("renders a dot for every scale note position (open + 22 frets)", () => {
    const { container } = render(
      <Fretboard notes={notes} labelMode="name" window={null} />
    );
    // 6현 × 23위치(0~22프렛) 중 A 마이너 펜타토닉(5/12) 소속만 렌더
    const dots = container.querySelectorAll("[data-testid^='note-']");
    expect(dots.length).toBe(60);
  });

  it("marks roots with data-root", () => {
    const { container } = render(
      <Fretboard notes={notes} labelMode="name" window={null} />
    );
    const root = container.querySelector("[data-testid='note-6-5']");
    expect(root?.getAttribute("data-root")).toBe("true");
  });

  it("labels follow labelMode", () => {
    const { container: byName } = render(
      <Fretboard notes={notes} labelMode="name" window={null} />
    );
    expect(byName.querySelector("[data-testid='note-6-5'] text")?.textContent).toBe("A");

    const { container: byDegree } = render(
      <Fretboard notes={notes} labelMode="degree" window={null} />
    );
    expect(byDegree.querySelector("[data-testid='note-6-8'] text")?.textContent).toBe("b3");

    const { container: none } = render(
      <Fretboard notes={notes} labelMode="none" window={null} />
    );
    expect(none.querySelector("[data-testid='note-6-5'] text")).toBeNull();
  });

  it("dims notes outside the window", () => {
    const { container } = render(
      <Fretboard notes={notes} labelMode="name" window={{ start: 5, end: 9 }} />
    );
    expect(container.querySelector("[data-testid='note-6-5']")?.getAttribute("data-dimmed")).toBe("false");
    expect(container.querySelector("[data-testid='note-6-12']")?.getAttribute("data-dimmed")).toBe("true");
    // 경계: end 프렛(9)의 노트는 디밍 안 됨 (3번 줄 9프렛 = E)
    expect(container.querySelector("[data-testid='note-3-9']")?.getAttribute("data-dimmed")).toBe("false");
    // 경계: end+1 프렛(10)의 노트는 디밍됨 (6번 줄 10프렛 = D)
    expect(container.querySelector("[data-testid='note-6-10']")?.getAttribute("data-dimmed")).toBe("true");
  });
});

describe("Fretboard colorMode=degree", () => {
  const chordNotes = chordNoteMap("E", "7"); // E G# B D

  const fillOf = (container: HTMLElement, testid: string) =>
    container.querySelector(`[data-testid='${testid}'] circle`)?.getAttribute("fill");

  it("colors notes by degree family", () => {
    const { container } = render(
      <Fretboard notes={chordNotes} labelMode="degree" window={null} colorMode="degree" />
    );
    expect(fillOf(container, "note-6-0")).toBe("var(--note-root)"); // E = 1
    expect(fillOf(container, "note-6-4")).toBe("var(--tone-3)");    // G# = 3
    expect(fillOf(container, "note-6-7")).toBe("var(--tone-5)");    // B = 5
    expect(fillOf(container, "note-6-10")).toBe("var(--tone-7)");   // D = b7
  });

  it("default colorMode keeps the two-color scheme", () => {
    const { container } = render(
      <Fretboard notes={chordNotes} labelMode="degree" window={null} />
    );
    expect(fillOf(container, "note-6-4")).toBe("var(--note-scale)");
  });
});

describe("Fretboard quiz interaction", () => {
  const empty = new Map();

  it("renders marks with kind fill and labels", () => {
    const marks = new Map<string, QuizMark>([
      ["6-5", { kind: "question" }],
      ["5-3", { kind: "correct", label: "C" }],
      ["4-2", { kind: "wrong", label: "E" }],
    ]);
    const { container } = render(
      <Fretboard notes={empty} labelMode="none" window={null} marks={marks} />
    );
    const q = container.querySelector("[data-testid='mark-6-5']");
    expect(q?.getAttribute("data-kind")).toBe("question");
    expect(q?.querySelector("circle")?.getAttribute("fill")).toBe("var(--mark-question)");
    expect(q?.querySelector("text")?.textContent).toBe("?");
    expect(container.querySelector("[data-testid='mark-5-3'] text")?.textContent).toBe("C");
    expect(container.querySelector("[data-testid='mark-4-2'] circle")?.getAttribute("fill")).toBe("var(--mark-wrong)");
  });

  it("renders click targets and reports positions when interactive", () => {
    const onClick = vi.fn();
    const { container } = render(
      <Fretboard notes={empty} labelMode="none" window={null} interactive onPositionClick={onClick} />
    );
    const hit = container.querySelector("[data-testid='hit-5-3']");
    expect(hit).not.toBeNull();
    fireEvent.click(hit!);
    expect(onClick).toHaveBeenCalledWith({ str: 5, fret: 3 });
  });

  it("renders no click targets by default", () => {
    const { container } = render(
      <Fretboard notes={empty} labelMode="none" window={null} />
    );
    expect(container.querySelector("[data-testid^='hit-']")).toBeNull();
  });
});
