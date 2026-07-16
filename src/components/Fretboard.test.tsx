import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Fretboard } from "./Fretboard";
import { scaleNoteMap } from "@/theory/scales";

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
