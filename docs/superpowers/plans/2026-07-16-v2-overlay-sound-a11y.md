# v2: 오버레이 모드 + 사운드 + a11y Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ① [오버레이] 모드 — 스케일을 흐리게 깔고 그 위에 (독립적인 루트의) 코드톤을 도수 색상으로 강조하는 "안전한 착지점" 뷰. ② 노트 클릭 시 실제 음 재생(Web Audio, 토글 가능). ③ a11y 번들 — 라운드 종료 포커스 복원, 스크린리더 안내, 이중 덮개 명암 정리 (docs/PLAN.md §10 v2 우선순위 + v2 백로그 '사운드 재생').

**Architecture:** 오버레이는 기존 seam 그대로 — `Fretboard`가 두 번째 맵(`overlay`)을 받아 배경(notes)을 dim, 오버레이 노트를 degreeFill로 그린다. 오디오는 순수 계산(midiAt/freqOf)과 부수효과(playPosition)를 `src/audio/tone.ts`로 분리하고 컨텍스트 주입으로 테스트한다. URL은 기존 viewUrl에 overlay 모드·croot 파라미터를 추가한다.

**Tech Stack:** 기존과 동일. 신규 런타임 의존성 금지 (Web Audio는 브라우저 내장).

## Global Constraints

- M1~M4 Global Constraints 전부 유지 (한국어 UI, aria-pressed, conventional commits, 기존 테스트 보존)
- **오버레이 코드 루트는 스케일 키와 독립** (블루스: A 마이너 펜타 + E7). 상태 필드 `overlayRoot: Key`, URL 파라미터 `croot`. 오버레이 모드에서 박스 필터 없음
- **오버레이 렌더 규칙**: 같은 pc가 양쪽에 있으면 코드톤이 이김. 배경 스케일 노트 = `var(--note-dim)` + opacity 0.45, 링 없음. 오버레이 노트 = degreeFill(도수 색) + opacity 1, 코드 루트만 링. 스케일 밖 코드톤도 표시. `data-layer="overlay"|"scale"` 속성은 overlay prop이 있을 때만
- **사운드**: 6번줄 개방 E2(MIDI 40) 기준 표준 튜닝 [40,45,50,55,59,64], 12프렛=+12. 기본 켬, localStorage `fretboard-sound-enabled`("off"일 때만 끔). AudioContext는 첫 클릭 시 lazy 생성(자동재생 정책 안전), 실패는 무해(try/catch). 뷰 모드 노트 클릭 + 퀴즈 모두찾기 클릭에서 재생. 노트 클릭 사운드는 마우스 전용(키보드 노트 포커스는 v3 기록)
- **a11y**: 퀴즈 라운드 종료(또는 모드 A 응답 후) 시 포커스를 "다음 문제" 버튼으로 이동. 모두찾기 진행 중 sr-only 사용법 안내. 퀴즈 피드백은 role="status". 범위 덮개는 셀당 정확히 1회만 덮음(이중 명암 제거)

## File Structure

```
src/components/Fretboard.tsx   — 수정: overlay/onNoteClick props (Task 1·4), 덮개 per-string (Task 5)
src/lib/viewUrl.ts             — 수정: mode "overlay", overlayRoot/croot (Task 2)
src/components/Controls.tsx    — 수정: [오버레이] 탭, 코드 루트 셀렉터 (Task 2)
app/page.tsx                   — 수정: overlay 분기·타이틀 (Task 2), onNoteClick (Task 4)
src/audio/tone.ts              — 신규: midiAt/freqOf/playPosition/사운드 설정 (Task 3)
src/components/SoundToggle.tsx — 신규 (Task 4)
src/components/Quiz.tsx        — 수정: 클릭 재생 (Task 4), 포커스 복원·sr-only·status (Task 5)
app/globals.css                — 수정: --note-dim (Task 1), .sr-only (Task 5)
```

---

### Task 1: Fretboard 오버레이 렌더링

**Files:**
- Modify: `src/components/Fretboard.tsx`, `app/globals.css`(:root 변수 1개)
- Test: `src/components/Fretboard.test.tsx`

**Interfaces:**
- Produces: `FretboardProps.overlay?: Map<PitchClass, NoteInfo>` — Task 2가 소비. 미지정 시 기존 렌더와 완전 동일

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/Fretboard.test.tsx`에 describe 추가 (`scaleNoteMap`은 이미 import됨, `chordNoteMap`도 이미 import됨):

```tsx
describe("Fretboard overlay", () => {
  const scale = scaleNoteMap("A", "minorPentatonic"); // A C D E G
  const chord = chordNoteMap("A", "7");               // A C# E G

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
    const e7 = chordNoteMap("E", "7"); // E G# B D — A는 스케일 전용이 됨
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/components/Fretboard.test.tsx`
Expected: FAIL — `overlay` prop 없음

- [ ] **Step 3: 구현**

`app/globals.css`의 `:root`에 추가:

```css
  --note-dim: #b9bdc9;
```

`src/components/Fretboard.tsx`:

1. props에 `overlay?: Map<PitchClass, NoteInfo>;` 추가, destructuring에 `overlay` 추가 (기본값 없음 = undefined)
2. 노트 레이어의 콜백 본문을 다음으로 교체 (기존 구조에서 pc/overlayInfo 분기와 fill/ring/opacity/data-layer만 확장):

```tsx
        Array.from({ length: FRET_COUNT + 1 }, (_, fret) => {
          const pc = pitchAt({ str, fret });
          const overlayInfo = overlay?.get(pc);
          const info = overlayInfo ?? notes.get(pc);
          if (!info) return null;
          const isOverlayNote = overlayInfo !== undefined;
          const dimmed = window ? fret < window.start || fret > window.end : false;
          const label = labelMode === "name" ? info.name
                      : labelMode === "degree" ? info.degree : null;
          const fill = isOverlayNote
            ? degreeFill(info.degree)
            : overlay
              ? "var(--note-dim)"
              : colorMode === "degree"
                ? degreeFill(info.degree)
                : info.isRoot ? "var(--note-root)" : "var(--note-scale)";
          const ring = info.isRoot && (!overlay || isOverlayNote);
          return (
            <g key={`${str}-${fret}`}
               data-testid={`note-${str}-${fret}`}
               data-root={info.isRoot ? "true" : "false"}
               data-dimmed={dimmed ? "true" : "false"}
               {...(overlay ? { "data-layer": isOverlayNote ? "overlay" : "scale" } : {})}
               opacity={dimmed ? 0.18 : overlay && !isOverlayNote ? 0.45 : 1}>
              <circle cx={noteX(fret)} cy={stringY(str)} r={12}
                      fill={fill}
                      stroke={ring ? "var(--note-root-ring)" : "none"}
                      strokeWidth={ring ? 3 : 0} />
              {label && (
                <text x={noteX(fret)} y={stringY(str) + 4} textAnchor="middle"
                      className="note-label">
                  {label}
                </text>
              )}
            </g>
          );
        })
```

(overlay 미지정 시: `overlayInfo` 항상 undefined → fill/ring/opacity 분기가 기존 식과 동일하게 환원 — 기존 테스트 전부 보존)

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test` → Expected: 100개 전부 PASS (97 + 신규 3)
Run: `npm run build` → Expected: 성공

- [ ] **Step 5: Commit**

```bash
git add src/components/Fretboard.tsx src/components/Fretboard.test.tsx app/globals.css
git commit -m "feat: overlay rendering — dim scale under degree-colored chord tones"
```

---

### Task 2: 오버레이 모드 통합 (Controls·page·URL)

**Files:**
- Modify: `src/lib/viewUrl.ts`, `src/components/Controls.tsx`, `app/page.tsx`
- Test: `src/lib/viewUrl.test.ts`, `src/components/Controls.test.tsx`

**Interfaces:**
- Consumes: Task 1의 `overlay` prop
- Produces: `Mode`/`ViewMode`에 `"overlay"` 추가, `UrlViewState.overlayRoot: Key`(기본 "A", URL 파라미터 `croot`), `ControlsProps.overlayRoot: Key`

**URL 게이트 규칙 (확정):** `key`·`label` = quiz 외 모든 모드. `scale` = scale·overlay. `chord` = chord·overlay. `croot` = overlay만. `box` = scale만.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/viewUrl.test.ts` — `D`에 `overlayRoot: "A"` 필드 추가, describe에 테스트 추가:

```ts
  it("encodes overlay mode with scale, chord root and chord", () => {
    expect(viewQueryString({ ...D, mode: "overlay", scaleId: "blues", overlayRoot: "E" }, D))
      .toBe("?mode=overlay&scale=blues&croot=E");
  });

  it("round-trips an overlay view", () => {
    const v: UrlViewState = { ...D, mode: "overlay", overlayRoot: "Bb", chordId: "m7" };
    expect(parseViewQuery(viewQueryString(v, D), D)).toEqual(v);
  });
```

`src/components/Controls.test.tsx` — `baseProps`에 `overlayRoot: "A" as const` 추가, describe 추가:

```tsx
describe("Controls (overlay mode)", () => {
  const overlayProps = { ...baseProps, mode: "overlay" as const, overlayRoot: "E" as const };

  it("shows scale, chord-root and chord selects and hides the box filter", () => {
    const { getByLabelText, queryByRole } = render(<Controls {...overlayProps} />);
    expect(getByLabelText("키")).not.toBeNull();
    expect(getByLabelText("스케일")).not.toBeNull();
    expect(getByLabelText("코드 루트")).not.toBeNull();
    expect(getByLabelText("코드")).not.toBeNull();
    expect(queryByRole("group", { name: "포지션" })).toBeNull();
  });

  it("chord option text uses the overlay chord root", () => {
    const { getByRole } = render(<Controls {...overlayProps} />);
    expect(getByRole("option", { name: "E7 · 도미넌트 7" })).not.toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/lib/viewUrl.test.ts src/components/Controls.test.tsx`
Expected: FAIL — overlayRoot 필드/오버레이 모드 없음

- [ ] **Step 3: viewUrl 구현**

`src/lib/viewUrl.ts` 수정:

```ts
export type ViewMode = "scale" | "chord" | "overlay" | "quiz";
```

`UrlViewState`에 `overlayRoot: Key;` 추가. `MODES` 배열에 `"overlay"` 추가 (`["scale", "chord", "overlay", "quiz"]`). `parseViewQuery` 반환 객체에 추가:

```ts
    overlayRoot: oneOf(p.get("croot"), KEYS) ?? defaults.overlayRoot,
```

`viewQueryString`의 게이트를 규칙대로 교체:

```ts
  if (view.mode !== "quiz" && view.keySel !== defaults.keySel) p.set("key", view.keySel);
  if ((view.mode === "scale" || view.mode === "overlay") && view.scaleId !== defaults.scaleId) p.set("scale", view.scaleId);
  if ((view.mode === "chord" || view.mode === "overlay") && view.chordId !== defaults.chordId) p.set("chord", view.chordId);
  if (view.mode === "overlay" && view.overlayRoot !== defaults.overlayRoot) p.set("croot", view.overlayRoot);
  if (view.mode !== "quiz" && view.labelMode !== defaults.labelMode) p.set("label", view.labelMode);
  if (view.mode === "scale" && view.boxIndex !== null) p.set("box", String(view.boxIndex + 1));
```

(파라미터 순서: mode, key, scale, chord, croot, label, box — 테스트 기대 문자열과 일치)

- [ ] **Step 4: Controls 구현**

`src/components/Controls.tsx` 수정:

```tsx
export type Mode = "scale" | "chord" | "overlay" | "quiz";

const MODES: { id: Mode; label: string }[] = [
  { id: "scale", label: "스케일" },
  { id: "chord", label: "코드톤" },
  { id: "overlay", label: "오버레이" },
  { id: "quiz", label: "퀴즈" },
];
```

`ControlsProps`에 `overlayRoot: Key;` 추가. `mode !== "quiz"` 블록 안을 다음 구조로 교체:

```tsx
          <label>
            {mode === "chord" ? "루트" : "키"}
            <select id="view-key" value={keySel} onChange={(e) => onChange({ keySel: e.target.value as Key })}>
              {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>

          {(mode === "scale" || mode === "overlay") && (
            <label>
              스케일
              <select id="view-scale" value={scaleId}
                      onChange={(e) => onChange({ scaleId: e.target.value as ScaleId, boxIndex: null })}>
                {SCALE_IDS.map((id) => <option key={id} value={id}>{SCALES[id].name}</option>)}
              </select>
            </label>
          )}

          {mode === "overlay" && (
            <label>
              코드 루트
              <select id="view-chord-root" value={overlayRoot}
                      onChange={(e) => onChange({ overlayRoot: e.target.value as Key })}>
                {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
          )}

          {(mode === "chord" || mode === "overlay") && (
            <label>
              코드
              <select id="view-chord" value={chordId}
                      onChange={(e) => onChange({ chordId: e.target.value as ChordId })}>
                {CHORD_IDS.map((id) => (
                  <option key={id} value={id}>
                    {(mode === "chord" ? keySel : overlayRoot)}{CHORDS[id].symbol} · {CHORDS[id].name}
                  </option>
                ))}
              </select>
            </label>
          )}
```

(라벨 seg와 `mode === "scale" && boxCount !== null` 포지션 seg는 그대로 유지)

- [ ] **Step 5: page 구현**

`app/page.tsx` 수정:

1. import에 `chordNoteMap`은 이미 있음. `DEFAULT_VIEW`에 `overlayRoot: "A",` 추가
2. 파생 계산을 다음으로 교체:

```tsx
  const isChord = view.mode === "chord";
  const isOverlay = view.mode === "overlay";
  const isQuiz = view.mode === "quiz";

  const notes = isChord
    ? chordNoteMap(view.keySel, view.chordId)
    : scaleNoteMap(view.keySel, view.scaleId);
  const overlayNotes = isOverlay ? chordNoteMap(view.overlayRoot, view.chordId) : undefined;
  const boxes = view.mode === "scale" ? boxesFor(view.keySel, view.scaleId) : null;
  const activeWindow = view.boxIndex !== null && boxes ? boxes[view.boxIndex] : null;

  const title = isChord
    ? `${view.keySel}${CHORDS[view.chordId].symbol} — ${CHORDS[view.chordId].name} 코드톤`
    : isOverlay
      ? `${view.keySel} ${SCALES[view.scaleId].name} + ${view.overlayRoot}${CHORDS[view.chordId].symbol} 코드톤`
      : `${view.keySel} ${SCALES[view.scaleId].name}${view.boxIndex !== null ? ` — 박스 ${view.boxIndex + 1}` : ""}`;
```

3. `<Controls ...>`에 `overlayRoot={view.overlayRoot}` 전달, `<Fretboard ...>`에 `overlay={overlayNotes}` 전달 (colorMode는 기존 `isChord ? "degree" : "root"` 유지)

- [ ] **Step 6: 전체 검증 + 커밋**

Run: `npm test` → Expected: 104개 전부 PASS (100 + 신규 4)
Run: `npm run build` → Expected: 성공

```bash
git add -A
git commit -m "feat: overlay view mode with independent chord root"
```

---

### Task 3: 오디오 엔진 (`tone.ts`)

**Files:**
- Create: `src/audio/tone.ts`
- Test: `src/audio/tone.test.ts`

**Interfaces:**
- Consumes: `FretPos`, `StringNo` (fretboard.ts)
- Produces (Task 4가 소비):
  - `midiAt(pos: FretPos): number` — 표준 튜닝 개방현 MIDI [6번줄→1번줄: 40,45,50,55,59,64] + fret
  - `freqOf(midi: number): number` — 평균율, A4(69)=440Hz
  - `isSoundEnabled(): boolean` / `setSoundEnabled(on: boolean): void` — localStorage `fretboard-sound-enabled`, "off"일 때만 꺼짐(기본 켬), SSR 가드
  - `playPosition(pos: FretPos, ctxOverride?: AudioContextLike): void` — 꺼짐/미지원/실패 시 무해한 no-op. 테스트용 컨텍스트 주입
  - `interface AudioContextLike` — 최소 구조 타입 (테스트 페이크용)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/audio/tone.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  midiAt, freqOf, isSoundEnabled, setSoundEnabled, playPosition,
  type AudioContextLike,
} from "./tone";

beforeEach(() => {
  window.localStorage.clear();
});

describe("midiAt", () => {
  it("maps open strings to standard-tuning MIDI numbers", () => {
    expect(midiAt({ str: 6, fret: 0 })).toBe(40); // E2
    expect(midiAt({ str: 5, fret: 0 })).toBe(45); // A2
    expect(midiAt({ str: 1, fret: 0 })).toBe(64); // E4
    expect(midiAt({ str: 5, fret: 12 })).toBe(57); // A3 — 옥타브
  });
});

describe("freqOf", () => {
  it("computes equal-temperament frequencies", () => {
    expect(freqOf(69)).toBe(440);
    expect(freqOf(57)).toBeCloseTo(220, 5);
    expect(freqOf(40)).toBeCloseTo(82.4069, 3);
  });
});

describe("sound preference", () => {
  it("defaults to enabled and persists the toggle", () => {
    expect(isSoundEnabled()).toBe(true);
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
  });
});

function fakeContext() {
  const gain = {
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  };
  const osc = {
    type: "sine",
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const ctx: AudioContextLike = {
    currentTime: 0,
    destination: {},
    createOscillator: () => osc,
    createGain: () => gain,
  };
  return { ctx, osc, gain };
}

describe("playPosition", () => {
  it("schedules a decaying oscillator at the position's frequency", () => {
    const { ctx, osc } = fakeContext();
    playPosition({ str: 5, fret: 0 }, ctx); // A2 = MIDI 45 = 110Hz
    expect(osc.frequency.value).toBeCloseTo(110, 3);
    expect(osc.type).toBe("triangle");
    expect(osc.start).toHaveBeenCalled();
    expect(osc.stop).toHaveBeenCalled();
  });

  it("is a no-op when sound is disabled", () => {
    setSoundEnabled(false);
    const { ctx, osc } = fakeContext();
    playPosition({ str: 5, fret: 0 }, ctx);
    expect(osc.start).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/audio/tone.test.ts`
Expected: FAIL — `Cannot find module './tone'`

- [ ] **Step 3: 구현**

`src/audio/tone.ts`:

```ts
import type { FretPos, StringNo } from "@/theory/fretboard";

// 표준 튜닝 개방현 MIDI: E2 A2 D3 G3 B3 E4
const OPEN_MIDI: Record<StringNo, number> = { 6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64 };

export function midiAt(pos: FretPos): number {
  return OPEN_MIDI[pos.str] + pos.fret;
}

export function freqOf(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const PREF_KEY = "fretboard-sound-enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PREF_KEY) !== "off";
}

export function setSoundEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {
    // 저장 실패는 무해 — 이번 세션 동안만 기본값으로 동작
  }
}

interface GainLike {
  gain: {
    setValueAtTime(value: number, time: number): unknown;
    exponentialRampToValueAtTime(value: number, time: number): unknown;
  };
  connect(dest: unknown): unknown;
}

interface OscillatorLike {
  type: string;
  frequency: { value: number };
  connect(node: unknown): unknown;
  start(time: number): void;
  stop(time: number): void;
}

export interface AudioContextLike {
  currentTime: number;
  destination: unknown;
  state?: string;
  resume?(): unknown;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
}

let sharedCtx: AudioContextLike | null = null;

function getContext(): AudioContextLike | null {
  if (sharedCtx) return sharedCtx;
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext;
  if (!AC) return null;
  sharedCtx = new AC();
  return sharedCtx;
}

export function playPosition(pos: FretPos, ctxOverride?: AudioContextLike): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = ctxOverride ?? getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume?.();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freqOf(midiAt(pos));
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1);
  } catch {
    // 오디오 실패는 학습 흐름에 무해 — 조용히 무시
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test` → Expected: 109개 전부 PASS (104 + 신규 5)

- [ ] **Step 5: Commit**

```bash
git add src/audio/tone.ts src/audio/tone.test.ts
git commit -m "feat: web audio tone engine with injectable context"
```

---

### Task 4: 사운드 통합 (노트 클릭·퀴즈·토글)

**Files:**
- Create: `src/components/SoundToggle.tsx`
- Modify: `src/components/Fretboard.tsx`, `src/components/Controls.tsx`, `app/page.tsx`, `src/components/Quiz.tsx`
- Test: `src/components/Fretboard.test.tsx`, `src/components/SoundToggle.test.tsx`, `src/components/Quiz.test.tsx`

**Interfaces:**
- Consumes: Task 3 전부
- Produces: `FretboardProps.onNoteClick?: (pos: FretPos) => void` (노트 `<g>` 클릭, 제공 시 cursor pointer), `SoundToggle` 컴포넌트 (Controls 끝에 항상 렌더)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/Fretboard.test.tsx`의 quiz interaction describe에 추가:

```tsx
  it("reports note clicks when onNoteClick is provided", () => {
    const onClick = vi.fn();
    const { container } = render(
      <Fretboard notes={scaleNoteMap("A", "minorPentatonic")} labelMode="name" window={null}
                 onNoteClick={onClick} />
    );
    fireEvent.click(container.querySelector("[data-testid='note-6-5']")!);
    expect(onClick).toHaveBeenCalledWith({ str: 6, fret: 5 });
  });
```

`src/components/SoundToggle.test.tsx` (신규):

```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { SoundToggle } from "./SoundToggle";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("SoundToggle", () => {
  it("toggles the sound preference and its pressed state", () => {
    const { getByRole } = render(<SoundToggle />);
    const btn = getByRole("button", { name: /소리/ });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(window.localStorage.getItem("fretboard-sound-enabled")).toBe("off");
  });
});
```

`src/components/Quiz.test.tsx` — 파일 상단(다른 import 아래)에 모듈 목과 테스트 추가:

```tsx
import { playPosition } from "@/audio/tone";

vi.mock("@/audio/tone", () => ({ playPosition: vi.fn() }));
```

(기존 vitest import에 `vi`가 없으면 병합.) "Quiz — 모두 찾기" describe에 추가:

```tsx
  it("plays the clicked position's tone", () => {
    const { container } = setup();
    fireEvent.click(container.querySelector("[data-testid='hit-6-5']")!);
    expect(playPosition).toHaveBeenCalledWith({ str: 6, fret: 5 });
  });
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/components/Fretboard.test.tsx src/components/SoundToggle.test.tsx src/components/Quiz.test.tsx`
Expected: FAIL — onNoteClick prop/SoundToggle 없음, playPosition 미호출

- [ ] **Step 3: 구현**

`src/components/Fretboard.tsx` — props에 `onNoteClick?: (pos: FretPos) => void;` 추가(destructuring 포함). 노트 `<g>`에 스프레드 추가 (Task 1의 data-layer 스프레드 옆):

```tsx
               {...(onNoteClick ? { onClick: () => onNoteClick({ str, fret }), style: { cursor: "pointer" } as const } : {})}
```

`src/components/SoundToggle.tsx` (신규):

```tsx
import { useEffect, useState } from "react";
import { isSoundEnabled, setSoundEnabled } from "@/audio/tone";

export function SoundToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(isSoundEnabled()); // SSR 하이드레이션 후 실제 설정 반영
  }, []);

  const toggle = () => {
    setSoundEnabled(!on);
    setOn(!on);
  };

  return (
    <button className="secondary sound-toggle" aria-pressed={on} onClick={toggle}>
      {on ? "🔊 소리 켬" : "🔇 소리 끔"}
    </button>
  );
}
```

`src/components/Controls.tsx` — import에 `SoundToggle` 추가, `.controls` div 마지막(포지션 seg 뒤, 닫는 태그 앞)에 `<SoundToggle />` 추가 (퀴즈 모드 포함 항상 렌더).

`app/page.tsx` — import에 `playPosition` 추가, 뷰 모드 `<Fretboard ...>`에 `onNoteClick={playPosition}` 추가.

`src/components/Quiz.tsx` — import에 `playPosition` 추가, `handlePositionClick` 첫 가드 통과 직후(중복 클릭 가드 앞)에 `playPosition(pos);` 추가:

```tsx
  const handlePositionClick = (pos: FretPos) => {
    if (!target || roundOver) return;
    playPosition(pos);
    const k = posKey(pos);
    ...
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test` → Expected: 112개 전부 PASS (109 + 신규 3)
Run: `npm run build` → Expected: 성공

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: play note audio on clicks with a sound toggle"
```

---

### Task 5: a11y 번들 (포커스 복원·SR 안내·덮개 정리)

**Files:**
- Modify: `src/components/Quiz.tsx`, `src/components/Fretboard.tsx`, `app/globals.css`
- Test: `src/components/Quiz.test.tsx`, `src/components/Fretboard.test.tsx`

**Interfaces:**
- 외부 인터페이스 변화 없음. 동작: ① 퀴즈에서 모드 A 응답 후·모드 B 라운드 종료 후 포커스가 [다음 문제]/[시작] primary 버튼으로 이동 ② 모두찾기 진행 중 sr-only 사용법 안내 ③ 퀴즈 피드백 `role="status"` ④ 범위 덮개가 셀당 1회만 덮음 — 프렛 덮개를 범위 내 현의 행에만 per-string 렌더 (`region-fret-cover-{s}`)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/Quiz.test.tsx`의 "Quiz — 모두 찾기" describe에 추가:

```tsx
  it("moves focus to the next-question button when the round ends", () => {
    const { getByRole, container } = setup();
    fireEvent.click(container.querySelector("[data-testid='hit-6-5']")!);
    fireEvent.click(container.querySelector("[data-testid='hit-5-0']")!);
    expect(document.activeElement).toBe(getByRole("button", { name: "다음 문제" }));
  });

  it("announces feedback via a status region and offers sr-only instructions", () => {
    const { container, getByText } = setup();
    expect(container.querySelector(".sr-only")?.textContent).toContain("Enter");
    fireEvent.click(container.querySelector("[data-testid='hit-6-5']")!);
    fireEvent.click(container.querySelector("[data-testid='hit-5-0']")!);
    expect(getByText("완벽!").getAttribute("role")).toBe("status");
  });
```

`src/components/Fretboard.test.tsx` — 기존 activeRegion 테스트 2개를 다음으로 교체하고 1개 추가:

```tsx
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- src/components/Quiz.test.tsx src/components/Fretboard.test.tsx`
Expected: FAIL — 포커스 미이동, sr-only/status 없음, region-fret-cover-{s} 미존재

- [ ] **Step 3: Fretboard 덮개 per-string 교체**

`src/components/Fretboard.tsx`의 `region-fret-cover` rect(단일)를 다음으로 교체:

```tsx
          {activeRegion.fretMax < FRET_COUNT &&
            STRINGS.filter((s) => activeRegion.strings.includes(s)).map((s) => (
              <rect key={`fret-cover-${s}`} data-testid={`region-fret-cover-${s}`}
                    x={fretX(Math.max(activeRegion.fretMax, 0))}
                    y={stringY(s) - STRING_GAP / 2}
                    width={W - RIGHT_PAD - fretX(Math.max(activeRegion.fretMax, 0))}
                    height={STRING_GAP}
                    fill="var(--bg)" opacity={0.6} />
            ))}
```

(현 덮개 rect들은 그대로 — 이제 어떤 셀도 두 덮개에 겹치지 않음)

- [ ] **Step 4: Quiz 포커스·SR·status 구현**

`src/components/Quiz.tsx`:

1. import에 `useRef` 확인(이미 있음). primary 버튼 ref 추가:

```tsx
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
```

primary 버튼에 `ref={primaryBtnRef}` 부여. 포커스 이펙트 추가 (기록 이펙트 아래):

```tsx
  const answered = picked !== null;
  useEffect(() => {
    if (roundOver || answered) primaryBtnRef.current?.focus();
  }, [roundOver, answered]);
```

2. 모두찾기 진행 중 sr-only 안내 — Fretboard 바로 위에 추가:

```tsx
      {quizMode === "findAll" && target && !roundOver && (
        <p className="sr-only">
          지판의 클릭 영역을 Tab으로 이동하고 Enter로 선택하세요. 목표: 모든 {target.name} 찾기.
        </p>
      )}
```

3. 두 `quiz-feedback` `<p>`에 `role="status"` 추가

`app/globals.css` 끝에 추가:

```css
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
```

- [ ] **Step 5: 전체 검증 + 커밋**

Run: `npm test` → Expected: 115개 전부 PASS (112 + Quiz 2 + Fretboard 1)
Run: `npm run build` → Expected: 성공

```bash
git add -A
git commit -m "feat: a11y bundle — focus restore, SR guidance, uniform range dim"
```

---

## Self-Review 결과

- **Spec coverage:** §10 v2 1순위 오버레이(독립 코드 루트 포함) → Task 1·2. 기획안 v2 백로그 '사운드 재생' → Task 3·4 (토글·SSR 가드 포함). §10 v2 3순위 a11y 번들(SR 컨텍스트·포커스 복원·이중 덮개) → Task 5. 퀴즈 URL 리프트·다크 모드는 이번 범위 밖(사용자 선택).
- **Placeholder scan:** 통과 — 전 스텝 실제 코드/명령 포함.
- **Type consistency:** `overlay: Map<PitchClass, NoteInfo>`(Task 1 정의 → Task 2 소비), `overlayRoot: Key`(Task 2에서 viewUrl·Controls·page 동일 필드), `AudioContextLike`(Task 3 정의 → 테스트 페이크), `onNoteClick: (pos: FretPos) => void`(Task 4 정의 → page·테스트). 테스트 수 누계: 97 → 100 → 104 → 109 → 112 → 115.
- **주의 (구현자 전달):** Task 4의 Quiz vi.mock은 파일 전체에 적용되므로 기존 통계 어서션(localStorage)과 무관 — playPosition만 목. Task 5의 포커스 이펙트는 모드 A 응답 시에도 발동(choice 버튼들이 disabled 상태라 포커스 이동이 자연스러움). Task 1의 오버레이 분기는 overlay 미지정 시 기존 식과 동일하게 환원되어야 함 — 기존 colorMode·root ring 테스트가 그 회귀 방지선.
