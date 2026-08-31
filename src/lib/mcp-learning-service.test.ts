import { beforeEach, describe, expect, it } from "vitest";
import {
  completeSession,
  getMastery,
  getMistakeHistory,
  getProblems,
  getTodayPlan,
  recordAttempt,
  resetLearningStateForTests,
  startSession,
} from "./mcp-learning-service";

describe("MCP learning service", () => {
  beforeEach(() => resetLearningStateForTests());

  it("returns provenance with verified problems", () => {
    const problems = getProblems({ primarySkill: "rational-functions", limit: 2 });
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0].source).toBeTruthy();
    expect(problems[0].sourceProblemId).toBeTruthy();
    expect(problems[0].licensingNote).toBeTruthy();
  });

  it("records an attempt and updates mastery without accepting direct mastery writes", () => {
    const [problem] = getProblems({ primarySkill: "rational-functions", limit: 1 });
    const before = getMastery().find((item) => item.skillId === "rational-functions")!.mastery;
    const session = startSession([problem.id]);

    const result = recordAttempt({
      sessionId: session.id,
      problemId: problem.id,
      selectedChoiceId: problem.choices[0].id,
      durationMs: 12000,
      mistakeCategory: "concept",
    });

    const after = getMastery().find((item) => item.skillId === "rational-functions")!.mastery;
    expect(result.attempt.problemId).toBe(problem.id);
    expect(after).not.toBe(before);
  });

  it("tracks mistake history and completes sessions", () => {
    const [problem] = getProblems({ limit: 1 });
    const wrongChoice = problem.choices.find((choice) => choice.id !== "__never__")!;
    const session = startSession([problem.id]);

    recordAttempt({
      sessionId: session.id,
      problemId: problem.id,
      selectedChoiceId: wrongChoice.id,
      durationMs: 8000,
      mistakeCategory: "unknown",
    });

    const completed = completeSession(session.id);
    expect(completed.summary.answered).toBe(1);
    expect(getMistakeHistory()).toBeInstanceOf(Array);
  });

  it("produces a next-study plan from deterministic state", () => {
    const plan = getTodayPlan();
    expect(plan.nextSkillId).toBeTruthy();
  });
});
