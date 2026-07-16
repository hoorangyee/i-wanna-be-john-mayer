# 컬러톤 교체 + i18n(영어 기본/언어 토글) 디자인 스펙 — UI 재설계 애드엔덤

- 날짜: 2026-07-17
- 상태: 사용자 승인 완료 (방향 3문항 + 설계 요약 승인)
- 선행: docs/superpowers/specs/2026-07-16-ui-redesign-design.md (구현 완료 상태에서 확장)

## 1. 요구사항

1. 현재 컬러톤(웜 크림 + 테라코타 오렌지)이 Claude 브랜딩과 유사 → **쿨 뉴트럴 + 인디고 액센트**로 교체.
2. 지판 노트/마크 색상은 **그대로 유지** (사용자 결정 — 악기 영역 웜 톤 유지).
3. 기본 언어를 **영어**로, 헤더에 **EN/KO 언어 토글** 추가. 번역 범위는 **전체 UI**(컨트롤·퀴즈·범례·aria·sr 안내·스케일/코드 표시명 포함).

## 2. 컬러 토큰 (globals.css 값만 교체, 변수명 불변)

### 라이트 (쿨 뉴트럴)
- `--bg: #f6f7f9` / `--surface: #ffffff` / `--surface-2: #eef0f4` / `--line: #e2e5ea`
- `--ink: #1f2430` / `--ink-muted: #6b7280`
- `--accent: #4f46e5`(인디고 600) / `--accent-ink: #ffffff`
- `--shadow-card: 0 1px 2px rgb(31 36 48 / 0.04), 0 4px 16px rgb(31 36 48 / 0.06)`

### 다크 (쿨 차콜/슬레이트)
- `--bg: #14161c` / `--surface: #1c1f27` / `--surface-2: #242834` / `--line: #323848`
- `--ink: #e6e8ee` / `--ink-muted: #9aa1b0`
- `--accent: #818cf8`(인디고 400) / `--accent-ink: #14161c` (밝은 액센트 위 다크 잉크로 대비 확보)
- `--shadow-card: 0 0 0 1px rgb(255 255 255 / 0.04)`

### 불변
- `--fb-*`, `--note-*`, `--tone-*`, `--mark-*` 라이트/다크 값 전부 유지.
- PickIcon 등 `var(--accent)` 참조 요소는 자동으로 인디고 전환. 루트 오렌지는 액센트와 더 이상 겹치지 않아 시맨틱이 더 명확해짐.

## 3. i18n 아키텍처

- `src/lib/i18n.ts` (신규): `type Lang = "en" | "ko"`, `LANG_KEY = "fretboard-lang"`, `loadLang()`(기본 `"en"`, 저장소 차단 가드), `saveLang()`, 타입드 메시지 사전 `MESSAGES: Record<Lang, Messages>`(파라미터 문자열은 함수), `SCALE_NAMES`/`CHORD_NAMES: Record<Lang, Record<ScaleId|ChordId, string>>` — **이론 파일은 계속 불변**, 표시명만 i18n 계층에서 매핑. `Record` 키 타입으로 누락이 컴파일 에러가 되게 한다.
- `src/lib/LangContext.tsx` (신규): `LangProvider`(마운트 후 `loadLang()` 반영 — SSR 하이드레이션 안전, `document.documentElement.lang` 동기화, `setLang`이 저장까지) + `useLang()`. **Provider 없이는 `"en"` 기본** — 컴포넌트 단독 렌더 테스트가 영어 기본으로 동작.
- `src/components/LangToggle.tsx` (신규): EN ↔ KO 토글 버튼(`.icon-btn` 변형), aria-label은 `Language: English` / `언어: 한국어`. 헤더 우측 그룹(사운드·테마 토글 옆)에 배치.
- `app/layout.tsx`: `<html lang="en">` 기본, description 영어로.
- 모든 컴포넌트(page, ModeTabs, Controls, Quiz, SoundToggle, ThemeToggle, Legend, Fretboard)가 `useLang()` + 사전으로 문자열 해석. 하드코딩 한국어 제거.

## 4. 영어 카피 (확정)

- 모드: Scale / Chord Tones / Overlay / Quiz · nav aria `Mode switcher` · group aria `Mode`
- 필드: Key / Root / Scale / Chord Root / Chord · 라벨 그룹 `Labels`: Names / Degrees / Off · 포지션 그룹 `Position`: All, 1..5
- 범례 aria `Legend`: Root / Root (1) / Scale notes / 3rd / 5th / 7th
- 지판 aria `Guitar fretboard` · 히트 타겟 `String {str}, fret {fret}`
- 사운드 `Sound on`/`Sound off` · 테마 `Theme: System|Light|Dark`
- 퀴즈: 그룹 `Strings`(버튼은 숫자만) / `Quiz Type`: Name That Note · Find All / `Fret Range`: `0–{f}`
- 버튼: Start / Next / Show Answers
- 헤딩: `Quiz — Name That Note` / `What note is this?` / `Quiz — Find All` / `Click every {name} on the fretboard ({found}/{total})`
- 피드백: `Correct!` / `Wrong — it was {answer}` / `Answers revealed` / `Perfect!` / `Done — {n} misses`
- 스탯 칩: `Session {c}/{a}` / `Accuracy {p}%` / `Avg {s}s`
- 타이틀: `{key} {scale}` (+ ` — Box {n}`) / `{key}{symbol} — {chord} Chord Tones` / `{key} {scale} + {root}{symbol} Chord Tones`
- SR 안내: `Move between fretboard targets with Tab and press Enter to select. Goal: find every {name}.`
- 스케일명: Major / Natural Minor / Minor Pentatonic / Major Pentatonic / Blues · 코드명: Major / Minor / Dominant 7 / Major 7 / Minor 7 (심볼은 언어 무관)
- 한국어 카피는 기존 문구 그대로 사전의 `ko`로 이동.

## 5. 테스트 전략

- **기존 테스트를 영어 기본으로 갱신** (Provider 없는 단독 렌더 = en). 한국어 문자열 어서션은 대응 영어 문자열로 치환. `data-testid`/구조/스토리지 키 어서션은 불변.
- 신규: i18n 유닛(loadLang 기본/유효값/차단 가드, saveLang), LangToggle(전환/저장/aria), KO 통합(저장된 `ko`로 LangProvider 하 렌더 시 한국어 라벨).
- 브라우저 검증: 새 팔레트 라이트/다크, EN 기본 로드, KO 전환·새로고침 유지, `html lang` 동기화.

## 6. 비목표

- 지판 노트/마크 색상 변경 없음. 이론/퀴즈/오디오/viewUrl 로직 변경 없음. URL 스키마에 언어 미포함(스토리지만). 서드파티 i18n 라이브러리 도입 없음.
