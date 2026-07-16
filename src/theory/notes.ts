export type PitchClass = number; // 0=C .. 11=B
export type Accidental = "flat" | "sharp";
export type ToneFamily = "major" | "minor";

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

export function preference(key: Key, family: ToneFamily): Accidental {
  if (family === "minor") {
    if (key.includes("b")) return "flat";
    if (key.includes("#")) return "sharp";
    const relativeMajor = KEYS[(keyToPc(key) + 3) % 12];
    return FLAT_KEYS.has(relativeMajor) ? "flat" : "sharp";
  }
  return FLAT_KEYS.has(key) ? "flat" : "sharp";
}

export function spellWith(pc: PitchClass, acc: Accidental): string {
  const names = acc === "flat" ? NAMES_FLAT : NAMES_SHARP;
  return names[((pc % 12) + 12) % 12];
}

export function spell(pc: PitchClass, key: Key): string {
  return spellWith(pc, preference(key, "major"));
}
