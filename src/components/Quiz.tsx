import { useEffect, useState } from "react";
import { STRINGS, posKey, type StringNo, type FretPos } from "@/theory/fretboard";
import {
  DEFAULT_RANGE, makeFindAllTarget, makeNameQuestion, positionsInRange,
  type FindAllTarget, type NameQuestion, type QuizRange,
} from "@/quiz/engine";
import { accuracy, avgMs, emptyStats, loadStats, recordResult, type QuizModeId, type QuizStats } from "@/quiz/stats";
import { Fretboard, type QuizMark } from "./Fretboard";

export interface QuizProps {
  makeQuestion?: typeof makeNameQuestion;
  makeTarget?: typeof makeFindAllTarget;
}

const FRET_MAX_OPTIONS = [5, 12, 22];
const EMPTY_NOTES = new Map();
const QUIZ_MODES: { id: QuizModeId; label: string }[] = [
  { id: "nameThatNote", label: "이 음은?" },
  { id: "findAll", label: "모두 찾기" },
];

export function Quiz({ makeQuestion = makeNameQuestion, makeTarget = makeFindAllTarget }: QuizProps) {
  const [range, setRange] = useState<QuizRange>(DEFAULT_RANGE);
  const [quizMode, setQuizMode] = useState<QuizModeId>("nameThatNote");
  const [question, setQuestion] = useState<NameQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [target, setTarget] = useState<FindAllTarget | null>(null);
  const [found, setFound] = useState<ReadonlySet<string>>(new Set());
  const [misses, setMisses] = useState<ReadonlySet<string>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const [askedAt, setAskedAt] = useState(0);
  const [session, setSession] = useState({
    nameThatNote: { asked: 0, correct: 0 },
    findAll: { asked: 0, correct: 0 },
  });
  const [stats, setStats] = useState<QuizStats>(emptyStats());

  useEffect(() => {
    setStats(loadStats()); // SSR 하이드레이션 불일치 방지: 마운트 후 로드
  }, []);

  const toggleString = (s: StringNo) => {
    setRange((r) => {
      const has = r.strings.includes(s);
      if (has && r.strings.length === 1) return r; // 최소 1현 유지
      return { ...r, strings: has ? r.strings.filter((x) => x !== s) : [...r.strings, s] };
    });
  };

  const ask = () => {
    setQuestion(makeQuestion(range));
    setPicked(null);
    setAskedAt(Date.now());
  };

  const answer = (choice: string) => {
    if (!question || picked !== null) return;
    setPicked(choice);
    const correct = choice === question.answer;
    setSession((s) => ({
      ...s,
      nameThatNote: {
        asked: s.nameThatNote.asked + 1,
        correct: s.nameThatNote.correct + (correct ? 1 : 0),
      },
    }));
    setStats(recordResult("nameThatNote", correct, Date.now() - askedAt));
  };

  const switchQuizMode = (id: QuizModeId) => {
    if (id === quizMode) return;
    setQuizMode(id);
    setQuestion(null);
    setPicked(null);
    setTarget(null);
    setFound(new Set());
    setMisses(new Set());
    setRevealed(false);
  };

  const roundComplete = target !== null && found.size === target.positions.length;
  const roundOver = revealed || roundComplete;

  const targetKeys = target ? new Set(target.positions.map(posKey)) : null;
  const rangeKeys = quizMode === "findAll" && target
    ? new Set(positionsInRange(range).map(posKey))
    : undefined;

  const startFind = () => {
    setTarget(makeTarget(range));
    setFound(new Set());
    setMisses(new Set());
    setRevealed(false);
    setAskedAt(Date.now());
  };

  const handlePositionClick = (pos: FretPos) => {
    if (!target || roundOver) return;
    const k = posKey(pos);
    if (found.has(k) || misses.has(k)) return;
    if (targetKeys!.has(k)) {
      const next = new Set(found);
      next.add(k);
      setFound(next);
      if (next.size === target.positions.length) {
        const clean = misses.size === 0;
        setSession((s) => ({
          ...s,
          findAll: { asked: s.findAll.asked + 1, correct: s.findAll.correct + (clean ? 1 : 0) },
        }));
        setStats(recordResult("findAll", clean, Date.now() - askedAt));
      }
    } else {
      setMisses(new Set(misses).add(k));
    }
  };

  const giveUp = () => {
    if (!target || roundOver) return;
    setRevealed(true);
    setSession((s) => ({
      ...s,
      findAll: { asked: s.findAll.asked + 1, correct: s.findAll.correct },
    }));
    setStats(recordResult("findAll", false, Date.now() - askedAt));
  };

  const marks = new Map<string, QuizMark>();
  if (quizMode === "nameThatNote" && question) {
    marks.set(
      posKey(question.pos),
      picked === null
        ? { kind: "question" }
        : { kind: picked === question.answer ? "correct" : "wrong", label: question.answer }
    );
  }
  if (quizMode === "findAll" && target) {
    for (const k of found) marks.set(k, { kind: "correct", label: target.name });
    for (const k of misses) marks.set(k, { kind: "wrong" });
    if (revealed) {
      for (const p of target.positions) {
        const k = posKey(p);
        if (!found.has(k)) marks.set(k, { kind: "reveal", label: target.name });
      }
    }
  }

  const m = stats[quizMode];
  const acc = accuracy(m);
  const avg = avgMs(m);

  return (
    <section className="board">
      <div className="quiz-settings">
        <div className="seg" role="group" aria-label="출제 현">
          {STRINGS.map((s) => (
            <button key={s} data-active={range.strings.includes(s)}
                    aria-pressed={range.strings.includes(s)}
                    onClick={() => toggleString(s)}>
              {s}번
            </button>
          ))}
        </div>
        <div className="seg" role="group" aria-label="퀴즈 종류">
          {QUIZ_MODES.map(({ id, label }) => (
            <button key={id} data-active={quizMode === id} aria-pressed={quizMode === id}
                    onClick={() => switchQuizMode(id)}>
              {label}
            </button>
          ))}
        </div>
        <label>
          프렛 범위
          <select id="quiz-fret-max" value={range.fretMax}
                  onChange={(e) => setRange((r) => ({ ...r, fretMax: Number(e.target.value) }))}>
            {FRET_MAX_OPTIONS.map((f) => <option key={f} value={f}>0~{f}</option>)}
          </select>
        </label>
        <button className="primary" onClick={quizMode === "nameThatNote" ? ask : startFind}>
          {(quizMode === "nameThatNote" ? question : target) ? "다음 문제" : "시작"}
        </button>
        {quizMode === "findAll" && target && !roundOver && (
          <button onClick={giveUp}>정답 보기</button>
        )}
      </div>

      <h2 className="view-title">
        {quizMode === "nameThatNote"
          ? question ? "이 위치의 음이름은?" : "퀴즈 — 이 음은?"
          : target
            ? `지판에서 모든 ${target.name}을 클릭하세요 (${found.size}/${target.positions.length})`
            : "퀴즈 — 모두 찾기"}
      </h2>

      <Fretboard notes={EMPTY_NOTES} labelMode="none" window={null} marks={marks}
                 interactive={quizMode === "findAll" && target !== null && !roundOver}
                 interactivePositions={rangeKeys}
                 onPositionClick={handlePositionClick} />

      {quizMode === "nameThatNote" && question && (
        <div className="quiz-answers">
          {question.choices.map((c) => (
            <button key={c} className="choice"
                    data-state={picked === null ? "idle" : c === question.answer ? "correct" : c === picked ? "wrong" : "idle"}
                    disabled={picked !== null}
                    onClick={() => answer(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      {quizMode === "nameThatNote" && picked !== null && question && (
        <p className="quiz-feedback" data-correct={picked === question.answer}>
          {picked === question.answer ? "정답!" : `오답 — 정답은 ${question.answer}`}
        </p>
      )}

      {quizMode === "findAll" && target && roundOver && (
        <p className="quiz-feedback" data-correct={roundComplete && misses.size === 0}>
          {revealed ? "정답 공개" : misses.size === 0 ? "완벽!" : `완료 — 실수 ${misses.size}회`}
        </p>
      )}

      <p className="quiz-stats">
        이번 세션 {session[quizMode].correct}/{session[quizMode].asked}
        {acc !== null && avg !== null &&
          ` · 누적 정답률 ${Math.round(acc * 100)}% · 평균 ${(avg / 1000).toFixed(1)}초`}
      </p>
    </section>
  );
}
