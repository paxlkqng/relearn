import { describe, expect, it } from "vitest";
import {
  applyEvidence,
  chooseNextSkill,
  diagnoseFailure,
  seedMasteryState,
  type MasteryState,
} from "@/src/lib/mastery-engine";

describe("mastery engine", () => {
  it("updates mastery deterministically and keeps it in bounds", () => {
    const state: MasteryState = { factoring: 0.5 };
    const afterCorrect = applyEvidence(state, {
      skillId: "factoring",
      correct: true,
      category: "concept",
    });
    const afterWrong = applyEvidence(afterCorrect, {
      skillId: "factoring",
      correct: false,
      category: "concept",
    });

    expect(afterCorrect.factoring).toBeCloseTo(0.545);
    expect(afterWrong.factoring).toBeCloseTo(0.475);
  });

  it("falls back from rational functions to a weak prerequisite", () => {
    const state = seedMasteryState();
    const diagnosis = diagnoseFailure("rational-functions", state, "unknown");

    expect(diagnosis.suspectedRootSkillId).toBe("polynomial-division");
    expect(diagnosis.prerequisitePath).toContain("factoring");
    expect(diagnosis.prerequisitePath.at(-1)).toBe("rational-functions");
  });

  it("does not descend for a careless mistake", () => {
    const state = seedMasteryState();
    const diagnosis = diagnoseFailure("rational-functions", state, "careless");

    expect(diagnosis.suspectedRootSkillId).toBe("rational-functions");
  });

  it("routes an algebra-manipulation error to the algebra foundation when weak", () => {
    const state = {
      ...seedMasteryState(),
      "equation-manipulation": 0.4,
    };

    const diagnosis = diagnoseFailure(
      "rational-functions",
      state,
      "algebra-manipulation",
    );

    expect(diagnosis.suspectedRootSkillId).toBe("equation-manipulation");
  });

  it("chooses the weakest candidate and then resolves prerequisite debt", () => {
    const state = seedMasteryState();
    const next = chooseNextSkill(["rational-functions", "function-transformations"], state);

    expect(next).toBe("polynomial-division");
  });
});
