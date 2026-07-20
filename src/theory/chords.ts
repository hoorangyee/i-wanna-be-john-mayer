import { type Key, type PitchClass, keyToPc, spellDegree } from "./notes";
import type { NoteInfo } from "./scales";

// ── v3: 퀄리티 + 확장 모델 (스펙: 2026-07-17-chord-extensions-design.md) ──

export type ChordQuality =
  | "major" | "minor" | "dominant"
  | "diminished" | "halfDiminished" | "augmented";
export const QUALITIES = [
  "major", "minor", "dominant", "diminished", "halfDiminished", "augmented",
] as const satisfies readonly ChordQuality[];

export type Extension = "7" | "b9" | "9" | "#9" | "11" | "#11" | "13" | "b13";
export const EXTENSIONS = [
  "7", "b9", "9", "#9", "11", "#11", "13", "b13",
] as const satisfies readonly Extension[];

interface Tone {
  interval: number;
  degree: string;
}

interface QualityDef {
  third: Tone;
  fifth: Tone;
  seventh: Tone;      // 7th 종류는 퀄리티가 결정
  symbolBase: string; // 7 꺼짐 시 심볼
  symbolWith7: string;
}

const QUALITY_DEFS: Record<ChordQuality, QualityDef> = {
  major: {
    third: { interval: 4, degree: "3" },
    fifth: { interval: 7, degree: "5" },
    seventh: { interval: 11, degree: "7" },
    symbolBase: "",
    symbolWith7: "maj7",
  },
  minor: {
    third: { interval: 3, degree: "b3" },
    fifth: { interval: 7, degree: "5" },
    seventh: { interval: 10, degree: "b7" },
    symbolBase: "m",
    symbolWith7: "m7",
  },
  dominant: {
    third: { interval: 4, degree: "3" },
    fifth: { interval: 7, degree: "5" },
    seventh: { interval: 10, degree: "b7" },
    symbolBase: "",
    symbolWith7: "7",
  },
  diminished: {
    third: { interval: 3, degree: "b3" },
    fifth: { interval: 6, degree: "b5" },
    seventh: { interval: 9, degree: "bb7" },
    symbolBase: "dim",
    symbolWith7: "dim7",
  },
  halfDiminished: {
    third: { interval: 3, degree: "b3" },
    fifth: { interval: 6, degree: "b5" },
    seventh: { interval: 10, degree: "b7" }, // 7 꺼짐 시 dim 트라이어드와 동일 표시 — dominant/major 전례
    symbolBase: "dim",
    symbolWith7: "m7b5",
  },
  augmented: {
    third: { interval: 4, degree: "3" },
    fifth: { interval: 8, degree: "#5" },
    seventh: { interval: 10, degree: "b7" },
    symbolBase: "aug",
    symbolWith7: "aug7",
  },
};

// 변형 텐션은 도미넌트 전용. 디미니시의 13도는 bb7과 같은 음이라 독립 텐션이 아니므로 제외.
const ALTERED: ReadonlySet<Extension> = new Set(["b9", "#9", "#11", "b13"]);
const DIM_EXCLUDED: ReadonlySet<Extension> = new Set(["b13", "13"]);

export function allowedExts(quality: ChordQuality): readonly Extension[] {
  if (quality === "dominant") return EXTENSIONS;
  if (quality === "diminished") return EXTENSIONS.filter((e) => !ALTERED.has(e) && !DIM_EXCLUDED.has(e));
  return EXTENSIONS.filter((e) => !ALTERED.has(e));
}

const UPPER_EXTENSIONS: Record<Exclude<Extension, "7">, Tone> = {
  b9: { interval: 1, degree: "b9" },
  "9": { interval: 2, degree: "9" },
  "#9": { interval: 3, degree: "#9" },
  "11": { interval: 5, degree: "11" },
  "#11": { interval: 6, degree: "#11" },
  "13": { interval: 9, degree: "13" },
  b13: { interval: 8, degree: "b13" },
};

/** 확장 목록을 EXTENSIONS 순서로 정규화하고 중복을 제거한다. */
export function normalizeExts(exts: Iterable<Extension>): readonly Extension[] {
  const set = new Set(exts);
  return EXTENSIONS.filter((e) => set.has(e));
}

export function chordSymbol(quality: ChordQuality, exts: readonly Extension[]): string {
  const def = QUALITY_DEFS[quality];
  const has7 = exts.includes("7");
  const uppers = normalizeExts(exts).filter((e): e is Exclude<Extension, "7"> => e !== "7");
  const base = has7 ? def.symbolWith7 : def.symbolBase;
  if (uppers.length === 0) return base;
  return has7
    ? `${base}(${uppers.join(",")})`
    : `${base}(${uppers.map((e) => `add${e}`).join(",")})`;
}

export function chordToneMap(
  key: Key,
  quality: ChordQuality,
  exts: readonly Extension[]
): Map<PitchClass, NoteInfo> {
  const def = QUALITY_DEFS[quality];
  const root = keyToPc(key);
  const tones: Tone[] = [{ interval: 0, degree: "1" }, def.third, def.fifth];
  for (const e of normalizeExts(exts)) {
    tones.push(e === "7" ? def.seventh : UPPER_EXTENSIONS[e]);
  }
  const map = new Map<PitchClass, NoteInfo>();
  for (const { interval, degree } of tones) {
    const pc = (root + interval) % 12;
    if (!map.has(pc)) map.set(pc, { name: spellDegree(key, degree, pc), degree, isRoot: interval === 0 });
  }
  return map;
}
