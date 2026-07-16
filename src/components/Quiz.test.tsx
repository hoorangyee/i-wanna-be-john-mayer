import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { Quiz } from "./Quiz";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const stubQuestion = {
  pos: { str: 6 as const, fret: 5 },
  answer: "A",
  choices: ["A", "C", "D", "E"],
};

describe("Quiz — 이 음은?", () => {
  it("shows a question mark and four choices after start", () => {
    const { getByRole, container } = render(<Quiz makeQuestion={() => stubQuestion} />);
    fireEvent.click(getByRole("button", { name: "시작" }));
    expect(container.querySelector("[data-testid='mark-6-5']")?.getAttribute("data-kind")).toBe("question");
    expect(container.querySelectorAll(".choice")).toHaveLength(4);
  });

  it("marks a correct answer and counts the session", () => {
    const { getByRole, getByText, container } = render(<Quiz makeQuestion={() => stubQuestion} />);
    fireEvent.click(getByRole("button", { name: "시작" }));
    fireEvent.click(getByRole("button", { name: "A" }));
    expect(container.querySelector("[data-testid='mark-6-5']")?.getAttribute("data-kind")).toBe("correct");
    expect(getByText("정답!")).not.toBeNull();
    expect(getByText(/이번 세션 1\/1/)).not.toBeNull();
  });

  it("reveals the answer at the position on a wrong pick", () => {
    const { getByRole, getByText, container } = render(<Quiz makeQuestion={() => stubQuestion} />);
    fireEvent.click(getByRole("button", { name: "시작" }));
    fireEvent.click(getByRole("button", { name: "C" }));
    expect(container.querySelector("[data-testid='mark-6-5']")?.getAttribute("data-kind")).toBe("wrong");
    expect(container.querySelector("[data-testid='mark-6-5'] text")?.textContent).toBe("A");
    expect(getByText(/오답 — 정답은 A/)).not.toBeNull();
    expect(getByText(/이번 세션 0\/1/)).not.toBeNull();
  });

  it("persists stats to localStorage", () => {
    const { getByRole } = render(<Quiz makeQuestion={() => stubQuestion} />);
    fireEvent.click(getByRole("button", { name: "시작" }));
    fireEvent.click(getByRole("button", { name: "A" }));
    const raw = window.localStorage.getItem("fretboard-quiz-stats-v1");
    expect(JSON.parse(raw!).nameThatNote).toEqual(
      expect.objectContaining({ attempts: 1, correct: 1 })
    );
  });
});

const stubTarget = {
  name: "A",
  pc: 9,
  positions: [{ str: 6 as const, fret: 5 }, { str: 5 as const, fret: 0 }],
};

describe("Quiz — 모두 찾기", () => {
  const setup = () => {
    const utils = render(<Quiz makeTarget={() => stubTarget} />);
    fireEvent.click(utils.getByRole("button", { name: "모두 찾기" }));
    fireEvent.click(utils.getByRole("button", { name: "시작" }));
    return utils;
  };

  it("shows the target and progress after start", () => {
    const { getByText } = setup();
    expect(getByText(/모든 A/)).not.toBeNull();
    expect(getByText(/0\/2/)).not.toBeNull();
  });

  it("judges clicks and completes the round", () => {
    const { getByText, container } = setup();
    fireEvent.click(container.querySelector("[data-testid='hit-6-5']")!);
    expect(container.querySelector("[data-testid='mark-6-5']")?.getAttribute("data-kind")).toBe("correct");
    fireEvent.click(container.querySelector("[data-testid='hit-6-3']")!); // G — 오답
    expect(container.querySelector("[data-testid='mark-6-3']")?.getAttribute("data-kind")).toBe("wrong");
    fireEvent.click(container.querySelector("[data-testid='hit-5-0']")!);
    expect(getByText(/완료 — 실수 1회/)).not.toBeNull();
    const raw = window.localStorage.getItem("fretboard-quiz-stats-v1");
    expect(JSON.parse(raw!).findAll).toEqual(expect.objectContaining({ attempts: 1, correct: 0 }));
  });

  it("completes cleanly with no mistakes", () => {
    const { getByText, container } = setup();
    fireEvent.click(container.querySelector("[data-testid='hit-6-5']")!);
    fireEvent.click(container.querySelector("[data-testid='hit-5-0']")!);
    expect(getByText("완벽!")).not.toBeNull();
    const raw = window.localStorage.getItem("fretboard-quiz-stats-v1");
    expect(JSON.parse(raw!).findAll).toEqual(expect.objectContaining({ attempts: 1, correct: 1 }));
  });

  it("reveals remaining positions on give-up and records a miss", () => {
    const { getByRole, container } = setup();
    fireEvent.click(container.querySelector("[data-testid='hit-6-5']")!);
    fireEvent.click(getByRole("button", { name: "정답 보기" }));
    const reveal = container.querySelector("[data-testid='mark-5-0']");
    expect(reveal?.getAttribute("data-kind")).toBe("reveal");
    expect(reveal?.querySelector("text")?.textContent).toBe("A");
    const raw = window.localStorage.getItem("fretboard-quiz-stats-v1");
    expect(JSON.parse(raw!).findAll).toEqual(expect.objectContaining({ attempts: 1, correct: 0 }));
  });

  it("judges by target positions, not pitch class alone", () => {
    const { container } = setup();
    // 5번줄 12프렛도 같은 A(pc 9)지만 스텁 타깃 목록에 없음 → wrong 처리
    fireEvent.click(container.querySelector("[data-testid='hit-5-12']")!);
    expect(container.querySelector("[data-testid='mark-5-12']")?.getAttribute("data-kind")).toBe("wrong");
    expect(container.querySelector(".view-title")?.textContent).toContain("(0/2)");
  });

  it("renders click targets only inside the quiz range", () => {
    const { container } = setup();
    expect(container.querySelector("[data-testid='hit-6-5']")).not.toBeNull();
    expect(container.querySelector("[data-testid='hit-4-2']")).toBeNull(); // 4번줄은 기본 범위 밖
  });
});

describe("Quiz — 세션 카운터", () => {
  it("keeps session counters per quiz mode", () => {
    const { getByRole, getByText } = render(
      <Quiz makeQuestion={() => stubQuestion} makeTarget={() => stubTarget} />
    );
    fireEvent.click(getByRole("button", { name: "시작" }));
    fireEvent.click(getByRole("button", { name: "A" }));
    expect(getByText(/이번 세션 1\/1/)).not.toBeNull();
    fireEvent.click(getByRole("button", { name: "모두 찾기" }));
    expect(getByText(/이번 세션 0\/0/)).not.toBeNull();
  });
});
