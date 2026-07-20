import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Fretboard, type QuizMark } from "./Fretboard";
import { scaleNoteMap } from "@/theory/scales";
import { chordToneMap } from "@/theory/chords";

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
  const chordNotes = chordToneMap("E", "dominant", ["7"]); // E G# B D

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

  it("colors altered tensions and the 13th by their slot color", () => {
    const tensionNotes = chordToneMap("E", "dominant", ["b9", "#9", "13", "b13"]);
    const { container } = render(
      <Fretboard notes={tensionNotes} labelMode="degree" window={null} colorMode="degree" />
    );
    expect(fillOf(container, "note-6-1")).toBe("var(--tone-9)");  // F  = b9  → 9 슬롯
    expect(fillOf(container, "note-6-3")).toBe("var(--tone-9)");  // G  = #9  → 9 슬롯
    expect(fillOf(container, "note-6-9")).toBe("var(--tone-13)"); // C# = 13  → 13 슬롯
    expect(fillOf(container, "note-6-8")).toBe("var(--tone-13)"); // C  = b13 → 13 슬롯
  });
});

describe("Fretboard overlay", () => {
  const scale = scaleNoteMap("A", "minorPentatonic"); // A C D E G
  const chord = chordToneMap("A", "dominant", ["7"]); // A C# E G

  it("dims scale-only notes and colors chord tones by degree", () => {
    const { container } = render(
      <Fretboard notes={scale} labelMode="name" window={null} overlay={chord} />
    );
    const bg = container.querySelector("[data-testid='note-6-8']"); // C — 스케일 전용
    expect(bg?.getAttribute("data-layer")).toBe("scale");
    expect(bg?.querySelector("circle")?.getAttribute("fill")).toBe("var(--note-dim)");
    expect(bg?.getAttribute("opacity")).toBe("0.45");
    const tone = container.querySelector("[data-testid='note-6-3']"); // G — b7
    expect(tone?.getAttribute("data-layer")).toBe("overlay");
    expect(tone?.querySelector("circle")?.getAttribute("fill")).toBe("var(--tone-7)");
  });

  it("shows chord tones outside the scale (C# over A minor pentatonic)", () => {
    const { container } = render(
      <Fretboard notes={scale} labelMode="name" window={null} overlay={chord} />
    );
    const outside = container.querySelector("[data-testid='note-6-9']"); // C# — 스케일 밖 3음
    expect(outside?.getAttribute("data-layer")).toBe("overlay");
    expect(outside?.querySelector("circle")?.getAttribute("fill")).toBe("var(--tone-3)");
    expect(outside?.querySelector("text")?.textContent).toBe("C#");
  });

  it("rings only the chord root, not the background scale root", () => {
    const e7 = chordToneMap("E", "dominant", ["7"]); // E G# B D — A는 스케일 전용이 됨
    const { container } = render(
      <Fretboard notes={scale} labelMode="name" window={null} overlay={e7} />
    );
    expect(container.querySelector("[data-testid='note-6-0'] circle")?.getAttribute("stroke"))
      .toBe("var(--note-root-ring)"); // E — 코드 루트
    const scaleRoot = container.querySelector("[data-testid='note-6-5']"); // A — 스케일 루트
    expect(scaleRoot?.getAttribute("data-layer")).toBe("scale");
    expect(scaleRoot?.querySelector("circle")?.getAttribute("stroke")).toBe("none");
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

  it("supports keyboard activation of click targets", () => {
    const onClick = vi.fn();
    const { container } = render(
      <Fretboard notes={empty} labelMode="none" window={null} interactive onPositionClick={onClick} />
    );
    const hit = container.querySelector("[data-testid='hit-6-5']")!;
    expect(hit.getAttribute("role")).toBe("button");
    expect(hit.getAttribute("tabindex")).toBe("0");
    expect(hit.getAttribute("aria-label")).toBe("String 6, fret 5");
    fireEvent.keyDown(hit, { key: "Enter" });
    expect(onClick).toHaveBeenCalledWith({ str: 6, fret: 5 });
  });

  it("switches the svg role when interactive", () => {
    const { container: plain } = render(
      <Fretboard notes={empty} labelMode="none" window={null} />
    );
    expect(plain.querySelector("svg")?.getAttribute("role")).toBe("img");
    const { container: inter } = render(
      <Fretboard notes={empty} labelMode="none" window={null} interactive />
    );
    expect(inter.querySelector("svg")?.getAttribute("role")).toBe("group");
  });

  it("limits click targets to interactivePositions when provided", () => {
    const { container } = render(
      <Fretboard notes={empty} labelMode="none" window={null} interactive
                 interactivePositions={new Set(["6-5"])} onPositionClick={vi.fn()} />
    );
    expect(container.querySelector("[data-testid='hit-6-5']")).not.toBeNull();
    expect(container.querySelector("[data-testid='hit-5-3']")).toBeNull();
  });

  it("dims the board outside the active region", () => {
    const { container } = render(
      <Fretboard notes={empty} labelMode="none" window={null}
                 activeRegion={{ strings: [6, 5], fretMax: 12 }} />
    );
    expect(container.querySelector("[data-testid='region-fret-cover-6']")).not.toBeNull();
    expect(container.querySelector("[data-testid='region-string-cover-1']")).not.toBeNull();
    expect(container.querySelector("[data-testid='region-string-cover-6']")).toBeNull();
  });

  it("renders no overlay when the region covers the whole board", () => {
    const { container } = render(
      <Fretboard notes={empty} labelMode="none" window={null}
                 activeRegion={{ strings: [1, 2, 3, 4, 5, 6], fretMax: 22 }} />
    );
    expect(container.querySelector("[data-testid^='region-fret-cover']")).toBeNull();
    expect(container.querySelector("[data-testid^='region-string-cover']")).toBeNull();
  });

  it("covers each out-of-range cell exactly once (no double dim)", () => {
    const { container } = render(
      <Fretboard notes={empty} labelMode="none" window={null}
                 activeRegion={{ strings: [6, 5], fretMax: 12 }} />
    );
    // 프렛 덮개는 범위 내 현(6·5번 줄)의 행에만 — 범위 밖 현은 현 덮개 하나로 끝
    expect(container.querySelector("[data-testid='region-fret-cover-5']")).not.toBeNull();
    expect(container.querySelector("[data-testid='region-fret-cover-1']")).toBeNull();
  });

  it("reports note clicks when onNoteClick is provided", () => {
    const onClick = vi.fn();
    const { container } = render(
      <Fretboard notes={scaleNoteMap("A", "minorPentatonic")} labelMode="name" window={null}
                 onNoteClick={onClick} />
    );
    fireEvent.click(container.querySelector("[data-testid='note-6-5']")!);
    expect(onClick).toHaveBeenCalledWith({ str: 6, fret: 5 });
  });
});
