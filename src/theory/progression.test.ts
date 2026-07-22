import { describe, expect, it } from "vitest";
import {
  MAX_PROG,
  insertAfter,
  progChordLabel,
  progNoteMap,
  removeAt,
  type ProgChord,
} from "./progression";

const AM7: ProgChord = { root: "A", quality: "minor", exts: ["7"] };
const D7: ProgChord = { root: "D", quality: "dominant", exts: ["7"] };
const FMAJ7: ProgChord = { root: "F", quality: "major", exts: ["7"] };

describe("progNoteMap — 역할 분류", () => {
  const map = progNoteMap(AM7, D7);

  it("두 코드의 음을 모두 담는다 (Am7 ∪ D7 = 6개 피치클래스)", () => {
    expect([...map.keys()].sort((a, b) => a - b)).toEqual([0, 2, 4, 6, 7, 9]);
  });

  it("공통음은 현재 코드 기준 도수를 쓰고 다음 코드 도수를 병기한다", () => {
    expect(map.get(9)).toEqual({
      name: "A", degree: "1", isRoot: true, role: "common", nextDegree: "5",
    });
    expect(map.get(0)).toEqual({
      name: "C", degree: "b3", isRoot: false, role: "common", nextDegree: "b7",
    });
  });

  it("현재 코드에만 있는 음은 current이고 nextDegree가 없다", () => {
    expect(map.get(4)).toEqual({
      name: "E", degree: "5", isRoot: false, role: "current", nextDegree: null,
    });
    expect(map.get(7)).toEqual({
      name: "G", degree: "b7", isRoot: false, role: "current", nextDegree: null,
    });
  });

  it("다음 코드에만 있고 현재 코드 음의 반음 위면 half (G → F#)", () => {
    expect(map.get(6)).toEqual({
      name: "F#", degree: "3", isRoot: false, role: "half", nextDegree: null,
    });
  });

  it("다음 코드에만 있고 반음 이웃이 없으면 other", () => {
    expect(map.get(2)?.role).toBe("other");
  });

  it("다음 코드의 루트라도 isRoot는 false — 루트 링은 현재 코드 전용", () => {
    expect(map.get(2)?.isRoot).toBe(false);
    expect(map.get(2)?.degree).toBe("1");
  });

  it("반음 판정은 아래 방향도 잡는다 (Am7의 E → Fmaj7의 F)", () => {
    const m = progNoteMap(AM7, FMAJ7);
    expect(m.get(5)?.role).toBe("half");
  });

  it("다음 코드가 없으면 전부 current — 일반 코드톤 모드와 같은 그림", () => {
    const m = progNoteMap(AM7, null);
    expect(m.size).toBe(4);
    expect([...m.values()].every((v) => v.role === "current")).toBe(true);
    expect([...m.values()].every((v) => v.nextDegree === null)).toBe(true);
  });

  it("같은 코드로 이어지면 전부 공통음이고 도수가 같다", () => {
    const m = progNoteMap(AM7, AM7);
    expect([...m.values()].every((v) => v.role === "common")).toBe(true);
    expect(m.get(0)?.nextDegree).toBe("b3");
  });

  it("변형 텐션의 이명동음도 도수 기준으로 표기한다 (C7#11 → F#)", () => {
    const m = progNoteMap({ root: "C", quality: "dominant", exts: ["7", "#11"] }, null);
    expect(m.get(6)).toEqual({
      name: "F#", degree: "#11", isRoot: false, role: "current", nextDegree: null,
    });
  });
});

describe("progChordLabel", () => {
  it("루트와 코드 심볼을 잇는다", () => {
    expect(progChordLabel(AM7)).toBe("Am7");
    expect(progChordLabel(D7)).toBe("D7");
    expect(progChordLabel({ root: "F#", quality: "halfDiminished", exts: ["7"] })).toBe("F#m7b5");
    expect(progChordLabel({ root: "Bb", quality: "major", exts: [] })).toBe("Bb");
  });
});

describe("insertAfter", () => {
  it("선택된 코드의 사본을 바로 뒤에 넣고 그 인덱스를 반환한다", () => {
    const { prog, index } = insertAfter([AM7, D7], 0);
    expect(prog).toEqual([AM7, AM7, D7]);
    expect(index).toBe(1);
  });

  it("마지막에서 추가하면 끝에 붙는다", () => {
    const { prog, index } = insertAfter([AM7, D7], 1);
    expect(prog).toEqual([AM7, D7, D7]);
    expect(index).toBe(2);
  });

  it("MAX_PROG에 도달하면 그대로 둔다", () => {
    const full = Array.from({ length: MAX_PROG }, () => AM7);
    const { prog, index } = insertAfter(full, 0);
    expect(prog).toHaveLength(MAX_PROG);
    expect(index).toBe(0);
  });
});

describe("removeAt", () => {
  it("선택된 코드를 지운다", () => {
    const { prog, index } = removeAt([AM7, D7, FMAJ7], 0);
    expect(prog).toEqual([D7, FMAJ7]);
    expect(index).toBe(0);
  });

  it("마지막을 지우면 인덱스가 새 끝으로 당겨진다", () => {
    const { prog, index } = removeAt([AM7, D7, FMAJ7], 2);
    expect(prog).toEqual([AM7, D7]);
    expect(index).toBe(1);
  });

  it("하나 남으면 지우지 않는다", () => {
    const { prog, index } = removeAt([AM7], 0);
    expect(prog).toEqual([AM7]);
    expect(index).toBe(0);
  });
});
