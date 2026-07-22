# 코드 진행 모드 디자인 스펙 — 코드톤을 이어서 보며 연결을 고민하기

- 날짜: 2026-07-22
- 상태: 사용자 승인 완료 (표시 방식/입력 방식/모드 위치/이동 방식/보이스리딩 깊이/도수 라벨 6문항 + 동작 섹션 승인)
- 선행: 변형 텐션 + 퀄리티 확장 (완료 상태에서 확장)

## 1. 요구사항

코드톤 모드에서 **여러 코드를 이어서** 보며, "이 코드에서 다음 코드로 어떻게 넘어갈지"를 지판 위에서 고민할 수 있게 한다.

사용자 결정:

1. **표시**: 프렛보드는 하나. 현재 코드를 진하게, 다음 코드를 고스트로 **같은 지판에 겹쳐** 표시.
2. **입력**: 프리셋 없이 루트+퀄리티+테션으로 **직접 코드를 추가**해 진행을 만든다.
3. **위치**: 상단 탭은 4개 그대로. **코드톤 모드 안의 토글**로 진입한다.
4. **이동**: 자동 재생 없이 **수동만** — 칩 클릭 또는 ←/→ 키.
5. **보이스리딩 깊이**: 고스트만 깔지 않고 **공통음 / 반음 이동 / 그 외**를 구분한다. 화살표는 그리지 않는다(22프렛 전체에 수십 개가 깔려 지저분해짐).
6. **도수 라벨**: 공통음은 **양쪽 도수를 병기**한다(`♭3` 위 / `♭7` 아래). 나머지는 속한 코드 기준 단일 도수.

## 2. 이론 계층 (`src/theory/progression.ts` 신규)

```ts
export interface ProgChord { root: Key; quality: ChordQuality; exts: readonly Extension[]; }
export type NoteRole = "current" | "common" | "half" | "other";
export interface ProgNoteInfo {
  name: string; degree: string; isRoot: boolean;
  role: NoteRole;
  nextDegree: string | null;   // role === "common" 일 때만 채움
}
export const MAX_PROG = 8;
export function progNoteMap(current: ProgChord, next: ProgChord | null): Map<PitchClass, ProgNoteInfo>
export function progChordLabel(c: ProgChord): string                       // "Am7"
export function insertAfter(prog, index): { prog: ProgChord[]; index: number }
export function removeAt(prog, index): { prog: ProgChord[]; index: number }
```

`progNoteMap` 규칙 — 기존 `chordToneMap`을 두 번 호출해 합성한다(코드 이론 로직 중복 없음):

- 현재 코드의 각 피치클래스: 다음 코드에도 있으면 `common`(+`nextDegree`), 없으면 `current`.
- 다음 코드에만 있는 피치클래스: 현재 코드 음 중 **피치클래스 ±1** 이 있으면 `half`, 아니면 `other`.
  - 반음 판정은 프렛 위치가 아니라 **피치클래스 기준** — 지판 전체에서 판정이 일관된다.
- `name`/`degree`/`isRoot`는 그 음이 **속한 코드** 기준(공통음은 현재 코드 기준). 다음 코드에만 있는 음의 `isRoot`는 항상 `false` — 루트 링의 의미를 "현재 코드의 루트" 하나로 유지한다.
- `next === null`(코드 1개)이면 전부 `current` — 일반 코드톤 모드와 동일한 그림.

`insertAfter` — 선택된 코드의 **사본을 바로 뒤에** 넣고 새 인덱스를 반환. `MAX_PROG` 도달 시 원본 그대로 반환.
`removeAt` — 길이 1이면 원본 그대로. 새 인덱스는 `min(index, newLength - 1)`.

이 둘이 있으면 **중간 삽입 + 삭제**로 어떤 진행이든 만들 수 있어 순서 변경 UI는 비목표.

## 3. URL 상태 (`src/lib/viewUrl.ts`)

`UrlViewState` 추가 필드: `progOn: boolean`, `prog: readonly ProgChord[]`, `progIndex: number`.
기본값: `progOn: false`, `prog: []`, `progIndex: 0`.

파라미터:

- `prog=A:minor:7;D:dominant:7,b9;G:major:7` — `;` 로 코드 구분, `:` 로 `루트:퀄리티:테션`, 테션은 `,` 구분. 테션이 없으면 세 번째 필드를 생략(`A:minor`).
- `pi=1` — 선택 인덱스. 0이면 생략.
- `prog` 존재 = 진행 켜짐. `progOn`을 위한 별도 파라미터는 두지 않는다.

파싱 검증:

- 루트는 `KEYS`, 퀄리티는 `QUALITIES` 에 있어야 하며, 하나라도 어긋난 항목은 **그 코드만 버린다**.
- 테션은 `EXTENSIONS` 로 거르고 `allowedExts(quality)` 로 한 번 더 거른 뒤 `normalizeExts` 로 정렬(단일 코드 모드와 동일 규칙).
- `MAX_PROG` 초과분은 잘라낸다. 유효 코드가 0개면 `progOn: false`, `prog: []`.
- `pi`는 `[0, prog.length - 1]` 로 클램프.

직렬화: `mode === "chord" && progOn && prog.length > 0` 일 때만 `prog`/`pi` 출력. `F#`·`#9` 의 `#` 는 `URLSearchParams` 가 `%23` 로 인코딩하고 파싱 시 되돌린다.

**세션 내 토글 보존**: 진행을 끄면 URL에서 `prog` 가 빠지지만 `prog` 배열은 React 상태에 남는다 — 껐다 켜도 목록이 살아 있다. 끈 상태로 새로고침/공유하면 목록은 사라진다(의도된 트레이드오프: 꺼진 상태의 URL에 목록 노이즈를 남기지 않는다).

## 4. 편집 대상 위임 (`app/page.tsx`)

진행이 켜져 있으면 **기존 루트/퀄리티/테션 컨트롤이 선택된 코드의 편집기**가 된다. `Controls` 의 props 계약은 그대로 두고, 페이지가 읽기/쓰기 양방향을 매핑한다.

```ts
const progActive = view.mode === "chord" && view.progOn && view.prog.length > 0;
const editing = progActive ? view.prog[view.progIndex]
                           : { root: view.keySel, quality: view.quality, exts: view.exts };
```

`onChange(patch)` 처리 — `progActive` 는 `setView` 콜백 안의 최신 상태로 다시 판정한다(스테일 클로저 방지):

- `keySel`/`quality`/`exts` 가 패치에 있으면 `prog[progIndex]` 에 반영.
- 나머지 필드(`labelMode` 등)는 종전대로 최상위에 반영.
- 퀄리티 변경 시 `Controls` 가 이미 `exts` 를 함께 걸러 보내므로 한 패치로 처리된다.

진행 토글 켜기: `progOn: true`, `prog` 가 비어 있으면 현재 단일 코드를 첫 항목으로 시딩(`[{ root: keySel, quality, exts }]`), `progIndex: 0`.

## 5. UI

### 5.1 진행 토글 (`Controls`)

코드톤 모드에서만(오버레이 제외) 렌더. 기존 `seg` 패턴을 따르는 단일 토글 버튼, `aria-pressed`. 라벨 `Progression` / `진행`.

### 5.2 진행 바 (`ProgressionBar` 신규)

컨트롤 카드 안, 컨트롤 줄 아래에 렌더한다(`page.tsx` 가 배치, `Controls` 는 건드리지 않음).

```
진행   [Am7] [D7] [Gmaj7]        [＋] [삭제]
        선택된 칩은 data-active
```

- 칩은 `role="group"` + `aria-pressed` 버튼 — 레포의 기존 seg 컨트롤(라벨/포지션/테션)과 동일 패턴.
- 칩 aria-label: `Chord 2: D7` / `2번 코드: D7`.
- `＋`: `MAX_PROG` 도달 시 `disabled`. `삭제`: 길이 1이면 `disabled`.
- 길이 1이면 힌트 문구 표시: "코드를 하나 더 추가하면 연결이 보입니다."
- **키보드 ←/→**: `ProgressionBar` 가 `window` keydown 을 구독한다(내비게이션의 소유자). `INPUT`/`SELECT`/`TEXTAREA` 에 포커스가 있거나 `meta`/`ctrl`/`alt` 가 눌려 있으면 무시. 양끝에서 순환.
- 칩 목록은 `flex-wrap` — 8개가 모바일에서 줄바꿈된다.

### 5.3 지판 (`Fretboard`)

새 prop `progression?: ReadonlyMap<PitchClass, ProgNoteInfo>`. 주어지면 노트 레이어를 이쪽이 담당하고 `notes`/`overlay` 는 무시된다(상호 배타).

역할별 표현 — **불투명도 = 지금이냐 다음이냐**, **링 = 얼마나 움직이나**:

| 역할 | 채움 | 채움 불투명도 | 링 |
|---|---|---|---|
| `current` | 도수 색 | 1 | — |
| `common` | 도수 색(현재 코드 기준) | 1 | 원 **바깥** 후광 링 `--prog-common` (r+2.5) |
| `half` | 도수 색(다음 코드 기준) | 0.3 | 원 테두리 실선 링 `--prog-half` |
| `other` | 도수 색(다음 코드 기준) | 0.3 | 원 테두리 **점선** 링 `--prog-other` |

고스트는 원 전체가 아니라 **채움만** 옅게 한다 — 링은 불투명하게 남아 윤곽이 또렷하다. 대신 흰 라벨이 읽히지 않으므로 고스트 라벨은 `var(--ink)` 로 칠한다(CSS `.note-label` 이 `fill` 속성을 이기므로 `style` 로 지정).

루트 링(원 테두리 `--note-root-ring`)과 충돌하지 않는다: 고스트는 정의상 현재 코드 루트가 될 수 없고, 공통음 후광은 원 **바깥**에 있다.

> 후광을 원 안쪽에 두는 안을 먼저 구현했으나 2줄 라벨을 관통해 읽히지 않았다. 바깥으로 빼면서 반지름을 12로 통일했다(안쪽 여백 전부를 라벨이 쓴다). 후광 색도 도수 색이 아니라 **보드 배경**과 대비를 잡아야 하므로 흰색이 아닌 잉크 톤이다.

`data-role={role}` 을 `<g>` 에 붙여 테스트/디버깅 계약으로 삼는다.

**JSX 통합**: 현재 노트 렌더링을 `{fill, stroke, strokeWidth, dash, radius, opacity, innerRing, primary, secondary, layer, role}` 한 형태로 통일한다. 기존 일반/오버레이 경로는 `innerRing: false, dash: none, radius: 12, secondary: null` 로 떨어져 **동작이 바뀌지 않는다**. 진행 경로의 계산만 `src/components/noteVisual.ts` 의 순수 함수 `progNoteVisual(info, labelMode)` 로 분리해 단위 테스트한다.

### 5.4 도수 라벨 2줄 (공통음 · 도수 보기일 때만)

- `primary` = 현재 코드 도수, `y = cy - 2`, 10px
- `secondary` = 다음 코드 도수, `y = cy + 7`, 8px, opacity .85
- 반지름은 12 고정 — 후광이 바깥으로 나가면서 원 안쪽이 통째로 라벨 몫이 됐다.
- 음이름 보기에서는 같은 음이므로 이름 하나만 — 2줄 문제가 없다. 끄기 모드에서는 라벨 없음.

### 5.5 제목 · 범례

- 제목: `titleProgression(current, next, i, total)` → `Am7 → D7 · 2/4`. 코드 1개면 `Am7 · 1/1`.
- 범례: `Legend` 의 `mode` 에 `"progression"` 추가. **현재 코드 기준 도수 항목(기존 로직 재사용) + 역할 항목 3개**(공통음 / 반음 이동 / 그 외)를 함께 표시한다. "현재 코드"는 기본값이라 범례에서 생략. `LegendItem` 에 `variant?: "inner" | "half" | "other"` 를 더해 안쪽 링·실선 링·점선 링을 미리보기 점에 반영한다.

### 5.6 색 토큰

`--prog-common`, `--prog-half`, `--prog-other` 를 라이트/다크 두 벌 추가. 기존 팔레트 대비 규칙(WCAG AA)을 따르며, 도수 색 위에 얹히는 링이므로 배경이 아닌 **선 대비**로 판단한다.

### 5.7 i18n 신규 키

`progToggle`, `progGroup`, `progAdd`, `progRemove`, `progHint`, `progChipLabel(i, label)`, `legendCommon`, `legendHalf`, `legendOther`, `titleProgression`.

## 6. 테스트 전략

- **이론 TDD** (`progression.test.ts`): Am7→D7 역할 분류 전수, `nextDegree` 병기, `next === null`, 반음 판정 양방향(pc±1), 이명동음 경계(#11/b5), `insertAfter`/`removeAt` 의 배열·인덱스, `MAX_PROG` 상한, 최소 1개 보장, `progChordLabel`.
- **URL TDD** (`viewUrl.test.ts` 추가): `prog`/`pi` 왕복, `F#`·`#9` 인코딩 통과, 잘못된 루트·퀄리티 항목만 탈락, 퀄리티별 테션 필터, 8개 상한 절단, `pi` 클램프, 비-코드 모드에서 미출력, 유효 코드 0개 → 진행 꺼짐.
- **`noteVisual.test.ts`**: 역할 4종의 시각 스펙, 공통음 2줄 라벨은 도수 보기에서만.
- **`ProgressionBar.test.tsx`**: 칩 렌더/선택, ＋·삭제 콜백과 disabled 조건, 길이 1 힌트, ←/→ 순환, 입력 포커스·수정키 가드.
- **`Fretboard.test.tsx` 추가**: `progression` 전달 시 `data-role` 부여, 공통음 반지름·안쪽 링.
- **`Controls.test.tsx` 추가**: 진행 토글이 코드톤 모드에만 렌더되고 패치를 올린다.
- **`Legend.test.tsx` 추가**: progression 모드의 역할 항목 3개.
- **불변**: 스케일/오버레이/퀴즈 동작과 기존 테스트, 기존 `data-testid` 계약, 테마·사운드·언어 토글.

## 7. 비목표

- 자동 재생·템포·마디 수 (사용자가 수동만 선택).
- 프리셋 진행(ii-V-I, 12마디 블루스) 및 텍스트 파싱 입력.
- 순서 변경(드래그/이동 버튼) — 중간 삽입 + 삭제로 대체.
- 보이스리딩 화살표.
- 오버레이 모드에서의 진행(스케일 위 진행) — 코드톤 모드 전용.
- 진행 전체 아르페지오 사운드 재생. 노트 클릭 재생은 기존대로 유지.
