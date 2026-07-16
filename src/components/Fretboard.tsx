import type { PitchClass } from "@/theory/notes";
import { FRET_COUNT, STRINGS, pitchAt, type StringNo } from "@/theory/fretboard";
import type { NoteInfo } from "@/theory/scales";
import type { FretWindow } from "@/theory/boxes";

export type LabelMode = "name" | "degree" | "none";

export interface FretboardProps {
  notes: Map<PitchClass, NoteInfo>;
  labelMode: LabelMode;
  window?: FretWindow | null;
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

const stringY = (str: StringNo) => TOP_Y + (str - 1) * STRING_GAP;
const fretX = (fret: number) => NUT_X + fret * FRET_W;          // 프렛선 x
const noteX = (fret: number) =>
  fret === 0 ? OPEN_X : NUT_X + (fret - 0.5) * FRET_W;          // 노트 중심 x

export function Fretboard({ notes, labelMode, window = null }: FretboardProps) {
  const midY = (stringY(3) + stringY(4)) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fretboard" role="img"
         aria-label="기타 지판">
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

      {/* 노트 */}
      {STRINGS.flatMap((str) =>
        Array.from({ length: FRET_COUNT + 1 }, (_, fret) => {
          const info = notes.get(pitchAt({ str, fret }));
          if (!info) return null;
          const dimmed = window ? fret < window.start || fret > window.end : false;
          const label = labelMode === "name" ? info.name
                      : labelMode === "degree" ? info.degree : null;
          return (
            <g key={`${str}-${fret}`}
               data-testid={`note-${str}-${fret}`}
               data-root={info.isRoot ? "true" : "false"}
               data-dimmed={dimmed ? "true" : "false"}
               opacity={dimmed ? 0.18 : 1}>
              <circle cx={noteX(fret)} cy={stringY(str)} r={12}
                      fill={info.isRoot ? "var(--note-root)" : "var(--note-scale)"}
                      stroke={info.isRoot ? "var(--note-root-ring)" : "none"}
                      strokeWidth={info.isRoot ? 3 : 0} />
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
    </svg>
  );
}
