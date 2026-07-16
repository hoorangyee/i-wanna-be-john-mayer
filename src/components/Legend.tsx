export interface LegendProps {
  mode: "scale" | "chord" | "overlay";
}

interface LegendItem {
  label: string;
  color: string;
  ring?: boolean;
}

const DEGREE_ITEMS: LegendItem[] = [
  { label: "루트 (1)", color: "var(--note-root)", ring: true },
  { label: "3도", color: "var(--tone-3)" },
  { label: "5도", color: "var(--tone-5)" },
  { label: "7도", color: "var(--tone-7)" },
];

function itemsFor(mode: LegendProps["mode"]): LegendItem[] {
  if (mode === "scale") {
    return [
      { label: "루트", color: "var(--note-root)", ring: true },
      { label: "스케일음", color: "var(--note-scale)" },
    ];
  }
  if (mode === "chord") return DEGREE_ITEMS;
  return [...DEGREE_ITEMS, { label: "스케일음", color: "var(--note-dim)" }];
}

export function Legend({ mode }: LegendProps) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1" aria-label="범례">
      {itemsFor(mode).map(({ label, color, ring }) => (
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
