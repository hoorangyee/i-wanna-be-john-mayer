# M1: 지판 렌더러 + 스케일 뷰어 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 키/스케일을 선택하면 22프렛 지판 전체에 스케일 노트가 표시되는 반응형 웹앱 (docs/PLAN.md M1).

**Architecture:** 순수 TS 함수로 된 음악 이론 엔진(`src/theory/`)이 pitch class 집합과 표기를 계산하고, SVG 기반 `Fretboard` 컴포넌트가 그 결과를 단순 매핑으로 렌더링한다. 상태(키·스케일·라벨모드·박스)는 페이지 레벨 useState 하나로 관리.

**Tech Stack:** Next.js 15 (App Router) + React 19 + TypeScript(strict) + Vitest 3 + @testing-library/react + jsdom. 스타일은 `globals.css` 순수 CSS. 그 외 런타임 의존성 금지.

## Global Constraints

- 백엔드 없음 — 모든 컴포넌트는 클라이언트 사이드에서 동작
- 튜닝 고정: 표준 EADGBE, 프렛 수 22 고정
- 표기법: 키의 플랫/샤프 선호에 따름 (Db,Eb,F,Ab,Bb 키 = 플랫, 나머지 = 샤프)
- 접근성: 루트 노트는 색+형태(테두리) 이중 부호화
- UI 문구는 한국어, 음이름은 영문(C, Db …)
- 포지션(박스) 필터는 M1에서 5음 스케일(펜타토닉 계열)만 지원. 7음 스케일 CAGED는 후속 마일스톤 — UI에서 필터 숨김
- 커밋 메시지는 conventional commits (`feat:`, `test:`, `chore:`)

## File Structure

```
package.json / tsconfig.json / next.config.ts / vitest.config.ts
app/layout.tsx, app/page.tsx, app/globals.css
src/theory/notes.ts       — Key, PitchClass, keyToPc, spell
src/theory/fretboard.ts   — TUNING, FRET_COUNT, pitchAt
src/theory/scales.ts      — SCALES 공식, scaleNoteMap, degreeLabel
src/theory/boxes.ts       — 펜타토닉 5박스 프렛 윈도우 계산
src/components/Fretboard.tsx — SVG 지판 렌더러
src/components/Controls.tsx  — 키/스케일/라벨/박스 셀렉터
src/theory/*.test.ts, src/components/Fretboard.test.tsx
```

---

### Task 1: 프로젝트 스캐폴드 (Next.js + Vitest + git)

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `src/smoke.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `npm run dev`(Next 개발 서버), `npm test`(vitest run)가 동작하는 프로젝트 뼈대

- [ ] **Step 1: git 저장소 초기화**

```bash
cd /Users/parkminhoo/dev/i-wanna-be-john-mayer && git init -b main
```

- [ ] **Step 2: 설정 파일 작성**

`package.json`:
```json
{
  "name": "i-wanna-be-john-mayer",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.3.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "jsdom": "^26.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
});
```

`.gitignore`:
```
node_modules/
.next/
out/
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 3: 앱 뼈대 작성**

`app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fretboard — i wanna be john mayer",
  description: "기타 지판 스케일/코드톤 시각화 학습 도구",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

`app/page.tsx` (Task 7에서 교체될 임시 버전):
```tsx
export default function Home() {
  return <main>fretboard coming soon</main>;
}
```

`app/globals.css` (Task 7에서 확장될 최소 버전):
```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; }
```

- [ ] **Step 4: 스모크 테스트 작성**

`src/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: 설치 및 검증**

Run: `npm install`
Run: `npm test` → Expected: `1 passed`
Run: `npm run build` → Expected: `✓ Compiled successfully` (경고 없이 빌드 성공)

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold next.js 15 + vitest project"
```

---

### Task 2: 이론 엔진 — 음이름과 표기 (`notes.ts`)

**Files:**
- Create: `src/theory/notes.ts`
- Test: `src/theory/notes.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type PitchClass = number` (0=C … 11=B)
  - `const KEYS: readonly Key[]` — `"C"|"Db"|"D"|"Eb"|"E"|"F"|"F#"|"G"|"Ab"|"A"|"Bb"|"B"`
  - `keyToPc(key: Key): PitchClass`
  - `spell(pc: PitchClass, key: Key): string` — 키 선호(플랫/샤프)에 맞는 음이름

- [ ] **Step 1: 실패하는 테스트 작성**

`src/theory/notes.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { KEYS, keyToPc, spell } from "./notes";

describe("keyToPc", () => {
  it("maps canonical keys to pitch classes", () => {
    expect(keyToPc("C")).toBe(0);
    expect(keyToPc("Db")).toBe(1);
    expect(keyToPc("F#")).toBe(6);
    expect(keyToPc("Bb")).toBe(10);
    expect(keyToPc("B")).toBe(11);
  });

  it("KEYS has all 12 pitch classes exactly once", () => {
    const pcs = KEYS.map(keyToPc).sort((a, b) => a - b);
    expect(pcs).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});

describe("spell", () => {
  it("uses flats in flat keys", () => {
    expect(spell(10, "F")).toBe("Bb");   // F키의 4음
    expect(spell(3, "Eb")).toBe("Eb");
    expect(spell(1, "Ab")).toBe("Db");
  });

  it("uses sharps in sharp keys", () => {
    expect(spell(6, "G")).toBe("F#");
    expect(spell(1, "A")).toBe("C#");
    expect(spell(10, "E")).toBe("A#");
  });

  it("naturals are identical in both preferences", () => {
    expect(spell(0, "F")).toBe("C");
    expect(spell(0, "G")).toBe("C");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/theory/notes.test.ts`
Expected: FAIL — `Cannot find module './notes'`

- [ ] **Step 3: 최소 구현**

`src/theory/notes.ts`:
```ts
export type PitchClass = number; // 0=C .. 11=B

export const KEYS = [
  "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
] as const;
export type Key = (typeof KEYS)[number];

const NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const FLAT_KEYS: ReadonlySet<Key> = new Set(["Db", "Eb", "F", "Ab", "Bb"]);

export function keyToPc(key: Key): PitchClass {
  return KEYS.indexOf(key);
}

export function spell(pc: PitchClass, key: Key): string {
  const names = FLAT_KEYS.has(key) ? NAMES_FLAT : NAMES_SHARP;
  return names[((pc % 12) + 12) % 12];
}
```

주의: `KEYS` 배열은 인덱스가 곧 pitch class가 되도록 반음 순서로 배열되어 있다 (C=0, Db=1 … B=11). `keyToPc`가 `indexOf`로 동작하는 이유.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/theory/notes.test.ts`
Expected: PASS (테스트 6개)

- [ ] **Step 5: Commit**

```bash
git add src/theory/notes.ts src/theory/notes.test.ts
git commit -m "feat: pitch class model with per-key spelling"
```

---

### Task 3: 이론 엔진 — 지판 매핑 (`fretboard.ts`)

**Files:**
- Create: `src/theory/fretboard.ts`
- Test: `src/theory/fretboard.test.ts`

**Interfaces:**
- Consumes: `PitchClass` (Task 2)
- Produces:
  - `type StringNo = 1|2|3|4|5|6` (1=하이 E, 6=로우 E)
  - `interface FretPos { str: StringNo; fret: number }`
  - `const FRET_COUNT = 22`
  - `const STRINGS: readonly StringNo[]` — `[1,2,3,4,5,6]`
  - `const TUNING: Record<StringNo, PitchClass>` — 개방현 pitch class
  - `pitchAt(pos: FretPos): PitchClass`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/theory/fretboard.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { FRET_COUNT, STRINGS, TUNING, pitchAt } from "./fretboard";

describe("fretboard", () => {
  it("standard tuning open strings", () => {
    expect(TUNING[6]).toBe(4);  // E
    expect(TUNING[5]).toBe(9);  // A
    expect(TUNING[4]).toBe(2);  // D
    expect(TUNING[3]).toBe(7);  // G
    expect(TUNING[2]).toBe(11); // B
    expect(TUNING[1]).toBe(4);  // E
  });

  it("pitchAt: open string equals tuning", () => {
    expect(pitchAt({ str: 6, fret: 0 })).toBe(4);
  });

  it("pitchAt: well-known landmarks", () => {
    expect(pitchAt({ str: 5, fret: 3 })).toBe(0);  // A현 3프렛 = C
    expect(pitchAt({ str: 6, fret: 5 })).toBe(9);  // E현 5프렛 = A
    expect(pitchAt({ str: 6, fret: 12 })).toBe(4); // 12프렛 = 옥타브
    expect(pitchAt({ str: 2, fret: 1 })).toBe(0);  // B현 1프렛 = C
  });

  it("constants", () => {
    expect(FRET_COUNT).toBe(22);
    expect(STRINGS).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/theory/fretboard.test.ts`
Expected: FAIL — `Cannot find module './fretboard'`

- [ ] **Step 3: 최소 구현**

`src/theory/fretboard.ts`:
```ts
import type { PitchClass } from "./notes";

export type StringNo = 1 | 2 | 3 | 4 | 5 | 6; // 1 = high E
export interface FretPos {
  str: StringNo;
  fret: number; // 0 = open
}

export const FRET_COUNT = 22;
export const STRINGS: readonly StringNo[] = [1, 2, 3, 4, 5, 6];

export const TUNING: Record<StringNo, PitchClass> = {
  1: 4,  // E
  2: 11, // B
  3: 7,  // G
  4: 2,  // D
  5: 9,  // A
  6: 4,  // E
};

export function pitchAt(pos: FretPos): PitchClass {
  return (TUNING[pos.str] + pos.fret) % 12;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/theory/fretboard.test.ts`
Expected: PASS (테스트 4개)

- [ ] **Step 5: Commit**

```bash
git add src/theory/fretboard.ts src/theory/fretboard.test.ts
git commit -m "feat: fretboard position-to-pitch mapping"
```

---

### Task 4: 이론 엔진 — 스케일 (`scales.ts`)

**Files:**
- Create: `src/theory/scales.ts`
- Test: `src/theory/scales.test.ts`

**Interfaces:**
- Consumes: `Key`, `PitchClass`, `keyToPc`, `spell` (Task 2)
- Produces:
  - `const SCALES: Record<ScaleId, ScaleDef>` — `ScaleDef = { name: string; intervals: readonly number[] }`
  - `type ScaleId = "major" | "naturalMinor" | "minorPentatonic" | "majorPentatonic" | "blues"`
  - `const SCALE_IDS: readonly ScaleId[]`
  - `degreeLabel(interval: number): string` — 0→"1", 3→"b3", 6→"b5" …
  - `interface NoteInfo { name: string; degree: string; isRoot: boolean }`
  - `scaleNoteMap(key: Key, scaleId: ScaleId): Map<PitchClass, NoteInfo>` — 뷰가 소비하는 유일한 진입점

- [ ] **Step 1: 실패하는 테스트 작성**

`src/theory/scales.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { SCALES, SCALE_IDS, degreeLabel, scaleNoteMap } from "./scales";

describe("SCALES", () => {
  it("has the 5 v1 scales with correct formulas", () => {
    expect(SCALES.major.intervals).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(SCALES.naturalMinor.intervals).toEqual([0, 2, 3, 5, 7, 8, 10]);
    expect(SCALES.minorPentatonic.intervals).toEqual([0, 3, 5, 7, 10]);
    expect(SCALES.majorPentatonic.intervals).toEqual([0, 2, 4, 7, 9]);
    expect(SCALES.blues.intervals).toEqual([0, 3, 5, 6, 7, 10]);
    expect(SCALE_IDS).toHaveLength(5);
  });
});

describe("degreeLabel", () => {
  it("maps intervals to degree names", () => {
    expect(degreeLabel(0)).toBe("1");
    expect(degreeLabel(3)).toBe("b3");
    expect(degreeLabel(4)).toBe("3");
    expect(degreeLabel(6)).toBe("b5");
    expect(degreeLabel(7)).toBe("5");
    expect(degreeLabel(10)).toBe("b7");
    expect(degreeLabel(11)).toBe("7");
  });
});

describe("scaleNoteMap", () => {
  it("A minor pentatonic = A C D E G", () => {
    const map = scaleNoteMap("A", "minorPentatonic");
    expect([...map.keys()].sort((a, b) => a - b)).toEqual([0, 2, 4, 7, 9]);
    expect(map.get(9)).toEqual({ name: "A", degree: "1", isRoot: true });
    expect(map.get(0)).toEqual({ name: "C", degree: "b3", isRoot: false });
    expect(map.get(7)).toEqual({ name: "G", degree: "b7", isRoot: false });
  });

  it("F major spells Bb as flat", () => {
    const map = scaleNoteMap("F", "major");
    expect(map.get(10)!.name).toBe("Bb");
    expect(map.get(10)!.degree).toBe("4");
  });

  it("E blues includes the b5", () => {
    const map = scaleNoteMap("E", "blues");
    expect(map.get(10)).toEqual({ name: "A#", degree: "b5", isRoot: false });
    expect(map.size).toBe(6);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/theory/scales.test.ts`
Expected: FAIL — `Cannot find module './scales'`

- [ ] **Step 3: 최소 구현**

`src/theory/scales.ts`:
```ts
import { type Key, type PitchClass, keyToPc, spell } from "./notes";

export interface ScaleDef {
  name: string;
  intervals: readonly number[]; // 루트로부터의 반음 간격, 0 포함 오름차순
}

export const SCALES = {
  major: { name: "메이저", intervals: [0, 2, 4, 5, 7, 9, 11] },
  naturalMinor: { name: "내추럴 마이너", intervals: [0, 2, 3, 5, 7, 8, 10] },
  minorPentatonic: { name: "마이너 펜타토닉", intervals: [0, 3, 5, 7, 10] },
  majorPentatonic: { name: "메이저 펜타토닉", intervals: [0, 2, 4, 7, 9] },
  blues: { name: "블루스", intervals: [0, 3, 5, 6, 7, 10] },
} as const satisfies Record<string, ScaleDef>;

export type ScaleId = keyof typeof SCALES;
export const SCALE_IDS = Object.keys(SCALES) as readonly ScaleId[];

const DEGREE_NAMES = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"];

export function degreeLabel(interval: number): string {
  return DEGREE_NAMES[((interval % 12) + 12) % 12];
}

export interface NoteInfo {
  name: string;   // 키 표기법에 맞는 음이름 (예: "Bb")
  degree: string; // 루트 기준 도수 (예: "b3")
  isRoot: boolean;
}

export function scaleNoteMap(key: Key, scaleId: ScaleId): Map<PitchClass, NoteInfo> {
  const root = keyToPc(key);
  const map = new Map<PitchClass, NoteInfo>();
  for (const interval of SCALES[scaleId].intervals) {
    const pc = (root + interval) % 12;
    map.set(pc, {
      name: spell(pc, key),
      degree: degreeLabel(interval),
      isRoot: interval === 0,
    });
  }
  return map;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/theory/scales.test.ts`
Expected: PASS (테스트 5개)

- [ ] **Step 5: Commit**

```bash
git add src/theory/scales.ts src/theory/scales.test.ts
git commit -m "feat: scale formulas and per-key note map"
```

---

### Task 5: 이론 엔진 — 펜타토닉 박스 (`boxes.ts`)

**Files:**
- Create: `src/theory/boxes.ts`
- Test: `src/theory/boxes.test.ts`

**Interfaces:**
- Consumes: `Key`, `keyToPc` (Task 2), `TUNING` (Task 3), `SCALES`, `ScaleId` (Task 4)
- Produces:
  - `interface FretWindow { start: number; end: number }` (inclusive 프렛 범위)
  - `boxesFor(key: Key, scaleId: ScaleId): FretWindow[] | null` — 5음 스케일과 blues는 5개 박스, 7음 스케일은 `null`

**도메인 배경 (구현자가 알아야 할 것):** 펜타토닉 5박스는 6번 줄(로우 E) 위 스케일 톤이 나오는 프렛을 앵커로 삼는다. 예: A 마이너 펜타토닉의 6번 줄 스케일 톤 프렛(1~12 구간) = 3(G), 5(A), 8(C), 10(D), 12(E). **루트 앵커부터 시작해 순환 정렬**하면 5, 8, 10, 12, 15(=3+12) — 각 앵커에서 4프렛 폭 윈도우가 박스 1~5가 된다 (박스1 = 5~8프렛, 통용되는 Am 펜타토닉 박스1과 일치). 블루스 스케일은 b5를 뺀 마이너 펜타토닉 앵커를 그대로 쓴다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/theory/boxes.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { boxesFor } from "./boxes";

describe("boxesFor", () => {
  it("A minor pentatonic: canonical 5 boxes starting at root anchor", () => {
    expect(boxesFor("A", "minorPentatonic")).toEqual([
      { start: 5, end: 9 },
      { start: 8, end: 12 },
      { start: 10, end: 14 },
      { start: 12, end: 16 },
      { start: 15, end: 19 },
    ]);
  });

  it("E minor pentatonic: box 1 uses open position", () => {
    const boxes = boxesFor("E", "minorPentatonic")!;
    expect(boxes[0]).toEqual({ start: 0, end: 4 });
    expect(boxes).toHaveLength(5);
  });

  it("blues reuses the minor pentatonic anchors (b5 ignored)", () => {
    expect(boxesFor("A", "blues")).toEqual(boxesFor("A", "minorPentatonic"));
  });

  it("7-note scales are not supported in M1", () => {
    expect(boxesFor("C", "major")).toBeNull();
    expect(boxesFor("A", "naturalMinor")).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/theory/boxes.test.ts`
Expected: FAIL — `Cannot find module './boxes'`

- [ ] **Step 3: 최소 구현**

`src/theory/boxes.ts`:
```ts
import { type Key, keyToPc } from "./notes";
import { TUNING } from "./fretboard";
import { SCALES, type ScaleId } from "./scales";

export interface FretWindow {
  start: number;
  end: number; // inclusive
}

const BOX_SPAN = 4; // 각 박스는 앵커 프렛부터 4프렛 폭

/** blues는 마이너 펜타토닉 앵커를 공유. 7음 스케일은 M1 미지원. */
const ANCHOR_SCALE: Partial<Record<ScaleId, ScaleId>> = {
  minorPentatonic: "minorPentatonic",
  majorPentatonic: "majorPentatonic",
  blues: "minorPentatonic",
};

export function boxesFor(key: Key, scaleId: ScaleId): FretWindow[] | null {
  const anchorScaleId = ANCHOR_SCALE[scaleId];
  if (!anchorScaleId) return null;

  const root = keyToPc(key);
  const pcs = SCALES[anchorScaleId].intervals.map((i) => (root + i) % 12);

  // 6번 줄에서 각 스케일 톤이 나오는 프렛 (0..11)
  const anchorFrets = pcs
    .map((pc) => (((pc - TUNING[6]) % 12) + 12) % 12)
    .sort((a, b) => a - b);

  // 루트 앵커부터 시작하도록 순환 정렬 (루트보다 낮은 앵커는 +12)
  const rootFret = (((root - TUNING[6]) % 12) + 12) % 12;
  const rotated = anchorFrets.map((f) => (f < rootFret ? f + 12 : f));
  rotated.sort((a, b) => a - b);

  return rotated.map((start) => ({ start, end: start + BOX_SPAN }));
}
```

주의: E 키(루트 프렛 0)는 박스 1이 개방 포지션(0~4)이 되고 나머지 앵커는 그대로 0~11 구간에 있으므로 `f < 0`인 경우가 없어 회전이 일어나지 않는다 — 테스트 2가 이 경계를 잡는다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/theory/boxes.test.ts`
Expected: PASS (테스트 4개)

- [ ] **Step 5: Commit**

```bash
git add src/theory/boxes.ts src/theory/boxes.test.ts
git commit -m "feat: pentatonic 5-box fret windows"
```

---

### Task 6: SVG 지판 렌더러 (`Fretboard.tsx`)

**Files:**
- Create: `src/components/Fretboard.tsx`
- Test: `src/components/Fretboard.test.tsx`

**Interfaces:**
- Consumes: `STRINGS`, `FRET_COUNT`, `pitchAt` (Task 3), `NoteInfo` (Task 4), `FretWindow` (Task 5), `PitchClass` (Task 2)
- Produces:
  - `type LabelMode = "name" | "degree" | "none"`
  - `Fretboard({ notes, labelMode, window }: FretboardProps)` — `notes: Map<PitchClass, NoteInfo>`, `window?: FretWindow | null` (지정 시 바깥 노트는 흐리게)

**렌더링 규칙:**
- viewBox `0 0 1180 240`, 반응형은 CSS(`width: 100%; height: auto`)가 담당
- 프렛 간격 균등(다이어그램 방식). 너트 영역: x=30(개방현 라벨) ~ x=56(너트 선)
- 1번 줄(하이 E)이 위. 줄 y 좌표 = `28 + (str - 1) * 34`
- 인레이 마커: 3·5·7·9·15·17·19·21 프렛 중앙 단일 점, 12프렛은 두 점
- 노트 점: 반지름 12, 프렛 중앙에 배치, 개방현은 너트 왼쪽에 배치
- 루트: 색상(`--root` 계열) + 두꺼운 테두리 이중 부호화, 나머지 스케일 톤은 단일 색
- `window` 바깥 노트는 `opacity: 0.18`
- 테스트를 위해 각 노트 `<g>`에 `data-testid="note-{str}-{fret}"`, 루트에는 `data-root="true"`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/Fretboard.test.tsx`:
```tsx
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
  });
});
```

테스트 1의 기대값 60 도출: 한 현의 0~22프렛(23개 위치)에서 각 pitch class는 2회 등장하되, 단 하나 (개방현pc+11)%12 만 1회 등장한다 (오프셋 0~10은 +12 위치가 존재하지만 +11은 프렛 23이 없으므로). A 마이너 펜타토닉 pc 집합 {9,0,2,4,7}에 대해 여섯 현 모두 (개방pc+11)%12가 집합 밖이므로, 6현 × 5pc × 2회 = **60**.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/components/Fretboard.test.tsx`
Expected: FAIL — `Cannot find module './Fretboard'`

- [ ] **Step 3: 구현**

`src/components/Fretboard.tsx`:
```tsx
import type { PitchClass } from "@/theory/notes";
import { FRET_COUNT, STRINGS, pitchAt, type StringNo } from "@/theory/fretboard";
import type { NoteInfo } from "@/theory/scales";
import type { FretWindow } from "@/theory/boxes";

export type LabelMode = "name" | "degree" | "none";

export interface FretboardProps {
  notes: Map<PitchClass, NoteInfo>;
  labelMode: LabelMode;
  window?: FretWindow | null;
}

const W = 1180;
const H = 240;
const NUT_X = 56;
const OPEN_X = 30;
const RIGHT_PAD = 10;
const TOP_Y = 28;
const STRING_GAP = 34;
const FRET_W = (W - NUT_X - RIGHT_PAD) / FRET_COUNT;
const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];

const stringY = (str: StringNo) => TOP_Y + (str - 1) * STRING_GAP;
const fretX = (fret: number) => NUT_X + fret * FRET_W;          // 프렛선 x
const noteX = (fret: number) =>
  fret === 0 ? OPEN_X : NUT_X + (fret - 0.5) * FRET_W;          // 노트 중심 x

export function Fretboard({ notes, labelMode, window = null }: FretboardProps) {
  const midY = (stringY(3) + stringY(4)) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fretboard" role="img"
         aria-label="기타 지판">
      {/* 너트 */}
      <rect x={NUT_X - 4} y={TOP_Y} width={4} height={STRING_GAP * 5} fill="var(--fb-nut)" />

      {/* 프렛선 */}
      {Array.from({ length: FRET_COUNT }, (_, i) => i + 1).map((f) => (
        <line key={f} x1={fretX(f)} y1={TOP_Y} x2={fretX(f)} y2={TOP_Y + STRING_GAP * 5}
              stroke="var(--fb-fret)" strokeWidth={1.5} />
      ))}

      {/* 인레이 */}
      {SINGLE_INLAYS.map((f) => (
        <circle key={f} cx={noteX(f)} cy={midY} r={5} fill="var(--fb-inlay)" />
      ))}
      <circle cx={noteX(12)} cy={stringY(2)} r={5} fill="var(--fb-inlay)" />
      <circle cx={noteX(12)} cy={stringY(5)} r={5} fill="var(--fb-inlay)" />

      {/* 줄 */}
      {STRINGS.map((s) => (
        <line key={s} x1={OPEN_X - 10} y1={stringY(s)} x2={W - RIGHT_PAD} y2={stringY(s)}
              stroke="var(--fb-string)" strokeWidth={0.8 + s * 0.25} />
      ))}

      {/* 프렛 번호 */}
      {[3, 5, 7, 9, 12, 15, 17, 19, 21].map((f) => (
        <text key={f} x={noteX(f)} y={H - 8} textAnchor="middle" className="fret-no">
          {f}
        </text>
      ))}

      {/* 노트 */}
      {STRINGS.flatMap((str) =>
        Array.from({ length: FRET_COUNT + 1 }, (_, fret) => {
          const info = notes.get(pitchAt({ str, fret }));
          if (!info) return null;
          const dimmed = window ? fret < window.start || fret > window.end : false;
          const label = labelMode === "name" ? info.name
                      : labelMode === "degree" ? info.degree : null;
          return (
            <g key={`${str}-${fret}`}
               data-testid={`note-${str}-${fret}`}
               data-root={info.isRoot ? "true" : "false"}
               data-dimmed={dimmed ? "true" : "false"}
               opacity={dimmed ? 0.18 : 1}>
              <circle cx={noteX(fret)} cy={stringY(str)} r={12}
                      fill={info.isRoot ? "var(--note-root)" : "var(--note-scale)"}
                      stroke={info.isRoot ? "var(--note-root-ring)" : "none"}
                      strokeWidth={info.isRoot ? 3 : 0} />
              {label && (
                <text x={noteX(fret)} y={stringY(str) + 4} textAnchor="middle"
                      className="note-label">
                  {label}
                </text>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/components/Fretboard.test.tsx`
Expected: PASS (테스트 4개)

- [ ] **Step 5: Commit**

```bash
git add src/components/Fretboard.tsx src/components/Fretboard.test.tsx
git commit -m "feat: responsive SVG fretboard renderer"
```

---

### Task 7: 컨트롤 + 페이지 통합

**Files:**
- Create: `src/components/Controls.tsx`
- Modify: `app/page.tsx` (Task 1의 임시 버전 전체 교체)
- Modify: `app/globals.css` (Task 1의 최소 버전 전체 교체)

**Interfaces:**
- Consumes: `KEYS`, `Key` (Task 2), `SCALES`, `SCALE_IDS`, `ScaleId`, `scaleNoteMap` (Task 4), `boxesFor` (Task 5), `Fretboard`, `LabelMode` (Task 6)
- Produces: 완성된 M1 페이지 (키·스케일·라벨·박스 선택 → 지판 표시)

- [ ] **Step 1: Controls 구현**

`src/components/Controls.tsx`:
```tsx
import { KEYS, type Key } from "@/theory/notes";
import { SCALES, SCALE_IDS, type ScaleId } from "@/theory/scales";
import type { LabelMode } from "./Fretboard";

export interface ControlsProps {
  keySel: Key;
  scaleId: ScaleId;
  labelMode: LabelMode;
  boxIndex: number | null;   // null = 전체
  boxCount: number | null;   // null = 이 스케일은 박스 미지원
  onChange: (patch: Partial<Pick<ControlsProps, "keySel" | "scaleId" | "labelMode" | "boxIndex">>) => void;
}

const LABEL_MODES: { id: LabelMode; label: string }[] = [
  { id: "name", label: "음이름" },
  { id: "degree", label: "도수" },
  { id: "none", label: "숨김" },
];

export function Controls({ keySel, scaleId, labelMode, boxIndex, boxCount, onChange }: ControlsProps) {
  return (
    <div className="controls">
      <label>
        키
        <select value={keySel} onChange={(e) => onChange({ keySel: e.target.value as Key })}>
          {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>

      <label>
        스케일
        <select value={scaleId}
                onChange={(e) => onChange({ scaleId: e.target.value as ScaleId, boxIndex: null })}>
          {SCALE_IDS.map((id) => <option key={id} value={id}>{SCALES[id].name}</option>)}
        </select>
      </label>

      <div className="seg" role="group" aria-label="라벨 표시">
        {LABEL_MODES.map(({ id, label }) => (
          <button key={id} data-active={labelMode === id}
                  onClick={() => onChange({ labelMode: id })}>
            {label}
          </button>
        ))}
      </div>

      {boxCount !== null && (
        <div className="seg" role="group" aria-label="포지션">
          <button data-active={boxIndex === null} onClick={() => onChange({ boxIndex: null })}>
            전체
          </button>
          {Array.from({ length: boxCount }, (_, i) => (
            <button key={i} data-active={boxIndex === i}
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

- [ ] **Step 2: 페이지 통합**

`app/page.tsx` (전체 교체):
```tsx
"use client";

import { useState } from "react";
import type { Key } from "@/theory/notes";
import { scaleNoteMap, SCALES, type ScaleId } from "@/theory/scales";
import { boxesFor } from "@/theory/boxes";
import { Fretboard, type LabelMode } from "@/components/Fretboard";
import { Controls } from "@/components/Controls";

interface ViewState {
  keySel: Key;
  scaleId: ScaleId;
  labelMode: LabelMode;
  boxIndex: number | null;
}

export default function Home() {
  const [view, setView] = useState<ViewState>({
    keySel: "A",
    scaleId: "minorPentatonic",
    labelMode: "name",
    boxIndex: null,
  });

  const notes = scaleNoteMap(view.keySel, view.scaleId);
  const boxes = boxesFor(view.keySel, view.scaleId);
  const window = view.boxIndex !== null && boxes ? boxes[view.boxIndex] : null;

  return (
    <main>
      <header className="topbar">
        <h1>Fretboard</h1>
        <Controls
          keySel={view.keySel}
          scaleId={view.scaleId}
          labelMode={view.labelMode}
          boxIndex={view.boxIndex}
          boxCount={boxes ? boxes.length : null}
          onChange={(patch) => setView((v) => ({ ...v, ...patch }))}
        />
      </header>
      <section className="board">
        <h2 className="view-title">
          {view.keySel} {SCALES[view.scaleId].name}
          {view.boxIndex !== null ? ` — 박스 ${view.boxIndex + 1}` : ""}
        </h2>
        <Fretboard notes={notes} labelMode={view.labelMode} window={window} />
      </section>
    </main>
  );
}
```

- [ ] **Step 3: 스타일 작성**

`app/globals.css` (전체 교체):
```css
* { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #faf8f4;
  --ink: #2b2a27;
  --panel: #ffffff;
  --line: #e4e0d8;
  --fb-nut: #8a8478;
  --fb-fret: #c9c3b8;
  --fb-string: #a39d90;
  --fb-inlay: #e0dbd0;
  --note-scale: #4a7ba6;
  --note-root: #d96c3d;
  --note-root-ring: #a44b22;
  --accent: #d96c3d;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--ink);
}

main { max-width: 1280px; margin: 0 auto; padding: 20px 24px 48px; }

.topbar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 16px 28px;
  padding-bottom: 16px; border-bottom: 1px solid var(--line); margin-bottom: 24px;
}
.topbar h1 { font-size: 20px; letter-spacing: -0.01em; }

.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; }
.controls label { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.controls select {
  font-size: 15px; padding: 6px 10px; border: 1px solid var(--line);
  border-radius: 8px; background: var(--panel); color: inherit;
}

.seg { display: flex; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.seg button {
  font-size: 14px; padding: 6px 12px; border: none; background: var(--panel);
  color: inherit; cursor: pointer;
}
.seg button + button { border-left: 1px solid var(--line); }
.seg button[data-active="true"] { background: var(--accent); color: #fff; }

.board { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 20px; }
.view-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; }

.fretboard { width: 100%; height: auto; display: block; }
.fretboard .note-label { font-size: 11px; font-weight: 700; fill: #fff; }
.fretboard .fret-no { font-size: 12px; fill: #9a948a; }

@media (max-width: 720px) {
  main { padding: 12px; }
  .board { overflow-x: auto; }
  .fretboard { min-width: 900px; }
}
```

- [ ] **Step 4: 전체 테스트 + 빌드 검증**

Run: `npm test` → Expected: 모든 테스트 PASS (Task 1~6 누적)
Run: `npm run build` → Expected: 빌드 성공

- [ ] **Step 5: 수동 검증 (dev 서버)**

Run: `npm run dev` 후 브라우저에서 `http://localhost:3000` 확인:
- A 마이너 펜타토닉이 기본으로 표시되고 6번 줄 5프렛(A)이 루트 색+테두리
- 키를 F, 스케일을 메이저로 바꾸면 Bb 표기 확인
- 라벨을 도수로 바꾸면 1, b3, 4, 5, b7 표시
- 박스 1 선택 시 5~9프렛 밖 노트가 흐려짐
- 창 폭을 줄이면 지판이 가로 스크롤로 전환

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scale viewer page with key/scale/label/box controls"
```

---

## Self-Review 결과

- **Spec coverage:** PLAN.md M1 범위(이론 엔진+테스트, 지판 렌더러, 키/스케일 선택, 라벨 토글) 모두 태스크에 매핑됨. 포지션 필터는 5음 스케일 한정(Global Constraints에 명시), CAGED는 후속 마일스톤.
- **Placeholder scan:** 통과 — 모든 스텝에 실제 코드/명령 포함.
- **Type consistency:** `scaleNoteMap` → `Map<PitchClass, NoteInfo>` (Task 4 정의, Task 6·7 소비), `boxesFor` → `FretWindow[] | null` (Task 5 정의, Task 6·7 소비), `LabelMode` (Task 6 정의, Task 7 소비) 일치 확인.
