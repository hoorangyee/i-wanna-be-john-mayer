import type { PitchClass } from "./notes";

export type StringNo = 1 | 2 | 3 | 4 | 5 | 6; // 1 = high E
export interface FretPos {
  str: StringNo;
  fret: number; // 0 = open
}

export const FRET_COUNT = 22;
export const STRINGS: readonly StringNo[] = [1, 2, 3, 4, 5, 6];

export const TUNING: Record<StringNo, PitchClass> = {
  1: 4,  // E
  2: 11, // B
  3: 7,  // G
  4: 2,  // D
  5: 9,  // A
  6: 4,  // E
};

export function pitchAt(pos: FretPos): PitchClass {
  return (TUNING[pos.str] + pos.fret) % 12;
}
