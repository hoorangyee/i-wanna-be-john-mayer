# 코드 진행 모드 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 코드톤 모드에 진행 토글을 붙여, 현재 코드와 다음 코드를 한 지판에 겹쳐 보며 공통음·반음 이동을 판단할 수 있게 한다.

**Architecture:** 기존 `chordToneMap` 을 두 번 호출해 합성하는 얇은 계층(`src/theory/progression.ts`)을 새로 두고, UI는 "선택된 코드를 기존 컨트롤이 편집"하는 위임 구조로 붙인다. 지판은 노트 렌더링을 단일 시각 스펙으로 통일하고 진행 경로만 순수 함수로 분리한다. 스펙: `docs/superpowers/specs/2026-07-22-chord-progression-design.md`.

**Tech Stack:** Next.js 15 + React 19, TypeScript, Vitest + Testing Library, Tailwind v4 (CSS 토큰).

## Global Constraints

- 진행은 **코드톤 모드 전용**. 스케일·오버레이·퀴즈는 불변.
- `MAX_PROG = 8`, 최소 1개. 마지막 코드의 "다음"은 첫 코드(루프).
- 반음 판정은 **피치클래스 ±1** — 프렛 위치 무관.
- 다음 코드에만 있는 음의 `isRoot` 는 항상 `false`.
- URL: `prog=A:minor:7;D:dominant:7,b9` + `pi=1`. `prog` 존재 = 진행 켜짐.
- 기존 `data-testid` 계약과 일반/오버레이 렌더 결과는 바뀌지 않는다.
- 커밋 메시지 말미: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- 테스트 실행: `npm test -- <파일경로>`. 전체: `npm test`.

---

### Task 1: 이론 — `src/theory/progression.ts`

**Files:** Create `src/theory/progression.ts`, `src/theory/progression.test.ts`

**Interfaces:**
- Consumes: `chordToneMap`, `chordSymbol`, `ChordQuality`, `Extension` (`src/theory/chords.ts`), `Key`, `PitchClass` (`src/theory/notes.ts`)
- Produces: `ProgChord`, `NoteRole`, `ProgNoteInfo`, `MAX_PROG`, `progNoteMap`, `progChordLabel`, `insertAfter`, `removeAt`

- [ ] Step 1: 실패 테스트 — Am7→D7 역할 전수(공통음 C·G, 반음, 그 외), `nextDegree` 병기, `next === null` 전부 `current`, 반음 양방향, 다음 전용 음 `isRoot === false`, `insertAfter`/`removeAt` 배열·인덱스·상한·하한, `progChordLabel`
- [ ] Step 2: 구현
- [ ] Step 3: `npm test -- src/theory/progression.test.ts` 통과 확인 후 커밋

### Task 2: URL — 진행 상태 직렬화

**Files:** Modify `src/lib/viewUrl.ts`, `src/lib/viewUrl.test.ts`

**Interfaces:**
- Consumes: Task 1 의 `ProgChord`, `MAX_PROG`
- Produces: `UrlViewState` 에 `progOn`/`prog`/`progIndex` 추가

- [ ] Step 1: 실패 테스트 — 왕복, `F#`·`#9` 인코딩, 잘못된 항목만 탈락, 퀄리티별 테션 필터, 8개 절단, `pi` 클램프, 비-코드 모드 미출력, 유효 0개 → `progOn: false`
- [ ] Step 2: 구현 (`parseProgChords`/`serializeProgChords` 내부 헬퍼)
- [ ] Step 3: 테스트 통과 후 커밋

### Task 3: 색 토큰 + 노트 시각 스펙

**Files:** Modify `app/globals.css`, Create `src/components/noteVisual.ts`, `src/components/noteVisual.test.ts`

**Interfaces:**
- Produces: `--prog-common`/`--prog-half`/`--prog-other` (라이트·다크), `NoteVisual`, `progNoteVisual(info, labelMode)`

- [ ] Step 1: 실패 테스트 — 역할 4종의 fill/opacity/ring/dash, 공통음 2줄 라벨은 `labelMode === "degree"` 에서만, 이름 보기는 단일 라벨, 끄기는 라벨 없음
- [ ] Step 2: 구현 (2줄 라벨용 CSS 클래스 포함)
- [ ] Step 3: 테스트 통과 후 커밋

### Task 4: 지판 렌더링

**Files:** Modify `src/components/Fretboard.tsx`, `src/components/Fretboard.test.tsx`

**Interfaces:**
- Consumes: Task 1 `ProgNoteInfo`, Task 3 `progNoteVisual`
- Produces: `FretboardProps.progression`

- [ ] Step 1: 실패 테스트 — `progression` 전달 시 `data-role` 부여, 공통음 안쪽 링·반지름 13, 고스트 점선, 기존 일반/오버레이 스냅샷 불변
- [ ] Step 2: 노트 `<g>` 를 단일 시각 스펙으로 통일하고 진행 분기 추가
- [ ] Step 3: `npm test -- src/components/Fretboard.test.tsx` 통과 후 커밋

### Task 5: i18n + 범례

**Files:** Modify `src/lib/i18n.ts`, `src/components/Legend.tsx`, `src/components/Legend.test.tsx`, `src/components/langSwitch.test.tsx`

**Interfaces:**
- Produces: 신규 메시지 키 10종, `LegendProps.mode` 에 `"progression"`, `LegendItem.variant`

- [ ] Step 1: 실패 테스트 — progression 범례가 도수 항목 + 역할 3개를 내고, KO 표시명이 바뀐다
- [ ] Step 2: 구현
- [ ] Step 3: 테스트 통과 후 커밋

### Task 6: 진행 바 컴포넌트

**Files:** Create `src/components/ProgressionBar.tsx`, `src/components/ProgressionBar.test.tsx`

**Interfaces:**
- Consumes: Task 1 `ProgChord`/`progChordLabel`/`MAX_PROG`, Task 5 메시지
- Produces: `ProgressionBar({ prog, index, onSelect, onInsert, onRemove })`

- [ ] Step 1: 실패 테스트 — 칩 렌더/`aria-pressed`, 선택 콜백, ＋·삭제 콜백과 disabled 조건, 길이 1 힌트, ←/→ 순환, `SELECT` 포커스·수정키 가드
- [ ] Step 2: 구현 (window keydown 구독은 이 컴포넌트가 소유)
- [ ] Step 3: 테스트 통과 후 커밋

### Task 7: 컨트롤 토글 + 페이지 배선

**Files:** Modify `src/components/Controls.tsx`, `src/components/Controls.test.tsx`, `app/page.tsx`

**Interfaces:**
- Consumes: Task 1·2·4·6 전부
- Produces: 진행 토글, 편집 대상 위임, 제목, ProgressionBar 배치

- [ ] Step 1: 실패 테스트 — 토글이 코드톤 모드에만 렌더되고 패치를 올린다
- [ ] Step 2: `Controls` 토글 + `page.tsx` 위임 로직(`setView` 콜백 안에서 `progActive` 재판정)
- [ ] Step 3: `npm test` 전체 통과 + `npm run build` 후 커밋

### Task 8: README 갱신

**Files:** Modify `README.md`

- [ ] Step 1: 기능 목록에 진행 모드 항목 추가
- [ ] Step 2: 커밋
