import { KEYS, type Key } from "@/theory/notes";
import { SCALE_IDS, type ScaleId } from "@/theory/scales";
import {
  EXTENSIONS, QUALITIES, allowedExts, normalizeExts, type ChordQuality, type Extension,
} from "@/theory/chords";
import { MAX_PROG, type ProgChord } from "@/theory/progression";

export type ViewMode = "scale" | "chord" | "overlay" | "quiz";
export type ViewLabelMode = "name" | "degree" | "none";

export interface UrlViewState {
  mode: ViewMode;
  keySel: Key;
  scaleId: ScaleId;
  quality: ChordQuality;
  exts: readonly Extension[];
  labelMode: ViewLabelMode;
  boxIndex: number | null;
  overlayRoot: Key;
  progOn: boolean;
  prog: readonly ProgChord[];
  progIndex: number;
}

const MODES: readonly ViewMode[] = ["scale", "chord", "overlay", "quiz"];
const LABELS: readonly ViewLabelMode[] = ["name", "degree", "none"];

// 구 chord 파라미터 → 표시 결과 보존 매핑 (v2 이전 북마크 호환)
const LEGACY_CHORD: Record<string, { quality: ChordQuality; exts: readonly Extension[] }> = {
  maj: { quality: "major", exts: [] },
  m: { quality: "minor", exts: [] },
  "7": { quality: "dominant", exts: ["7"] },
  maj7: { quality: "major", exts: ["7"] },
  m7: { quality: "minor", exts: ["7"] },
};

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

function parseExts(raw: string | null): readonly Extension[] | null {
  if (raw === null) return null;
  const parts = raw
    .split(",")
    .filter((p): p is Extension => (EXTENSIONS as readonly string[]).includes(p));
  return normalizeExts(parts);
}

// 진행: `루트:퀄리티:텐션,텐션` 을 `;` 로 이은 목록. 텐션이 없으면 세 번째 필드를 생략한다.
function parseProg(raw: string | null): readonly ProgChord[] {
  if (raw === null) return [];
  const chords: ProgChord[] = [];
  for (const entry of raw.split(";")) {
    const [rootRaw, qualityRaw, extRaw = ""] = entry.split(":");
    const root = oneOf(rootRaw ?? null, KEYS);
    const quality = oneOf(qualityRaw ?? null, QUALITIES);
    if (root === null || quality === null) continue; // 어긋난 항목만 버린다
    const allowed = allowedExts(quality);
    chords.push({ root, quality, exts: (parseExts(extRaw) ?? []).filter((e) => allowed.includes(e)) });
    if (chords.length === MAX_PROG) break;
  }
  return chords;
}

function serializeProg(prog: readonly ProgChord[]): string {
  return prog
    .map(({ root, quality, exts }) => {
      const kept = normalizeExts(exts).filter((e) => allowedExts(quality).includes(e));
      return kept.length > 0 ? `${root}:${quality}:${kept.join(",")}` : `${root}:${quality}`;
    })
    .join(";");
}

export function parseViewQuery(search: string, defaults: UrlViewState): UrlViewState {
  const p = new URLSearchParams(search);
  const boxRaw = p.get("box");
  const box = boxRaw === null ? NaN : Number(boxRaw);
  // 레거시는 새 파라미터(quality/ext)가 둘 다 없을 때만 해석
  const legacy =
    p.get("quality") === null && p.get("ext") === null
      ? (LEGACY_CHORD[p.get("chord") ?? ""] ?? null)
      : null;
  const quality = oneOf(p.get("quality"), QUALITIES) ?? legacy?.quality ?? defaults.quality;
  const rawExts = parseExts(p.get("ext")) ?? legacy?.exts ?? defaults.exts;
  const allowed = allowedExts(quality);
  const mode = oneOf(p.get("mode"), MODES) ?? defaults.mode;
  // 진행은 코드톤 모드 전용 — 다른 모드에서는 아예 읽지 않는다
  const prog = mode === "chord" ? parseProg(p.get("prog")) : [];
  const pi = Number(p.get("pi"));
  const progIndex = prog.length > 0 && Number.isInteger(pi)
    ? Math.min(Math.max(pi, 0), prog.length - 1)
    : 0;
  // 단일 코드 필드는 언제나 지금 보이는 코드를 비춘다 — 진행을 끄면 그 코드로 이어진다
  const selected = prog[progIndex];
  return {
    mode,
    keySel: selected?.root ?? oneOf(p.get("key"), KEYS) ?? defaults.keySel,
    scaleId: oneOf(p.get("scale"), SCALE_IDS) ?? defaults.scaleId,
    quality: selected?.quality ?? quality,
    exts: selected?.exts ?? rawExts.filter((e) => allowed.includes(e)),
    labelMode: oneOf(p.get("label"), LABELS) ?? defaults.labelMode,
    boxIndex: Number.isInteger(box) && box >= 1 && box <= 5 ? box - 1 : null,
    overlayRoot: oneOf(p.get("croot"), KEYS) ?? defaults.overlayRoot,
    progOn: prog.length > 0,
    prog,
    progIndex,
  };
}

export function viewQueryString(view: UrlViewState, defaults: UrlViewState): string {
  const p = new URLSearchParams();
  // 진행이 켜져 있으면 코드는 prog가 통째로 나른다 — key/quality/ext는 중복이라 생략
  const progActive = view.mode === "chord" && view.progOn && view.prog.length > 0;
  if (view.mode !== defaults.mode) p.set("mode", view.mode);
  if (view.mode !== "quiz" && !progActive && view.keySel !== defaults.keySel) p.set("key", view.keySel);
  if ((view.mode === "scale" || view.mode === "overlay") && view.scaleId !== defaults.scaleId) p.set("scale", view.scaleId);
  if (view.mode === "overlay" && view.overlayRoot !== defaults.overlayRoot) p.set("croot", view.overlayRoot);
  if ((view.mode === "chord" && !progActive) || view.mode === "overlay") {
    if (view.quality !== defaults.quality) p.set("quality", view.quality);
    const allowed = allowedExts(view.quality);
    const exts = normalizeExts(view.exts).filter((e) => allowed.includes(e));
    if (exts.length > 0) p.set("ext", exts.join(",")); // 기본값은 빈 목록
  }
  if (progActive) {
    p.set("prog", serializeProg(view.prog));
    if (view.progIndex > 0) p.set("pi", String(view.progIndex));
  }
  if (view.mode !== "quiz" && view.labelMode !== defaults.labelMode) p.set("label", view.labelMode);
  if (view.mode === "scale" && view.boxIndex !== null) p.set("box", String(view.boxIndex + 1));
  const s = p.toString();
  return s ? `?${s}` : "";
}
