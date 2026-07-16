import { MESSAGES, type Messages } from "@/lib/i18n";
import { useLang } from "@/lib/LangContext";

export interface LegendProps {
  mode: "scale" | "chord" | "overlay";
}

interface LegendItem {
  label: string;
  color: string;
  ring?: boolean;
}

function itemsFor(mode: LegendProps["mode"], m: Messages): LegendItem[] {
  const degreeItems: LegendItem[] = [
    { label: m.legendRoot1, color: "var(--note-root)", ring: true },
    { label: m.legendThird, color: "var(--tone-3)" },
    { label: m.legendFifth, color: "var(--tone-5)" },
    { label: m.legendSeventh, color: "var(--tone-7)" },
  ];
  if (mode === "scale") {
    return [
      { label: m.legendRoot, color: "var(--note-root)", ring: true },
      { label: m.legendScaleNote, color: "var(--note-scale)" },
    ];
  }
  if (mode === "chord") return degreeItems;
  return [...degreeItems, { label: m.legendScaleNote, color: "var(--note-dim)" }];
}

export function Legend({ mode }: LegendProps) {
  const { lang } = useLang();
  const m = MESSAGES[lang];
  return (
    <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1" aria-label={m.legend}>
      {itemsFor(mode, m).map(({ label, color, ring }) => (
        <li key={label} className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span aria-hidden="true" className="inline-block size-3 rounded-full"
                style={{
                  background: color,
                  boxShadow: ring ? "inset 0 0 0 1.5px var(--note-root-ring)" : undefined,
                }} />
          {label}
        </li>
      ))}
    </ul>
  );
}
