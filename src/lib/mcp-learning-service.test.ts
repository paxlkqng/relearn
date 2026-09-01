import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLearningRepository } from "./learning-repository";
import {
  completeSession,
  createLearningService,
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

  it("isolates sessions, mistakes, and mastery by trusted learner id", () => {
    const repository = new InMemoryLearningRepository();
    const learnerA = createLearningService({ learnerId: "learner-a", repository });
    const learnerB = createLearningService({ learnerId: "learner-b", repository });
    const [problem] = learnerA.getProblems({ primarySkill: "factoring", limit: 1 });
    const initialB = learnerB.getMastery().find((item) => item.skillId === "factoring")!.mastery;
    const sessionA = learnerA.startSession([problem.id]);

    learnerA.recordAttempt({
      sessionId: sessionA.id,
      problemId: problem.id,
      selectedChoiceId: problem.choices[0].id,
      durationMs: 1000,
      mistakeCategory: "concept",
    });

    expect(learnerB.getMistakeHistory()).toEqual([]);
    expect(() => learnerB.completeSession(sessionA.id)).toThrow(`Unknown session: ${sessionA.id}`);
    expect(learnerB.getMastery().find((item) => item.skillId === "factoring")!.mastery).toBe(initialB);
  });

  it("rejects an empty learner id at the service boundary", () => {
    expect(() =>
      createLearningService({ learnerId: "   ", repository: new InMemoryLearningRepository() }),
    ).toThrow("A trusted learner id is required.");
  });
});
