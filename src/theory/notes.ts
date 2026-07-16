export type PitchClass = number; // 0=C .. 11=B

export const KEYS = [
  "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
] as const;
export type Key = (typeof KEYS)[number];

const NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const FLAT_KEYS: ReadonlySet<Key> = new Set(["Db", "Eb", "F", "Ab", "Bb"]);

export function keyToPc(key: Key): PitchClass {
  return KEYS.indexOf(key);
}

export function spell(pc: PitchClass, key: Key): string {
  const names = FLAT_KEYS.has(key) ? NAMES_FLAT : NAMES_SHARP;
  return names[((pc % 12) + 12) % 12];
}
