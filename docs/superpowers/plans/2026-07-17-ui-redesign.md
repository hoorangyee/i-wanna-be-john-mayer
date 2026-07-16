# UI/UX 재설계 구현 계획 (Tailwind v4 + 듀얼 테마 + 레이아웃 재구성)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기타 지판 학습 앱의 UX/UI를 스펙(docs/superpowers/specs/2026-07-16-ui-redesign-design.md)대로 재설계한다 — 스티키 헤더 + 컨트롤 바 + 스테이지 카드 구조, 라이트/다크 듀얼 테마, Tailwind CSS v4 전환.

**Architecture:** 스테이지 중심 단일 컬럼. 모드 탭은 헤더로 승격(ModeTabs 신규 분리), 모드별 컨트롤은 지판 위 카드로, 지판은 헤더/범례를 가진 카드로. 테마는 `<html data-theme="light|dark">`(해석된 값만)로 적용하고 선호(`system|light|dark`)는 localStorage에 저장. 지판 SVG는 CSS 변수 이름을 그대로 유지해 코드 변경 없이 테마를 추종한다.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS v4 (CSS-first, `@theme`), Vitest + Testing Library (jsdom).

## Global Constraints

- 의존성 추가는 devDependencies의 `tailwindcss`, `@tailwindcss/postcss` **2개만**. 컴포넌트/모션 라이브러리 금지.
- **불변 로직**: `src/theory/*`, `src/quiz/*`, `src/audio/*`, `src/lib/viewUrl.ts` 는 수정하지 않는다. `src/lib/theme.ts`는 신규 추가만.
- **테스트 계약 유지** (기존 스위트가 그대로 통과해야 함, 명시된 이동 제외):
  - `data-testid` 전부 (`note-*`, `mark-*`, `hit-*`, `active-region`, `region-*`), `role`/`aria-label`/`aria-pressed` 의미.
  - aria-label 문자열: `모드`, `라벨 표시`, `포지션`, `출제 현`, `퀴즈 종류`, `기타 지판`, `범례`, `/소리/`.
  - 텍스트 포맷: `정답!`, `오답 — 정답은 {answer}`, `정답 공개`, `완벽!`, `완료 — 실수 {n}회`, `이번 세션 {correct}/{asked}`, 버튼 `시작`/`다음 문제`/`정답 보기`.
  - 퀴즈 선택지 버튼의 클래스명 `choice` (Quiz.test가 `.choice` 셀렉터 사용).
  - Controls의 mode-탭 3개 테스트는 `ModeTabs.test.tsx`로 **이동**(Task 4에 정확한 코드 있음).
- **CSS 변수 이름 유지**: `--bg`, `--fb-nut/fret/string/inlay`, `--note-scale/root/root-ring/dim`, `--tone-3/5/7`, `--mark-question/correct/wrong/reveal` (Fretboard.tsx가 `var(...)`로 직접 참조).
- 테마 저장 키: `"fretboard-theme"` (`THEME_KEY` 상수, 값은 `"light"`/`"dark"`만 저장, 시스템은 키 제거).
- UI 카피는 한국어 유지.
- 각 태스크 종료 시 `npm test` 전체 통과 후 커밋. 커밋 메시지 끝에 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Tailwind v4 셋업 + 디자인 토큰/컴포넌트 클래스 기반

**Files:**
- Create: `postcss.config.mjs`
- Modify: `package.json` (npm install로 자동), `app/globals.css` (전면 재작성, 구 스타일 일부 공존)

**Interfaces:**
- Consumes: 없음 (기반 태스크)
- Produces: Tailwind 유틸리티 (`bg-canvas`, `bg-surface`, `bg-surface-2`, `border-line`, `text-ink`, `text-ink-muted`, `bg-accent`, `text-accent-ink`, `shadow-card`), 컴포넌트 클래스 `.card`, `.seg`, `.icon-btn`, `.field`, `.btn-primary`, `.btn-ghost`, `.choice`, `.chip`. 이후 모든 태스크가 사용.

- [ ] **Step 1: 의존성 설치**

Run: `npm install -D tailwindcss @tailwindcss/postcss`
Expected: package.json devDependencies에 두 패키지 추가, 에러 없음.

- [ ] **Step 2: postcss.config.mjs 생성**

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 3: app/globals.css 전면 재작성**

아래 내용으로 파일 전체를 교체한다. 마지막 "구 스타일" 블록은 마이그레이션 동안 공존하며 Task 4~7에서 단계적으로 삭제된다.

```css
@import "tailwindcss";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

/* ── 디자인 토큰: 라이트 (기본) ─────────────────────────────── */
:root {
  --bg: #faf8f4;
  --surface: #ffffff;
  --surface-2: #f4f1ea;
  --line: #e4e0d8;
  --ink: #2b2a27;
  --ink-muted: #7a756c;
  --accent: #d96c3d;
  --accent-ink: #ffffff;
  --shadow-card: 0 1px 2px rgb(43 42 39 / 0.04), 0 4px 16px rgb(43 42 39 / 0.06);

  --fb-nut: #8a8478;
  --fb-fret: #c9c3b8;
  --fb-string: #a39d90;
  --fb-inlay: #e0dbd0;

  --note-scale: #4a7ba6;
  --note-root: #d96c3d;
  --note-root-ring: #a44b22;
  --note-dim: #b9bdc9;
  --tone-3: #3d8b6b;
  --tone-5: #5f7fae;
  --tone-7: #8a63b3;
  --mark-question: #e0a83c;
  --mark-correct: #3d8b6b;
  --mark-wrong: #c05252;
  --mark-reveal: #9aa0ab;
}

/* ── 디자인 토큰: 다크 (웜 차콜) ────────────────────────────── */
:root[data-theme="dark"] {
  --bg: #1c1a17;
  --surface: #26231e;
  --surface-2: #2e2a24;
  --line: #3b362e;
  --ink: #ece7de;
  --ink-muted: #a39d90;
  --accent: #e8834f;
  --accent-ink: #2a1608;
  --shadow-card: 0 0 0 1px rgb(255 255 255 / 0.04);

  --fb-nut: #6f685b;
  --fb-fret: #453f35;
  --fb-string: #8d867a;
  --fb-inlay: #3b362e;

  --note-scale: #5688b8;
  --note-root: #e0703d;
  --note-root-ring: #f2a67c;
  --note-dim: #4d5160;
  --tone-3: #46996f;
  --tone-5: #6d8cc2;
  --tone-7: #9c77c9;
  --mark-question: #d9a43a;
  --mark-correct: #46996f;
  --mark-wrong: #d16060;
  --mark-reveal: #6f7581;
}

/* Tailwind 유틸리티 매핑 — 토큰이 런타임 CSS 변수를 참조하므로 inline */
@theme inline {
  --color-canvas: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-line: var(--line);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-accent: var(--accent);
  --color-accent-ink: var(--accent-ink);
  --shadow-card: var(--shadow-card);
}

body {
  font-family: system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif;
  background: var(--bg);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ── 컴포넌트 클래스 ────────────────────────────────────────── */
@layer components {
  .card {
    border-radius: 16px;
    border: 1px solid var(--line);
    background: var(--surface);
    box-shadow: var(--shadow-card);
  }

  .seg {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface-2);
  }
  .seg button {
    border: none;
    border-radius: 999px;
    padding: 5px 12px;
    font-size: 13px;
    background: transparent;
    color: var(--ink-muted);
    cursor: pointer;
    transition: color 150ms, background-color 150ms;
  }
  .seg button:hover { color: var(--ink); }
  .seg button[data-active="true"] {
    background: var(--surface);
    color: var(--ink);
    font-weight: 600;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    color: var(--ink-muted);
    cursor: pointer;
    transition: color 150ms, background-color 150ms;
  }
  .icon-btn:hover { color: var(--ink); background: var(--surface-2); }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    color: var(--ink-muted);
  }
  .field select {
    height: 36px;
    padding: 0 10px;
    font-size: 14px;
    color: var(--ink);
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
  }

  .btn-primary {
    padding: 8px 18px;
    font-size: 14px;
    font-weight: 600;
    color: var(--accent-ink);
    background: var(--accent);
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: filter 150ms, transform 150ms ease-out;
  }
  .btn-primary:hover { filter: brightness(1.06); }
  .btn-primary:active { transform: scale(0.98); }

  .btn-ghost {
    padding: 8px 14px;
    font-size: 14px;
    font-weight: 500;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 10px;
    cursor: pointer;
    transition: background-color 150ms;
  }
  .btn-ghost:hover { background: var(--surface-2); }

  .choice {
    min-width: 72px;
    padding: 12px 24px;
    font-size: 18px;
    font-weight: 600;
    color: var(--ink);
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    cursor: pointer;
    transition: transform 150ms ease-out, box-shadow 150ms ease-out,
      background-color 150ms, color 150ms, border-color 150ms;
  }
  .choice:hover:enabled { transform: translateY(-1px); box-shadow: var(--shadow-card); }
  .choice[data-state="correct"] { background: var(--mark-correct); border-color: transparent; color: #fff; animation: pop 180ms ease-out; }
  .choice[data-state="wrong"] { background: var(--mark-wrong); border-color: transparent; color: #fff; animation: shake 240ms ease-in-out; }
  .choice:disabled { cursor: default; }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface-2);
    font-size: 12.5px;
    color: var(--ink-muted);
    font-variant-numeric: tabular-nums;
  }
}

/* ── 모션 ──────────────────────────────────────────────────── */
@keyframes pop {
  from { transform: scale(0.92); opacity: 0; }
}
@keyframes shake {
  25% { translate: -3px 0; }
  50% { translate: 3px 0; }
  75% { translate: -2px 0; }
}
@keyframes fade-in {
  from { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ── 지판 SVG ──────────────────────────────────────────────── */
.fretboard { width: 100%; height: auto; display: block; }
.fretboard .note-label { font-size: 11px; font-weight: 700; fill: #fff; }
.fretboard .fret-no { font-size: 12px; fill: var(--ink-muted); font-variant-numeric: tabular-nums; }

.fretboard [role="button"] { outline: none; }
.fretboard [role="button"]:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* ── 구 스타일 (마이그레이션 공존용 — Task 4~7에서 단계 삭제) ── */
main { max-width: 1280px; margin: 0 auto; padding: 20px 24px 48px; }

.topbar {
  display: flex; flex-wrap: wrap; align-items: flex-start; gap: 16px 28px;
  padding-bottom: 16px; border-bottom: 1px solid var(--line); margin-bottom: 24px;
}
.topbar h1 { padding-top: 4px; font-size: 20px; letter-spacing: -0.01em; }

.controls { display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0; }
.controls-top {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px;
  justify-content: space-between;
}
.mode-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; min-height: 36px; }
.controls label { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.controls select, .quiz-settings select {
  font-size: 15px; padding: 6px 10px; border: 1px solid var(--line);
  border-radius: 8px; background: var(--surface); color: inherit;
}

.board { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 20px; }
.view-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; }

.quiz-settings { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; margin-bottom: 16px; }
.quiz-settings label { display: flex; align-items: center; gap: 8px; font-size: 14px; }
button.primary {
  background: var(--accent); color: #fff; border: none; border-radius: 8px;
  padding: 8px 18px; font-size: 15px; cursor: pointer;
}
button.secondary {
  background: var(--surface); color: inherit; border: 1px solid var(--line); border-radius: 8px;
  padding: 8px 18px; font-size: 15px; cursor: pointer;
}
.quiz-answers { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
.quiz-feedback { margin-top: 12px; font-weight: 600; }
.quiz-feedback[data-correct="true"] { color: var(--mark-correct); }
.quiz-feedback[data-correct="false"] { color: var(--mark-wrong); }
.quiz-stats { margin-top: 8px; font-size: 14px; color: var(--ink-muted); }

@media (max-width: 720px) {
  main { padding: 12px; }
  .board { overflow-x: auto; }
  .fretboard { min-width: 900px; }
}
```

주의: 구 `* { box-sizing... }` 리셋과 구 `:root`/`body`/`.seg` 블록은 새 정의로 대체되었으므로 다시 넣지 않는다. 구 `.seg`는 새 컴포넌트 클래스가 즉시 대신한다(테스트는 스타일을 검사하지 않음).

- [ ] **Step 4: 기존 테스트 전체 통과 확인**

Run: `npm test`
Expected: 전체 통과 (CSS는 jsdom 테스트에 영향 없음).

- [ ] **Step 5: 프로덕션 빌드로 Tailwind 파이프라인 검증**

Run: `npm run build`
Expected: 빌드 성공, Tailwind 관련 에러 없음.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json postcss.config.mjs app/globals.css
git commit -m "feat: tailwind v4 setup with dual-theme design tokens"
```

---

### Task 2: 테마 유틸 (src/lib/theme.ts) + FOUC 방지 스크립트

**Files:**
- Create: `src/lib/theme.ts`, `src/lib/theme.test.ts`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: `type ThemePref = "system" | "light" | "dark"`, `type ResolvedTheme = "light" | "dark"`, `THEME_KEY: "fretboard-theme"`, `loadThemePref(): ThemePref`, `saveThemePref(pref: ThemePref): void`, `resolveTheme(pref: ThemePref, systemDark: boolean): ResolvedTheme`, `nextThemePref(pref: ThemePref): ThemePref`, `applyTheme(resolved: ResolvedTheme): void` — Task 3의 ThemeToggle이 사용.

- [ ] **Step 1: 실패하는 테스트 작성 — src/lib/theme.test.ts**

```ts
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  loadThemePref, saveThemePref, resolveTheme, nextThemePref, applyTheme, THEME_KEY,
} from "./theme";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.theme;
});

describe("loadThemePref", () => {
  it("returns system when nothing is stored", () => {
    expect(loadThemePref()).toBe("system");
  });

  it("returns the stored value when valid", () => {
    window.localStorage.setItem(THEME_KEY, "dark");
    expect(loadThemePref()).toBe("dark");
  });

  it("ignores invalid stored values", () => {
    window.localStorage.setItem(THEME_KEY, "neon");
    expect(loadThemePref()).toBe("system");
  });

  it("falls back to system when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadThemePref()).toBe("system");
  });
});

describe("saveThemePref", () => {
  it("stores light/dark and removes the key for system", () => {
    saveThemePref("dark");
    expect(window.localStorage.getItem(THEME_KEY)).toBe("dark");
    saveThemePref("system");
    expect(window.localStorage.getItem(THEME_KEY)).toBeNull();
  });

  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveThemePref("light")).not.toThrow();
  });
});

describe("resolveTheme / nextThemePref / applyTheme", () => {
  it("resolves system by the OS preference", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("explicit prefs override the OS preference", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("cycles system → light → dark → system", () => {
    expect(nextThemePref("system")).toBe("light");
    expect(nextThemePref("light")).toBe("dark");
    expect(nextThemePref("dark")).toBe("system");
  });

  it("applyTheme stamps the resolved theme on <html>", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/theme.test.ts`
Expected: FAIL — "Cannot find module './theme'" 또는 유사 에러.

- [ ] **Step 3: 구현 — src/lib/theme.ts**

```ts
export type ThemePref = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "fretboard-theme";

export function loadThemePref(): ThemePref {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system"; // 저장소 접근 불가 시 시스템 추종으로 동작
  }
}

export function saveThemePref(pref: ThemePref): void {
  if (typeof window === "undefined") return;
  try {
    if (pref === "system") window.localStorage.removeItem(THEME_KEY);
    else window.localStorage.setItem(THEME_KEY, pref);
  } catch {
    // 저장 실패는 무해 — 이번 세션 동안만 적용
  }
}

export function resolveTheme(pref: ThemePref, systemDark: boolean): ResolvedTheme {
  if (pref === "system") return systemDark ? "dark" : "light";
  return pref;
}

export function nextThemePref(pref: ThemePref): ThemePref {
  return pref === "system" ? "light" : pref === "light" ? "dark" : "system";
}

export function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.dataset.theme = resolved;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/theme.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: FOUC 방지 스크립트 — app/layout.tsx 전체 교체**

```tsx
import type { Metadata } from "next";
import { THEME_KEY } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fretboard — i wanna be john mayer",
  description: "기타 지판 스케일/코드톤 시각화 학습 도구",
};

// 페인트 전에 저장된 테마 선호를 해석해 <html data-theme>을 설정 (FOUC 방지).
// 저장소 차단 등 실패 시 시스템 다크 여부만으로 동작.
const THEME_INIT = `(function(){var t="light";try{var p=localStorage.getItem(${JSON.stringify(
  THEME_KEY
)});if(p==="dark"||(p!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches))t="dark"}catch(e){}document.documentElement.dataset.theme=t})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

`suppressHydrationWarning`은 인라인 스크립트가 하이드레이션 전에 `data-theme`을 설정하기 때문에 필요하다.

- [ ] **Step 6: 전체 테스트 + 빌드**

Run: `npm test && npm run build`
Expected: 전체 통과, 빌드 성공.

- [ ] **Step 7: Commit**

```bash
git add src/lib/theme.ts src/lib/theme.test.ts app/layout.tsx
git commit -m "feat: theme preference utils and pre-paint theme init script"
```

---

### Task 3: ThemeToggle 컴포넌트

**Files:**
- Create: `src/components/ThemeToggle.tsx`, `src/components/ThemeToggle.test.tsx`

**Interfaces:**
- Consumes: Task 2의 `@/lib/theme` 전체 export, Task 1의 `.icon-btn` 클래스.
- Produces: `<ThemeToggle />` (props 없음) — Task 4의 헤더가 사용. aria-label은 `테마: 시스템`/`테마: 라이트`/`테마: 다크`.

- [ ] **Step 1: 실패하는 테스트 작성 — src/components/ThemeToggle.test.tsx**

```tsx
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";

function stubMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
}

beforeEach(() => stubMatchMedia(false));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.theme;
});

describe("ThemeToggle", () => {
  it("cycles system → light → dark → system", () => {
    const { getByRole } = render(<ThemeToggle />);
    const btn = getByRole("button", { name: "테마: 시스템" });
    fireEvent.click(btn);
    expect(getByRole("button", { name: "테마: 라이트" })).not.toBeNull();
    fireEvent.click(btn);
    expect(getByRole("button", { name: "테마: 다크" })).not.toBeNull();
    fireEvent.click(btn);
    expect(getByRole("button", { name: "테마: 시스템" })).not.toBeNull();
  });

  it("persists the preference and applies the resolved theme", () => {
    const { getByRole } = render(<ThemeToggle />);
    fireEvent.click(getByRole("button", { name: "테마: 시스템" })); // → light
    expect(window.localStorage.getItem("fretboard-theme")).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    fireEvent.click(getByRole("button", { name: "테마: 라이트" })); // → dark
    expect(window.localStorage.getItem("fretboard-theme")).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("system mode follows the OS preference on mount", () => {
    stubMatchMedia(true); // OS 다크
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/ThemeToggle.test.tsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 — src/components/ThemeToggle.tsx**

```tsx
import { useEffect, useState } from "react";
import {
  applyTheme, loadThemePref, nextThemePref, resolveTheme, saveThemePref, type ThemePref,
} from "@/lib/theme";

const LABELS: Record<ThemePref, string> = {
  system: "테마: 시스템",
  light: "테마: 라이트",
  dark: "테마: 다크",
};

function SystemIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>("system");

  useEffect(() => {
    setPref(loadThemePref()); // SSR 하이드레이션 후 실제 설정 반영
  }, []);

  // 시스템 모드일 때만 OS 테마 변경을 실시간 반영
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyTheme(resolveTheme("system", mq.matches));
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [pref]);

  const cycle = () => {
    const next = nextThemePref(pref);
    setPref(next);
    saveThemePref(next);
    applyTheme(resolveTheme(next, window.matchMedia("(prefers-color-scheme: dark)").matches));
  };

  return (
    <button type="button" className="icon-btn" aria-label={LABELS[pref]} title={LABELS[pref]}
            onClick={cycle}>
      {pref === "system" ? <SystemIcon /> : pref === "light" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/ThemeToggle.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: 전체 테스트**

Run: `npm test`
Expected: 전체 통과.

- [ ] **Step 6: Commit**

```bash
git add src/components/ThemeToggle.tsx src/components/ThemeToggle.test.tsx
git commit -m "feat: three-state theme toggle with system tracking"
```

---

### Task 4: 헤더/컨트롤 바 재구성 — ModeTabs 분리, Controls 슬림화, SoundToggle 아이콘화, 페이지 골격

**Files:**
- Create: `src/components/ModeTabs.tsx`, `src/components/ModeTabs.test.tsx`
- Modify: `src/components/Controls.tsx`(전체 교체), `src/components/Controls.test.tsx`(모드 탭 테스트 이동/교체), `src/components/SoundToggle.tsx`(전체 교체), `app/page.tsx`(전체 교체), `app/globals.css`(구 규칙 삭제)

**Interfaces:**
- Consumes: Task 1의 `.card`/`.seg`/`.field`/`.icon-btn` 클래스, Task 3의 `<ThemeToggle />`.
- Produces:
  - `ModeTabs`: `{ mode: Mode; onSelect: (patch: { mode: Mode; boxIndex: null }) => void }`. `Mode` 타입은 계속 `./Controls`에서 export.
  - `Controls`: props 시그니처 불변. 퀴즈 모드에서는 `null` 반환 (퀴즈 설정은 Quiz가 자체 렌더 — Task 6과의 계약).

- [ ] **Step 1: 실패하는 테스트 작성 — src/components/ModeTabs.test.tsx**

Controls.test.tsx에 있던 모드 탭 동작 3건을 이 파일로 이동한 것이다.

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ModeTabs } from "./ModeTabs";

afterEach(() => cleanup());

describe("ModeTabs", () => {
  it("marks the active tab as pressed", () => {
    const { getByRole } = render(<ModeTabs mode="quiz" onSelect={vi.fn()} />);
    expect(getByRole("button", { name: "퀴즈" }).getAttribute("aria-pressed")).toBe("true");
    expect(getByRole("button", { name: "스케일" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("selecting another mode emits the mode with a boxIndex reset", () => {
    const onSelect = vi.fn();
    const { getByRole } = render(<ModeTabs mode="scale" onSelect={onSelect} />);
    fireEvent.click(getByRole("button", { name: "코드톤" }));
    expect(onSelect).toHaveBeenCalledWith({ mode: "chord", boxIndex: null });
  });

  it("clicking the already-active tab does not emit", () => {
    const onSelect = vi.fn();
    const { getByRole } = render(<ModeTabs mode="scale" onSelect={onSelect} />);
    fireEvent.click(getByRole("button", { name: "스케일" }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/ModeTabs.test.tsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 — src/components/ModeTabs.tsx**

```tsx
import type { Mode } from "./Controls";

const MODES: { id: Mode; label: string }[] = [
  { id: "scale", label: "스케일" },
  { id: "chord", label: "코드톤" },
  { id: "overlay", label: "오버레이" },
  { id: "quiz", label: "퀴즈" },
];

export interface ModeTabsProps {
  mode: Mode;
  onSelect: (patch: { mode: Mode; boxIndex: null }) => void;
}

export function ModeTabs({ mode, onSelect }: ModeTabsProps) {
  const active = MODES.findIndex((m) => m.id === mode);
  return (
    <div className="relative grid grid-cols-4 rounded-full border border-line bg-surface-2 p-1"
         role="group" aria-label="모드">
      {/* 슬라이딩 인디케이터 — 등폭 4칸 전제, 자기 폭 단위 translateX */}
      <span aria-hidden="true"
            className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/4)] rounded-full bg-accent transition-transform duration-200 ease-out"
            style={{ transform: `translateX(${active * 100}%)` }} />
      {MODES.map(({ id, label }) => (
        <button key={id} type="button" data-active={mode === id} aria-pressed={mode === id}
                className="relative z-10 cursor-pointer rounded-full px-3 py-1.5 text-[13px] whitespace-nowrap text-ink-muted transition-colors duration-200 hover:text-ink data-[active=true]:font-semibold data-[active=true]:text-accent-ink sm:px-4"
                onClick={() => mode !== id && onSelect({ mode: id, boxIndex: null })}>
          {label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/ModeTabs.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Controls 슬림화 — src/components/Controls.tsx 전체 교체**

모드 탭 행과 SoundToggle을 제거하고, 필드/세그 스타일로 전환한다. props 시그니처는 불변.

```tsx
import { KEYS, type Key } from "@/theory/notes";
import { SCALES, SCALE_IDS, type ScaleId } from "@/theory/scales";
import { CHORDS, CHORD_IDS, type ChordId } from "@/theory/chords";
import type { LabelMode } from "./Fretboard";

export type Mode = "scale" | "chord" | "overlay" | "quiz";

export interface ControlsProps {
  mode: Mode;
  keySel: Key;
  scaleId: ScaleId;
  chordId: ChordId;
  labelMode: LabelMode;
  boxIndex: number | null;
  boxCount: number | null;   // null = 이 스케일은 박스 미지원 (코드 모드에서도 null 전달)
  overlayRoot: Key;
  onChange: (patch: Partial<Omit<ControlsProps, "onChange" | "boxCount">>) => void;
}

const LABEL_MODES: { id: LabelMode; label: string }[] = [
  { id: "name", label: "음이름" },
  { id: "degree", label: "도수" },
  { id: "none", label: "숨김" },
];

export function Controls({ mode, keySel, scaleId, chordId, labelMode, boxIndex, boxCount, overlayRoot, onChange }: ControlsProps) {
  if (mode === "quiz") return null; // 퀴즈 설정은 Quiz가 자체 렌더

  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
      <label className="field">
        {mode === "chord" ? "루트" : "키"}
        <select id="view-key" value={keySel} onChange={(e) => onChange({ keySel: e.target.value as Key })}>
          {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>

      {(mode === "scale" || mode === "overlay") && (
        <label className="field">
          스케일
          <select id="view-scale" value={scaleId}
                  onChange={(e) => onChange({ scaleId: e.target.value as ScaleId, boxIndex: null })}>
            {SCALE_IDS.map((id) => <option key={id} value={id}>{SCALES[id].name}</option>)}
          </select>
        </label>
      )}

      {mode === "overlay" && (
        <label className="field">
          코드 루트
          <select id="view-chord-root" value={overlayRoot}
                  onChange={(e) => onChange({ overlayRoot: e.target.value as Key })}>
            {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
      )}

      {(mode === "chord" || mode === "overlay") && (
        <label className="field">
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

      <div className="seg" role="group" aria-label="라벨 표시">
        {LABEL_MODES.map(({ id, label }) => (
          <button key={id} type="button" data-active={labelMode === id} aria-pressed={labelMode === id}
                  onClick={() => onChange({ labelMode: id })}>
            {label}
          </button>
        ))}
      </div>

      {mode === "scale" && boxCount !== null && (
        <div className="seg" role="group" aria-label="포지션">
          <button type="button" data-active={boxIndex === null} aria-pressed={boxIndex === null}
                  onClick={() => onChange({ boxIndex: null })}>
            전체
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

- [ ] **Step 6: Controls 테스트 갱신 — src/components/Controls.test.tsx**

모드 탭 3건(ModeTabs로 이동)을 삭제하고, 퀴즈 모드 기대를 "null 렌더"로 교체한다. 파일 전체를 아래로 교체:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { Controls } from "./Controls";

afterEach(() => {
  cleanup();
});

const baseProps = {
  mode: "scale" as const,
  keySel: "A" as const,
  scaleId: "minorPentatonic" as const,
  chordId: "7" as const,
  labelMode: "name" as const,
  boxIndex: null,
  boxCount: 5,
  overlayRoot: "A" as const,
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
});

describe("Controls (quiz mode)", () => {
  it("renders nothing in quiz mode (settings live in Quiz)", () => {
    const { container } = render(<Controls {...baseProps} mode="quiz" />);
    expect(container.firstChild).toBeNull();
  });
});

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

- [ ] **Step 7: SoundToggle 아이콘 버튼화 — src/components/SoundToggle.tsx 전체 교체**

aria-pressed와 `/소리/` 매칭 이름은 유지된다 (기존 SoundToggle.test 계약).

```tsx
import { useEffect, useState } from "react";
import { isSoundEnabled, setSoundEnabled } from "@/audio/tone";

function VolumeOnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="m16 9 5 5M21 9l-5 5" />
    </svg>
  );
}

export function SoundToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(isSoundEnabled()); // SSR 하이드레이션 후 실제 설정 반영
  }, []);

  const toggle = () => {
    setSoundEnabled(!on);
    setOn(!on);
  };

  const label = on ? "소리 켬" : "소리 끔";

  return (
    <button type="button" className="icon-btn" aria-pressed={on} aria-label={label} title={label}
            onClick={toggle}>
      {on ? <VolumeOnIcon /> : <VolumeOffIcon />}
    </button>
  );
}
```

- [ ] **Step 8: 페이지 골격 재구성 — app/page.tsx 전체 교체**

```tsx
"use client";

import { useState, useEffect } from "react";
import { scaleNoteMap, SCALES } from "@/theory/scales";
import { chordNoteMap, CHORDS } from "@/theory/chords";
import { boxesFor } from "@/theory/boxes";
import { playPosition } from "@/audio/tone";
import { Fretboard } from "@/components/Fretboard";
import { Controls } from "@/components/Controls";
import { ModeTabs } from "@/components/ModeTabs";
import { SoundToggle } from "@/components/SoundToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Quiz } from "@/components/Quiz";
import { parseViewQuery, viewQueryString, type UrlViewState } from "@/lib/viewUrl";

const DEFAULT_VIEW: UrlViewState = {
  mode: "scale",
  keySel: "A",
  scaleId: "minorPentatonic",
  chordId: "7",
  labelMode: "name",
  boxIndex: null,
  overlayRoot: "A",
};

function PickIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)" aria-hidden="true">
      <path d="M12 2.5c-3.9 0-7.5 1.6-7.5 4.8 0 4.6 3.7 10.4 7.5 14.2 3.8-3.8 7.5-9.6 7.5-14.2 0-3.2-3.6-4.8-7.5-4.8z" />
    </svg>
  );
}

export default function Home() {
  const [view, setView] = useState<UrlViewState>(DEFAULT_VIEW);

  // 마운트 시 URL → 상태 (SSR/하이드레이션 후 1회)
  useEffect(() => {
    setView(parseViewQuery(window.location.search, DEFAULT_VIEW));
  }, []);

  // 상태 → URL (북마크 가능, 히스토리 오염 없이 replace)
  useEffect(() => {
    const q = viewQueryString(view, DEFAULT_VIEW);
    window.history.replaceState(null, "", q || window.location.pathname);
  }, [view]);

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

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-[color-mix(in_srgb,var(--surface)_82%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <h1 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <PickIcon />
            Fretboard
          </h1>
          <nav className="order-last w-full sm:order-none sm:w-auto sm:flex-1" aria-label="모드 전환">
            <div className="flex sm:justify-center">
              <ModeTabs mode={view.mode} onSelect={(patch) => setView((v) => ({ ...v, ...patch }))} />
            </div>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <SoundToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 pb-12 pt-5 sm:px-6">
        {isQuiz ? (
          <Quiz />
        ) : (
          <>
            {/* key={view.mode}: 모드 전환 시 내용 페이드 재생 */}
            <div key={view.mode}
                 className="card mb-4 min-h-[76px] px-4 py-3 animate-[fade-in_150ms_ease-out]">
              <Controls
                mode={view.mode}
                keySel={view.keySel}
                scaleId={view.scaleId}
                chordId={view.chordId}
                labelMode={view.labelMode}
                boxIndex={view.boxIndex}
                boxCount={boxes ? boxes.length : null}
                overlayRoot={view.overlayRoot}
                onChange={(patch) => setView((v) => ({ ...v, ...patch }))}
              />
            </div>
            <section className="card">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5">
                <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
              </div>
              <div className="board-scroll px-5 py-4">
                <Fretboard
                  notes={notes}
                  labelMode={view.labelMode}
                  window={activeWindow}
                  colorMode={isChord ? "degree" : "root"}
                  overlay={overlayNotes}
                  onNoteClick={playPosition}
                />
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
```

- [ ] **Step 9: 구 CSS 규칙 삭제 — app/globals.css**

"구 스타일" 블록에서 다음 규칙들을 삭제한다 (이번 태스크에서 대체 완료된 것들):
`main { ... }`, `.topbar` 2개 규칙, `.controls`, `.controls-top`, `.mode-controls`, `.controls label`, `.controls select, .quiz-settings select` → `.quiz-settings select`만 남긴다:

```css
.quiz-settings select {
  font-size: 15px; padding: 6px 10px; border: 1px solid var(--line);
  border-radius: 8px; background: var(--surface); color: inherit;
}
```

미디어 쿼리 블록에서 `main { padding: 12px; }` 줄도 삭제한다.

- [ ] **Step 10: 전체 테스트 + 빌드**

Run: `npm test && npm run build`
Expected: 전체 통과 (ModeTabs 3건 신규, Controls 7건, SoundToggle/Quiz/Fretboard 기존 통과), 빌드 성공.

- [ ] **Step 11: Commit**

```bash
git add src/components/ModeTabs.tsx src/components/ModeTabs.test.tsx src/components/Controls.tsx src/components/Controls.test.tsx src/components/SoundToggle.tsx app/page.tsx app/globals.css
git commit -m "feat: sticky app header with mode tabs, slim control bar, icon toggles"
```

---

### Task 5: 스테이지 카드 마감 — Legend 컴포넌트 + 지판 모션

**Files:**
- Create: `src/components/Legend.tsx`, `src/components/Legend.test.tsx`
- Modify: `app/page.tsx` (Legend 추가), `src/components/Fretboard.tsx` (모션 클래스 2곳), `app/globals.css` (board-scroll/모션 추가, `.board`/`.view-title` 삭제)

**Interfaces:**
- Consumes: Task 1의 토큰 변수, Task 4의 스테이지 카드 구조.
- Produces: `Legend`: `{ mode: "scale" | "chord" | "overlay" }`. 항목 라벨 — scale: `루트`/`스케일음`, chord: `루트 (1)`/`3도`/`5도`/`7도`, overlay: chord 항목 + `스케일음`(딤 색).

- [ ] **Step 1: 실패하는 테스트 작성 — src/components/Legend.test.tsx**

```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Legend } from "./Legend";

afterEach(() => cleanup());

describe("Legend", () => {
  it("scale mode shows root and scale-note swatches", () => {
    const { getByText, queryByText } = render(<Legend mode="scale" />);
    expect(getByText("루트")).not.toBeNull();
    expect(getByText("스케일음")).not.toBeNull();
    expect(queryByText("3도")).toBeNull();
  });

  it("chord mode shows degree swatches", () => {
    const { getByText, queryByText } = render(<Legend mode="chord" />);
    for (const label of ["루트 (1)", "3도", "5도", "7도"]) {
      expect(getByText(label)).not.toBeNull();
    }
    expect(queryByText("스케일음")).toBeNull();
  });

  it("overlay mode adds the dimmed scale-note swatch", () => {
    const { getByText } = render(<Legend mode="overlay" />);
    for (const label of ["루트 (1)", "3도", "5도", "7도", "스케일음"]) {
      expect(getByText(label)).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/Legend.test.tsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 — src/components/Legend.tsx**

```tsx
export interface LegendProps {
  mode: "scale" | "chord" | "overlay";
}

interface LegendItem {
  label: string;
  color: string;
  ring?: boolean;
}

const DEGREE_ITEMS: LegendItem[] = [
  { label: "루트 (1)", color: "var(--note-root)", ring: true },
  { label: "3도", color: "var(--tone-3)" },
  { label: "5도", color: "var(--tone-5)" },
  { label: "7도", color: "var(--tone-7)" },
];

function itemsFor(mode: LegendProps["mode"]): LegendItem[] {
  if (mode === "scale") {
    return [
      { label: "루트", color: "var(--note-root)", ring: true },
      { label: "스케일음", color: "var(--note-scale)" },
    ];
  }
  if (mode === "chord") return DEGREE_ITEMS;
  return [...DEGREE_ITEMS, { label: "스케일음", color: "var(--note-dim)" }];
}

export function Legend({ mode }: LegendProps) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1" aria-label="범례">
      {itemsFor(mode).map(({ label, color, ring }) => (
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

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/Legend.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: 페이지에 Legend 연결 — app/page.tsx**

import 추가:

```tsx
import { Legend } from "@/components/Legend";
```

`const title = ...` 선언 아래에 추가:

```tsx
const legendMode = isChord ? "chord" : isOverlay ? "overlay" : "scale";
```

스테이지 카드 헤더의 `<h2 ...>{title}</h2>` 다음 줄에 추가:

```tsx
<Legend mode={legendMode} />
```

- [ ] **Step 6: 지판 모션 클래스 — src/components/Fretboard.tsx**

노트 `<g>`(약 134행, `data-testid={`note-${str}-${fret}`}` 있는 요소)에 `className="note"` 를 추가:

```tsx
<g key={`${str}-${fret}`}
   className="note"
   data-testid={`note-${str}-${fret}`}
```

퀴즈 마크 `<g>`(약 163행, `data-testid={`mark-${str}-${fret}`}` 있는 요소)에 `className="mark"` 를 추가:

```tsx
<g key={`mark-${str}-${fret}`} className="mark" data-testid={`mark-${str}-${fret}`} data-kind={mark.kind}>
```

다른 변경은 하지 않는다.

- [ ] **Step 7: 스테이지 CSS — app/globals.css**

"지판 SVG" 섹션에 추가:

```css
/* 노트 프레스 피드백 + 마크 등장 모션 */
.fretboard .note {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 120ms ease-out;
}
.fretboard .note:active { transform: scale(1.12); }
.fretboard .mark {
  transform-box: fill-box;
  transform-origin: center;
  animation: mark-pop 180ms ease-out;
}
@keyframes mark-pop {
  from { transform: scale(0.6); opacity: 0; }
}

/* 지판 가로 스크롤 컨테이너 (모바일 힌트는 최종 태스크의 미디어 쿼리에서) */
.board-scroll { overflow-x: auto; }
```

"구 스타일" 블록에서 `.board { ... }`, `.view-title { ... }` 규칙을 삭제하고, 미디어 쿼리의 `.board { overflow-x: auto; }` 를 `.board-scroll { overflow-x: auto; }` 로 바꾼다 (기본 규칙과 중복이지만 다음 태스크에서 정리).

- [ ] **Step 8: 전체 테스트 + 빌드**

Run: `npm test && npm run build`
Expected: 전체 통과 (Fretboard 기존 테스트는 testid 기반이라 영향 없음), 빌드 성공.

- [ ] **Step 9: Commit**

```bash
git add src/components/Legend.tsx src/components/Legend.test.tsx src/components/Fretboard.tsx app/page.tsx app/globals.css
git commit -m "feat: stage card legend and fretboard micro-interactions"
```

---

### Task 6: 퀴즈 모드 재구성 — 설정 카드, 선택지/피드백, 스탯 칩

**Files:**
- Modify: `src/components/Quiz.tsx` (렌더 부분 교체, 로직 불변), `app/globals.css` (구 퀴즈 CSS 삭제, 피드백 모션 추가)

**Interfaces:**
- Consumes: Task 1의 `.card`/`.seg`/`.field`/`.btn-primary`/`.btn-ghost`/`.choice`/`.chip`, Task 5의 `.board-scroll`.
- Produces: 없음 (말단 UI). 테스트 계약(Global Constraints의 텍스트/클래스/aria)은 전부 유지.

- [ ] **Step 1: Quiz.tsx 렌더 교체**

import는 그대로 두고, 파일 상단(컴포넌트 함수 밖)에 아이콘 2개를 추가:

```tsx
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
```

훅/핸들러/파생값 로직(`return (` 이전)은 **한 줄도 수정하지 않는다**. `return (...)` JSX 전체를 아래로 교체:

```tsx
  return (
    <>
      <div className="card mb-4 flex min-h-[76px] flex-wrap items-end gap-x-5 gap-y-3 px-4 py-3">
        <div className="field">
          <span>출제 현</span>
          <div className="seg" role="group" aria-label="출제 현">
            {STRINGS.map((s) => (
              <button key={s} type="button" data-active={range.strings.includes(s)}
                      aria-pressed={range.strings.includes(s)}
                      onClick={() => toggleString(s)}>
                {s}번
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>퀴즈 종류</span>
          <div className="seg" role="group" aria-label="퀴즈 종류">
            {QUIZ_MODES.map(({ id, label }) => (
              <button key={id} type="button" data-active={quizMode === id} aria-pressed={quizMode === id}
                      onClick={() => switchQuizMode(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          프렛 범위
          <select id="quiz-fret-max" value={range.fretMax}
                  onChange={(e) => changeFretMax(Number(e.target.value))}>
            {FRET_MAX_OPTIONS.map((f) => <option key={f} value={f}>0~{f}</option>)}
          </select>
        </label>

        <div className="ml-auto flex items-center gap-2 self-end">
          {quizMode === "findAll" && target && !roundOver && (
            <button type="button" className="btn-ghost" onClick={giveUp}>정답 보기</button>
          )}
          <button ref={primaryBtnRef} type="button" className="btn-primary"
                  onClick={quizMode === "nameThatNote" ? ask : startFind}>
            {(quizMode === "nameThatNote" ? question : target) ? "다음 문제" : "시작"}
          </button>
        </div>
      </div>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5">
          <h2 className="text-[17px] font-semibold tracking-tight">
            {quizMode === "nameThatNote"
              ? question ? "이 위치의 음이름은?" : "퀴즈 — 이 음은?"
              : target
                ? `지판에서 모든 ${target.name}을 클릭하세요 (${found.size}/${target.positions.length})`
                : "퀴즈 — 모두 찾기"}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">이번 세션 {session[quizMode].correct}/{session[quizMode].asked}</span>
            {acc !== null && avg !== null && (
              <>
                <span className="chip">누적 정답률 {Math.round(acc * 100)}%</span>
                <span className="chip">평균 {(avg / 1000).toFixed(1)}초</span>
              </>
            )}
          </div>
        </div>

        {quizMode === "findAll" && target && !roundOver && (
          <p className="sr-only">
            지판의 클릭 영역을 Tab으로 이동하고 Enter로 선택하세요. 목표: 모든 {target.name} 찾기.
          </p>
        )}

        <div className="board-scroll px-5 py-4">
          <Fretboard notes={EMPTY_NOTES} labelMode="none" window={null} marks={marks}
                     interactive={quizMode === "findAll" && target !== null && !roundOver}
                     interactivePositions={rangeKeys}
                     onPositionClick={handlePositionClick} activeRegion={range} />
        </div>

        {quizMode === "nameThatNote" && question && (
          <div className="flex flex-wrap gap-3 px-5 pb-4">
            {question.choices.map((c) => (
              <button key={c} type="button" className="choice"
                      data-state={picked === null ? "idle" : c === question.answer ? "correct" : c === picked ? "wrong" : "idle"}
                      disabled={picked !== null}
                      onClick={() => answer(c)}>
                {c}
              </button>
            ))}
          </div>
        )}

        {quizMode === "nameThatNote" && picked !== null && question && (
          <p className="quiz-feedback px-5 pb-4" role="status" data-correct={picked === question.answer}>
            {picked === question.answer ? <CheckIcon /> : <XIcon />}
            {picked === question.answer ? "정답!" : `오답 — 정답은 ${question.answer}`}
          </p>
        )}

        {quizMode === "findAll" && target && roundOver && (
          <p className="quiz-feedback px-5 pb-4" role="status" data-correct={roundComplete && misses.size === 0}>
            {roundComplete && misses.size === 0 ? <CheckIcon /> : <XIcon />}
            {revealed ? "정답 공개" : misses.size === 0 ? "완벽!" : `완료 — 실수 ${misses.size}회`}
          </p>
        )}
      </section>
    </>
  );
```

- [ ] **Step 2: 퀴즈 CSS 정리 — app/globals.css**

"모션" 섹션 근처에 새 피드백 스타일 추가:

```css
.quiz-feedback {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}
.quiz-feedback[data-correct="true"] { color: var(--mark-correct); animation: pop 180ms ease-out; }
.quiz-feedback[data-correct="false"] { color: var(--mark-wrong); animation: shake 240ms ease-in-out; }
```

"구 스타일" 블록에서 다음 규칙을 전부 삭제:
`.quiz-settings`, `.quiz-settings label`, `.quiz-settings select`, `button.primary`, `button.secondary`, `.quiz-answers`, 구 `.quiz-feedback` 3개 규칙, `.quiz-stats`.

- [ ] **Step 3: 전체 테스트 + 빌드**

Run: `npm test && npm run build`
Expected: 전체 통과 — Quiz.test는 role/텍스트/`.choice`/testid 기반이라 그대로 통과해야 한다. 실패 시 텍스트 포맷이 계약과 달라진 것이므로 JSX를 수정한다(테스트 수정 금지).

- [ ] **Step 4: Commit**

```bash
git add src/components/Quiz.tsx app/globals.css
git commit -m "feat: quiz mode redesign — settings card, choice cards, stat chips"
```

---

### Task 7: 잔여 구 CSS 제거 + 모바일/모션 마감 + 최종 검증

**Files:**
- Modify: `app/globals.css`
- Verify: 브라우저에서 라이트/다크 × 4개 모드

**Interfaces:**
- Consumes: 이전 태스크 전부.
- Produces: 최종 상태 (구 스타일 블록 완전 제거).

- [ ] **Step 1: 구 스타일 블록 완전 제거 — app/globals.css**

`/* ── 구 스타일 ... ── */` 주석과 그 아래 남은 규칙 전부(잔여 미디어 쿼리 포함)를 삭제하고, 파일 끝에 최종 모바일 블록을 추가:

```css
/* ── 모바일 ────────────────────────────────────────────────── */
@media (max-width: 720px) {
  .fretboard { min-width: 900px; }
  /* 오른쪽 에지 페이드 — 가로 스크롤 가능함을 암시 (의도된 단순 힌트) */
  .board-scroll {
    mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
  }
}
```

- [ ] **Step 2: 구 클래스 참조 잔존 여부 확인**

Run: `grep -rn "topbar\|view-title\|quiz-settings\|quiz-answers\|quiz-stats\|mode-controls\|controls-top\|className=\"primary\"\|className=\"secondary\"\|\"board\"" src app --include="*.tsx" --include="*.css"`
Expected: 출력 없음 (매치 0건).

- [ ] **Step 3: 전체 테스트 + 빌드**

Run: `npm test && npm run build`
Expected: 전체 통과, 빌드 성공.

- [ ] **Step 4: 브라우저 검증**

Run: `npm run dev` 후 http://localhost:3000 에서 확인:
1. 4개 모드 각각 렌더/전환(탭 인디케이터 슬라이드, 컨트롤 페이드) 확인.
2. 테마 토글 3단 순환 + 새로고침 후 유지(FOUC 없음) 확인.
3. 다크에서 지판/노트/마크 색 대비 확인.
4. 뷰포트 ~390px에서 헤더 랩핑, 지판 가로 스크롤 + 에지 페이드 확인.
5. 퀴즈 두 종류 한 라운드씩: 선택지 상태색, 피드백 모션, 스탯 칩 확인.
6. URL 파라미터(`?mode=chord&key=E` 등) 진입이 그대로 반영되는지 확인.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "chore: remove legacy styles, finish mobile and motion polish"
```
