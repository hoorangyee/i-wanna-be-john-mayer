import { useEffect } from "react";
import { MAX_PROG, progChordLabel, type ProgChord } from "@/theory/progression";
import { MESSAGES } from "@/lib/i18n";
import { useLang } from "@/lib/LangContext";

export interface ProgressionBarProps {
  prog: readonly ProgChord[];
  index: number;
  onSelect: (index: number) => void;
  onInsert: () => void;
  onRemove: () => void;
}

const FORM_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA"]);

export function ProgressionBar({ prog, index, onSelect, onInsert, onRemove }: ProgressionBarProps) {
  const { lang } = useLang();
  const m = MESSAGES[lang];

  // ←/→ 로 코드 사이를 오간다 — 내비게이션의 소유자가 이 바이므로 구독도 여기서.
  useEffect(() => {
    if (prog.length < 2) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (FORM_TAGS.has(target.tagName) || target.isContentEditable)) return;
      e.preventDefault();
      const step = e.key === "ArrowRight" ? 1 : -1;
      onSelect((index + step + prog.length) % prog.length); // 양끝에서 순환
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prog.length, index, onSelect]);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-3">
      <span className="text-xs font-medium text-ink-muted">{m.progToggle}</span>

      <div className="seg" role="group" aria-label={m.progGroup}>
        {prog.map((chord, i) => {
          const symbol = progChordLabel(chord);
          return (
            <button key={i} type="button"
                    data-active={i === index} aria-pressed={i === index}
                    aria-label={m.progChipLabel(i + 1, symbol)}
                    onClick={() => onSelect(i)}>
              {symbol}
            </button>
          );
        })}
      </div>

      <div className="seg" role="group" aria-label={m.progGroup}>
        <button type="button" aria-label={m.progAdd} title={m.progAdd}
                disabled={prog.length >= MAX_PROG} onClick={onInsert}>
          ＋
        </button>
        <button type="button" aria-label={m.progRemove} title={m.progRemove}
                disabled={prog.length <= 1} onClick={onRemove}>
          ✕
        </button>
      </div>

      {prog.length === 1 && <p className="text-xs text-ink-muted">{m.progHint}</p>}
    </div>
  );
}
