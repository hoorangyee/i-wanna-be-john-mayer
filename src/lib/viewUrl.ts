import { KEYS, type Key } from "@/theory/notes";
import { SCALE_IDS, type ScaleId } from "@/theory/scales";
import {
  EXTENSIONS, QUALITIES, allowedExts, normalizeExts, type ChordQuality, type Extension,
} from "@/theory/chords";

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
  return {
    mode: oneOf(p.get("mode"), MODES) ?? defaults.mode,
    keySel: oneOf(p.get("key"), KEYS) ?? defaults.keySel,
    scaleId: oneOf(p.get("scale"), SCALE_IDS) ?? defaults.scaleId,
    quality,
    exts: rawExts.filter((e) => allowed.includes(e)),
    labelMode: oneOf(p.get("label"), LABELS) ?? defaults.labelMode,
    boxIndex: Number.isInteger(box) && box >= 1 && box <= 5 ? box - 1 : null,
    overlayRoot: oneOf(p.get("croot"), KEYS) ?? defaults.overlayRoot,
  };
}

export function viewQueryString(view: UrlViewState, defaults: UrlViewState): string {
  const p = new URLSearchParams();
  if (view.mode !== defaults.mode) p.set("mode", view.mode);
  if (view.mode !== "quiz" && view.keySel !== defaults.keySel) p.set("key", view.keySel);
  if ((view.mode === "scale" || view.mode === "overlay") && view.scaleId !== defaults.scaleId) p.set("scale", view.scaleId);
  if (view.mode === "overlay" && view.overlayRoot !== defaults.overlayRoot) p.set("croot", view.overlayRoot);
  if (view.mode === "chord" || view.mode === "overlay") {
    if (view.quality !== defaults.quality) p.set("quality", view.quality);
    const allowed = allowedExts(view.quality);
    const exts = normalizeExts(view.exts).filter((e) => allowed.includes(e));
    if (exts.length > 0) p.set("ext", exts.join(",")); // 기본값은 빈 목록
  }
  if (view.mode !== "quiz" && view.labelMode !== defaults.labelMode) p.set("label", view.labelMode);
  if (view.mode === "scale" && view.boxIndex !== null) p.set("box", String(view.boxIndex + 1));
  const s = p.toString();
  return s ? `?${s}` : "";
}
