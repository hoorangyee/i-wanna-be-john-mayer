import { useEffect, useState, useRef } from "react";
import { STRINGS, posKey, type StringNo, type FretPos } from "@/theory/fretboard";
import { playPosition } from "@/audio/tone";
import {
  DEFAULT_RANGE, makeFindAllTarget, makeNameQuestion, positionsInRange,
  type FindAllTarget, type NameQuestion, type QuizRange,
} from "@/quiz/engine";
import { accuracy, avgMs, emptyStats, loadStats, recordResult, type QuizModeId, type QuizStats } from "@/quiz/stats";
import { Fretboard, type QuizMark } from "./Fretboard";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

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
  const recordedRef = useRef(false);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setStats(loadStats()); // SSR 하이드레이션 불일치 방지: 마운트 후 로드
  }, []);

  const resetProgress = () => {
    setQuestion(null);
    setPicked(null);
    setTarget(null);
    setFound(new Set());
    setMisses(new Set());
    setRevealed(false);
    recordedRef.current = false;
  };

  const toggleString = (s: StringNo) => {
    const has = range.strings.includes(s);
    if (has && range.strings.length === 1) return; // 최소 1현 유지
    setRange({
      ...range,
      strings: has ? range.strings.filter((x) => x !== s) : [...range.strings, s],
    });
    resetProgress();
  };

  const changeFretMax = (fretMax: number) => {
    setRange((r) => ({ ...r, fretMax }));
    resetProgress();
  };

  // 의도적 결정: 미답 상태에서 "다음 문제"로 넘어가는 스킵을 허용하고 기록하지 않는다.
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
    resetProgress();
  };

  const roundComplete = target !== null && found.size === target.positions.length;
  const roundOver = revealed || roundComplete;

  useEffect(() => {
    if (!target || !roundOver || recordedRef.current) return;
    recordedRef.current = true;
    const clean = roundComplete && misses.size === 0;
    setSession((s) => ({
      ...s,
      findAll: { asked: s.findAll.asked + 1, correct: s.findAll.correct + (clean ? 1 : 0) },
    }));
    setStats(recordResult("findAll", clean, Date.now() - askedAt));
  }, [target, roundOver, roundComplete, misses, askedAt]);

  const answered = picked !== null;
  useEffect(() => {
    if (roundOver || answered) primaryBtnRef.current?.focus();
  }, [roundOver, answered]);

  const targetKeys = target ? new Set(target.positions.map(posKey)) : null;
  const rangeKeys = quizMode === "findAll" && target
    ? new Set(positionsInRange(range).map(posKey))
    : undefined;

  const startFind = () => {
    recordedRef.current = false;
    setTarget(makeTarget(range));
    setFound(new Set());
    setMisses(new Set());
    setRevealed(false);
    setAskedAt(Date.now());
  };

  const handlePositionClick = (pos: FretPos) => {
    if (!target || roundOver) return;
    playPosition(pos);
    const k = posKey(pos);
    if (found.has(k) || misses.has(k)) return;
    if (targetKeys!.has(k)) {
      setFound((prev) => new Set(prev).add(k));
    } else {
      setMisses((prev) => new Set(prev).add(k));
    }
  };

  const giveUp = () => {
    if (!target || roundOver) return;
    setRevealed(true);
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
    <>
      <div className="card mb-4 flex min-h-[76px] flex-wrap items-end gap-x-5 gap-y-3 px-4 py-3">
        <div className="field">
          <span>출제 현</span>
          <div className="seg" role="group" aria-label="출제 현">
            {STRINGS.map((s) => (
              <button key={s} type="button" data-active={range.strings.includes(s)}
                      aria-pressed={range.strings.includes(s)}
                      onClick={() => toggleString(s)}>
                {s}번
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>퀴즈 종류</span>
          <div className="seg" role="group" aria-label="퀴즈 종류">
            {QUIZ_MODES.map(({ id, label }) => (
              <button key={id} type="button" data-active={quizMode === id} aria-pressed={quizMode === id}
                      onClick={() => switchQuizMode(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          프렛 범위
          <select id="quiz-fret-max" value={range.fretMax}
                  onChange={(e) => changeFretMax(Number(e.target.value))}>
            {FRET_MAX_OPTIONS.map((f) => <option key={f} value={f}>0~{f}</option>)}
          </select>
        </label>

        <div className="ml-auto flex items-center gap-2 self-end">
          {quizMode === "findAll" && target && !roundOver && (
            <button type="button" className="btn-ghost" onClick={giveUp}>정답 보기</button>
          )}
          <button ref={primaryBtnRef} type="button" className="btn-primary"
                  onClick={quizMode === "nameThatNote" ? ask : startFind}>
            {(quizMode === "nameThatNote" ? question : target) ? "다음 문제" : "시작"}
          </button>
        </div>
      </div>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5">
          <h2 className="view-title text-[17px] font-semibold tracking-tight">
            {quizMode === "nameThatNote"
              ? question ? "이 위치의 음이름은?" : "퀴즈 — 이 음은?"
              : target
                ? `지판에서 모든 ${target.name}을 클릭하세요 (${found.size}/${target.positions.length})`
                : "퀴즈 — 모두 찾기"}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">이번 세션 {session[quizMode].correct}/{session[quizMode].asked}</span>
            {acc !== null && avg !== null && (
              <>
                <span className="chip">누적 정답률 {Math.round(acc * 100)}%</span>
                <span className="chip">평균 {(avg / 1000).toFixed(1)}초</span>
              </>
            )}
          </div>
        </div>

        {quizMode === "findAll" && target && !roundOver && (
          <p className="sr-only">
            지판의 클릭 영역을 Tab으로 이동하고 Enter로 선택하세요. 목표: 모든 {target.name} 찾기.
          </p>
        )}

        <div className="board-scroll px-5 py-4">
          <Fretboard notes={EMPTY_NOTES} labelMode="none" window={null} marks={marks}
                     interactive={quizMode === "findAll" && target !== null && !roundOver}
                     interactivePositions={rangeKeys}
                     onPositionClick={handlePositionClick} activeRegion={range} />
        </div>

        {quizMode === "nameThatNote" && question && (
          <div className="flex flex-wrap gap-3 px-5 pb-4">
            {question.choices.map((c) => (
              <button key={c} type="button" className="choice"
                      data-state={picked === null ? "idle" : c === question.answer ? "correct" : c === picked ? "wrong" : "idle"}
                      disabled={picked !== null}
                      onClick={() => answer(c)}>
                {c}
              </button>
            ))}
          </div>
        )}

        {quizMode === "nameThatNote" && picked !== null && question && (
          <p className="quiz-feedback px-5 pb-4" role="status" data-correct={picked === question.answer}>
            {picked === question.answer ? <CheckIcon /> : <XIcon />}
            {picked === question.answer ? "정답!" : `오답 — 정답은 ${question.answer}`}
          </p>
        )}

        {quizMode === "findAll" && target && roundOver && (
          <p className="quiz-feedback px-5 pb-4" role="status" data-correct={roundComplete && misses.size === 0}>
            {roundComplete && misses.size === 0 ? <CheckIcon /> : <XIcon />}
            {revealed ? "정답 공개" : misses.size === 0 ? "완벽!" : `완료 — 실수 ${misses.size}회`}
          </p>
        )}
      </section>
    </>
  );
}
