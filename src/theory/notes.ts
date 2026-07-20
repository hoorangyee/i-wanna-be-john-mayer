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

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const LETTER_PC: Record<string, PitchClass> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// 도수 라벨 → 루트 문자로부터의 글자 수 (9=2도, 11=4도, 13=6도 자리)
const DEGREE_STEP: Record<string, number> = {
  "1": 0,
  b2: 1, "2": 1, b9: 1, "9": 1, "#9": 1,
  b3: 2, "3": 2,
  "4": 3, "11": 3, "#11": 3,
  b5: 4, "5": 4, "#5": 4,
  b6: 5, "6": 5, "13": 5, b13: 5,
  b7: 6, "7": 6, bb7: 6,
};

/**
 * 도수를 고려해 음이름을 표기한다 — 같은 피치라도 도수에 따라 문자가 달라진다
 * (C7의 b9는 C#이 아니라 Db). 겹변화표(Bbb·F## 등 540개 중 20개)는
 * 지판에서 읽기 어려워 이명동음으로 단순화한다.
 */
export function spellDegree(key: Key, degree: string, pc: PitchClass): string {
  const step = DEGREE_STEP[degree];
  if (step === undefined) return spellWith(pc, preference(key, "major"));
  const letter = LETTERS[(LETTERS.indexOf(key[0] as (typeof LETTERS)[number]) + step) % 7];
  const alter = ((((pc - LETTER_PC[letter]) + 6) % 12) + 12) % 12 - 6;
  if (Math.abs(alter) >= 2) return spellWith(pc, alter > 0 ? "sharp" : "flat");
  return letter + (alter > 0 ? "#" : alter < 0 ? "b" : "");
}
