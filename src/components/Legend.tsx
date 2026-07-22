import type { Extension } from "@/theory/chords";
import { MESSAGES, type Messages } from "@/lib/i18n";
import { useLang } from "@/lib/LangContext";

export interface LegendProps {
  mode: "scale" | "chord" | "overlay" | "progression";
  exts?: readonly Extension[];
}

interface LegendItem {
  label: string;
  color: string;
  ring?: boolean;
  /** 진행 모드의 역할 표시 — 색이 아니라 링 모양이 뜻을 나른다. */
  variant?: "inner" | "half" | "other";
}

function itemsFor(mode: LegendProps["mode"], exts: readonly Extension[], m: Messages): LegendItem[] {
  if (mode === "scale") {
    return [
      { label: m.legendRoot, color: "var(--note-root)", ring: true },
      { label: m.legendScaleNote, color: "var(--note-scale)" },
    ];
  }
  const items: LegendItem[] = [
    { label: m.legendRoot1, color: "var(--note-root)", ring: true },
    { label: m.legendThird, color: "var(--tone-3)" },
    { label: m.legendFifth, color: "var(--tone-5)" },
  ];
  // 변형(b9 등)만 켜도 해당 슬롯 항목을 표시 — 정확한 변화표는 지판 도수 라벨이 담당 (스펙 §4)
  const has = (...slot: Extension[]) => slot.some((s) => exts.includes(s));
  if (has("7")) items.push({ label: m.legendSeventh, color: "var(--tone-7)" });
  if (has("b9", "9", "#9")) items.push({ label: m.legendNinth, color: "var(--tone-9)" });
  if (has("11", "#11")) items.push({ label: m.legendEleventh, color: "var(--tone-11)" });
  if (has("13", "b13")) items.push({ label: m.legendThirteenth, color: "var(--tone-13)" });
  if (mode === "overlay") items.push({ label: m.legendScaleNote, color: "var(--note-dim)" });
  if (mode === "progression") {
    // "현재 코드"는 기본값이라 생략 — 새로 읽어야 할 정보는 나머지 셋뿐이다.
    items.push(
      { label: m.legendCommon, color: "var(--note-scale)", variant: "inner" },
      { label: m.legendHalf, color: "var(--note-scale)", variant: "half" },
      { label: m.legendOther, color: "var(--note-scale)", variant: "other" }
    );
  }
  return items;
}

function swatchStyle({ color, ring, variant }: LegendItem): React.CSSProperties {
  if (variant === "inner") {
    return { background: color, boxShadow: "inset 0 0 0 1.5px var(--prog-common)" };
  }
  if (variant === "half" || variant === "other") {
    return {
      background: `color-mix(in srgb, ${color} 30%, transparent)`,
      border: `1.5px ${variant === "half" ? "solid" : "dashed"} var(--prog-${variant})`,
    };
  }
  return {
    background: color,
    boxShadow: ring ? "inset 0 0 0 1.5px var(--note-root-ring)" : undefined,
  };
}

export function Legend({ mode, exts = [] }: LegendProps) {
  const { lang } = useLang();
  const m = MESSAGES[lang];
  return (
    <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1" aria-label={m.legend}>
      {itemsFor(mode, exts, m).map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span aria-hidden="true" className="inline-block size-3 shrink-0 rounded-full"
                style={swatchStyle(item)} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
