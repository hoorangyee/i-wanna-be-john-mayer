import { type Key, keyToPc } from "./notes";
import { TUNING } from "./fretboard";
import { SCALES, type ScaleId } from "./scales";

export interface FretWindow {
  start: number;
  end: number; // inclusive
}

const BOX_SPAN = 4; // 각 박스는 앵커 프렛부터 4프렛 폭

/** blues는 마이너 펜타토닉 앵커를 공유. 7음 스케일은 M1 미지원. */
const ANCHOR_SCALE: Partial<Record<ScaleId, ScaleId>> = {
  minorPentatonic: "minorPentatonic",
  majorPentatonic: "majorPentatonic",
  blues: "minorPentatonic",
};

export function boxesFor(key: Key, scaleId: ScaleId): FretWindow[] | null {
  const anchorScaleId = ANCHOR_SCALE[scaleId];
  if (!anchorScaleId) return null;

  const root = keyToPc(key);
  const pcs = SCALES[anchorScaleId].intervals.map((i) => (root + i) % 12);

  // 6번 줄에서 각 스케일 톤이 나오는 프렛 (0..11)
  const anchorFrets = pcs
    .map((pc) => (((pc - TUNING[6]) % 12) + 12) % 12)
    .sort((a, b) => a - b);

  // 루트 앵커부터 시작하도록 순환 정렬 (루트보다 낮은 앵커는 +12)
  const rootFret = (((root - TUNING[6]) % 12) + 12) % 12;
  const rotated = anchorFrets.map((f) => (f < rootFret ? f + 12 : f));
  rotated.sort((a, b) => a - b);

  return rotated.map((start) => ({ start, end: start + BOX_SPAN }));
}
