import type { Mode } from "./Controls";

const MODES: { id: Mode; label: string }[] = [
  { id: "scale", label: "스케일" },
  { id: "chord", label: "코드톤" },
  { id: "overlay", label: "오버레이" },
  { id: "quiz", label: "퀴즈" },
];

export interface ModeTabsProps {
  mode: Mode;
  onSelect: (patch: { mode: Mode; boxIndex: null }) => void;
}

export function ModeTabs({ mode, onSelect }: ModeTabsProps) {
  const active = MODES.findIndex((m) => m.id === mode);
  return (
    <div className="relative grid grid-cols-4 rounded-full border border-line bg-surface-2 p-1"
         role="group" aria-label="모드">
      {/* 슬라이딩 인디케이터 — 등폭 4칸 전제, 자기 폭 단위 translateX */}
      <span aria-hidden="true"
            className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/4)] rounded-full bg-accent transition-transform duration-200 ease-out"
            style={{ transform: `translateX(${active * 100}%)` }} />
      {MODES.map(({ id, label }) => (
        <button key={id} type="button" data-active={mode === id} aria-pressed={mode === id}
                className="relative z-10 cursor-pointer rounded-full px-3 py-1.5 text-[13px] whitespace-nowrap text-ink-muted transition-colors duration-200 hover:text-ink data-[active=true]:font-semibold data-[active=true]:text-accent-ink sm:px-4"
                onClick={() => mode !== id && onSelect({ mode: id, boxIndex: null })}>
          {label}
        </button>
      ))}
    </div>
  );
}
