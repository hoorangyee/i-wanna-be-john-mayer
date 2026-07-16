import { KEYS, type Key } from "@/theory/notes";
import { SCALES, SCALE_IDS, type ScaleId } from "@/theory/scales";
import type { LabelMode } from "./Fretboard";

export interface ControlsProps {
  keySel: Key;
  scaleId: ScaleId;
  labelMode: LabelMode;
  boxIndex: number | null;   // null = 전체
  boxCount: number | null;   // null = 이 스케일은 박스 미지원
  onChange: (patch: Partial<Pick<ControlsProps, "keySel" | "scaleId" | "labelMode" | "boxIndex">>) => void;
}

const LABEL_MODES: { id: LabelMode; label: string }[] = [
  { id: "name", label: "음이름" },
  { id: "degree", label: "도수" },
  { id: "none", label: "숨김" },
];

export function Controls({ keySel, scaleId, labelMode, boxIndex, boxCount, onChange }: ControlsProps) {
  return (
    <div className="controls">
      <label>
        키
        <select value={keySel} onChange={(e) => onChange({ keySel: e.target.value as Key })}>
          {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>

      <label>
        스케일
        <select value={scaleId}
                onChange={(e) => onChange({ scaleId: e.target.value as ScaleId, boxIndex: null })}>
          {SCALE_IDS.map((id) => <option key={id} value={id}>{SCALES[id].name}</option>)}
        </select>
      </label>

      <div className="seg" role="group" aria-label="라벨 표시">
        {LABEL_MODES.map(({ id, label }) => (
          <button key={id} data-active={labelMode === id} aria-pressed={labelMode === id}
                  onClick={() => onChange({ labelMode: id })}>
            {label}
          </button>
        ))}
      </div>

      {boxCount !== null && (
        <div className="seg" role="group" aria-label="포지션">
          <button data-active={boxIndex === null} aria-pressed={boxIndex === null} onClick={() => onChange({ boxIndex: null })}>
            전체
          </button>
          {Array.from({ length: boxCount }, (_, i) => (
            <button key={i} data-active={boxIndex === i} aria-pressed={boxIndex === i}
                    onClick={() => onChange({ boxIndex: i })}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
