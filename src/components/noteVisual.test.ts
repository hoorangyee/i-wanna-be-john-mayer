import { describe, expect, it } from "vitest";
import { degreeFill, progNoteVisual } from "./noteVisual";
import type { ProgNoteInfo } from "@/theory/progression";

const note = (over: Partial<ProgNoteInfo> = {}): ProgNoteInfo => ({
  name: "C", degree: "b3", isRoot: false, role: "current", nextDegree: null, ...over,
});

describe("degreeFill", () => {
  it("maps a degree slot to its tone token", () => {
    expect(degreeFill("3")).toBe("var(--tone-3)");
    expect(degreeFill("1")).toBe("var(--note-root)");
  });

  it("strips accidentals so altered tensions share their slot color", () => {
    expect(degreeFill("b9")).toBe("var(--tone-9)");
    expect(degreeFill("#11")).toBe("var(--tone-11)");
    expect(degreeFill("bb7")).toBe("var(--tone-7)");
  });
});

describe("progNoteVisual — 현재 코드 음", () => {
  it("도수 색을 꽉 채우고 링이 없다", () => {
    const v = progNoteVisual(note(), "degree");
    expect(v).toMatchObject({
      fill: "var(--tone-3)", fillOpacity: 1, stroke: null,
      dashed: false, radius: 12, halo: null, labelFill: null,
    });
  });

  it("루트는 기존 바깥 링을 그대로 쓴다", () => {
    const v = progNoteVisual(note({ degree: "1", isRoot: true }), "degree");
    expect(v).toMatchObject({ stroke: "var(--note-root-ring)", strokeWidth: 3 });
  });
});

describe("progNoteVisual — 공통음", () => {
  const common = note({ role: "common", nextDegree: "b7" });

  it("후광 링이 붙고 도수 보기에서 두 도수를 쌓는다", () => {
    const v = progNoteVisual(common, "degree");
    expect(v).toMatchObject({
      fillOpacity: 1, halo: "var(--prog-common)",
      primary: "b3", secondary: "b7", radius: 12,
    });
  });

  it("음이름 보기에서는 같은 음이라 한 줄이다", () => {
    const v = progNoteVisual(common, "name");
    expect(v).toMatchObject({ primary: "C", secondary: null, radius: 12 });
  });

  it("라벨을 꺼도 후광 링은 남는다", () => {
    const v = progNoteVisual(common, "none");
    expect(v).toMatchObject({ primary: null, secondary: null, halo: "var(--prog-common)" });
  });

  it("루트인 공통음은 바깥 링과 후광 링을 함께 쓴다", () => {
    const v = progNoteVisual(note({ role: "common", nextDegree: "5", degree: "1", isRoot: true }), "degree");
    expect(v.stroke).toBe("var(--note-root-ring)");
    expect(v.halo).toBe("var(--prog-common)");
  });
});

describe("progNoteVisual — 다음 코드 음", () => {
  it("반음 이동은 잉크 톤 실선 링에 옅은 면", () => {
    const v = progNoteVisual(note({ role: "half", degree: "3" }), "degree");
    expect(v).toMatchObject({
      fill: "var(--tone-3)", fillOpacity: 0.3,
      stroke: "var(--prog-half)", strokeWidth: 2, dashed: false,
      labelFill: "var(--ink)", secondary: null,
    });
  });

  it("그 외는 점선 링으로 한 단계 물러난다", () => {
    const v = progNoteVisual(note({ role: "other", degree: "5" }), "degree");
    expect(v).toMatchObject({
      stroke: "var(--prog-other)", strokeWidth: 1.5, dashed: true, labelFill: "var(--ink)",
    });
  });

  it("고스트는 자기 코드 기준 도수 한 줄만 보인다", () => {
    expect(progNoteVisual(note({ role: "other", degree: "1", name: "D" }), "name").primary).toBe("D");
    expect(progNoteVisual(note({ role: "half", degree: "3" }), "degree").primary).toBe("3");
  });
});
