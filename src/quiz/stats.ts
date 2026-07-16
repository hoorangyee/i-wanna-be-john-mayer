export interface ModeStats {
  attempts: number;
  correct: number;
  totalMs: number;
}

export type QuizModeId = "nameThatNote" | "findAll";

export interface QuizStats {
  nameThatNote: ModeStats;
  findAll: ModeStats;
}

const STORAGE_KEY = "fretboard-quiz-stats-v1";

const emptyMode = (): ModeStats => ({ attempts: 0, correct: 0, totalMs: 0 });

export function emptyStats(): QuizStats {
  return { nameThatNote: emptyMode(), findAll: emptyMode() };
}

export function loadStats(): QuizStats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as Partial<QuizStats>;
    return {
      nameThatNote: { ...emptyMode(), ...parsed.nameThatNote },
      findAll: { ...emptyMode(), ...parsed.findAll },
    };
  } catch {
    return emptyStats();
  }
}

export function recordResult(mode: QuizModeId, correct: boolean, elapsedMs: number): QuizStats {
  const stats = loadStats();
  const m = stats[mode];
  m.attempts += 1;
  if (correct) m.correct += 1;
  m.totalMs += elapsedMs;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }
  return stats;
}

export function accuracy(m: ModeStats): number | null {
  return m.attempts === 0 ? null : m.correct / m.attempts;
}

export function avgMs(m: ModeStats): number | null {
  return m.attempts === 0 ? null : m.totalMs / m.attempts;
}
