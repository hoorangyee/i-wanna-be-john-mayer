import type { PitchClass } from "@/theory/notes";
import { FRET_COUNT, STRINGS, pitchAt, posKey, type FretPos, type StringNo } from "@/theory/fretboard";
import type { NoteInfo } from "@/theory/scales";
import type { FretWindow } from "@/theory/boxes";
import { MESSAGES } from "@/lib/i18n";
import { useLang } from "@/lib/LangContext";

export type LabelMode = "name" | "degree" | "none";

export type QuizMarkKind = "question" | "correct" | "wrong" | "reveal";

export interface QuizMark {
  kind: QuizMarkKind;
  label?: string;
}

export interface FretboardProps {
  notes: Map<PitchClass, NoteInfo>;
  labelMode: LabelMode;
  window?: FretWindow | null;
  colorMode?: "root" | "degree";
  interactive?: boolean;
  interactivePositions?: ReadonlySet<string>;
  onPositionClick?: (pos: FretPos) => void;
  onNoteClick?: (pos: FretPos) => void;
  marks?: ReadonlyMap<string, QuizMark>;
  activeRegion?: { strings: readonly StringNo[]; fretMax: number } | null;
  overlay?: Map<PitchClass, NoteInfo>;
}

const W = 1180;
const H = 240;
const NUT_X = 56;
const OPEN_X = 30;
const RIGHT_PAD = 10;
const TOP_Y = 28;
const STRING_GAP = 34;
const FRET_W = (W - NUT_X - RIGHT_PAD) / FRET_COUNT;
const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
const FRET_NUMBERS = [...SINGLE_INLAYS, 12].sort((a, b) => a - b);

// 주의: degreeFill이 변화표(b·#)를 일괄 제거하므로 b5·#5·bb7·b9·#9·#11·b13도 해당 슬롯 색이 된다.
const TONE_FILL: Record<string, string> = {
  "1": "var(--note-root)",
  "3": "var(--tone-3)",
  "5": "var(--tone-5)",
  "7": "var(--tone-7)",
  "9": "var(--tone-9)",
  "11": "var(--tone-11)",
  "13": "var(--tone-13)",
};

function degreeFill(degree: string): string {
  return TONE_FILL[degree.replace(/[b#]/g, "")] ?? "var(--note-scale)";
}

const stringY = (str: StringNo) => TOP_Y + (str - 1) * STRING_GAP;
const fretX = (fret: number) => NUT_X + fret * FRET_W;          // 프렛선 x
const noteX = (fret: number) =>
  fret === 0 ? OPEN_X : NUT_X + (fret - 0.5) * FRET_W;          // 노트 중심 x

export function Fretboard({ notes, labelMode, window = null, colorMode = "root", interactive = false, interactivePositions, onPositionClick, onNoteClick, marks, activeRegion = null, overlay }: FretboardProps) {
  const { lang } = useLang();
  const m = MESSAGES[lang];
  const midY = (stringY(3) + stringY(4)) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fretboard" role={interactive ? "group" : "img"}
         aria-label={m.fretboard}>
      {/* 너트 */}
      <rect x={NUT_X - 4} y={TOP_Y} width={4} height={STRING_GAP * 5} fill="var(--fb-nut)" />

      {/* 프렛선 */}
      {Array.from({ length: FRET_COUNT }, (_, i) => i + 1).map((f) => (
        <line key={f} x1={fretX(f)} y1={TOP_Y} x2={fretX(f)} y2={TOP_Y + STRING_GAP * 5}
              stroke="var(--fb-fret)" strokeWidth={1.5} />
      ))}

      {/* 인레이 */}
      {SINGLE_INLAYS.map((f) => (
        <circle key={f} cx={noteX(f)} cy={midY} r={5} fill="var(--fb-inlay)" />
      ))}
      <circle cx={noteX(12)} cy={stringY(2)} r={5} fill="var(--fb-inlay)" />
      <circle cx={noteX(12)} cy={stringY(5)} r={5} fill="var(--fb-inlay)" />

      {/* 줄 */}
      {STRINGS.map((s) => (
        <line key={s} x1={OPEN_X - 10} y1={stringY(s)} x2={W - RIGHT_PAD} y2={stringY(s)}
              stroke="var(--fb-string)" strokeWidth={0.8 + s * 0.25} />
      ))}

      {/* 프렛 번호 */}
      {FRET_NUMBERS.map((f) => (
        <text key={f} x={noteX(f)} y={H - 8} textAnchor="middle" className="fret-no">
          {f}
        </text>
      ))}

      {/* 출제 범위 밖 덮개 */}
      {activeRegion && (
        <g data-testid="active-region" pointerEvents="none">
          {activeRegion.fretMax < FRET_COUNT &&
            STRINGS.filter((s) => activeRegion.strings.includes(s)).map((s) => (
              <rect key={`fret-cover-${s}`} data-testid={`region-fret-cover-${s}`}
                    x={fretX(Math.max(activeRegion.fretMax, 0))}
                    y={stringY(s) - STRING_GAP / 2}
                    width={W - RIGHT_PAD - fretX(Math.max(activeRegion.fretMax, 0))}
                    height={STRING_GAP}
                    fill="var(--bg)" opacity={0.6} />
            ))}
          {STRINGS.filter((s) => !activeRegion.strings.includes(s)).map((s) => (
            <rect key={s} data-testid={`region-string-cover-${s}`}
                  x={OPEN_X - 14} y={stringY(s) - STRING_GAP / 2}
                  width={W - OPEN_X} height={STRING_GAP}
                  fill="var(--bg)" opacity={0.6} />
          ))}
        </g>
      )}

      {/* 노트 */}
      {STRINGS.flatMap((str) =>
        Array.from({ length: FRET_COUNT + 1 }, (_, fret) => {
          const pc = pitchAt({ str, fret });
          const overlayInfo = overlay?.get(pc);
          const info = overlayInfo ?? notes.get(pc);
          if (!info) return null;
          const isOverlayNote = overlayInfo !== undefined;
          const dimmed = window ? fret < window.start || fret > window.end : false;
          const label = labelMode === "name" ? info.name
                      : labelMode === "degree" ? info.degree : null;
          const fill = isOverlayNote
            ? degreeFill(info.degree)
            : overlay
              ? "var(--note-dim)"
              : colorMode === "degree"
                ? degreeFill(info.degree)
                : info.isRoot ? "var(--note-root)" : "var(--note-scale)";
          const ring = info.isRoot && (!overlay || isOverlayNote);
          return (
            <g key={`${str}-${fret}`}
               className="note"
               data-testid={`note-${str}-${fret}`}
               data-root={info.isRoot ? "true" : "false"}
               data-dimmed={dimmed ? "true" : "false"}
               {...(overlay ? { "data-layer": isOverlayNote ? "overlay" : "scale" } : {})}
               {...(onNoteClick ? { onClick: () => onNoteClick({ str, fret }), style: { cursor: "pointer" } as const } : {})}
               opacity={dimmed ? 0.18 : overlay && !isOverlayNote ? 0.45 : 1}>
              <circle cx={noteX(fret)} cy={stringY(str)} r={12}
                      fill={fill}
                      stroke={ring ? "var(--note-root-ring)" : "none"}
                      strokeWidth={ring ? 3 : 0} />
              {label && (
                <text x={noteX(fret)} y={stringY(str) + 4} textAnchor="middle"
                      className="note-label">
                  {label}
                </text>
              )}
            </g>
          );
        })
      )}

      {/* 퀴즈 마크 */}
      {marks && STRINGS.flatMap((str) =>
        Array.from({ length: FRET_COUNT + 1 }, (_, fret) => {
          const mark = marks.get(posKey({ str, fret }));
          if (!mark) return null;
          const label = mark.label ?? (mark.kind === "question" ? "?" : null);
          return (
            <g key={`mark-${str}-${fret}`} className="mark" data-testid={`mark-${str}-${fret}`} data-kind={mark.kind}>
              <circle cx={noteX(fret)} cy={stringY(str)} r={12}
                      fill={`var(--mark-${mark.kind})`} />
              {label && (
                <text x={noteX(fret)} y={stringY(str) + 4} textAnchor="middle" className="note-label">
                  {label}
                </text>
              )}
            </g>
          );
        })
      )}

      {/* 클릭 타겟 */}
      {interactive && STRINGS.flatMap((str) =>
        Array.from({ length: FRET_COUNT + 1 }, (_, fret) => {
          if (interactivePositions && !interactivePositions.has(posKey({ str, fret }))) return null;
          return (
            <circle key={`hit-${str}-${fret}`} data-testid={`hit-${str}-${fret}`}
                    cx={noteX(fret)} cy={stringY(str)} r={13}
                    fill="transparent" style={{ cursor: "pointer" }}
                    role="button" tabIndex={0}
                    aria-label={m.hitLabel(str, fret)}
                    onClick={() => onPositionClick?.({ str, fret })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onPositionClick?.({ str, fret });
                      }
                    }} />
          );
        })
      )}
    </svg>
  );
}
