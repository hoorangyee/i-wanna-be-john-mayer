# 코드톤 확장 표시 디자인 스펙 — 퀄리티 + 7th/9th/11th 선택 표시

- 날짜: 2026-07-17
- 상태: 사용자 승인 완료 (모델/퀄리티/토글 의미/오버레이 적용 4문항 + 섹션 승인)
- 선행: UI 재설계 + i18n 애드엔덤 (완료 상태에서 확장)

## 1. 요구사항

코드톤 모드에서 루트·3rd·5th(트라이어드)는 항상 표시하고, 7th/9th/11th는 사용자가 선택적으로 표시한다.

사용자 결정:
1. 코드 모델을 **퀄리티 + 확장**으로 재편 (기존 maj/m/7/maj7/m7 5종 어휘 제거).
2. 퀄리티는 **Major / Minor / Dominant** 3종. Dominant는 확장 미선택 시 메이저 트라이어드와 동일하게 보이는 것 허용.
3. 확장 토글은 **독립 표시 토글** — 체크된 것만 표시(트라이어드는 항상). 9만 켜면 add9 형태.
4. **오버레이 모드에도 동일 모델** 적용 (코드 레이어 = 코드 루트 + 퀄리티 + 확장).

## 2. 이론 계층 (`src/theory/chords.ts` 재편)

```
ChordQuality = "major" | "minor" | "dominant"      QUALITIES 순서: major, minor, dominant
Extension    = "7" | "9" | "11"                    EXTENSIONS 순서: 7, 9, 11
```

- 트라이어드(항상 포함): 1도(0), 3도(major/dominant: 4 → 라벨 `3`, minor: 3 → 라벨 `b3`), 5도(7 → 라벨 `5`).
- 7th(토글): major → 장7(11, 라벨 `7`), minor·dominant → 단7(10, 라벨 `b7`).
- 9th(토글): 장9 — 피치클래스 루트+2, 라벨 `9`. 11th(토글): 완전11 — 루트+5, 라벨 `11`. 퀄리티 무관 고정(#11, b9 등 변형 텐션은 명시적 비목표).
- `chordNoteMap(root: Key, quality: ChordQuality, exts: ReadonlySet<Extension>): Map<PitchClass, NoteInfo>` — 체크된 확장만 포함. NoteInfo 형태(name/degree/isRoot)와 키 표기 규칙은 기존 그대로.
- 심볼 합성 `chordSymbol(quality, exts)`:
  - 베이스: major `""` / minor `"m"` / dominant `""`, 7 켜짐 시 각각 `"maj7"` / `"m7"` / `"7"`.
  - 9·11: 7 켜짐 → `7(9)`, `maj7(9,11)` 형식. 7 꺼짐 → `(add9)`, `(add9,add11)` 형식. 없으면 베이스만.
  - 예: dominant+{7,9} → `7(9)` (타이틀 "A7(9)"), major+{9} → `(add9)` ("A(add9)"), minor+{} → `m` ("Am").
- 기존 `CHORDS`/`CHORD_IDS`/`ChordId` 제거. 소비자(Controls/page/viewUrl/i18n)가 함께 전환된다.

## 3. URL 상태 (`src/lib/viewUrl.ts`)

- `UrlViewState`: `chordId` 제거 → `quality: ChordQuality`, `exts: ReadonlySet<Extension>` 추가.
- 파라미터: `quality=major|minor|dominant`(기본 dominant는 생략), `ext=7,9,11`(활성만 콤마, 없으면 생략). 유효하지 않은 값은 무시. 직렬화는 항상 `EXTENSIONS` 순서(7,9,11)로 정규화하고, 파서는 임의 순서·중복을 허용한다.
- 직렬화 조건: 기존 규칙 계승 — `quality`/`ext`는 chord·overlay 모드에서만 출력.
- 기본값: `quality: "dominant"`, `exts: {}`(전부 꺼짐) → 기본 화면은 1·3·5.
- **레거시 마이그레이션**: 구 `chord` 파라미터를 표시 결과 보존 방향으로 해석 — `maj→major+{}`, `m→minor+{}`, `7→dominant+{7}`, `maj7→major+{7}`, `m7→minor+{7}`. 새 파라미터와 공존 시 새 파라미터 우선. 직렬화는 항상 새 형식.

## 4. UI

- **컨트롤 바(코드톤·오버레이 공통)**: 코드 셀렉트 → 퀄리티 셀렉트(3종 표시명) + 확장 필 토글 seg(7th·9th·11th, 다중 선택, 퀴즈 출제 현 토글과 동일 패턴, `aria-pressed`).
- 확장 토글 그룹 aria-label: `Extensions` / `확장`. 토글 버튼 표기: `7th`·`9th`·`11th`(양 언어 동일).
- **타이틀**: `{key}{symbol} — {qualityName} Chord Tones` / `… 코드톤`. 오버레이: `{key} {scale} + {root}{symbol} Chord Tones`.
- **범례**: 코드톤·오버레이에서 Root(1)/3rd/5th 고정 + 활성 확장만 항목 추가 — 7th(퀄리티 무관 동일 라벨)/9th/11th (ko: 7도/9도/11도). `Legend` props: `mode` + `exts`.
- **색상**: 신규 토큰 `--tone-9`, `--tone-11` 라이트/다크 두 벌. Fretboard `TONE_FILL`에 `"9"`, `"11"` 매핑 추가. `b7`은 기존 b-스트립 규칙으로 `--tone-7` 사용(기존 동작). 노트/마크 기존 색 불변.
  - 라이트: `--tone-9: #b0813a`(앰버 톤), `--tone-11: #3e8f96`(틸 톤) — 기존 3(그린)/5(블루)/7(퍼플)과 구분되는 계열.
  - 다크: `--tone-9: #c29347`, `--tone-11: #4a9ea6`.
- **i18n**: `CHORD_NAMES` → `QUALITY_NAMES: Record<Lang, Record<ChordQuality, string>>` (Major/Minor/Dominant · 메이저/마이너/도미넌트). 신규 키: 확장 그룹 라벨, 범례 7th/9th/11th(9도 등), 확장 토글 표기.

## 5. 테스트 전략

- 이론 TDD: 퀄리티별 트라이어드/7th 인터벌·도수 라벨, 확장 조합, 심볼 합성 규칙 전체 케이스.
- viewUrl TDD: 새 파라미터 왕복, 레거시 5종 마이그레이션, 무효값 무시, 모드별 직렬화 조건.
- Controls: 퀄리티 셀렉트·확장 토글 렌더/이벤트. Legend: 확장 조건부 항목. langSwitch: 퀄리티 KO 표시명.
- 불변: 퀴즈/스케일 모드 동작·테스트, 테마/사운드/언어 토글, `data-testid` 계약.

## 6. 비목표

- 변형 텐션(b9/#9/#11/13) 없음. 누적 스태킹(9→7 자동) 없음. 퀴즈에 코드톤 문제 추가 없음. 박스(포지션) 기능의 코드 모드 확장 없음.
