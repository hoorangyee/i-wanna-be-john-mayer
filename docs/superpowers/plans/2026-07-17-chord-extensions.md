# 코드톤 퀄리티 + 확장(7/9/11) 표시 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스펙(docs/superpowers/specs/2026-07-17-chord-extensions-design.md)대로 코드톤/오버레이 모드를 퀄리티(Major/Minor/Dominant) + 독립 확장 토글(7th/9th/11th) 모델로 재편한다. 기본은 트라이어드(1·3·5)만 표시.

**Architecture:** 이론 계층에 새 API(`chordToneMap`/`chordSymbol`/`normalizeExts`)를 **기존 어휘와 병행 추가**(Task C1) → URL/UI/i18n/색상을 새 모델로 일괄 전환(Task C2) → 구 어휘(`CHORDS`/`ChordId`/`chordNoteMap`) 제거(Task C3). 모든 태스크에서 커밋 시점 테스트+빌드 그린 유지.

**Tech Stack:** 기존 스택 그대로 (신규 의존성 0).

## Global Constraints

- **불변 로직**: `src/quiz/*`, `src/audio/*`, `src/theory/notes.ts`, `src/theory/scales.ts`, `src/theory/boxes.ts`, `src/theory/fretboard.ts`, `src/lib/theme.ts`, `src/lib/LangContext.tsx` 수정 금지. `src/theory/chords.ts`는 이 계획의 대상.
- 퀄리티/확장 정의(스펙 §2 값 그대로): major(3=4, 7th=11/`7`), minor(3=3/`b3`, 7th=10/`b7`), dominant(3=4, 7th=10/`b7`); 9=+2/`9`, 11=+5/`11`.
- 심볼 규칙: 베이스 `""`/`m`/`""`, 7 켜짐 `maj7`/`m7`/`7`; 9·11은 7 켜짐 `7(9,11)` 형식, 꺼짐 `(add9,add11)` 형식.
- URL: `quality=major|minor|dominant`(기본 dominant 생략), `ext=7,9,11`(EXTENSIONS 순 정규화, 빈 목록 생략), chord·overlay 모드에서만 출력. 레거시 `chord` 파라미터는 새 파라미터(quality/ext) **둘 다 부재 시에만** 해석: maj→major+[], m→minor+[], 7→dominant+[7], maj7→major+[7], m7→minor+[7].
- 기본값: `quality: "dominant"`, `exts: []` (1·3·5만 표시).
- 테스트 계약 유지: `data-testid`, role 구조, `.choice`/`.view-title`, 스토리지 키, 퀴즈/스케일 모드 동작. 확장 토글 그룹 aria-label `Extensions`/`확장`, 버튼 표기 `7th`/`9th`/`11th`(양 언어 동일).
- 각 태스크 종료 시 `npm test && npm run build` 전체 그린 후 커밋, 트레일러 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task C1: 이론 계층 — 퀄리티+확장 API (기존 어휘와 병행 추가)

**Files:**
- Modify: `src/theory/chords.ts` (기존 코드 유지, 아래 추가), `src/theory/chords.test.ts` (기존 describe 유지, 아래 추가)

> 스펙 §2는 새 함수를 `chordNoteMap(root, quality, exts)`로 표기했지만, 마이그레이션 동안 구 `chordNoteMap(key, chordId)`과 공존해야 하므로 새 함수는 `chordToneMap`으로 명명한다(의도된 정제 — C3에서 구 함수 제거 후에도 이름 유지).

**Interfaces:**
- Consumes: `./notes`의 `Key`/`PitchClass`/`ToneFamily`/`keyToPc`/`preference`/`spellWith`, `./scales`의 `NoteInfo` (모두 기존 import에 이미 있음).
- Produces (C2가 사용): `type ChordQuality = "major" | "minor" | "dominant"`, `QUALITIES: readonly ChordQuality[]`, `type Extension = "7" | "9" | "11"`, `EXTENSIONS: readonly Extension[]`, `normalizeExts(exts: Iterable<Extension>): readonly Extension[]`, `chordSymbol(quality: ChordQuality, exts: readonly Extension[]): string`, `chordToneMap(key: Key, quality: ChordQuality, exts: readonly Extension[]): Map<PitchClass, NoteInfo>`.

- [ ] **Step 1: 실패하는 테스트 추가 — src/theory/chords.test.ts 끝에 append**

import 줄을 다음으로 교체:

```ts
import { CHORDS, CHORD_IDS, chordNoteMap, chordToneMap, chordSymbol, normalizeExts } from "./chords";
```

파일 끝에 추가:

```ts
describe("chordToneMap", () => {
  it("shows only the triad by default (A major = A C# E)", () => {
    const map = chordToneMap("A", "major", []);
    expect(map.size).toBe(3);
    expect(map.get(9)).toEqual({ name: "A", degree: "1", isRoot: true });
    expect(map.get(1)).toEqual({ name: "C#", degree: "3", isRoot: false });
    expect(map.get(4)).toEqual({ name: "E", degree: "5", isRoot: false });
  });

  it("minor third is labeled b3 (A minor → C)", () => {
    const map = chordToneMap("A", "minor", []);
    expect(map.get(0)).toEqual({ name: "C", degree: "b3", isRoot: false });
  });

  it("7th kind follows quality", () => {
    expect(chordToneMap("A", "major", ["7"]).get(8)).toEqual({ name: "G#", degree: "7", isRoot: false });
    expect(chordToneMap("A", "dominant", ["7"]).get(7)).toEqual({ name: "G", degree: "b7", isRoot: false });
    expect(chordToneMap("A", "minor", ["7"]).get(7)).toEqual({ name: "G", degree: "b7", isRoot: false });
  });

  it("9th and 11th are independent of the 7th toggle (A: B=9, D=11)", () => {
    const map = chordToneMap("A", "dominant", ["9", "11"]);
    expect(map.get(11)).toEqual({ name: "B", degree: "9", isRoot: false });
    expect(map.get(2)).toEqual({ name: "D", degree: "11", isRoot: false });
    expect(map.size).toBe(5); // 트라이어드 + 9 + 11 (7은 꺼짐 — 독립 토글)
  });

  it("flat keys spell extensions with flats (Bb dominant 7,9)", () => {
    const map = chordToneMap("Bb", "dominant", ["7", "9"]);
    expect(map.get(8)!.name).toBe("Ab"); // b7
    expect(map.get(0)!.name).toBe("C");  // 9
  });
});

describe("chordSymbol", () => {
  it("base symbols per quality", () => {
    expect(chordSymbol("major", [])).toBe("");
    expect(chordSymbol("minor", [])).toBe("m");
    expect(chordSymbol("dominant", [])).toBe("");
  });

  it("7 toggles the seventh symbol", () => {
    expect(chordSymbol("major", ["7"])).toBe("maj7");
    expect(chordSymbol("minor", ["7"])).toBe("m7");
    expect(chordSymbol("dominant", ["7"])).toBe("7");
  });

  it("upper extensions: parens with 7, add-notation without 7", () => {
    expect(chordSymbol("dominant", ["7", "9"])).toBe("7(9)");
    expect(chordSymbol("major", ["7", "9", "11"])).toBe("maj7(9,11)");
    expect(chordSymbol("major", ["9"])).toBe("(add9)");
    expect(chordSymbol("minor", ["9", "11"])).toBe("m(add9,add11)");
  });
});

describe("normalizeExts", () => {
  it("dedupes and orders 7 → 9 → 11", () => {
    expect(normalizeExts(["11", "7", "7", "9"])).toEqual(["7", "9", "11"]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/theory/chords.test.ts`
Expected: FAIL — `chordToneMap` 등 export 없음.

- [ ] **Step 3: 구현 — src/theory/chords.ts 끝에 추가 (기존 코드는 그대로 둠 — C3에서 구 어휘 제거)**

```ts
// ── v3: 퀄리티 + 확장 모델 (스펙: 2026-07-17-chord-extensions-design.md) ──
// 기존 CHORDS 어휘는 마이그레이션 완료 후 제거 예정.

export type ChordQuality = "major" | "minor" | "dominant";
export const QUALITIES = ["major", "minor", "dominant"] as const satisfies readonly ChordQuality[];

export type Extension = "7" | "9" | "11";
export const EXTENSIONS = ["7", "9", "11"] as const satisfies readonly Extension[];

interface Tone {
  interval: number;
  degree: string;
}

interface QualityDef {
  family: ToneFamily;
  third: Tone;
  seventh: Tone;      // 7th 종류는 퀄리티가 결정
  symbolBase: string; // 7 꺼짐 시 심볼
  symbolWith7: string;
}

const QUALITY_DEFS: Record<ChordQuality, QualityDef> = {
  major: {
    family: "major",
    third: { interval: 4, degree: "3" },
    seventh: { interval: 11, degree: "7" },
    symbolBase: "",
    symbolWith7: "maj7",
  },
  minor: {
    family: "minor",
    third: { interval: 3, degree: "b3" },
    seventh: { interval: 10, degree: "b7" },
    symbolBase: "m",
    symbolWith7: "m7",
  },
  dominant: {
    family: "major",
    third: { interval: 4, degree: "3" },
    seventh: { interval: 10, degree: "b7" },
    symbolBase: "",
    symbolWith7: "7",
  },
};

// 9=장9(+2), 11=완전11(+5) — 변형 텐션(b9/#11 등)은 비목표 (스펙 §6)
const UPPER_EXTENSIONS: Record<"9" | "11", Tone> = {
  "9": { interval: 2, degree: "9" },
  "11": { interval: 5, degree: "11" },
};

/** 확장 목록을 EXTENSIONS 순서로 정규화하고 중복을 제거한다. */
export function normalizeExts(exts: Iterable<Extension>): readonly Extension[] {
  const set = new Set(exts);
  return EXTENSIONS.filter((e) => set.has(e));
}

export function chordSymbol(quality: ChordQuality, exts: readonly Extension[]): string {
  const def = QUALITY_DEFS[quality];
  const has7 = exts.includes("7");
  const uppers = normalizeExts(exts).filter((e): e is "9" | "11" => e !== "7");
  const base = has7 ? def.symbolWith7 : def.symbolBase;
  if (uppers.length === 0) return base;
  return has7
    ? `${base}(${uppers.join(",")})`
    : `${base}(${uppers.map((e) => `add${e}`).join(",")})`;
}

export function chordToneMap(
  key: Key,
  quality: ChordQuality,
  exts: readonly Extension[]
): Map<PitchClass, NoteInfo> {
  const def = QUALITY_DEFS[quality];
  const root = keyToPc(key);
  const acc = preference(key, def.family);
  const tones: Tone[] = [{ interval: 0, degree: "1" }, def.third, { interval: 7, degree: "5" }];
  for (const e of normalizeExts(exts)) {
    tones.push(e === "7" ? def.seventh : UPPER_EXTENSIONS[e]);
  }
  const map = new Map<PitchClass, NoteInfo>();
  for (const { interval, degree } of tones) {
    const pc = (root + interval) % 12;
    map.set(pc, { name: spellWith(pc, acc), degree, isRoot: interval === 0 });
  }
  return map;
}
```

- [ ] **Step 4: 통과 확인 + 전체 검증**

Run: `npx vitest run src/theory/chords.test.ts` → PASS (기존 7 + 신규 9 = 16 tests).
Run: `npm test && npm run build` → 전체 그린 (추가만 했으므로 소비자 영향 없음).

- [ ] **Step 5: Commit**

```bash
git add src/theory/chords.ts src/theory/chords.test.ts
git commit -m "feat: chord quality + extension tone map, symbol composer"
```

---

### Task C2: URL·UI·i18n·색상 전환 — 새 모델 일괄 적용

**Files:**
- Modify: `src/lib/viewUrl.ts`(전체 교체), `src/lib/viewUrl.test.ts`(전체 교체), `src/lib/i18n.ts`(부분), `src/lib/i18n.test.ts`(부분), `app/page.tsx`(부분), `src/components/Controls.tsx`(전체 교체), `src/components/Controls.test.tsx`(chord/overlay describe 교체), `src/components/Legend.tsx`(전체 교체), `src/components/Legend.test.tsx`(전체 교체), `src/components/langSwitch.test.tsx`(props 갱신), `src/components/Fretboard.tsx`(TONE_FILL만), `app/globals.css`(토큰 2쌍 추가)

**Interfaces:**
- Consumes: C1의 `ChordQuality`/`QUALITIES`/`Extension`/`EXTENSIONS`/`normalizeExts`/`chordSymbol`/`chordToneMap`.
- Produces: `UrlViewState`에 `quality: ChordQuality`, `exts: readonly Extension[]` (`chordId` 제거). `LegendProps`에 `exts?: readonly Extension[]`. i18n에 `QUALITY_NAMES`, `Messages.extensions/legendNinth/legendEleventh` (`CHORD_NAMES` 제거).

- [ ] **Step 1: 실패하는 테스트 — src/lib/viewUrl.test.ts 전체 교체**

```ts
import { describe, it, expect } from "vitest";
import { parseViewQuery, viewQueryString, type UrlViewState } from "./viewUrl";

const D: UrlViewState = {
  mode: "scale",
  keySel: "A",
  scaleId: "minorPentatonic",
  quality: "dominant",
  exts: [],
  labelMode: "name",
  boxIndex: null,
  overlayRoot: "A",
};

describe("viewQueryString", () => {
  it("returns empty string for the default view", () => {
    expect(viewQueryString(D, D)).toBe("");
  });

  it("encodes only non-default fields", () => {
    expect(viewQueryString({ ...D, mode: "chord", keySel: "E" }, D)).toBe("?mode=chord&key=E");
  });

  it("encodes box 1-based and only in scale mode", () => {
    expect(viewQueryString({ ...D, boxIndex: 1 }, D)).toBe("?box=2");
    expect(viewQueryString({ ...D, mode: "chord", boxIndex: 1 }, D)).toBe("?mode=chord");
  });

  it("encodes quality and ext only in chord/overlay modes", () => {
    expect(viewQueryString({ ...D, mode: "chord", quality: "major", exts: ["7"] }, D))
      .toBe("?mode=chord&quality=major&ext=7");
    expect(viewQueryString({ ...D, quality: "major", exts: ["7"] }, D)).toBe(""); // scale 모드에선 생략
  });

  it("normalizes ext order and omits empty ext", () => {
    expect(viewQueryString({ ...D, mode: "chord", exts: ["11", "7"] }, D))
      .toBe("?mode=chord&ext=7%2C11");
    expect(viewQueryString({ ...D, mode: "chord" }, D)).toBe("?mode=chord");
  });

  it("encodes only mode for quiz view", () => {
    expect(viewQueryString({ ...D, mode: "quiz", keySel: "Bb", labelMode: "degree" }, D)).toBe("?mode=quiz");
  });

  it("encodes overlay mode with scale, chord root, quality and ext", () => {
    expect(viewQueryString({ ...D, mode: "overlay", scaleId: "blues", overlayRoot: "E", exts: ["9"] }, D))
      .toBe("?mode=overlay&scale=blues&croot=E&ext=9");
  });
});

describe("parseViewQuery", () => {
  it("round-trips a non-default view", () => {
    const v: UrlViewState = { ...D, mode: "chord", keySel: "Bb", quality: "major", exts: ["7", "9"] };
    expect(parseViewQuery(viewQueryString(v, D), D)).toEqual(v);
  });

  it("falls back to defaults on invalid values", () => {
    expect(parseViewQuery("?mode=nope&key=H&quality=aug&ext=13&box=99", D)).toEqual(D);
  });

  it("normalizes ext order and duplicates", () => {
    expect(parseViewQuery("?mode=chord&ext=11,7,7", D).exts).toEqual(["7", "11"]);
  });

  it("parses box to 0-based index within 1..5", () => {
    expect(parseViewQuery("?box=3", D).boxIndex).toBe(2);
    expect(parseViewQuery("?box=0", D).boxIndex).toBeNull();
    expect(parseViewQuery("?box=6", D).boxIndex).toBeNull();
  });

  it("round-trips an overlay view", () => {
    const v: UrlViewState = { ...D, mode: "overlay", overlayRoot: "Bb", quality: "minor", exts: ["7", "11"] };
    expect(parseViewQuery(viewQueryString(v, D), D)).toEqual(v);
  });
});

describe("parseViewQuery — legacy chord param", () => {
  it("maps the 5 legacy chords preserving what they displayed", () => {
    expect(parseViewQuery("?mode=chord&chord=maj", D)).toMatchObject({ quality: "major", exts: [] });
    expect(parseViewQuery("?mode=chord&chord=m", D)).toMatchObject({ quality: "minor", exts: [] });
    expect(parseViewQuery("?mode=chord&chord=7", D)).toMatchObject({ quality: "dominant", exts: ["7"] });
    expect(parseViewQuery("?mode=chord&chord=maj7", D)).toMatchObject({ quality: "major", exts: ["7"] });
    expect(parseViewQuery("?mode=chord&chord=m7", D)).toMatchObject({ quality: "minor", exts: ["7"] });
  });

  it("ignores legacy chord when a new param is present", () => {
    expect(parseViewQuery("?mode=chord&quality=minor&chord=maj7", D))
      .toMatchObject({ quality: "minor", exts: [] });
    expect(parseViewQuery("?mode=chord&ext=9&chord=maj7", D))
      .toMatchObject({ quality: "dominant", exts: ["9"] });
  });

  it("ignores unknown legacy values", () => {
    expect(parseViewQuery("?mode=chord&chord=dim", D)).toMatchObject({ quality: "dominant", exts: [] });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/viewUrl.test.ts`
Expected: FAIL — `quality`/`exts` 필드 없음 (타입/런타임 불일치).

- [ ] **Step 3: 구현 — src/lib/viewUrl.ts 전체 교체**

```ts
import { KEYS, type Key } from "@/theory/notes";
import { SCALE_IDS, type ScaleId } from "@/theory/scales";
import {
  EXTENSIONS, QUALITIES, normalizeExts, type ChordQuality, type Extension,
} from "@/theory/chords";

export type ViewMode = "scale" | "chord" | "overlay" | "quiz";
export type ViewLabelMode = "name" | "degree" | "none";

export interface UrlViewState {
  mode: ViewMode;
  keySel: Key;
  scaleId: ScaleId;
  quality: ChordQuality;
  exts: readonly Extension[];
  labelMode: ViewLabelMode;
  boxIndex: number | null;
  overlayRoot: Key;
}

const MODES: readonly ViewMode[] = ["scale", "chord", "overlay", "quiz"];
const LABELS: readonly ViewLabelMode[] = ["name", "degree", "none"];

// 구 chord 파라미터 → 표시 결과 보존 매핑 (v2 이전 북마크 호환)
const LEGACY_CHORD: Record<string, { quality: ChordQuality; exts: readonly Extension[] }> = {
  maj: { quality: "major", exts: [] },
  m: { quality: "minor", exts: [] },
  "7": { quality: "dominant", exts: ["7"] },
  maj7: { quality: "major", exts: ["7"] },
  m7: { quality: "minor", exts: ["7"] },
};

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

function parseExts(raw: string | null): readonly Extension[] | null {
  if (raw === null) return null;
  const parts = raw
    .split(",")
    .filter((p): p is Extension => (EXTENSIONS as readonly string[]).includes(p));
  return normalizeExts(parts);
}

export function parseViewQuery(search: string, defaults: UrlViewState): UrlViewState {
  const p = new URLSearchParams(search);
  const boxRaw = p.get("box");
  const box = boxRaw === null ? NaN : Number(boxRaw);
  // 레거시는 새 파라미터(quality/ext)가 둘 다 없을 때만 해석
  const legacy =
    p.get("quality") === null && p.get("ext") === null
      ? (LEGACY_CHORD[p.get("chord") ?? ""] ?? null)
      : null;
  return {
    mode: oneOf(p.get("mode"), MODES) ?? defaults.mode,
    keySel: oneOf(p.get("key"), KEYS) ?? defaults.keySel,
    scaleId: oneOf(p.get("scale"), SCALE_IDS) ?? defaults.scaleId,
    quality: oneOf(p.get("quality"), QUALITIES) ?? legacy?.quality ?? defaults.quality,
    exts: parseExts(p.get("ext")) ?? legacy?.exts ?? defaults.exts,
    labelMode: oneOf(p.get("label"), LABELS) ?? defaults.labelMode,
    boxIndex: Number.isInteger(box) && box >= 1 && box <= 5 ? box - 1 : null,
    overlayRoot: oneOf(p.get("croot"), KEYS) ?? defaults.overlayRoot,
  };
}

export function viewQueryString(view: UrlViewState, defaults: UrlViewState): string {
  const p = new URLSearchParams();
  if (view.mode !== defaults.mode) p.set("mode", view.mode);
  if (view.mode !== "quiz" && view.keySel !== defaults.keySel) p.set("key", view.keySel);
  if ((view.mode === "scale" || view.mode === "overlay") && view.scaleId !== defaults.scaleId) p.set("scale", view.scaleId);
  if (view.mode === "chord" || view.mode === "overlay") {
    if (view.quality !== defaults.quality) p.set("quality", view.quality);
    const exts = normalizeExts(view.exts);
    if (exts.length > 0) p.set("ext", exts.join(",")); // 기본값은 빈 목록
  }
  if (view.mode === "overlay" && view.overlayRoot !== defaults.overlayRoot) p.set("croot", view.overlayRoot);
  if (view.mode !== "quiz" && view.labelMode !== defaults.labelMode) p.set("label", view.labelMode);
  if (view.mode === "scale" && view.boxIndex !== null) p.set("box", String(view.boxIndex + 1));
  const s = p.toString();
  return s ? `?${s}` : "";
}
```

- [ ] **Step 4: viewUrl 테스트 통과 확인**

Run: `npx vitest run src/lib/viewUrl.test.ts`
Expected: PASS (17 tests).

- [ ] **Step 5: i18n — src/lib/i18n.ts 수정**

1. import를 교체: `import type { ChordId } from "@/theory/chords";` → `import type { ChordQuality } from "@/theory/chords";`
2. `Messages` 인터페이스에 3개 키 추가 (범례 그룹 근처):

```ts
  legendNinth: string; legendEleventh: string;
  extensions: string;
```

3. `MESSAGES.en`에 추가: `legendNinth: "9th", legendEleventh: "11th", extensions: "Extensions",`
4. `MESSAGES.ko`에 추가: `legendNinth: "9도", legendEleventh: "11도", extensions: "확장",`
5. `CHORD_NAMES` 전체를 다음으로 교체:

```ts
export const QUALITY_NAMES: Record<Lang, Record<ChordQuality, string>> = {
  en: { major: "Major", minor: "Minor", dominant: "Dominant" },
  ko: { major: "메이저", minor: "마이너", dominant: "도미넌트" },
};
```

6. `src/lib/i18n.test.ts`: import에서 `CHORD_NAMES` → `QUALITY_NAMES`, "maps scale and chord display names" 테스트의 코드 어서션 2줄을 다음으로 교체:

```ts
    expect(QUALITY_NAMES.en.dominant).toBe("Dominant");
    expect(QUALITY_NAMES.ko.major).toBe("메이저");
```

- [ ] **Step 6: 색상 토큰 — app/globals.css**

`:root`의 `--tone-7: #8a63b3;` 아래에 추가:

```css
  --tone-9: #b0813a;
  --tone-11: #3e8f96;
```

`:root[data-theme="dark"]`의 `--tone-7: #9c77c9;` 아래에 추가:

```css
  --tone-9: #c29347;
  --tone-11: #4a9ea6;
```

- [ ] **Step 7: Fretboard — src/components/Fretboard.tsx TONE_FILL만 교체**

```ts
const TONE_FILL: Record<string, string> = {
  "1": "var(--note-root)",
  "3": "var(--tone-3)",
  "5": "var(--tone-5)",
  "7": "var(--tone-7)",
  "9": "var(--tone-9)",
  "11": "var(--tone-11)",
};
```

(그 외 변경 금지 — `degreeFill`의 b-스트립으로 `b3`→3색, `b7`→7색 동작은 기존 그대로.)

- [ ] **Step 8: Controls — src/components/Controls.tsx 전체 교체**

```tsx
import { KEYS, type Key } from "@/theory/notes";
import { SCALE_IDS, type ScaleId } from "@/theory/scales";
import {
  EXTENSIONS, QUALITIES, normalizeExts, type ChordQuality, type Extension,
} from "@/theory/chords";
import { MESSAGES, SCALE_NAMES, QUALITY_NAMES } from "@/lib/i18n";
import { useLang } from "@/lib/LangContext";
import type { LabelMode } from "./Fretboard";

export type Mode = "scale" | "chord" | "overlay" | "quiz";

export interface ControlsProps {
  mode: Mode;
  keySel: Key;
  scaleId: ScaleId;
  quality: ChordQuality;
  exts: readonly Extension[];
  labelMode: LabelMode;
  boxIndex: number | null;
  boxCount: number | null;   // null = 이 스케일은 박스 미지원 (코드 모드에서도 null 전달)
  overlayRoot: Key;
  onChange: (patch: Partial<Omit<ControlsProps, "onChange" | "boxCount">>) => void;
}

export function Controls({ mode, keySel, scaleId, quality, exts, labelMode, boxIndex, boxCount, overlayRoot, onChange }: ControlsProps) {
  const { lang } = useLang();
  const m = MESSAGES[lang];
  const LABEL_MODES: { id: LabelMode; label: string }[] = [
    { id: "name", label: m.labelNames },
    { id: "degree", label: m.labelDegrees },
    { id: "none", label: m.labelOff },
  ];

  if (mode === "quiz") return null; // 퀴즈 설정은 Quiz가 자체 렌더

  const toggleExt = (e: Extension) =>
    onChange({
      exts: exts.includes(e) ? exts.filter((x) => x !== e) : normalizeExts([...exts, e]),
    });

  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
      <label className="field">
        {mode === "chord" ? m.root : m.key}
        <select id="view-key" value={keySel} onChange={(e) => onChange({ keySel: e.target.value as Key })}>
          {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>

      {(mode === "scale" || mode === "overlay") && (
        <label className="field">
          {m.scale}
          <select id="view-scale" value={scaleId}
                  onChange={(e) => onChange({ scaleId: e.target.value as ScaleId, boxIndex: null })}>
            {SCALE_IDS.map((id) => <option key={id} value={id}>{SCALE_NAMES[lang][id]}</option>)}
          </select>
        </label>
      )}

      {mode === "overlay" && (
        <label className="field">
          {m.chordRoot}
          <select id="view-chord-root" value={overlayRoot}
                  onChange={(e) => onChange({ overlayRoot: e.target.value as Key })}>
            {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
      )}

      {(mode === "chord" || mode === "overlay") && (
        <>
          <label className="field">
            {m.chord}
            <select id="view-quality" value={quality}
                    onChange={(e) => onChange({ quality: e.target.value as ChordQuality })}>
              {QUALITIES.map((q) => (
                <option key={q} value={q}>{QUALITY_NAMES[lang][q]}</option>
              ))}
            </select>
          </label>

          <div className="seg" role="group" aria-label={m.extensions}>
            {EXTENSIONS.map((e) => (
              <button key={e} type="button" data-active={exts.includes(e)} aria-pressed={exts.includes(e)}
                      onClick={() => toggleExt(e)}>
                {e}th
              </button>
            ))}
          </div>
        </>
      )}

      <div className="seg" role="group" aria-label={m.labelGroup}>
        {LABEL_MODES.map(({ id, label }) => (
          <button key={id} type="button" data-active={labelMode === id} aria-pressed={labelMode === id}
                  onClick={() => onChange({ labelMode: id })}>
            {label}
          </button>
        ))}
      </div>

      {mode === "scale" && boxCount !== null && (
        <div className="seg" role="group" aria-label={m.positionGroup}>
          <button type="button" data-active={boxIndex === null} aria-pressed={boxIndex === null}
                  onClick={() => onChange({ boxIndex: null })}>
            {m.positionAll}
          </button>
          {Array.from({ length: boxCount }, (_, i) => (
            <button key={i} type="button" data-active={boxIndex === i} aria-pressed={boxIndex === i}
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

주의: `{e}th`는 `7th`/`9th`/`11th`를 렌더한다(양 언어 동일 표기 — 스펙 §4).

- [ ] **Step 9: Controls 테스트 — src/components/Controls.test.tsx 수정**

`baseProps`의 `chordId: "7" as const` 를 다음 2줄로 교체:

```ts
  quality: "dominant" as const,
  exts: [] as const,
```

`describe("Controls (chord mode)")` 를 다음으로 교체:

```tsx
describe("Controls (chord mode)", () => {
  const chordProps = { ...baseProps, mode: "chord" as const };

  it("shows the quality select and extension toggles, hides scale select and position filter", () => {
    const { queryByLabelText, queryByRole, getByLabelText, getByRole } = render(<Controls {...chordProps} />);
    expect(getByLabelText("Chord")).not.toBeNull();
    expect(getByRole("option", { name: "Dominant" })).not.toBeNull();
    expect(getByRole("group", { name: "Extensions" })).not.toBeNull();
    expect(queryByLabelText("Scale")).toBeNull();
    expect(queryByRole("group", { name: "Position" })).toBeNull();
  });

  it("labels the key select as Root", () => {
    const { getByLabelText } = render(<Controls {...chordProps} />);
    expect(getByLabelText("Root")).not.toBeNull();
  });

  it("extension toggles start unpressed and emit an added extension", () => {
    const onChange = vi.fn();
    const { getByRole } = render(<Controls {...chordProps} onChange={onChange} />);
    const btn = getByRole("button", { name: "9th" });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(btn);
    expect(onChange).toHaveBeenCalledWith({ exts: ["9"] });
  });

  it("toggling an active extension removes it, and additions keep 7→9→11 order", () => {
    const onChange = vi.fn();
    const { getByRole, rerender } = render(
      <Controls {...chordProps} exts={["9"]} onChange={onChange} />
    );
    fireEvent.click(getByRole("button", { name: "9th" }));
    expect(onChange).toHaveBeenCalledWith({ exts: [] });
    rerender(<Controls {...chordProps} exts={["9"]} onChange={onChange} />);
    fireEvent.click(getByRole("button", { name: "7th" }));
    expect(onChange).toHaveBeenCalledWith({ exts: ["7", "9"] });
  });

  it("changing quality emits the new quality", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(<Controls {...chordProps} onChange={onChange} />);
    fireEvent.change(getByLabelText("Chord"), { target: { value: "minor" } });
    expect(onChange).toHaveBeenCalledWith({ quality: "minor" });
  });
});
```

`describe("Controls (overlay mode)")` 를 다음으로 교체:

```tsx
describe("Controls (overlay mode)", () => {
  const overlayProps = { ...baseProps, mode: "overlay" as const, overlayRoot: "E" as const };

  it("shows scale, chord-root, quality selects and extension toggles, hides the box filter", () => {
    const { getByLabelText, getByRole, queryByRole } = render(<Controls {...overlayProps} />);
    expect(getByLabelText("Key")).not.toBeNull();
    expect(getByLabelText("Scale")).not.toBeNull();
    expect(getByLabelText("Chord Root")).not.toBeNull();
    expect(getByLabelText("Chord")).not.toBeNull();
    expect(getByRole("group", { name: "Extensions" })).not.toBeNull();
    expect(queryByRole("group", { name: "Position" })).toBeNull();
  });
});
```

(scale/quiz describe는 그대로 — baseProps 필드 교체만 반영됨.)

- [ ] **Step 10: Legend — src/components/Legend.tsx 전체 교체 + Legend.test.tsx 전체 교체**

Legend.tsx:

```tsx
import type { Extension } from "@/theory/chords";
import { MESSAGES, type Messages } from "@/lib/i18n";
import { useLang } from "@/lib/LangContext";

export interface LegendProps {
  mode: "scale" | "chord" | "overlay";
  exts?: readonly Extension[];
}

interface LegendItem {
  label: string;
  color: string;
  ring?: boolean;
}

function itemsFor(mode: LegendProps["mode"], exts: readonly Extension[], m: Messages): LegendItem[] {
  if (mode === "scale") {
    return [
      { label: m.legendRoot, color: "var(--note-root)", ring: true },
      { label: m.legendScaleNote, color: "var(--note-scale)" },
    ];
  }
  const items: LegendItem[] = [
    { label: m.legendRoot1, color: "var(--note-root)", ring: true },
    { label: m.legendThird, color: "var(--tone-3)" },
    { label: m.legendFifth, color: "var(--tone-5)" },
  ];
  if (exts.includes("7")) items.push({ label: m.legendSeventh, color: "var(--tone-7)" });
  if (exts.includes("9")) items.push({ label: m.legendNinth, color: "var(--tone-9)" });
  if (exts.includes("11")) items.push({ label: m.legendEleventh, color: "var(--tone-11)" });
  if (mode === "overlay") items.push({ label: m.legendScaleNote, color: "var(--note-dim)" });
  return items;
}

export function Legend({ mode, exts = [] }: LegendProps) {
  const { lang } = useLang();
  const m = MESSAGES[lang];
  return (
    <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1" aria-label={m.legend}>
      {itemsFor(mode, exts, m).map(({ label, color, ring }) => (
        <li key={label} className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span aria-hidden="true" className="inline-block size-3 rounded-full"
                style={{
                  background: color,
                  boxShadow: ring ? "inset 0 0 0 1.5px var(--note-root-ring)" : undefined,
                }} />
          {label}
        </li>
      ))}
    </ul>
  );
}
```

Legend.test.tsx:

```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Legend } from "./Legend";

afterEach(() => cleanup());

describe("Legend", () => {
  it("scale mode shows root and scale-note swatches", () => {
    const { getByText, queryByText } = render(<Legend mode="scale" />);
    expect(getByText("Root")).not.toBeNull();
    expect(getByText("Scale notes")).not.toBeNull();
    expect(queryByText("3rd")).toBeNull();
  });

  it("chord mode shows only the triad by default", () => {
    const { getByText, queryByText } = render(<Legend mode="chord" />);
    for (const label of ["Root (1)", "3rd", "5th"]) {
      expect(getByText(label)).not.toBeNull();
    }
    expect(queryByText("7th")).toBeNull();
    expect(queryByText("9th")).toBeNull();
    expect(queryByText("11th")).toBeNull();
  });

  it("chord mode adds swatches for active extensions only", () => {
    const { getByText, queryByText } = render(<Legend mode="chord" exts={["7", "11"]} />);
    expect(getByText("7th")).not.toBeNull();
    expect(getByText("11th")).not.toBeNull();
    expect(queryByText("9th")).toBeNull();
  });

  it("overlay mode keeps the dimmed scale-note swatch after extensions", () => {
    const { getByText } = render(<Legend mode="overlay" exts={["9"]} />);
    for (const label of ["Root (1)", "3rd", "5th", "9th", "Scale notes"]) {
      expect(getByText(label)).not.toBeNull();
    }
  });
});
```

- [ ] **Step 11: page.tsx 수정**

1. import 교체: `import { chordNoteMap, CHORDS } from "@/theory/chords";` → `import { chordSymbol, chordToneMap } from "@/theory/chords";`
2. import 교체: `CHORD_NAMES` → `QUALITY_NAMES` (`@/lib/i18n`).
3. `DEFAULT_VIEW`의 `chordId: "7",` → `quality: "dominant", exts: [],`
4. notes/overlay 계산 교체:

```tsx
  const notes = isChord
    ? chordToneMap(view.keySel, view.quality, view.exts)
    : scaleNoteMap(view.keySel, view.scaleId);
  const overlayNotes = isOverlay ? chordToneMap(view.overlayRoot, view.quality, view.exts) : undefined;
```

5. 타이틀 계산 교체:

```tsx
  const scaleName = SCALE_NAMES[lang][view.scaleId];
  const symbol = chordSymbol(view.quality, view.exts);
  const title = isChord
    ? m.titleChord(view.keySel, symbol, QUALITY_NAMES[lang][view.quality])
    : isOverlay
      ? m.titleOverlay(view.keySel, scaleName, view.overlayRoot, symbol)
      : m.titleScale(view.keySel, scaleName, view.boxIndex);
```

6. `<Legend mode={legendMode} />` → `<Legend mode={legendMode} exts={view.exts} />`
7. `<Controls ... chordId={view.chordId} ...>` 의 해당 prop을 `quality={view.quality} exts={view.exts}` 로 교체.

- [ ] **Step 12: langSwitch.test.tsx — controlsProps의 `chordId: "7" as const,` 를 `quality: "dominant" as const, exts: [] as const,` 로 교체**

- [ ] **Step 13: 전체 검증 + 커밋**

Run: `npm test && npm run build`
Expected: 전체 그린(구 chords 테스트 포함 — 구 API는 아직 존재), 빌드 성공.

```bash
git add src/lib src/components app/page.tsx app/globals.css
git commit -m "feat: quality + extension controls, URL schema with legacy migration"
```

---

### Task C3: 구 코드 어휘 제거

**Files:**
- Modify: `src/theory/chords.ts` (구 어휘 삭제), `src/theory/chords.test.ts` (구 describe 삭제)

**Interfaces:**
- Consumes: C2 완료 상태 (모든 소비자가 새 API 사용 중).
- Produces: 최종 상태 — `chords.ts`는 새 모델만 export.

- [ ] **Step 1: src/theory/chords.ts에서 삭제**

`ChordDef` 인터페이스, `CHORDS`, `CHORD_IDS`, `ChordId`, `chordNoteMap` 함수, 그리고 이제 안 쓰는 import(`degreeLabel`)를 제거한다. import 줄은 다음이 된다:

```ts
import { type Key, type PitchClass, type ToneFamily, keyToPc, preference, spellWith } from "./notes";
import type { NoteInfo } from "./scales";
```

"── v3: 퀄리티 + 확장 모델 ──" 주석의 "기존 CHORDS 어휘는 마이그레이션 완료 후 제거 예정." 문구도 삭제.

- [ ] **Step 2: src/theory/chords.test.ts에서 삭제**

`describe("CHORDS")` 와 `describe("chordNoteMap")` 블록 전체, import에서 `CHORDS, CHORD_IDS, chordNoteMap` 제거:

```ts
import { chordToneMap, chordSymbol, normalizeExts } from "./chords";
```

- [ ] **Step 3: 잔존 참조 확인**

Run: `grep -rn "CHORD_IDS\|ChordId\b\|chordNoteMap\|CHORDS\b" src app --include="*.ts" --include="*.tsx"`
Expected: 매치 0건 (viewUrl의 LEGACY_CHORD 객체 키 `maj7` 등은 이 패턴에 걸리지 않음).

- [ ] **Step 4: 전체 검증 + 커밋**

Run: `npm test && npm run build`
Expected: 전체 그린, 빌드 성공.

```bash
git add src/theory/chords.ts src/theory/chords.test.ts
git commit -m "chore: remove legacy 5-chord vocabulary"
```

---

### Task C4: 브라우저 검증 + 최종 리뷰 (컨트롤러 수행)

- [ ] 코드톤 기본: 1·3·5만 (타이틀 "A — Dominant Chord Tones", 범례 Root(1)/3rd/5th)
- [ ] 7th/9th/11th 토글: 지판 노트·범례·타이틀 심볼(A7 → A7(9) → …) 동기 변화, 9/11 색상 라이트·다크 확인
- [ ] 오버레이: 동일 토글 반영 + 스케일 딤 유지
- [ ] URL: `?mode=chord&quality=major&ext=7,9` 직진입 / 레거시 `?mode=chord&chord=maj7` 마이그레이션 / KO 전환 시 퀄리티 표시명
- [ ] 콘솔 에러 0 → 전체 브랜치 최종 리뷰 디스패치
