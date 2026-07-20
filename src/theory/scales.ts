import { type Key, type PitchClass, keyToPc, spellDegree } from "./notes";

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
    const degree = degreeLabel(interval);
    map.set(pc, {
      name: spellDegree(key, degree, pc),
      degree,
      isRoot: interval === 0,
    });
  }
  return map;
}
