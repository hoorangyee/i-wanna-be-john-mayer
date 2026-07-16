import { KEYS, type Key } from "@/theory/notes";
import { SCALE_IDS, type ScaleId } from "@/theory/scales";
import { CHORDS, CHORD_IDS, type ChordId } from "@/theory/chords";
import { MESSAGES, SCALE_NAMES, CHORD_NAMES } from "@/lib/i18n";
import { useLang } from "@/lib/LangContext";
import type { LabelMode } from "./Fretboard";

export type Mode = "scale" | "chord" | "overlay" | "quiz";

export interface ControlsProps {
  mode: Mode;
  keySel: Key;
  scaleId: ScaleId;
  chordId: ChordId;
  labelMode: LabelMode;
  boxIndex: number | null;
  boxCount: number | null;   // null = 이 스케일은 박스 미지원 (코드 모드에서도 null 전달)
  overlayRoot: Key;
  onChange: (patch: Partial<Omit<ControlsProps, "onChange" | "boxCount">>) => void;
}

export function Controls({ mode, keySel, scaleId, chordId, labelMode, boxIndex, boxCount, overlayRoot, onChange }: ControlsProps) {
  const { lang } = useLang();
  const m = MESSAGES[lang];
  const LABEL_MODES: { id: LabelMode; label: string }[] = [
    { id: "name", label: m.labelNames },
    { id: "degree", label: m.labelDegrees },
    { id: "none", label: m.labelOff },
  ];

  if (mode === "quiz") return null; // 퀴즈 설정은 Quiz가 자체 렌더

  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
      <label className="field">
        {mode === "chord" ? m.root : m.key}
        <select id="view-key" value={keySel} onChange={(e) => onChange({ keySel: e.target.value as Key })}>
          {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>

      {(mode === "scale" || mode === "overlay") && (
        <label className="field">
          {m.scale}
          <select id="view-scale" value={scaleId}
                  onChange={(e) => onChange({ scaleId: e.target.value as ScaleId, boxIndex: null })}>
            {SCALE_IDS.map((id) => <option key={id} value={id}>{SCALE_NAMES[lang][id]}</option>)}
          </select>
        </label>
      )}

      {mode === "overlay" && (
        <label className="field">
          {m.chordRoot}
          <select id="view-chord-root" value={overlayRoot}
                  onChange={(e) => onChange({ overlayRoot: e.target.value as Key })}>
            {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
      )}

      {(mode === "chord" || mode === "overlay") && (
        <label className="field">
          {m.chord}
          <select id="view-chord" value={chordId}
                  onChange={(e) => onChange({ chordId: e.target.value as ChordId })}>
            {CHORD_IDS.map((id) => (
              <option key={id} value={id}>
                {(mode === "chord" ? keySel : overlayRoot)}{CHORDS[id].symbol} · {CHORD_NAMES[lang][id]}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="seg" role="group" aria-label={m.labelGroup}>
        {LABEL_MODES.map(({ id, label }) => (
          <button key={id} type="button" data-active={labelMode === id} aria-pressed={labelMode === id}
                  onClick={() => onChange({ labelMode: id })}>
            {label}
          </button>
        ))}
      </div>

      {mode === "scale" && boxCount !== null && (
        <div className="seg" role="group" aria-label={m.positionGroup}>
          <button type="button" data-active={boxIndex === null} aria-pressed={boxIndex === null}
                  onClick={() => onChange({ boxIndex: null })}>
            {m.positionAll}
          </button>
          {Array.from({ length: boxCount }, (_, i) => (
            <button key={i} type="button" data-active={boxIndex === i} aria-pressed={boxIndex === i}
                    onClick={() => onChange({ boxIndex: i })}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
