import type { Key, PitchClass } from "./notes";
import { chordSymbol, chordToneMap, type ChordQuality, type Extension } from "./chords";

// ── 코드 진행 — 현재 코드와 다음 코드를 한 지판에서 비교한다 ──
// (스펙: 2026-07-22-chord-progression-design.md)

export interface ProgChord {
  root: Key;
  quality: ChordQuality;
  exts: readonly Extension[];
}

/** 현재 코드 기준으로 본 음의 역할. 지판의 네 가지 표현과 1:1 대응한다. */
export type NoteRole =
  | "current"  // 현재 코드에만 있음
  | "common"   // 두 코드 모두에 있음 — 손 안 움직이고 역할만 바뀜
  | "half"     // 다음 코드 음, 현재 코드 음에서 반음 거리
  | "other";   // 다음 코드 음, 그 외

export interface ProgNoteInfo {
  name: string;
  degree: string;
  isRoot: boolean;
  role: NoteRole;
  nextDegree: string | null; // role === "common" 일 때만 채운다
}

export const MAX_PROG = 8;

/**
 * 현재 코드와 다음 코드를 합성한 지판 맵.
 * 반음 판정은 프렛 위치가 아니라 피치클래스 ±1 — 지판 전체에서 판정이 일관된다.
 */
export function progNoteMap(
  current: ProgChord,
  next: ProgChord | null
): Map<PitchClass, ProgNoteInfo> {
  const cur = chordToneMap(current.root, current.quality, current.exts);
  const nxt = next ? chordToneMap(next.root, next.quality, next.exts) : null;
  const map = new Map<PitchClass, ProgNoteInfo>();

  for (const [pc, info] of cur) {
    const twin = nxt?.get(pc);
    map.set(pc, {
      ...info,
      role: twin ? "common" : "current",
      nextDegree: twin?.degree ?? null,
    });
  }

  if (nxt) {
    for (const [pc, info] of nxt) {
      if (map.has(pc)) continue;
      const halfStep = cur.has((pc + 1) % 12) || cur.has((pc + 11) % 12);
      map.set(pc, {
        ...info,
        isRoot: false, // 루트 링은 현재 코드의 루트 하나만 뜻한다
        role: halfStep ? "half" : "other",
        nextDegree: null,
      });
    }
  }

  return map;
}

export function progChordLabel(chord: ProgChord): string {
  return chord.root + chordSymbol(chord.quality, chord.exts);
}

/** 선택된 코드의 사본을 바로 뒤에 넣는다 — 삭제와 함께면 순서 변경 UI가 필요 없다. */
export function insertAfter(
  prog: readonly ProgChord[],
  index: number
): { prog: ProgChord[]; index: number } {
  if (prog.length >= MAX_PROG) return { prog: [...prog], index };
  const at = index + 1;
  return { prog: [...prog.slice(0, at), { ...prog[index] }, ...prog.slice(at)], index: at };
}

export function removeAt(
  prog: readonly ProgChord[],
  index: number
): { prog: ProgChord[]; index: number } {
  if (prog.length <= 1) return { prog: [...prog], index: 0 };
  const rest = prog.filter((_, i) => i !== index);
  return { prog: rest, index: Math.min(index, rest.length - 1) };
}
