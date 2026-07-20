# 변형 텐션 + 신규 퀄리티 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 코드톤·오버레이 모드에 dim/m7b5/aug 퀄리티, 13th 토글, 도미넌트 전용 변형 텐션(b9/#9/#11/b13)을 추가한다.

**Architecture:** 기존 "퀄리티 + 독립 확장 토글" 모델의 최소 확장 — `ChordQuality` 3→6종(QualityDef에 `fifth` 필드 추가), `Extension` 3→8종, 유효성은 `allowedExts(quality)` 헬퍼를 단일 소스로 UI·URL 경계에서 필터. 스펙: `docs/superpowers/specs/2026-07-20-altered-tensions-qualities-design.md`.

**Tech Stack:** Next.js 15 + React 19, TypeScript, Vitest + Testing Library, Tailwind v4 (CSS 토큰).

## Global Constraints

- 변형 텐션(b9/#9/#11/b13)은 **도미넌트 전용**. 자연 확장(7/9/11/13)은 전 퀄리티 허용.
- `EXTENSIONS` 순서 = `["7", "b9", "9", "#9", "11", "#11", "13", "b13"]` — 정규화·심볼 나열·URL 직렬화 공통 순서.
- 심볼은 나열식 유지(재즈 축약 `A13` 금지): 7 켜짐 → `7(b9,#9)`, 꺼짐 → `(addb9)`.
- 퀄리티 URL 값은 TS 값 그대로(`diminished|halfDiminished|augmented`). `ext`는 토큰 그대로(`#`은 URLSearchParams가 `%23`으로 인코딩).
- 확장 필 라벨은 양 언어 동일: 자연 `7th/9th/11th/13th`, 변형 `b9/#9/#11/b13`.
- 신규 색 토큰은 `--tone-13` 하나: 라이트 `#b05a9e`(흰 라벨 대비 4.37:1), 다크 `#c06aae`(3.55:1 — 다크 팔레트 하한 3.2 준수).
- 커밋 메시지 말미: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- 테스트 실행: `npm test -- <파일경로>` (vitest run). 전체: `npm test`.

---

### Task 1: 이론 — 퀄리티 3종 추가 (diminished / halfDiminished / augmented)

**Files:**
- Modify: `src/theory/chords.ts`
- Modify: `src/lib/i18n.ts:166-169` (QUALITY_NAMES — `Record<ChordQuality, …>` 타입이 강제하므로 같은 커밋에 포함)
- Test: `src/theory/chords.test.ts`, `src/components/langSwitch.test.tsx`

**Interfaces:**
- Consumes: 기존 `Tone`, `QualityDef`, `QUALITY_DEFS`, `chordToneMap`, `chordSymbol` (src/theory/chords.ts)
- Produces: `ChordQuality = "major" | "minor" | "dominant" | "diminished" | "halfDiminished" | "augmented"`, 확장된 `QUALITIES`, `QualityDef.fifth: Tone`. 이후 태스크는 이 6종 리터럴을 그대로 사용한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/theory/chords.test.ts` 말미에 추가:

```ts
describe("chordToneMap — new qualities", () => {
  it("diminished triad is 1 b3 b5 (A: A C D#)", () => {
    const map = chordToneMap("A", "diminished", []);
    expect(map.size).toBe(3);
    expect(map.get(9)).toEqual({ name: "A", degree: "1", isRoot: true });
    expect(map.get(0)).toEqual({ name: "C", degree: "b3", isRoot: false });
    expect(map.get(3)).toEqual({ name: "D#", degree: "b5", isRoot: false });
  });

  it("diminished 7th is bb7 (A: F#)", () => {
    expect(chordToneMap("A", "diminished", ["7"]).get(6)).toEqual({ name: "F#", degree: "bb7", isRoot: false });
  });

  it("halfDiminished shares the dim triad but takes b7 (A: G)", () => {
    expect(chordToneMap("A", "halfDiminished", []).get(3)!.degree).toBe("b5");
    expect(chordToneMap("A", "halfDiminished", ["7"]).get(7)).toEqual({ name: "G", degree: "b7", isRoot: false });
  });

  it("augmented triad is 1 3 #5 and takes b7 (A: A C# F, G)", () => {
    const map = chordToneMap("A", "augmented", []);
    expect(map.get(1)).toEqual({ name: "C#", degree: "3", isRoot: false });
    expect(map.get(5)).toEqual({ name: "F", degree: "#5", isRoot: false });
    expect(chordToneMap("A", "augmented", ["7"]).get(7)!.degree).toBe("b7");
  });
});

describe("chordSymbol — new qualities", () => {
  it("dim/halfDim/aug base and with-7 symbols", () => {
    expect(chordSymbol("diminished", [])).toBe("dim");
    expect(chordSymbol("diminished", ["7"])).toBe("dim7");
    expect(chordSymbol("halfDiminished", [])).toBe("dim"); // 7 꺼짐 시 dim 트라이어드와 동일 표시 (스펙 §2)
    expect(chordSymbol("halfDiminished", ["7"])).toBe("m7b5");
    expect(chordSymbol("augmented", [])).toBe("aug");
    expect(chordSymbol("augmented", ["7"])).toBe("aug7");
  });
});
```

`src/components/langSwitch.test.tsx`의 `describe("language switching", …)` 안에 추가:

```tsx
  it("renders Korean quality names in chord mode", () => {
    window.localStorage.setItem("fretboard-lang", "ko");
    const { getByRole } = render(
      <LangProvider><Controls {...controlsProps} mode="chord" /></LangProvider>
    );
    expect(getByRole("option", { name: "디미니시드" })).not.toBeNull();
    expect(getByRole("option", { name: "하프 디미니시드" })).not.toBeNull();
    expect(getByRole("option", { name: "어그먼티드" })).not.toBeNull();
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/theory/chords.test.ts src/components/langSwitch.test.tsx`
Expected: FAIL — `"diminished"` 인자 타입 불일치로 신규 케이스 실패(vitest는 esbuild 변환이라 런타임에서 `QUALITY_DEFS[quality]`가 undefined → TypeError), KO 퀄리티 옵션 부재.

- [ ] **Step 3: 구현**

`src/theory/chords.ts` — 타입·정의 교체:

```ts
export type ChordQuality =
  | "major" | "minor" | "dominant"
  | "diminished" | "halfDiminished" | "augmented";
export const QUALITIES = [
  "major", "minor", "dominant", "diminished", "halfDiminished", "augmented",
] as const satisfies readonly ChordQuality[];
```

`QualityDef`에 `fifth` 필드 추가:

```ts
interface QualityDef {
  family: ToneFamily;
  third: Tone;
  fifth: Tone;
  seventh: Tone;      // 7th 종류는 퀄리티가 결정
  symbolBase: string; // 7 꺼짐 시 심볼
  symbolWith7: string;
}
```

`QUALITY_DEFS` — 기존 3종에 `fifth: { interval: 7, degree: "5" }` 추가하고 3종 신설:

```ts
const QUALITY_DEFS: Record<ChordQuality, QualityDef> = {
  major: {
    family: "major",
    third: { interval: 4, degree: "3" },
    fifth: { interval: 7, degree: "5" },
    seventh: { interval: 11, degree: "7" },
    symbolBase: "",
    symbolWith7: "maj7",
  },
  minor: {
    family: "minor",
    third: { interval: 3, degree: "b3" },
    fifth: { interval: 7, degree: "5" },
    seventh: { interval: 10, degree: "b7" },
    symbolBase: "m",
    symbolWith7: "m7",
  },
  dominant: {
    family: "major",
    third: { interval: 4, degree: "3" },
    fifth: { interval: 7, degree: "5" },
    seventh: { interval: 10, degree: "b7" },
    symbolBase: "",
    symbolWith7: "7",
  },
  diminished: {
    family: "minor",
    third: { interval: 3, degree: "b3" },
    fifth: { interval: 6, degree: "b5" },
    seventh: { interval: 9, degree: "bb7" },
    symbolBase: "dim",
    symbolWith7: "dim7",
  },
  halfDiminished: {
    family: "minor",
    third: { interval: 3, degree: "b3" },
    fifth: { interval: 6, degree: "b5" },
    seventh: { interval: 10, degree: "b7" }, // 7 꺼짐 시 dim 트라이어드와 동일 표시 — dominant/major 전례
    symbolBase: "dim",
    symbolWith7: "m7b5",
  },
  augmented: {
    family: "major",
    third: { interval: 4, degree: "3" },
    fifth: { interval: 8, degree: "#5" },
    seventh: { interval: 10, degree: "b7" },
    symbolBase: "aug",
    symbolWith7: "aug7",
  },
};
```

`chordToneMap`의 트라이어드 배열에서 5도 하드코딩을 `def.fifth`로 교체:

```ts
  const tones: Tone[] = [{ interval: 0, degree: "1" }, def.third, def.fifth];
```

`src/lib/i18n.ts`의 `QUALITY_NAMES` 교체:

```ts
export const QUALITY_NAMES: Record<Lang, Record<ChordQuality, string>> = {
  en: {
    major: "Major", minor: "Minor", dominant: "Dominant",
    diminished: "Diminished", halfDiminished: "Half-diminished", augmented: "Augmented",
  },
  ko: {
    major: "메이저", minor: "마이너", dominant: "도미넌트",
    diminished: "디미니시드", halfDiminished: "하프 디미니시드", augmented: "어그먼티드",
  },
};
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/theory/chords.test.ts src/components/langSwitch.test.tsx`
Expected: PASS (기존 케이스 포함 전부)

- [ ] **Step 5: 타입 확인 + 커밋**

Run: `npx tsc --noEmit` — Expected: 에러 없음

```bash
git add src/theory/chords.ts src/theory/chords.test.ts src/lib/i18n.ts src/components/langSwitch.test.tsx
git commit -m "feat: add diminished, half-diminished, augmented chord qualities

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 이론 — Extension 8종 + allowedExts + 피치클래스 충돌 가드

**Files:**
- Modify: `src/theory/chords.ts`
- Test: `src/theory/chords.test.ts`

**Interfaces:**
- Consumes: Task 1의 `QUALITY_DEFS`(6종), `Tone`, `normalizeExts`, `chordSymbol`, `chordToneMap`
- Produces: `Extension = "7" | "b9" | "9" | "#9" | "11" | "#11" | "13" | "b13"`, `EXTENSIONS`(위 순서), **`allowedExts(quality: ChordQuality): readonly Extension[]`** — 이후 Task 3(viewUrl)·Task 5(Controls)가 import.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/theory/chords.test.ts` 말미에 추가:

```ts
describe("altered tensions & 13th", () => {
  it("natural 13 is +9 (A major add13: F#)", () => {
    expect(chordToneMap("A", "major", ["13"]).get(6)).toEqual({ name: "F#", degree: "13", isRoot: false });
  });

  it("altered tensions on dominant (A: b9=A#, #9=C, #11=D#, b13=F)", () => {
    const map = chordToneMap("A", "dominant", ["b9", "#9", "#11", "b13"]);
    expect(map.get(10)).toEqual({ name: "A#", degree: "b9", isRoot: false });
    expect(map.get(0)).toEqual({ name: "C", degree: "#9", isRoot: false });
    expect(map.get(3)).toEqual({ name: "D#", degree: "#11", isRoot: false });
    expect(map.get(5)).toEqual({ name: "F", degree: "b13", isRoot: false });
    expect(map.size).toBe(7); // 트라이어드 3 + 텐션 4
  });

  it("keeps the first tone on pitch-class collision (dim7 + 13 → bb7 wins)", () => {
    const map = chordToneMap("A", "diminished", ["7", "13"]);
    expect(map.size).toBe(4);
    expect(map.get(6)!.degree).toBe("bb7");
  });
});

describe("allowedExts", () => {
  it("dominant allows all 8, others only naturals", () => {
    expect(allowedExts("dominant")).toEqual(["7", "b9", "9", "#9", "11", "#11", "13", "b13"]);
    expect(allowedExts("minor")).toEqual(["7", "9", "11", "13"]);
    expect(allowedExts("diminished")).toEqual(["7", "9", "11", "13"]);
  });
});

describe("chordSymbol — altered tensions & 13th", () => {
  it("lists uppers in EXTENSIONS order, add-notation without 7", () => {
    expect(chordSymbol("dominant", ["7", "b9", "#9"])).toBe("7(b9,#9)");
    expect(chordSymbol("dominant", ["#9", "b9", "7"])).toBe("7(b9,#9)"); // 순서 정규화
    expect(chordSymbol("dominant", ["7", "13"])).toBe("7(13)");
    expect(chordSymbol("dominant", ["b9"])).toBe("(addb9)");
    expect(chordSymbol("major", ["7", "9", "13"])).toBe("maj7(9,13)");
  });
});
```

같은 파일의 `describe("normalizeExts", …)` 내부 기존 케이스 아래 추가:

```ts
  it("orders the 8 extensions as 7 → b9 → 9 → #9 → 11 → #11 → 13 → b13", () => {
    expect(normalizeExts(["13", "b9", "7", "b9"])).toEqual(["7", "b9", "13"]);
  });
```

테스트 파일 상단 import에 `allowedExts` 추가:

```ts
import { chordToneMap, chordSymbol, normalizeExts, allowedExts } from "./chords";
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/theory/chords.test.ts`
Expected: FAIL — `allowedExts` 미정의(import 에러) 및 신규 텐션 케이스 실패

- [ ] **Step 3: 구현**

`src/theory/chords.ts`:

```ts
export type Extension = "7" | "b9" | "9" | "#9" | "11" | "#11" | "13" | "b13";
export const EXTENSIONS = [
  "7", "b9", "9", "#9", "11", "#11", "13", "b13",
] as const satisfies readonly Extension[];

// 변형 텐션은 도미넌트 전용 (스펙 §2) — UI 렌더·상태 전환·URL 파싱의 단일 유효성 소스
const ALTERED: ReadonlySet<Extension> = new Set(["b9", "#9", "#11", "b13"]);

export function allowedExts(quality: ChordQuality): readonly Extension[] {
  return quality === "dominant" ? EXTENSIONS : EXTENSIONS.filter((e) => !ALTERED.has(e));
}
```

`UPPER_EXTENSIONS` 교체 (기존 `Record<"9" | "11", Tone>` → 7 제외 전 텐션):

```ts
const UPPER_EXTENSIONS: Record<Exclude<Extension, "7">, Tone> = {
  b9: { interval: 1, degree: "b9" },
  "9": { interval: 2, degree: "9" },
  "#9": { interval: 3, degree: "#9" },
  "11": { interval: 5, degree: "11" },
  "#11": { interval: 6, degree: "#11" },
  "13": { interval: 9, degree: "13" },
  b13: { interval: 8, degree: "b13" },
};
```

`chordSymbol`의 uppers 필터 타입 갱신:

```ts
  const uppers = normalizeExts(exts).filter((e): e is Exclude<Extension, "7"> => e !== "7");
```

`chordToneMap` 루프에 충돌 가드 추가 (dim7의 bb7(+9)과 13(+9) — 먼저 삽입된 톤 유지, 스펙 §2):

```ts
  for (const { interval, degree } of tones) {
    const pc = (root + interval) % 12;
    if (!map.has(pc)) map.set(pc, { name: spellWith(pc, acc), degree, isRoot: interval === 0 });
  }
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/theory/chords.test.ts`
Expected: PASS

- [ ] **Step 5: 타입 확인 + 커밋**

Run: `npx tsc --noEmit` — Expected: 에러 없음

```bash
git add src/theory/chords.ts src/theory/chords.test.ts
git commit -m "feat: add 13th and dominant-only altered tensions to the theory layer

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: URL 코덱 — 새 토큰 왕복 + 퀄리티 기반 필터

**Files:**
- Modify: `src/lib/viewUrl.ts`
- Test: `src/lib/viewUrl.test.ts`

**Interfaces:**
- Consumes: Task 2의 `allowedExts`, 확장된 `EXTENSIONS`/`QUALITIES` (자동 반영 — `oneOf`/`parseExts`가 상수 기반)
- Produces: 변경 없는 시그니처 `parseViewQuery` / `viewQueryString` — 동작만 확장

- [ ] **Step 1: 기존 테스트 1건 갱신 + 신규 테스트 작성**

`src/lib/viewUrl.test.ts`의 기존 케이스(57행 부근)를 갱신 — `ext=13`이 유효해졌으므로 무효 토큰을 `b7`로 교체:

```ts
  it("falls back to defaults on invalid values", () => {
    expect(parseViewQuery("?mode=nope&key=H&quality=aug&ext=b7&box=99", D)).toEqual(D);
  });
```

(참고: `quality=aug`는 여전히 무효 — URL 값은 TS 값 그대로 `augmented`만 유효.)

`describe("parseViewQuery", …)` 말미에 추가:

```ts
  it("round-trips new qualities and the 13th", () => {
    const v: UrlViewState = { ...D, mode: "chord", quality: "diminished", exts: ["7", "13"] };
    expect(viewQueryString(v, D)).toBe("?mode=chord&quality=diminished&ext=7%2C13");
    expect(parseViewQuery(viewQueryString(v, D), D)).toEqual(v);
  });

  it("round-trips altered tensions with URL encoding (# → %23)", () => {
    const v: UrlViewState = { ...D, mode: "chord", exts: ["7", "b9", "#9"] };
    expect(viewQueryString(v, D)).toBe("?mode=chord&ext=7%2Cb9%2C%239");
    expect(parseViewQuery(viewQueryString(v, D), D)).toEqual(v);
  });

  it("drops altered tensions for non-dominant qualities on parse", () => {
    expect(parseViewQuery("?mode=chord&quality=minor&ext=7,b9,13", D).exts).toEqual(["7", "13"]);
  });

  it("drops altered tensions for non-dominant qualities on serialize", () => {
    expect(viewQueryString({ ...D, mode: "chord", quality: "minor", exts: ["7", "b9"] }, D))
      .toBe("?mode=chord&quality=minor&ext=7");
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/viewUrl.test.ts`
Expected: FAIL — 비도미넌트 드롭 2건 실패(현재는 필터 없음). 왕복 2건은 통과할 수 있음(상수 확장의 자동 효과) — 드롭 케이스가 이 태스크의 핵심.

- [ ] **Step 3: 구현**

`src/lib/viewUrl.ts` import에 `allowedExts` 추가:

```ts
import {
  EXTENSIONS, QUALITIES, allowedExts, normalizeExts, type ChordQuality, type Extension,
} from "@/theory/chords";
```

`parseViewQuery`의 return 직전을 재구성 — 퀄리티 확정 후 확장을 필터:

```ts
  const quality = oneOf(p.get("quality"), QUALITIES) ?? legacy?.quality ?? defaults.quality;
  const rawExts = parseExts(p.get("ext")) ?? legacy?.exts ?? defaults.exts;
  const allowed = allowedExts(quality);
  return {
    mode: oneOf(p.get("mode"), MODES) ?? defaults.mode,
    keySel: oneOf(p.get("key"), KEYS) ?? defaults.keySel,
    scaleId: oneOf(p.get("scale"), SCALE_IDS) ?? defaults.scaleId,
    quality,
    exts: rawExts.filter((e) => allowed.includes(e)),
    labelMode: oneOf(p.get("label"), LABELS) ?? defaults.labelMode,
    boxIndex: Number.isInteger(box) && box >= 1 && box <= 5 ? box - 1 : null,
    overlayRoot: oneOf(p.get("croot"), KEYS) ?? defaults.overlayRoot,
  };
```

`viewQueryString`의 chord/overlay 분기에서 직렬화 측도 동일 필터(방어적 정규화):

```ts
  if (view.mode === "chord" || view.mode === "overlay") {
    if (view.quality !== defaults.quality) p.set("quality", view.quality);
    const allowed = allowedExts(view.quality);
    const exts = normalizeExts(view.exts).filter((e) => allowed.includes(e));
    if (exts.length > 0) p.set("ext", exts.join(",")); // 기본값은 빈 목록
  }
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/lib/viewUrl.test.ts`
Expected: PASS (레거시 마이그레이션 describe 포함 전부)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/viewUrl.ts src/lib/viewUrl.test.ts
git commit -m "feat: encode new qualities and tensions in the view URL with quality-aware filtering

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 프렛보드 색상 — --tone-13 토큰 + 변화표 일반화

**Files:**
- Modify: `src/components/Fretboard.tsx:42-55` (TONE_FILL·degreeFill)
- Modify: `app/globals.css` (라이트 29-30행, 다크 61-62행 인근)
- Test: `src/components/Fretboard.test.tsx`

**Interfaces:**
- Consumes: Task 2의 확장 토큰(테스트에서 `chordToneMap`으로 생성되는 degree 문자열 `b9`/`#9`/`b13`/`13`)
- Produces: CSS 변수 `--tone-13`(라이트/다크), `degreeFill`이 모든 변화표(b/#) 제거 후 슬롯 색 반환 — Task 6(Legend)이 `var(--tone-13)` 사용.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/Fretboard.test.tsx`의 `describe("Fretboard colorMode=degree", …)` 내부에 추가 (`fillOf` 헬퍼 재사용):

```tsx
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
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/components/Fretboard.test.tsx`
Expected: FAIL — `#9`는 `b`만 제거하는 현재 로직에서 `"#9"` 키 미스로 `var(--note-scale)`, 13은 TONE_FILL 미등록.

- [ ] **Step 3: 구현**

`src/components/Fretboard.tsx` — TONE_FILL에 13 추가, degreeFill 정규식 일반화, 42행 주석 갱신:

```ts
// 주의: degreeFill이 변화표(b·#)를 일괄 제거하므로 b5·#5·bb7·b9·#9·#11·b13도 해당 슬롯 색이 된다.
const TONE_FILL: Record<string, string> = {
  "1": "var(--note-root)",
  "3": "var(--tone-3)",
  "5": "var(--tone-5)",
  "7": "var(--tone-7)",
  "9": "var(--tone-9)",
  "11": "var(--tone-11)",
  "13": "var(--tone-13)",
};

function degreeFill(degree: string): string {
  return TONE_FILL[degree.replace(/[b#]/g, "")] ?? "var(--note-scale)";
}
```

`app/globals.css` 라이트 블록의 `--tone-11: #3e8f96;` 다음 줄에:

```css
  --tone-13: #b05a9e; /* 로즈 마젠타 — 흰 라벨 대비 4.37:1, 루트 코럴 로즈·7 퍼플과 구분 */
```

다크 블록의 `--tone-11: #4a9ea6;` 다음 줄에:

```css
  --tone-13: #c06aae; /* 흰 라벨 대비 3.55:1 — 다크 팔레트 하한선(3.2) 준수 */
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/components/Fretboard.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/Fretboard.tsx src/components/Fretboard.test.tsx app/globals.css
git commit -m "feat: add tone-13 color token and generalize accidental stripping in degree fills

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Controls — 퀄리티별 확장 필 + 변형 자동 드롭

**Files:**
- Modify: `src/components/Controls.tsx`
- Test: `src/components/Controls.test.tsx`

**Interfaces:**
- Consumes: Task 2의 `allowedExts`; 기존 `normalizeExts`, `QUALITY_NAMES`
- Produces: 퀄리티 셀렉트 변경 시 `onChange({ quality, exts })` **두 필드 동시 패치** (기존은 quality만) — 기존 테스트 1건 갱신 필요.

- [ ] **Step 1: 기존 테스트 1건 갱신 + 신규 테스트 작성**

`src/components/Controls.test.tsx`의 기존 케이스(76-81행) 기대값 갱신 — 퀄리티 변경이 exts를 함께 패치:

```tsx
  it("changing quality emits the new quality with filtered extensions", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(<Controls {...chordProps} onChange={onChange} />);
    fireEvent.change(getByLabelText("Chord"), { target: { value: "minor" } });
    expect(onChange).toHaveBeenCalledWith({ quality: "minor", exts: [] });
  });
```

`describe("Controls (chord mode)", …)` 말미에 추가:

```tsx
  it("dominant shows altered-tension pills, other qualities only naturals", () => {
    const { getByRole, queryByRole, rerender } = render(<Controls {...chordProps} />);
    for (const name of ["7th", "b9", "9th", "#9", "11th", "#11", "13th", "b13"]) {
      expect(getByRole("button", { name })).not.toBeNull();
    }
    rerender(<Controls {...chordProps} quality="minor" />);
    expect(queryByRole("button", { name: "b9" })).toBeNull();
    expect(queryByRole("button", { name: "#11" })).toBeNull();
    expect(getByRole("button", { name: "13th" })).not.toBeNull();
  });

  it("switching quality away from dominant drops altered extensions but keeps naturals", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <Controls {...chordProps} exts={["7", "b9", "13"]} onChange={onChange} />
    );
    fireEvent.change(getByLabelText("Chord"), { target: { value: "minor" } });
    expect(onChange).toHaveBeenCalledWith({ quality: "minor", exts: ["7", "13"] });
  });

  it("altered pill toggles emit like natural ones", () => {
    const onChange = vi.fn();
    const { getByRole } = render(<Controls {...chordProps} exts={["7"]} onChange={onChange} />);
    fireEvent.click(getByRole("button", { name: "b9" }));
    expect(onChange).toHaveBeenCalledWith({ exts: ["7", "b9"] });
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/components/Controls.test.tsx`
Expected: FAIL — 필 라벨이 `b9th`로 렌더돼 `b9` 미검출, 퀄리티 변경 패치에 exts 없음, minor에서 변형 필이 그대로 노출.

- [ ] **Step 3: 구현**

`src/components/Controls.tsx` — import 교체(`EXTENSIONS` → `allowedExts`):

```tsx
import {
  allowedExts, normalizeExts, QUALITIES, type ChordQuality, type Extension,
} from "@/theory/chords";
```

컴포넌트 본문(기존 `toggleExt` 위쪽)에:

```tsx
  const pills = allowedExts(quality);
  const extLabel = (e: Extension) => (/^\d+$/.test(e) ? `${e}th` : e); // 자연: 7th 식, 변형: b9 식 (양 언어 동일)
```

퀄리티 셀렉트의 onChange 교체 — 새 퀄리티에서 무효인 확장 드롭(스케일 변경 시 boxIndex 리셋과 같은 패턴):

```tsx
            <select id="view-quality" value={quality}
                    onChange={(e) => {
                      const q = e.target.value as ChordQuality;
                      const keep = allowedExts(q);
                      onChange({ quality: q, exts: exts.filter((x) => keep.includes(x)) });
                    }}>
```

확장 필 seg의 매핑 소스·라벨 교체:

```tsx
          <div className="seg" role="group" aria-label={m.extensions}>
            {pills.map((e) => (
              <button key={e} type="button" data-active={exts.includes(e)} aria-pressed={exts.includes(e)}
                      onClick={() => toggleExt(e)}>
                {extLabel(e)}
              </button>
            ))}
          </div>
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/components/Controls.test.tsx src/components/langSwitch.test.tsx`
Expected: PASS (langSwitch 회귀 포함)

- [ ] **Step 5: 타입 확인 + 커밋**

Run: `npx tsc --noEmit` — Expected: 에러 없음

```bash
git add src/components/Controls.tsx src/components/Controls.test.tsx
git commit -m "feat: render quality-aware extension pills and drop altered tensions on quality switch

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Legend — 슬롯 그루핑 + 13th 항목

**Files:**
- Modify: `src/components/Legend.tsx:28-30`
- Modify: `src/lib/i18n.ts` (`Messages` 인터페이스 + en/ko `legendThirteenth`)
- Test: `src/components/Legend.test.tsx`

**Interfaces:**
- Consumes: Task 2의 `Extension` 8종, Task 4의 `--tone-13`
- Produces: `Messages.legendThirteenth: string` (en `"13th"` / ko `"13도"`)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/Legend.test.tsx`의 `describe("Legend", …)` 말미에 추가:

```tsx
  it("groups variant tensions under their slot swatch", () => {
    const { getByText, queryByText } = render(<Legend mode="chord" exts={["b9", "#11"]} />);
    expect(getByText("9th")).not.toBeNull();
    expect(getByText("11th")).not.toBeNull();
    expect(queryByText("7th")).toBeNull();
  });

  it("shows the 13th swatch when 13 or b13 is active", () => {
    const { getByText, rerender } = render(<Legend mode="chord" exts={["13"]} />);
    expect(getByText("13th")).not.toBeNull();
    rerender(<Legend mode="chord" exts={["b13"]} />);
    expect(getByText("13th")).not.toBeNull();
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/components/Legend.test.tsx`
Expected: FAIL — 변형만 켠 경우 슬롯 항목 미표시, 13th 항목 부재

- [ ] **Step 3: 구현**

`src/lib/i18n.ts` — `Messages` 인터페이스의 `legendNinth: string; legendEleventh: string;` 줄을 다음으로 교체:

```ts
  legendNinth: string; legendEleventh: string; legendThirteenth: string;
```

en 블록의 `legendNinth: "9th", legendEleventh: "11th",` 를:

```ts
    legendNinth: "9th", legendEleventh: "11th", legendThirteenth: "13th",
```

ko 블록의 `legendNinth: "9도", legendEleventh: "11도",` 를:

```ts
    legendNinth: "9도", legendEleventh: "11도", legendThirteenth: "13도",
```

`src/components/Legend.tsx`의 `itemsFor` 확장 분기(28-30행)를 슬롯 그루핑으로 교체:

```ts
  // 변형(b9 등)만 켜도 해당 슬롯 항목을 표시 — 정확한 변화표는 지판 도수 라벨이 담당 (스펙 §4)
  const has = (...slot: Extension[]) => slot.some((s) => exts.includes(s));
  if (has("7")) items.push({ label: m.legendSeventh, color: "var(--tone-7)" });
  if (has("b9", "9", "#9")) items.push({ label: m.legendNinth, color: "var(--tone-9)" });
  if (has("11", "#11")) items.push({ label: m.legendEleventh, color: "var(--tone-11)" });
  if (has("13", "b13")) items.push({ label: m.legendThirteenth, color: "var(--tone-13)" });
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/components/Legend.test.tsx src/components/langSwitch.test.tsx`
Expected: PASS

- [ ] **Step 5: 타입 확인 + 커밋**

Run: `npx tsc --noEmit` — Expected: 에러 없음

```bash
git add src/components/Legend.tsx src/components/Legend.test.tsx src/lib/i18n.ts
git commit -m "feat: group tension variants per slot in the legend and add the 13th entry

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: README 갱신 + 전체 검증

**Files:**
- Modify: `README.md` (Chord Tones 섹션)

**Interfaces:**
- Consumes: 전체 기능 완성 상태
- Produces: 없음 (문서 + 최종 게이트)

- [ ] **Step 1: README의 "Chord Tones with Extensions" 섹션 본문 교체**

기존 문단:

> Pick a root and a chord quality — **Major, Minor, or Dominant** — and the triad (1 · 3 · 5) lights up in degree colors. Toggle the **7th, 9th, and 11th** independently to stack extensions onto the neck; the title, legend, and URL stay in sync (`A7(9)`, `Amaj7(9,11)`, `Am(add9)` …). The 7th automatically follows the quality (maj7 vs ♭7).

를 다음으로 교체:

> Pick a root and a chord quality — **Major, Minor, Dominant, Diminished, Half-diminished, or Augmented** — and the triad (1 · 3 · 5, with ♭5/♯5 where the quality calls for it) lights up in degree colors. Toggle the **7th, 9th, 11th, and 13th** independently to stack extensions onto the neck, and on Dominant chords unlock the **altered tensions ♭9 · ♯9 · ♯11 · ♭13** for jazz voicings; the title, legend, and URL stay in sync (`A7(b9,#9)`, `Bdim7`, `Am7b5` …). The 7th automatically follows the quality (maj7 vs ♭7 vs 𝄫7).

- [ ] **Step 2: 전체 테스트**

Run: `npm test`
Expected: 전체 PASS (기존 150+ 포함)

- [ ] **Step 3: 타입·빌드 게이트**

Run: `npx tsc --noEmit && npm run build`
Expected: 에러 없음, 빌드 성공

- [ ] **Step 4: 수동 스모크 (브라우저)**

Run: `npm run dev` 후 확인 —
1. `http://localhost:3000/?mode=chord&quality=diminished&ext=7` → 타이틀 `Adim7 — Diminished Chord Tones`, 지판에 1·b3·b5·bb7.
2. 코드톤 모드에서 Dominant 선택 → 필 8개, `7th`+`b9`+`#9` 켜기 → 타이틀 `A7(b9,#9)`, URL `ext=7%2Cb9%2C%239`.
3. 그 상태에서 퀄리티를 Minor로 변경 → b9/#9 자동 꺼짐, 7th 유지.
4. 13th 켜고 라이트/다크 전환 → 13 노트가 로즈 마젠타로 표시.

- [ ] **Step 5: 커밋**

```bash
git add README.md
git commit -m "docs: describe new chord qualities, 13th, and altered tensions in README

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 계획 외 명시 사항

- `app/page.tsx`는 무변경 — `chordToneMap`/`chordSymbol`/`Legend` 시그니처가 그대로라 자동 반영된다.
- README 스크린샷 재촬영은 이 계획의 범위 밖(별도 후속 작업).
- 스펙 비목표(§7): sus·6th·프리셋 버튼·얼터드 스케일·퀴즈 확장 없음.
