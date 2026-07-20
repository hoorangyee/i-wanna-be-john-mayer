import type { ScaleId } from "@/theory/scales";
import type { ChordQuality } from "@/theory/chords";

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
  legendNinth: string; legendEleventh: string;
  extensions: string;
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
    legendNinth: "9th", legendEleventh: "11th", extensions: "Extensions",
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
    legendNinth: "9도", legendEleventh: "11도", extensions: "확장",
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
