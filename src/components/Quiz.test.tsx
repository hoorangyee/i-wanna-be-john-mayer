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
