import { KEYS, type Key } from "@/theory/notes";
import { SCALES, SCALE_IDS, type ScaleId } from "@/theory/scales";
import { CHORDS, CHORD_IDS, type ChordId } from "@/theory/chords";
import type { LabelMode } from "./Fretboard";

export type Mode = "scale" | "chord" | "quiz";

export interface ControlsProps {
  mode: Mode;
  keySel: Key;
  scaleId: ScaleId;
  chordId: ChordId;
  labelMode: LabelMode;
  boxIndex: number | null;
  boxCount: number | null;   // null = 이 스케일은 박스 미지원 (코드 모드에서도 null 전달)
  onChange: (patch: Partial<Omit<ControlsProps, "onChange" | "boxCount">>) => void;
}

const MODES: { id: Mode; label: string }[] = [
  { id: "scale", label: "스케일" },
  { id: "chord", label: "코드톤" },
  { id: "quiz", label: "퀴즈" },
];

const LABEL_MODES: { id: LabelMode; label: string }[] = [
  { id: "name", label: "음이름" },
  { id: "degree", label: "도수" },
  { id: "none", label: "숨김" },
];

export function Controls({ mode, keySel, scaleId, chordId, labelMode, boxIndex, boxCount, onChange }: ControlsProps) {
  return (
    <div className="controls">
      <div className="seg" role="group" aria-label="모드">
        {MODES.map(({ id, label }) => (
          <button key={id} data-active={mode === id} aria-pressed={mode === id}
                  onClick={() => mode !== id && onChange({ mode: id, boxIndex: null })}>
            {label}
          </button>
        ))}
      </div>

      {mode !== "quiz" && (
        <>
          <label>
            {mode === "chord" ? "루트" : "키"}
            <select id="view-key" value={keySel} onChange={(e) => onChange({ keySel: e.target.value as Key })}>
              {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>

          {mode === "scale" ? (
            <label>
              스케일
              <select id="view-scale" value={scaleId}
                      onChange={(e) => onChange({ scaleId: e.target.value as ScaleId, boxIndex: null })}>
                {SCALE_IDS.map((id) => <option key={id} value={id}>{SCALES[id].name}</option>)}
              </select>
            </label>
          ) : (
            <label>
              코드
              <select id="view-chord" value={chordId}
                      onChange={(e) => onChange({ chordId: e.target.value as ChordId })}>
                {CHORD_IDS.map((id) => (
                  <option key={id} value={id}>{keySel}{CHORDS[id].symbol} · {CHORDS[id].name}</option>
                ))}
              </select>
            </label>
          )}

          <div className="seg" role="group" aria-label="라벨 표시">
            {LABEL_MODES.map(({ id, label }) => (
              <button key={id} data-active={labelMode === id} aria-pressed={labelMode === id}
                      onClick={() => onChange({ labelMode: id })}>
                {label}
              </button>
            ))}
          </div>

          {mode === "scale" && boxCount !== null && (
            <div className="seg" role="group" aria-label="포지션">
              <button data-active={boxIndex === null} aria-pressed={boxIndex === null}
                      onClick={() => onChange({ boxIndex: null })}>
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
        </>
      )}
    </div>
  );
}
