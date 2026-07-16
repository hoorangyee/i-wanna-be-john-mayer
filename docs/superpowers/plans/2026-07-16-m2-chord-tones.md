# M2: 코드톤 뷰어 + 리뷰 이관 항목 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모드 탭에서 [코드톤]을 선택하고 루트×코드타입(maj/m/7/maj7/m7)을 고르면 지판 전체에 코드톤이 도수별 색상(1·3·5·7)으로 표시된다 (docs/PLAN.md F3 + §10 후속 작업).

**Architecture:** M1의 seam(`Map<PitchClass, NoteInfo>` → `Fretboard`)을 그대로 재사용한다. 새 `chords.ts`가 `chordNoteMap`으로 같은 형태를 반환하고, `Fretboard`는 `colorMode` prop("root" 기본 | "degree")으로 도수별 색상을 켠다. 표기법은 §10 결정대로 `(키, 음계 패밀리)` 기준으로 고친다 — 마이너 패밀리는 나란한조 메이저의 플랫/샤프 선호 상속.

**Tech Stack:** M1과 동일 (Next.js 15 + React 19 + TS strict + Vitest 3). 신규 런타임 의존성 금지.

## Global Constraints

- M1 Global Constraints 전부 유지 (클라이언트 사이드, EADGBE 22프렛, 한국어 UI/영문 음이름, conventional commits)
- 표기법 규칙 (M2에서 확정): **메이저 패밀리**(major, majorPentatonic, 코드 maj/7/maj7)는 기존 규칙(Db,Eb,F,Ab,Bb 키 = 플랫). **마이너 패밀리**(naturalMinor, minorPentatonic, blues, 코드 m/m7)는 ① 키 이름에 'b' 포함 → 플랫, ② '#' 포함 → 샤프, ③ 그 외 → 나란한조 메이저(루트+3반음)의 선호를 따름. 예: G 마이너 → Bb 메이저 → 플랫(Bb), E 블루스 → G 메이저 → 샤프(A#)
- 코드톤 도수별 색상: 1=루트(기존 주황), 3(b3 포함)·5·7(b7 포함) 각각 별도 CSS 변수 `--tone-3`, `--tone-5`, `--tone-7`. 루트의 색+테두리 이중 부호화 유지
- 코드 모드에서는 박스 필터 없음 (박스는 펜타토닉 전용)
- 기존 테스트가 깨지면 안 됨 — 단 표기법 변경으로 기대값이 바뀌는 테스트는 이 계획의 태스크가 명시적으로 수정

## File Structure

```
src/theory/notes.ts       — 수정: Accidental, ToneFamily, preference(), spellWith() 추가
src/theory/scales.ts      — 수정: SCALE_FAMILY 매핑, scaleNoteMap이 preference 사용
src/theory/chords.ts      — 신규: CHORDS 공식, ChordId, chordNoteMap
src/theory/boxes.ts       — 수정: 비오름차순 주석 1줄 (코드 변경 없음)
src/components/Fretboard.tsx — 수정: colorMode prop, FRET_NUMBERS 유도
src/components/Controls.tsx  — 수정: 모드 탭 + 코드타입 셀렉터
src/components/Controls.test.tsx — 신규
app/page.tsx              — 수정: mode 상태 분기
app/globals.css           — 수정: --tone-* 변수, 탭 스타일
app/icon.svg              — 신규: 파비콘
```

---

### Task 1: 리뷰 이관 정리 일괄

**Files:**
- Modify: `src/theory/boxes.ts` (주석 1줄)
- Modify: `src/components/Fretboard.tsx` (FRET_NUMBERS 유도)
- Modify: `src/components/Fretboard.test.tsx` (경계 디밍 테스트 2건 추가)
- Modify: `src/theory/fretboard.test.ts` (22프렛 랜드마크 1건 추가)
- Create: `app/icon.svg`
- Create: `src/components/Controls.test.tsx`

**Interfaces:**
- Consumes: 기존 M1 모듈 전부 (변경 없음)
- Produces: 동작 변화 없음 — 주석, 테스트, 파비콘, 내부 상수 유도만

- [ ] **Step 1: boxes.ts 주석 추가**

`src/theory/boxes.ts`의 `boxesFor` 마지막 return 문 바로 위에 주석 추가:

```ts
  // 주의: 22프렛 초과 박스는 12프렛 아래로 시프트되므로
  // 반환 배열의 start가 오름차순이라는 보장이 없다 (예: D 키 박스 5).
```

- [ ] **Step 2: Fretboard.tsx 프렛 번호 배열 유도**

`src/components/Fretboard.tsx`에서 프렛 번호 렌더링의 리터럴 배열 `[3, 5, 7, 9, 12, 15, 17, 19, 21]`을 제거하고, `SINGLE_INLAYS` 선언 아래에 유도 상수를 추가한 뒤 그것을 사용:

```ts
const FRET_NUMBERS = [...SINGLE_INLAYS, 12].sort((a, b) => a - b);
```

렌더링부는 `{FRET_NUMBERS.map((f) => (`으로 교체.

- [ ] **Step 3: 경계 테스트 추가**

`src/components/Fretboard.test.tsx`의 "dims notes outside the window" 테스트에 어서션 2개 추가 (A 마이너 펜타토닉, window {start:5, end:9} 기준):

```tsx
    // 경계: end 프렛(9)의 노트는 디밍 안 됨 (3번 줄 9프렛 = E)
    expect(container.querySelector("[data-testid='note-3-9']")?.getAttribute("data-dimmed")).toBe("false");
    // 경계: end+1 프렛(10)의 노트는 디밍됨 (6번 줄 10프렛 = D)
    expect(container.querySelector("[data-testid='note-6-10']")?.getAttribute("data-dimmed")).toBe("true");
```

`src/theory/fretboard.test.ts`의 "pitchAt: well-known landmarks" 테스트에 어서션 1개 추가:

```ts
    expect(pitchAt({ str: 1, fret: 22 })).toBe(2); // 1번 줄 22프렛 = D
```

- [ ] **Step 4: 파비콘 생성**

`app/icon.svg` (Next.js App Router가 자동으로 파비콘으로 제공):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="15" fill="#d96c3d"/>
  <circle cx="16" cy="16" r="6" fill="#fff"/>
</svg>
```

- [ ] **Step 5: Controls 컴포넌트 테스트 작성**

`src/components/Controls.test.tsx` (신규 — 현재 M1 Controls API 기준):

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Controls } from "./Controls";

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
    const { getByLabelText } = render(<Controls {...baseProps} onChange={onChange} />);
    fireEvent.change(getByLabelText("스케일"), { target: { value: "major" } });
    expect(onChange).toHaveBeenCalledWith({ scaleId: "major", boxIndex: null });
  });
});
```

- [ ] **Step 6: 전체 검증 + 커밋**

Run: `npm test` → Expected: 기존 25 + 신규 3(경계 2는 기존 테스트 내 어서션이므로 테스트 수 기준 +3: fretboard 랜드마크는 기존 테스트 내 어서션, Controls 2개 신규) — **테스트 파일 7개, 27개 테스트 전부 PASS**
Run: `npm run build` → Expected: 성공

```bash
git add -A && git commit -m "chore: post-M1 review cleanups (favicon, derived fret numbers, boundary tests, controls tests)"
```

---

### Task 2: 표기법 (키, 패밀리) 기준으로 수정

**Files:**
- Modify: `src/theory/notes.ts`
- Modify: `src/theory/scales.ts`
- Test: `src/theory/notes.test.ts`, `src/theory/scales.test.ts`

**Interfaces:**
- Consumes: 기존 `KEYS`, `keyToPc`
- Produces (Task 3이 소비):
  - `type Accidental = "flat" | "sharp"`
  - `type ToneFamily = "major" | "minor"`
  - `preference(key: Key, family: ToneFamily): Accidental`
  - `spellWith(pc: PitchClass, acc: Accidental): string`
  - 기존 `spell(pc, key)`는 `spellWith(pc, preference(key, "major"))`의 래퍼로 유지 (기존 테스트 보존)
  - `scaleNoteMap`은 내부적으로 `preference(key, SCALE_FAMILY[scaleId])` 사용

- [ ] **Step 1: 실패하는 테스트 작성**

`src/theory/notes.test.ts`에 추가:

```ts
import { preference, spellWith } from "./notes";

describe("preference", () => {
  it("major family follows the existing flat-key set", () => {
    expect(preference("F", "major")).toBe("flat");
    expect(preference("G", "major")).toBe("sharp");
  });

  it("minor family: explicit accidental in key name wins", () => {
    expect(preference("Eb", "minor")).toBe("flat");
    expect(preference("F#", "minor")).toBe("sharp");
  });

  it("minor family: natural keys inherit relative major preference", () => {
    expect(preference("G", "minor")).toBe("flat");  // 나란한조 Bb
    expect(preference("D", "minor")).toBe("flat");  // 나란한조 F
    expect(preference("E", "minor")).toBe("sharp"); // 나란한조 G
    expect(preference("A", "minor")).toBe("sharp"); // 나란한조 C
    expect(preference("B", "minor")).toBe("sharp"); // 나란한조 D
  });
});

describe("spellWith", () => {
  it("spells by explicit accidental, normalizing out-of-range pc", () => {
    expect(spellWith(10, "flat")).toBe("Bb");
    expect(spellWith(10, "sharp")).toBe("A#");
    expect(spellWith(-2, "flat")).toBe("Bb");
    expect(spellWith(13, "sharp")).toBe("C#");
  });
});
```

`src/theory/scales.test.ts`에 추가:

```ts
  it("G minor pentatonic spells Bb (not A#) via relative-major preference", () => {
    const map = scaleNoteMap("G", "minorPentatonic");
    expect(map.get(10)!.name).toBe("Bb");
    expect(map.get(3)!.name).toBe("Eb");
  });

  it("E blues keeps sharp spelling (relative major G is sharp)", () => {
    const map = scaleNoteMap("E", "blues");
    expect(map.get(10)!.name).toBe("A#");
  });
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/theory/notes.test.ts src/theory/scales.test.ts`
Expected: FAIL — `preference`/`spellWith` export 없음. (G 마이너 테스트는 현행 코드에서 "A#"을 반환하므로 FAIL)

- [ ] **Step 3: 구현**

`src/theory/notes.ts` — 기존 `FLAT_KEYS`, `NAMES_*`는 유지하고 아래를 추가/교체:

```ts
export type Accidental = "flat" | "sharp";
export type ToneFamily = "major" | "minor";

export function preference(key: Key, family: ToneFamily): Accidental {
  if (family === "minor") {
    if (key.includes("b")) return "flat";
    if (key.includes("#")) return "sharp";
    const relativeMajor = KEYS[(keyToPc(key) + 3) % 12];
    return FLAT_KEYS.has(relativeMajor) ? "flat" : "sharp";
  }
  return FLAT_KEYS.has(key) ? "flat" : "sharp";
}

export function spellWith(pc: PitchClass, acc: Accidental): string {
  const names = acc === "flat" ? NAMES_FLAT : NAMES_SHARP;
  return names[((pc % 12) + 12) % 12];
}

export function spell(pc: PitchClass, key: Key): string {
  return spellWith(pc, preference(key, "major"));
}
```

`src/theory/scales.ts` — import에 `preference`, `spellWith`, `ToneFamily` 추가, `spell` import 제거. `SCALE_IDS` 선언 아래에 패밀리 매핑 추가:

```ts
const SCALE_FAMILY: Record<ScaleId, ToneFamily> = {
  major: "major",
  majorPentatonic: "major",
  naturalMinor: "minor",
  minorPentatonic: "minor",
  blues: "minor",
};
```

`scaleNoteMap`에서 표기 부분 교체:

```ts
export function scaleNoteMap(key: Key, scaleId: ScaleId): Map<PitchClass, NoteInfo> {
  const root = keyToPc(key);
  const acc = preference(key, SCALE_FAMILY[scaleId]);
  const map = new Map<PitchClass, NoteInfo>();
  for (const interval of SCALES[scaleId].intervals) {
    const pc = (root + interval) % 12;
    map.set(pc, {
      name: spellWith(pc, acc),
      degree: degreeLabel(interval),
      isRoot: interval === 0,
    });
  }
  return map;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test` → Expected: 전체 PASS (기존 notes/scales 테스트 포함 — `spell`은 메이저 패밀리 래퍼로 유지되므로 기존 기대값 불변)

- [ ] **Step 5: Commit**

```bash
git add src/theory/notes.ts src/theory/notes.test.ts src/theory/scales.ts src/theory/scales.test.ts
git commit -m "fix: spell accidentals by (key, tone family) instead of key alone"
```

---

### Task 3: 이론 엔진 — 코드 (`chords.ts`)

**Files:**
- Create: `src/theory/chords.ts`
- Test: `src/theory/chords.test.ts`

**Interfaces:**
- Consumes: `Key`, `PitchClass`, `keyToPc`, `preference`, `spellWith`, `ToneFamily` (Task 2), `degreeLabel`, `NoteInfo` (scales.ts)
- Produces (Task 4·5가 소비):
  - `interface ChordDef { name: string; symbol: string; family: ToneFamily; intervals: readonly number[] }`
  - `const CHORDS: Record<ChordId, ChordDef>` — maj, m, "7", maj7, m7
  - `type ChordId`, `const CHORD_IDS: readonly ChordId[]`
  - `chordNoteMap(key: Key, chordId: ChordId): Map<PitchClass, NoteInfo>` — `scaleNoteMap`과 동일한 seam

- [ ] **Step 1: 실패하는 테스트 작성**

`src/theory/chords.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { CHORDS, CHORD_IDS, chordNoteMap } from "./chords";

describe("CHORDS", () => {
  it("has the 5 v1 chord types with correct formulas", () => {
    expect(CHORDS.maj.intervals).toEqual([0, 4, 7]);
    expect(CHORDS.m.intervals).toEqual([0, 3, 7]);
    expect(CHORDS["7"].intervals).toEqual([0, 4, 7, 10]);
    expect(CHORDS.maj7.intervals).toEqual([0, 4, 7, 11]);
    expect(CHORDS.m7.intervals).toEqual([0, 3, 7, 10]);
    expect(CHORD_IDS).toHaveLength(5);
  });

  it("symbols compose chord names", () => {
    expect(CHORDS.maj.symbol).toBe("");
    expect(CHORDS.m.symbol).toBe("m");
    expect(CHORDS.maj7.symbol).toBe("maj7");
  });
});

describe("chordNoteMap", () => {
  it("E7 = E G# B D with degrees 1 3 5 b7", () => {
    const map = chordNoteMap("E", "7");
    expect(map.get(4)).toEqual({ name: "E", degree: "1", isRoot: true });
    expect(map.get(8)).toEqual({ name: "G#", degree: "3", isRoot: false });
    expect(map.get(11)).toEqual({ name: "B", degree: "5", isRoot: false });
    expect(map.get(2)).toEqual({ name: "D", degree: "b7", isRoot: false });
    expect(map.size).toBe(4);
  });

  it("Gm7 spells Bb via minor-family preference", () => {
    const map = chordNoteMap("G", "m7");
    expect(map.get(10)).toEqual({ name: "Bb", degree: "b3", isRoot: false });
    expect(map.get(5)!.name).toBe("F");
  });

  it("Bb maj7 spells with flats (major-family flat key)", () => {
    const map = chordNoteMap("Bb", "maj7");
    expect(map.get(2)!.name).toBe("D");
    expect(map.get(9)!.name).toBe("A");
    expect(map.get(9)!.degree).toBe("7");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/theory/chords.test.ts`
Expected: FAIL — `Cannot find module './chords'`

- [ ] **Step 3: 최소 구현**

`src/theory/chords.ts`:

```ts
import { type Key, type PitchClass, type ToneFamily, keyToPc, preference, spellWith } from "./notes";
import { degreeLabel, type NoteInfo } from "./scales";

export interface ChordDef {
  name: string;
  symbol: string; // 루트 뒤에 붙는 표기 (예: "m7" → Am7)
  family: ToneFamily;
  intervals: readonly number[];
}

export const CHORDS = {
  maj: { name: "메이저", symbol: "", family: "major", intervals: [0, 4, 7] },
  m: { name: "마이너", symbol: "m", family: "minor", intervals: [0, 3, 7] },
  "7": { name: "도미넌트 7", symbol: "7", family: "major", intervals: [0, 4, 7, 10] },
  maj7: { name: "메이저 7", symbol: "maj7", family: "major", intervals: [0, 4, 7, 11] },
  m7: { name: "마이너 7", symbol: "m7", family: "minor", intervals: [0, 3, 7, 10] },
} as const satisfies Record<string, ChordDef>;

export type ChordId = keyof typeof CHORDS;
export const CHORD_IDS = Object.keys(CHORDS) as readonly ChordId[];

export function chordNoteMap(key: Key, chordId: ChordId): Map<PitchClass, NoteInfo> {
  const root = keyToPc(key);
  const chord = CHORDS[chordId];
  const acc = preference(key, chord.family);
  const map = new Map<PitchClass, NoteInfo>();
  for (const interval of chord.intervals) {
    const pc = (root + interval) % 12;
    map.set(pc, {
      name: spellWith(pc, acc),
      degree: degreeLabel(interval),
      isRoot: interval === 0,
    });
  }
  return map;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/theory/chords.test.ts`
Expected: PASS (테스트 5개)

- [ ] **Step 5: Commit**

```bash
git add src/theory/chords.ts src/theory/chords.test.ts
git commit -m "feat: chord formulas and chord-tone note map"
```

---

### Task 4: Fretboard 도수별 색상 (`colorMode`)

**Files:**
- Modify: `src/components/Fretboard.tsx`
- Test: `src/components/Fretboard.test.tsx`

**Interfaces:**
- Consumes: `chordNoteMap` (Task 3, 테스트에서), 기존 `NoteInfo`
- Produces (Task 5가 소비): `FretboardProps`에 `colorMode?: "root" | "degree"` 추가 (기본 `"root"` = 기존 동작 그대로)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/Fretboard.test.tsx`에 추가:

```tsx
import { chordNoteMap } from "@/theory/chords";

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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/components/Fretboard.test.tsx`
Expected: FAIL — `colorMode` prop 없음 / fill이 `var(--note-scale)`로 나옴

- [ ] **Step 3: 구현**

`src/components/Fretboard.tsx` — props와 fill 로직 수정:

```tsx
export interface FretboardProps {
  notes: Map<PitchClass, NoteInfo>;
  labelMode: LabelMode;
  window?: FretWindow | null;
  colorMode?: "root" | "degree";
}
```

파일 상단 상수 영역에 추가:

```tsx
const TONE_FILL: Record<string, string> = {
  "1": "var(--note-root)",
  "3": "var(--tone-3)",
  "5": "var(--tone-5)",
  "7": "var(--tone-7)",
};

function degreeFill(degree: string): string {
  return TONE_FILL[degree.replace("b", "")] ?? "var(--note-scale)";
}
```

컴포넌트 시그니처를 `export function Fretboard({ notes, labelMode, window = null, colorMode = "root" }: FretboardProps)`로 바꾸고, 노트 `<circle>`의 fill 결정부를 교체:

```tsx
              <circle cx={noteX(fret)} cy={stringY(str)} r={12}
                      fill={
                        colorMode === "degree"
                          ? degreeFill(info.degree)
                          : info.isRoot ? "var(--note-root)" : "var(--note-scale)"
                      }
                      stroke={info.isRoot ? "var(--note-root-ring)" : "none"}
                      strokeWidth={info.isRoot ? 3 : 0} />
```

(루트의 테두리 이중 부호화는 colorMode와 무관하게 유지)

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/components/Fretboard.test.tsx`
Expected: PASS (기존 4 + 신규 2 = 6개)

- [ ] **Step 5: Commit**

```bash
git add src/components/Fretboard.tsx src/components/Fretboard.test.tsx
git commit -m "feat: degree-based note coloring for chord tones"
```

---

### Task 5: 모드 탭 + 페이지 통합

**Files:**
- Modify: `src/components/Controls.tsx`
- Modify: `src/components/Controls.test.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `CHORDS`, `CHORD_IDS`, `ChordId`, `chordNoteMap` (Task 3), `colorMode` (Task 4), 기존 M1 전부
- Produces: 완성된 M2 페이지 — [스케일]/[코드톤] 모드 탭

- [ ] **Step 1: Controls 확장**

`src/components/Controls.tsx` 전체 교체:

```tsx
import { KEYS, type Key } from "@/theory/notes";
import { SCALES, SCALE_IDS, type ScaleId } from "@/theory/scales";
import { CHORDS, CHORD_IDS, type ChordId } from "@/theory/chords";
import type { LabelMode } from "./Fretboard";

export type Mode = "scale" | "chord";

export interface ControlsProps {
  mode: Mode;
  keySel: Key;
  scaleId: ScaleId;
  chordId: ChordId;
  labelMode: LabelMode;
  boxIndex: number | null;
  boxCount: number | null;   // null = 이 스케일은 박스 미지원 (코드 모드에서도 null 전달)
  onChange: (patch: Partial<Omit<ControlsProps, "onChange" | "boxCount">>) => void;
}

const MODES: { id: Mode; label: string }[] = [
  { id: "scale", label: "스케일" },
  { id: "chord", label: "코드톤" },
];

const LABEL_MODES: { id: LabelMode; label: string }[] = [
  { id: "name", label: "음이름" },
  { id: "degree", label: "도수" },
  { id: "none", label: "숨김" },
];

export function Controls({ mode, keySel, scaleId, chordId, labelMode, boxIndex, boxCount, onChange }: ControlsProps) {
  return (
    <div className="controls">
      <div className="seg" role="group" aria-label="모드">
        {MODES.map(({ id, label }) => (
          <button key={id} data-active={mode === id} aria-pressed={mode === id}
                  onClick={() => onChange({ mode: id, boxIndex: null })}>
            {label}
          </button>
        ))}
      </div>

      <label>
        {mode === "chord" ? "루트" : "키"}
        <select value={keySel} onChange={(e) => onChange({ keySel: e.target.value as Key })}>
          {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>

      {mode === "scale" ? (
        <label>
          스케일
          <select value={scaleId}
                  onChange={(e) => onChange({ scaleId: e.target.value as ScaleId, boxIndex: null })}>
            {SCALE_IDS.map((id) => <option key={id} value={id}>{SCALES[id].name}</option>)}
          </select>
        </label>
      ) : (
        <label>
          코드
          <select value={chordId}
                  onChange={(e) => onChange({ chordId: e.target.value as ChordId })}>
            {CHORD_IDS.map((id) => (
              <option key={id} value={id}>{keySel}{CHORDS[id].symbol} · {CHORDS[id].name}</option>
            ))}
          </select>
        </label>
      )}

      <div className="seg" role="group" aria-label="라벨 표시">
        {LABEL_MODES.map(({ id, label }) => (
          <button key={id} data-active={labelMode === id} aria-pressed={labelMode === id}
                  onClick={() => onChange({ labelMode: id })}>
            {label}
          </button>
        ))}
      </div>

      {mode === "scale" && boxCount !== null && (
        <div className="seg" role="group" aria-label="포지션">
          <button data-active={boxIndex === null} aria-pressed={boxIndex === null}
                  onClick={() => onChange({ boxIndex: null })}>
            전체
          </button>
          {Array.from({ length: boxCount }, (_, i) => (
            <button key={i} data-active={boxIndex === i} aria-pressed={boxIndex === i}
                    onClick={() => onChange({ boxIndex: i })}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Controls 테스트 갱신**

`src/components/Controls.test.tsx` 전체 교체 (Task 1 버전에 mode 파라미터 추가 + 코드 모드 테스트):

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Controls } from "./Controls";

const baseProps = {
  mode: "scale" as const,
  keySel: "A" as const,
  scaleId: "minorPentatonic" as const,
  chordId: "7" as const,
  labelMode: "name" as const,
  boxIndex: null,
  boxCount: 5,
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
```

- [ ] **Step 3: 페이지 통합**

`app/page.tsx` 전체 교체:

```tsx
"use client";

import { useState } from "react";
import type { Key } from "@/theory/notes";
import { scaleNoteMap, SCALES, type ScaleId } from "@/theory/scales";
import { chordNoteMap, CHORDS, type ChordId } from "@/theory/chords";
import { boxesFor } from "@/theory/boxes";
import { Fretboard, type LabelMode } from "@/components/Fretboard";
import { Controls, type Mode } from "@/components/Controls";

interface ViewState {
  mode: Mode;
  keySel: Key;
  scaleId: ScaleId;
  chordId: ChordId;
  labelMode: LabelMode;
  boxIndex: number | null;
}

export default function Home() {
  const [view, setView] = useState<ViewState>({
    mode: "scale",
    keySel: "A",
    scaleId: "minorPentatonic",
    chordId: "7",
    labelMode: "name",
    boxIndex: null,
  });

  const isChord = view.mode === "chord";
  const notes = isChord
    ? chordNoteMap(view.keySel, view.chordId)
    : scaleNoteMap(view.keySel, view.scaleId);
  const boxes = isChord ? null : boxesFor(view.keySel, view.scaleId);
  const activeWindow = view.boxIndex !== null && boxes ? boxes[view.boxIndex] : null;

  const title = isChord
    ? `${view.keySel}${CHORDS[view.chordId].symbol} — ${CHORDS[view.chordId].name} 코드톤`
    : `${view.keySel} ${SCALES[view.scaleId].name}${view.boxIndex !== null ? ` — 박스 ${view.boxIndex + 1}` : ""}`;

  return (
    <main>
      <header className="topbar">
        <h1>Fretboard</h1>
        <Controls
          mode={view.mode}
          keySel={view.keySel}
          scaleId={view.scaleId}
          chordId={view.chordId}
          labelMode={view.labelMode}
          boxIndex={view.boxIndex}
          boxCount={boxes ? boxes.length : null}
          onChange={(patch) => setView((v) => ({ ...v, ...patch }))}
        />
      </header>
      <section className="board">
        <h2 className="view-title">{title}</h2>
        <Fretboard
          notes={notes}
          labelMode={view.labelMode}
          window={activeWindow}
          colorMode={isChord ? "degree" : "root"}
        />
      </section>
    </main>
  );
}
```

- [ ] **Step 4: 스타일 추가**

`app/globals.css`의 `:root` 블록에 변수 3개 추가:

```css
  --tone-3: #3d8b6b;
  --tone-5: #5f7fae;
  --tone-7: #8a63b3;
```

- [ ] **Step 5: 전체 검증**

Run: `npm test` → Expected: 전체 PASS
Run: `npm run build` → Expected: 성공
Dev 서버 기동 후 `curl -s http://localhost:3000`에 "코드톤" 탭과 기본 뷰 타이틀이 포함되는지 확인 (시각 검증은 컨트롤러 담당)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: chord-tone view mode with degree coloring"
```

---

## Self-Review 결과

- **Spec coverage:** PLAN.md F3(루트×코드타입 5종, 도수별 색상, 3·7음 구분) → Task 3·4·5. §10 표기법 → Task 2. §10 잔여 정리(주석/프렛번호 유도/경계 테스트/favicon/Controls 테스트) → Task 1. §10 emphasis seam → Task 4의 colorMode가 그 결정(fill resolver 대신 단순 prop — 도수 정보가 이미 NoteInfo에 있으므로 필드 추가 불필요).
- **Placeholder scan:** 통과 — 전 스텝 실제 코드/명령 포함.
- **Type consistency:** `preference`/`spellWith`/`ToneFamily`(Task 2 정의 → Task 3 소비), `CHORDS`/`ChordId`/`chordNoteMap`(Task 3 정의 → Task 4 테스트·Task 5 소비), `colorMode`(Task 4 정의 → Task 5 소비), `Mode`(Task 5 내부 정의·export) 일치. Task 1의 Controls.test.tsx는 Task 5가 mode 파라미터를 추가하며 전체 교체함을 양쪽 스텝에 명시.
