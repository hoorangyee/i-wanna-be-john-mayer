import { KEYS, type PitchClass } from "@/theory/notes";
import { FRET_COUNT, STRINGS, pitchAt, type FretPos, type StringNo } from "@/theory/fretboard";

export interface QuizRange {
  strings: readonly StringNo[];
  fretMax: number; // 0..fretMax (포함), FRET_COUNT로 클램프
}

export const DEFAULT_RANGE: QuizRange = { strings: [6, 5], fretMax: 12 };

export type Rng = () => number; // [0, 1)

export function canonicalName(pc: PitchClass): string {
  return KEYS[((pc % 12) + 12) % 12];
}

export function positionsInRange(range: QuizRange): FretPos[] {
  const out: FretPos[] = [];
  for (const str of STRINGS) {
    if (!range.strings.includes(str)) continue;
    for (let fret = 0; fret <= Math.min(range.fretMax, FRET_COUNT); fret++) {
      out.push({ str, fret });
    }
  }
  return out;
}

function pick<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

function rangePositionsOrThrow(range: QuizRange): FretPos[] {
  const positions = positionsInRange(range);
  if (positions.length === 0) throw new Error("퀴즈 범위에 위치가 없습니다");
  return positions;
}

export interface NameQuestion {
  pos: FretPos;
  answer: string;     // canonical 음이름
  choices: string[];  // 4개, answer 포함, 중복 없음, rng로 셔플
}

export function makeNameQuestion(range: QuizRange, rng: Rng = Math.random): NameQuestion {
  const pos = pick(rangePositionsOrThrow(range), rng);
  const answer = canonicalName(pitchAt(pos));
  // answer를 제외한 11개 후보에서 rng로 3개 선택 (부분 Fisher–Yates, 항상 유한)
  const candidates: string[] = KEYS.filter((n) => n !== answer);
  const wrong: string[] = [];
  for (let i = 0; i < 3; i++) {
    const j = i + Math.floor(rng() * (candidates.length - i));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    wrong.push(candidates[i]);
  }
  const choices = [...wrong, answer];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return { pos, answer, choices };
}

export interface FindAllTarget {
  name: string;
  pc: PitchClass;
  positions: FretPos[]; // 범위 내 목표 음의 모든 위치
}

export function makeFindAllTarget(range: QuizRange, rng: Rng = Math.random): FindAllTarget {
  const all = rangePositionsOrThrow(range);
  const pcs = [...new Set(all.map(pitchAt))];
  const pc = pick(pcs, rng);
  return {
    name: canonicalName(pc),
    pc,
    positions: all.filter((p) => pitchAt(p) === pc),
  };
}
