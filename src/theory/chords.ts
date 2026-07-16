import { type Key, type PitchClass, type ToneFamily, keyToPc, preference, spellWith } from "./notes";
import { degreeLabel, type NoteInfo } from "./scales";

export interface ChordDef {
  name: string;
  symbol: string; // 루트 뒤에 붙는 표기 (예: "m7" → Am7)
  family: ToneFamily;
  intervals: readonly number[];
}

export const CHORDS = {
  maj: { name: "메이저", symbol: "", family: "major", intervals: [0, 4, 7] },
  m: { name: "마이너", symbol: "m", family: "minor", intervals: [0, 3, 7] },
  "7": { name: "도미넌트 7", symbol: "7", family: "major", intervals: [0, 4, 7, 10] },
  maj7: { name: "메이저 7", symbol: "maj7", family: "major", intervals: [0, 4, 7, 11] },
  m7: { name: "마이너 7", symbol: "m7", family: "minor", intervals: [0, 3, 7, 10] },
} as const satisfies Record<string, ChordDef>;

export const CHORD_IDS = ["maj", "m", "7", "maj7", "m7"] as const satisfies readonly (keyof typeof CHORDS)[];
export type ChordId = (typeof CHORD_IDS)[number];

export function chordNoteMap(key: Key, chordId: ChordId): Map<PitchClass, NoteInfo> {
  const root = keyToPc(key);
  const chord = CHORDS[chordId];
  const acc = preference(key, chord.family);
  const map = new Map<PitchClass, NoteInfo>();
  for (const interval of chord.intervals) {
    const pc = (root + interval) % 12;
    map.set(pc, {
      name: spellWith(pc, acc),
      degree: degreeLabel(interval),
      isRoot: interval === 0,
    });
  }
  return map;
}
