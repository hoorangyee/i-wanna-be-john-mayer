import { KEYS, type Key } from "@/theory/notes";
import { SCALE_IDS, type ScaleId } from "@/theory/scales";
import {
  allowedExts, QUALITIES, normalizeExts, type ChordQuality, type Extension,
} from "@/theory/chords";
import { MESSAGES, SCALE_NAMES, QUALITY_NAMES } from "@/lib/i18n";
import { useLang } from "@/lib/LangContext";
import type { LabelMode } from "./Fretboard";

export type Mode = "scale" | "chord" | "overlay" | "quiz";

export interface ControlsProps {
  mode: Mode;
  keySel: Key;
  scaleId: ScaleId;
  quality: ChordQuality;
  exts: readonly Extension[];
  labelMode: LabelMode;
  boxIndex: number | null;
  boxCount: number | null;   // null = 이 스케일은 박스 미지원 (코드 모드에서도 null 전달)
  overlayRoot: Key;
  onChange: (patch: Partial<Omit<ControlsProps, "onChange" | "boxCount">>) => void;
}

export function Controls({ mode, keySel, scaleId, quality, exts, labelMode, boxIndex, boxCount, overlayRoot, onChange }: ControlsProps) {
  const { lang } = useLang();
  const m = MESSAGES[lang];
  const LABEL_MODES: { id: LabelMode; label: string }[] = [
    { id: "name", label: m.labelNames },
    { id: "degree", label: m.labelDegrees },
    { id: "none", label: m.labelOff },
  ];

  if (mode === "quiz") return null; // 퀴즈 설정은 Quiz가 자체 렌더

  const pills = allowedExts(quality);
  const extLabel = (e: Extension) => (/^\d+$/.test(e) ? `${e}th` : e); // 자연: 7th 식, 변형: b9 식 (양 언어 동일)
  // 변형 필은 글리프만으로는 스크린리더가 구분하지 못한다 (#가 생략되거나 "number sign"으로 읽힘)
  const extA11y: Record<string, string> = {
    b9: "flat ninth", "#9": "sharp ninth", "#11": "sharp eleventh", b13: "flat thirteenth",
  };

  const toggleExt = (e: Extension) =>
    onChange({
      exts: exts.includes(e) ? exts.filter((x) => x !== e) : normalizeExts([...exts, e]),
    });

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
        <>
          <label className="field">
            {m.chord}
            <select id="view-quality" value={quality}
                    onChange={(e) => {
                      const q = e.target.value as ChordQuality;
                      const keep = allowedExts(q);
                      onChange({ quality: q, exts: exts.filter((x) => keep.includes(x)) });
                    }}>
              {QUALITIES.map((q) => (
                <option key={q} value={q}>{QUALITY_NAMES[lang][q]}</option>
              ))}
            </select>
          </label>

          <div className="seg" role="group" aria-label={m.extensions}>
            {pills.map((e) => (
              <button key={e} type="button" data-active={exts.includes(e)} aria-pressed={exts.includes(e)}
                      aria-label={extA11y[e]}
                      onClick={() => toggleExt(e)}>
                {extLabel(e)}
              </button>
            ))}
          </div>
        </>
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
