import { useEffect, useState } from "react";
import { STRINGS, posKey, type StringNo } from "@/theory/fretboard";
import { DEFAULT_RANGE, makeNameQuestion, type NameQuestion, type QuizRange } from "@/quiz/engine";
import { accuracy, avgMs, emptyStats, loadStats, recordResult, type QuizStats } from "@/quiz/stats";
import { Fretboard, type QuizMark } from "./Fretboard";

export interface QuizProps {
  makeQuestion?: typeof makeNameQuestion; // 테스트 주입용
}

const FRET_MAX_OPTIONS = [5, 12, 22];
const EMPTY_NOTES = new Map();

export function Quiz({ makeQuestion = makeNameQuestion }: QuizProps) {
  const [range, setRange] = useState<QuizRange>(DEFAULT_RANGE);
  const [question, setQuestion] = useState<NameQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [askedAt, setAskedAt] = useState(0);
  const [session, setSession] = useState({ asked: 0, correct: 0 });
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
    setSession((s) => ({ asked: s.asked + 1, correct: s.correct + (correct ? 1 : 0) }));
    setStats(recordResult("nameThatNote", correct, Date.now() - askedAt));
  };

  const marks = new Map<string, QuizMark>();
  if (question) {
    marks.set(
      posKey(question.pos),
      picked === null
        ? { kind: "question" }
        : { kind: picked === question.answer ? "correct" : "wrong", label: question.answer }
    );
  }

  const m = stats.nameThatNote;
  const acc = accuracy(m);
  const avg = avgMs(m);

  return (
    <section className="board quiz">
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
        <label>
          프렛 범위
          <select value={range.fretMax}
                  onChange={(e) => setRange((r) => ({ ...r, fretMax: Number(e.target.value) }))}>
            {FRET_MAX_OPTIONS.map((f) => <option key={f} value={f}>0~{f}</option>)}
          </select>
        </label>
        <button className="primary" onClick={ask}>
          {question ? "다음 문제" : "시작"}
        </button>
      </div>

      <h2 className="view-title">{question ? "이 위치의 음이름은?" : "퀴즈 — 이 음은?"}</h2>

      <Fretboard notes={EMPTY_NOTES} labelMode="none" window={null} marks={marks} />

      {question && (
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

      {picked !== null && question && (
        <p className="quiz-feedback" data-correct={picked === question.answer}>
          {picked === question.answer ? "정답!" : `오답 — 정답은 ${question.answer}`}
        </p>
      )}

      <p className="quiz-stats">
        이번 세션 {session.correct}/{session.asked}
        {acc !== null && avg !== null &&
          ` · 누적 정답률 ${Math.round(acc * 100)}% · 평균 ${(avg / 1000).toFixed(1)}초`}
      </p>
    </section>
  );
}
