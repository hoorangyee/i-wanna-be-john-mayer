import { KEYS, type Key } from "@/theory/notes";
import { SCALE_IDS, type ScaleId } from "@/theory/scales";
import { CHORD_IDS, type ChordId } from "@/theory/chords";

export type ViewMode = "scale" | "chord" | "overlay" | "quiz";
export type ViewLabelMode = "name" | "degree" | "none";

export interface UrlViewState {
  mode: ViewMode;
  keySel: Key;
  scaleId: ScaleId;
  chordId: ChordId;
  labelMode: ViewLabelMode;
  boxIndex: number | null;
  overlayRoot: Key;
}

const MODES: readonly ViewMode[] = ["scale", "chord", "overlay", "quiz"];
const LABELS: readonly ViewLabelMode[] = ["name", "degree", "none"];

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export function parseViewQuery(search: string, defaults: UrlViewState): UrlViewState {
  const p = new URLSearchParams(search);
  const boxRaw = p.get("box");
  const box = boxRaw === null ? NaN : Number(boxRaw);
  return {
    mode: oneOf(p.get("mode"), MODES) ?? defaults.mode,
    keySel: oneOf(p.get("key"), KEYS) ?? defaults.keySel,
    scaleId: oneOf(p.get("scale"), SCALE_IDS) ?? defaults.scaleId,
    chordId: oneOf(p.get("chord"), CHORD_IDS) ?? defaults.chordId,
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
  if ((view.mode === "chord" || view.mode === "overlay") && view.chordId !== defaults.chordId) p.set("chord", view.chordId);
  if (view.mode === "overlay" && view.overlayRoot !== defaults.overlayRoot) p.set("croot", view.overlayRoot);
  if (view.mode !== "quiz" && view.labelMode !== defaults.labelMode) p.set("label", view.labelMode);
  if (view.mode === "scale" && view.boxIndex !== null) p.set("box", String(view.boxIndex + 1));
  const s = p.toString();
  return s ? `?${s}` : "";
}
