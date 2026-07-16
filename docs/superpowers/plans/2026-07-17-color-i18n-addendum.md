# 컬러톤 교체 + i18n 구현 계획 (UI 재설계 애드엔덤)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스펙(docs/superpowers/specs/2026-07-17-color-i18n-addendum-design.md)대로 팔레트를 쿨 뉴트럴+인디고로 교체하고, 전체 UI를 영어 기본 + EN/KO 토글로 국제화한다.

**Architecture:** 컬러는 CSS 토큰 값만 교체(변수명 불변 → 컴포넌트 무변경). i18n은 `src/lib/i18n.ts`의 타입드 사전 + `LangContext`(Provider 없으면 en 기본) + 헤더 `LangToggle`. 스케일/코드 표시명은 i18n 계층의 `Record<Lang, Record<Id, string>>` 매핑으로 처리해 이론 파일 불변을 유지한다.

**Tech Stack:** 기존 스택 그대로 (신규 의존성 0).

## Global Constraints

- 신규 의존성 금지 (i18n 라이브러리 포함).
- **불변 로직**: `src/theory/*`, `src/quiz/*`, `src/audio/*`, `src/lib/viewUrl.ts`, `src/lib/theme.ts` 수정 금지.
- CSS 변수 **이름** 전부 불변, `--fb-*`/`--note-*`/`--tone-*`/`--mark-*` **값**도 불변 (라이트/다크 모두).
- 스토리지 키: 언어 `"fretboard-lang"`(값 `"en"`/`"ko"`), 기존 `"fretboard-theme"`/`"fretboard-sound-enabled"`/`"fretboard-quiz-stats-v1"` 불변.
- `data-testid`, role 구조, `.choice`/`.view-title` 클래스 훅 불변. 텍스트/aria-label만 사전 기반으로 교체.
- 기본 언어는 **en** (Provider 부재 시에도 en) — 기존 테스트는 영어 문자열로 갱신하되 구조는 유지.
- 각 태스크 종료 시 `npm test` 전체 통과 후 커밋, 트레일러 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task N1: 컬러 토큰 교체 (쿨 뉴트럴 + 인디고)

**Files:**
- Modify: `app/globals.css` (토큰 값만)

**Interfaces:**
- Consumes/Produces: 변수명 계약 불변 — 이후 태스크와 독립.

- [ ] **Step 1: 라이트 토큰 값 교체**

`:root`에서 아래 7개 값만 교체 (fb/note/tone/mark는 건드리지 않는다):

```css
  --bg: #f6f7f9;
  --surface: #ffffff;
  --surface-2: #eef0f4;
  --line: #e2e5ea;
  --ink: #1f2430;
  --ink-muted: #6b7280;
  --accent: #4f46e5;
  --accent-ink: #ffffff;
  --shadow-card: 0 1px 2px rgb(31 36 48 / 0.04), 0 4px 16px rgb(31 36 48 / 0.06);
```

- [ ] **Step 2: 다크 토큰 값 교체**

`:root[data-theme="dark"]`에서 동일 항목만 교체:

```css
  --bg: #14161c;
  --surface: #1c1f27;
  --surface-2: #242834;
  --line: #323848;
  --ink: #e6e8ee;
  --ink-muted: #9aa1b0;
  --accent: #818cf8;
  --accent-ink: #14161c;
  --shadow-card: 0 0 0 1px rgb(255 255 255 / 0.04);
```

- [ ] **Step 3: 검증 + 커밋**

Run: `npm test && npm run build`
Expected: 전체 통과(스타일 값은 테스트 무관), 빌드 성공.

```bash
git add app/globals.css
git commit -m "feat: swap palette to cool neutral with indigo accent"
```

---

### Task N2: i18n 모듈 + LangContext + LangToggle

**Files:**
- Create: `src/lib/i18n.ts`, `src/lib/i18n.test.ts`, `src/lib/LangContext.tsx`, `src/components/LangToggle.tsx`, `src/components/LangToggle.test.tsx`

**Interfaces:**
- Produces (Task N3이 사용): `Lang`, `LANG_KEY`, `loadLang()`, `saveLang(lang)`, `MESSAGES: Record<Lang, Messages>`, `SCALE_NAMES`, `CHORD_NAMES`, `LangProvider`, `useLang(): { lang, setLang }`, `<LangToggle />`.

- [ ] **Step 1: 실패하는 테스트 — src/lib/i18n.test.ts**

```ts
import { describe, it, expect, afterEach, vi } from "vitest";
import { loadLang, saveLang, LANG_KEY, MESSAGES, SCALE_NAMES, CHORD_NAMES } from "./i18n";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("loadLang", () => {
  it("defaults to en when nothing is stored", () => {
    expect(loadLang()).toBe("en");
  });
  it("returns the stored value when valid", () => {
    window.localStorage.setItem(LANG_KEY, "ko");
    expect(loadLang()).toBe("ko");
  });
  it("ignores invalid stored values", () => {
    window.localStorage.setItem(LANG_KEY, "fr");
    expect(loadLang()).toBe("en");
  });
  it("falls back to en when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadLang()).toBe("en");
  });
});

describe("saveLang", () => {
  it("stores the language", () => {
    saveLang("ko");
    expect(window.localStorage.getItem(LANG_KEY)).toBe("ko");
  });
  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveLang("ko")).not.toThrow();
  });
});

describe("dictionaries", () => {
  it("localizes parametrized messages", () => {
    expect(MESSAGES.en.wrong("A")).toBe("Wrong — it was A");
    expect(MESSAGES.ko.wrong("A")).toBe("오답 — 정답은 A");
    expect(MESSAGES.en.findHeadingAsk("A", 1, 2)).toBe("Click every A on the fretboard (1/2)");
    expect(MESSAGES.en.hitLabel(6, 5)).toBe("String 6, fret 5");
    expect(MESSAGES.ko.hitLabel(6, 5)).toBe("6번 줄 5프렛");
  });
  it("maps scale and chord display names per language", () => {
    expect(SCALE_NAMES.en.minorPentatonic).toBe("Minor Pentatonic");
    expect(SCALE_NAMES.ko.minorPentatonic).toBe("마이너 펜타토닉");
    expect(CHORD_NAMES.en["7"]).toBe("Dominant 7");
    expect(CHORD_NAMES.ko.maj7).toBe("메이저 7");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/i18n.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 — src/lib/i18n.ts**

```ts
import type { ScaleId } from "@/theory/scales";
import type { ChordId } from "@/theory/chords";

export type Lang = "en" | "ko";

export const LANG_KEY = "fretboard-lang";

export function loadLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const v = window.localStorage.getItem(LANG_KEY);
    return v === "en" || v === "ko" ? v : "en";
  } catch {
    return "en"; // 저장소 접근 불가 시 기본 언어
  }
}

export function saveLang(lang: Lang): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    // 저장 실패는 무해 — 이번 세션 동안만 적용
  }
}

export interface Messages {
  // 헤더/모드
  modeScale: string; modeChord: string; modeOverlay: string; modeQuiz: string;
  modeGroup: string; modeNav: string;
  // 컨트롤 필드
  key: string; root: string; scale: string; chordRoot: string; chord: string;
  labelGroup: string; labelNames: string; labelDegrees: string; labelOff: string;
  positionGroup: string; positionAll: string;
  // 범례
  legend: string; legendRoot: string; legendRoot1: string; legendScaleNote: string;
  legendThird: string; legendFifth: string; legendSeventh: string;
  // 지판
  fretboard: string;
  hitLabel: (str: number, fret: number) => string;
  // 토글
  soundOn: string; soundOff: string;
  themeSystem: string; themeLight: string; themeDark: string;
  langLabel: string;
  // 퀴즈
  quizStrings: string;
  stringButton: (n: number) => string;
  quizType: string; quizNameThatNote: string; quizFindAll: string;
  fretRange: string;
  fretRangeOption: (max: number) => string;
  start: string; next: string; showAnswers: string;
  nameHeadingIdle: string; nameHeadingAsk: string; findHeadingIdle: string;
  findHeadingAsk: (name: string, found: number, total: number) => string;
  srFindGuide: (name: string) => string;
  correct: string;
  wrong: (answer: string) => string;
  revealed: string; perfect: string;
  doneWithMisses: (n: number) => string;
  chipSession: (c: number, a: number) => string;
  chipAccuracy: (p: number) => string;
  chipAvg: (s: string) => string;
  // 스테이지 타이틀
  titleScale: (key: string, scaleName: string, box: number | null) => string;
  titleChord: (key: string, symbol: string, chordName: string) => string;
  titleOverlay: (key: string, scaleName: string, root: string, symbol: string) => string;
}

export const MESSAGES: Record<Lang, Messages> = {
  en: {
    modeScale: "Scale", modeChord: "Chord Tones", modeOverlay: "Overlay", modeQuiz: "Quiz",
    modeGroup: "Mode", modeNav: "Mode switcher",
    key: "Key", root: "Root", scale: "Scale", chordRoot: "Chord Root", chord: "Chord",
    labelGroup: "Labels", labelNames: "Names", labelDegrees: "Degrees", labelOff: "Off",
    positionGroup: "Position", positionAll: "All",
    legend: "Legend", legendRoot: "Root", legendRoot1: "Root (1)", legendScaleNote: "Scale notes",
    legendThird: "3rd", legendFifth: "5th", legendSeventh: "7th",
    fretboard: "Guitar fretboard",
    hitLabel: (str, fret) => `String ${str}, fret ${fret}`,
    soundOn: "Sound on", soundOff: "Sound off",
    themeSystem: "Theme: System", themeLight: "Theme: Light", themeDark: "Theme: Dark",
    langLabel: "Language: English",
    quizStrings: "Strings",
    stringButton: (n) => `${n}`,
    quizType: "Quiz Type", quizNameThatNote: "Name That Note", quizFindAll: "Find All",
    fretRange: "Fret Range",
    fretRangeOption: (max) => `0–${max}`,
    start: "Start", next: "Next", showAnswers: "Show Answers",
    nameHeadingIdle: "Quiz — Name That Note", nameHeadingAsk: "What note is this?",
    findHeadingIdle: "Quiz — Find All",
    findHeadingAsk: (name, found, total) => `Click every ${name} on the fretboard (${found}/${total})`,
    srFindGuide: (name) =>
      `Move between fretboard targets with Tab and press Enter to select. Goal: find every ${name}.`,
    correct: "Correct!",
    wrong: (answer) => `Wrong — it was ${answer}`,
    revealed: "Answers revealed", perfect: "Perfect!",
    doneWithMisses: (n) => `Done — ${n} misses`,
    chipSession: (c, a) => `Session ${c}/${a}`,
    chipAccuracy: (p) => `Accuracy ${p}%`,
    chipAvg: (s) => `Avg ${s}s`,
    titleScale: (key, scaleName, box) =>
      `${key} ${scaleName}${box !== null ? ` — Box ${box + 1}` : ""}`,
    titleChord: (key, symbol, chordName) => `${key}${symbol} — ${chordName} Chord Tones`,
    titleOverlay: (key, scaleName, root, symbol) =>
      `${key} ${scaleName} + ${root}${symbol} Chord Tones`,
  },
  ko: {
    modeScale: "스케일", modeChord: "코드톤", modeOverlay: "오버레이", modeQuiz: "퀴즈",
    modeGroup: "모드", modeNav: "모드 전환",
    key: "키", root: "루트", scale: "스케일", chordRoot: "코드 루트", chord: "코드",
    labelGroup: "라벨 표시", labelNames: "음이름", labelDegrees: "도수", labelOff: "숨김",
    positionGroup: "포지션", positionAll: "전체",
    legend: "범례", legendRoot: "루트", legendRoot1: "루트 (1)", legendScaleNote: "스케일음",
    legendThird: "3도", legendFifth: "5도", legendSeventh: "7도",
    fretboard: "기타 지판",
    hitLabel: (str, fret) => `${str}번 줄 ${fret}프렛`,
    soundOn: "소리 켬", soundOff: "소리 끔",
    themeSystem: "테마: 시스템", themeLight: "테마: 라이트", themeDark: "테마: 다크",
    langLabel: "언어: 한국어",
    quizStrings: "출제 현",
    stringButton: (n) => `${n}번`,
    quizType: "퀴즈 종류", quizNameThatNote: "이 음은?", quizFindAll: "모두 찾기",
    fretRange: "프렛 범위",
    fretRangeOption: (max) => `0~${max}`,
    start: "시작", next: "다음 문제", showAnswers: "정답 보기",
    nameHeadingIdle: "퀴즈 — 이 음은?", nameHeadingAsk: "이 위치의 음이름은?",
    findHeadingIdle: "퀴즈 — 모두 찾기",
    findHeadingAsk: (name, found, total) => `지판에서 모든 ${name}을 클릭하세요 (${found}/${total})`,
    srFindGuide: (name) =>
      `지판의 클릭 영역을 Tab으로 이동하고 Enter로 선택하세요. 목표: 모든 ${name} 찾기.`,
    correct: "정답!",
    wrong: (answer) => `오답 — 정답은 ${answer}`,
    revealed: "정답 공개", perfect: "완벽!",
    doneWithMisses: (n) => `완료 — 실수 ${n}회`,
    chipSession: (c, a) => `이번 세션 ${c}/${a}`,
    chipAccuracy: (p) => `누적 정답률 ${p}%`,
    chipAvg: (s) => `평균 ${s}초`,
    titleScale: (key, scaleName, box) =>
      `${key} ${scaleName}${box !== null ? ` — 박스 ${box + 1}` : ""}`,
    titleChord: (key, symbol, chordName) => `${key}${symbol} — ${chordName} 코드톤`,
    titleOverlay: (key, scaleName, root, symbol) =>
      `${key} ${scaleName} + ${root}${symbol} 코드톤`,
  },
};

export const SCALE_NAMES: Record<Lang, Record<ScaleId, string>> = {
  en: {
    major: "Major",
    naturalMinor: "Natural Minor",
    minorPentatonic: "Minor Pentatonic",
    majorPentatonic: "Major Pentatonic",
    blues: "Blues",
  },
  ko: {
    major: "메이저",
    naturalMinor: "내추럴 마이너",
    minorPentatonic: "마이너 펜타토닉",
    majorPentatonic: "메이저 펜타토닉",
    blues: "블루스",
  },
};

export const CHORD_NAMES: Record<Lang, Record<ChordId, string>> = {
  en: { maj: "Major", m: "Minor", "7": "Dominant 7", maj7: "Major 7", m7: "Minor 7" },
  ko: { maj: "메이저", m: "마이너", "7": "도미넌트 7", maj7: "메이저 7", m7: "마이너 7" },
};
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/i18n.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: LangContext — src/lib/LangContext.tsx**

```tsx
import { createContext, useContext, useEffect, useState } from "react";
import { loadLang, saveLang, type Lang } from "./i18n";

interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

// Provider 부재 시 en 고정 — 컴포넌트 단독 렌더 테스트가 영어 기본으로 동작
const LangContext = createContext<LangValue>({ lang: "en", setLang: () => {} });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(loadLang()); // SSR 하이드레이션 후 실제 설정 반영
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    saveLang(next);
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  return useContext(LangContext);
}
```

- [ ] **Step 6: 실패하는 테스트 — src/components/LangToggle.test.tsx**

```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { LangProvider } from "@/lib/LangContext";
import { LangToggle } from "./LangToggle";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.lang = "";
});

describe("LangToggle", () => {
  it("defaults to English and toggles to Korean", () => {
    const { getByRole } = render(<LangProvider><LangToggle /></LangProvider>);
    const btn = getByRole("button", { name: "Language: English" });
    fireEvent.click(btn);
    expect(getByRole("button", { name: "언어: 한국어" })).not.toBeNull();
    expect(window.localStorage.getItem("fretboard-lang")).toBe("ko");
    expect(document.documentElement.lang).toBe("ko");
  });

  it("restores a persisted language on mount", () => {
    window.localStorage.setItem("fretboard-lang", "ko");
    const { getByRole } = render(<LangProvider><LangToggle /></LangProvider>);
    expect(getByRole("button", { name: "언어: 한국어" })).not.toBeNull();
  });

  it("renders in English without a provider", () => {
    const { getByRole } = render(<LangToggle />);
    expect(getByRole("button", { name: "Language: English" })).not.toBeNull();
  });
});
```

- [ ] **Step 7: 실패 확인 후 구현 — src/components/LangToggle.tsx**

Run: `npx vitest run src/components/LangToggle.test.tsx` → FAIL(모듈 없음) 확인 후:

```tsx
import { MESSAGES } from "@/lib/i18n";
import { useLang } from "@/lib/LangContext";

export function LangToggle() {
  const { lang, setLang } = useLang();
  const label = MESSAGES[lang].langLabel;
  return (
    <button type="button" className="icon-btn w-auto px-2.5 text-xs font-semibold tracking-wide"
            aria-label={label} title={label}
            onClick={() => setLang(lang === "en" ? "ko" : "en")}>
      {lang === "en" ? "EN" : "KO"}
    </button>
  );
}
```

- [ ] **Step 8: 통과 확인 + 전체 테스트 + 커밋**

Run: `npx vitest run src/components/LangToggle.test.tsx` → PASS (3 tests). `npm test` → 전체 통과.

```bash
git add src/lib/i18n.ts src/lib/i18n.test.ts src/lib/LangContext.tsx src/components/LangToggle.tsx src/components/LangToggle.test.tsx
git commit -m "feat: i18n module with typed dictionaries, language context and toggle"
```

---

### Task N3: 전 컴포넌트 i18n 적용 + 기존 테스트 영어 갱신

**Files:**
- Modify: `app/layout.tsx`, `app/page.tsx`, `src/components/ModeTabs.tsx`, `src/components/Controls.tsx`, `src/components/Quiz.tsx`, `src/components/SoundToggle.tsx`, `src/components/ThemeToggle.tsx`, `src/components/Legend.tsx`, `src/components/Fretboard.tsx`
- Modify(테스트): `src/components/ModeTabs.test.tsx`, `src/components/Controls.test.tsx`, `src/components/Quiz.test.tsx`, `src/components/SoundToggle.test.tsx`, `src/components/ThemeToggle.test.tsx`, `src/components/Legend.test.tsx`, `src/components/Fretboard.test.tsx`(한국어 aria 어서션이 있는 경우)
- Create: `src/components/langSwitch.test.tsx` (KO 통합 테스트)

**Interfaces:**
- Consumes: N2의 전부.
- Produces: 최종 상태 — 모든 사용자 노출 문자열이 `MESSAGES[lang]`/`SCALE_NAMES[lang]`/`CHORD_NAMES[lang]` 경유.

**공통 패턴** (각 컴포넌트 상단):

```tsx
import { MESSAGES } from "@/lib/i18n";
import { useLang } from "@/lib/LangContext";
// 컴포넌트 함수 안:
const { lang } = useLang();
const m = MESSAGES[lang];
```

- [ ] **Step 1: layout.tsx — 기본 언어 en**

`<html lang="ko"` → `<html lang="en"`, `description: "Guitar fretboard trainer — scales, chord tones, quizzes"`.

- [ ] **Step 2: page.tsx**

- `LangProvider`를 최상위로: `return (<LangProvider>…기존 헤더+main…</LangProvider>)`.
- 헤더 우측 그룹에 `<LangToggle />`을 `<SoundToggle />` 앞에 추가.
- `useLang()`/`MESSAGES`로: `<nav aria-label={m.modeNav}>`, 타이틀 계산을 사전 함수로 교체:

```tsx
const scaleName = SCALE_NAMES[lang][view.scaleId];
const chordName = CHORD_NAMES[lang][view.chordId];
const title = isChord
  ? m.titleChord(view.keySel, CHORDS[view.chordId].symbol, chordName)
  : isOverlay
    ? m.titleOverlay(view.keySel, scaleName, view.overlayRoot, CHORDS[view.chordId].symbol)
    : m.titleScale(view.keySel, scaleName, view.boxIndex);
```

주의: `useLang()`은 `LangProvider` **안**에서 호출해야 하므로, 기존 `Home` 본문을 `HomeInner`(가칭) 컴포넌트로 감싸고 `export default`는 `<LangProvider><HomeInner /></LangProvider>`를 반환하는 래퍼로 한다.

- [ ] **Step 3: ModeTabs.tsx**

`MODES` 배열의 고정 label 제거 → `{ id, label: m.modeScale }` 형태로 컴포넌트 안에서 구성(또는 `labelFor(m, id)`), `aria-label={m.modeGroup}`.

- [ ] **Step 4: Controls.tsx**

모든 라벨/aria를 사전으로: `m.key`/`m.root`/`m.scale`/`m.chordRoot`/`m.chord`/`m.labelGroup`/`m.labelNames`/`m.labelDegrees`/`m.labelOff`/`m.positionGroup`/`m.positionAll`. 셀렉트 옵션 표시명: `SCALES[id].name` → `SCALE_NAMES[lang][id]`, `CHORDS[id].name` → `CHORD_NAMES[lang][id]` (심볼은 기존 그대로).

- [ ] **Step 5: Quiz.tsx**

설정 캡션/버튼/헤딩/피드백/칩 전부 사전으로. 매핑: `출제 현→m.quizStrings`, `{s}번→m.stringButton(s)`, `퀴즈 종류→m.quizType`, QUIZ_MODES label → `m.quizNameThatNote`/`m.quizFindAll`(배열을 컴포넌트 안에서 구성), `프렛 범위→m.fretRange`, 옵션 `0~{f}→m.fretRangeOption(f)`, `시작/다음 문제→m.start/m.next`, `정답 보기→m.showAnswers`, 헤딩 4종 → `m.nameHeadingAsk/m.nameHeadingIdle/m.findHeadingAsk(...)/m.findHeadingIdle`, sr 안내 → `m.srFindGuide(target.name)`, 피드백 → `m.correct/m.wrong(question.answer)/m.revealed/m.perfect/m.doneWithMisses(misses.size)`, 칩 → `m.chipSession(...)/m.chipAccuracy(Math.round(acc*100))/m.chipAvg((avg/1000).toFixed(1))`. 로직(훅/핸들러)은 계속 불변.

- [ ] **Step 6: SoundToggle / ThemeToggle / Legend / Fretboard**

- SoundToggle: label = `on ? m.soundOn : m.soundOff`.
- ThemeToggle: `LABELS` 상수 제거 → `{ system: m.themeSystem, light: m.themeLight, dark: m.themeDark }`.
- Legend: 항목 라벨을 `m.legendRoot`/`m.legendRoot1`/`m.legendScaleNote`/`m.legendThird`/`m.legendFifth`/`m.legendSeventh`, `aria-label={m.legend}` (itemsFor를 컴포넌트 안으로 이동해 m 사용).
- Fretboard: `aria-label={m.fretboard}`, 히트 타겟 `aria-label={m.hitLabel(str, fret)}`.

- [ ] **Step 7: 기존 테스트 영어 갱신 (구조 불변, 문자열만)**

문자열 치환표 (기존 → 신규):
- ModeTabs.test: `퀴즈→Quiz`, `스케일→Scale`, `코드톤→Chord Tones`
- Controls.test: `포지션→Position`, `스케일→Scale`, `코드→Chord`, `루트→Root`, `키→Key`, `코드 루트→Chord Root`, `A7 · 도미넌트 7→A7 · Dominant 7`, `E7 · 도미넌트 7→E7 · Dominant 7`, `라벨 표시→Labels`
- SoundToggle.test: `/소리/→/Sound/`
- ThemeToggle.test: `테마: 시스템→Theme: System`, `테마: 라이트→Theme: Light`, `테마: 다크→Theme: Dark`
- Legend.test: `루트→Root`, `스케일음→Scale notes`, `루트 (1)→Root (1)`, `3도→3rd`, `5도→5th`, `7도→7th`
- Quiz.test: `시작→Start`, `모두 찾기→Find All`, `다음 문제→Next`, `정답 보기→Show Answers`, `정답!→Correct!`, `/오답 — 정답은 A/→/Wrong — it was A/`, `/이번 세션 1\/1/→/Session 1\/1/`, `/이번 세션 0\/1/→/Session 0\/1/`, `/모든 A/→/every A/`, `정답 공개→Answers revealed`, `완벽!→Perfect!`, `/완료 — 실수 \d+회/→/Done — \d+ misses/`, `{n}번 현 버튼→{n}` (해당 어서션이 있는 경우)
- Fretboard.test: `기타 지판→Guitar fretboard`, `{s}번 줄 {f}프렛→String {s}, fret {f}` (해당 어서션이 있는 경우)

data-testid/스토리지 키/`.choice`/`.view-title` 어서션은 그대로 둔다.

- [ ] **Step 8: KO 통합 테스트 — src/components/langSwitch.test.tsx (신규)**

```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { LangProvider } from "@/lib/LangContext";
import { Controls } from "./Controls";
import { Legend } from "./Legend";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.lang = "";
});

const controlsProps = {
  mode: "scale" as const,
  keySel: "A" as const,
  scaleId: "minorPentatonic" as const,
  chordId: "7" as const,
  labelMode: "name" as const,
  boxIndex: null,
  boxCount: 5,
  overlayRoot: "A" as const,
  onChange: () => {},
};

describe("language switching", () => {
  it("renders Korean labels when the stored language is ko", () => {
    window.localStorage.setItem("fretboard-lang", "ko");
    const { getByLabelText, getByRole } = render(
      <LangProvider>
        <Controls {...controlsProps} />
        <Legend mode="scale" />
      </LangProvider>
    );
    expect(getByLabelText("키")).not.toBeNull();
    expect(getByLabelText("스케일")).not.toBeNull();
    expect(getByRole("group", { name: "포지션" })).not.toBeNull();
    expect(getByRole("option", { name: "마이너 펜타토닉" })).not.toBeNull();
  });

  it("defaults to English inside the provider when nothing is stored", () => {
    const { getByLabelText } = render(
      <LangProvider><Controls {...controlsProps} /></LangProvider>
    );
    expect(getByLabelText("Key")).not.toBeNull();
  });
});
```

- [ ] **Step 9: 전체 검증 + 커밋**

Run: `npm test && npm run build`
Expected: 전체 통과(문자열 갱신 후), 빌드 성공.

```bash
git add app/layout.tsx app/page.tsx src/components src/lib
git commit -m "feat: full-UI i18n — English default with EN/KO toggle"
```

---

### Task N4: 브라우저 검증 (컨트롤러 수행)

- [ ] 새 팔레트 라이트/다크 (인디고 액센트, 쿨 배경, 노트 색 불변)
- [ ] 최초 로드 EN 기본 (html lang=en, 전체 영어)
- [ ] EN→KO 전환 즉시 반영 + 새로고침 유지 + html lang=ko
- [ ] 퀴즈 EN 한 라운드 (Start/Correct!/Session 칩)
- [ ] 콘솔 에러 0
