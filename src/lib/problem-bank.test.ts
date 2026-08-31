import { describe, expect, it } from "vitest";
import { ingestProblemRecords, queryProblemBank } from "./problem-bank";
import { starterProblems, type Problem } from "./problems";

describe("problem bank ingestion", () => {
  it("accepts valid curated records", () => {
    const result = ingestProblemRecords(starterProblems);

    expect(result.rejected).toHaveLength(0);
    expect(result.accepted).toHaveLength(starterProblems.length);
  });

  it("rejects duplicate source provenance even when ids differ", () => {
    const duplicate: Problem = {
      ...starterProblems[0],
      id: "different-local-id",
    };

    const result = ingestProblemRecords([duplicate], [starterProblems[0]]);

    expect(result.accepted).toHaveLength(0);
    expect(result.rejected[0]?.reason).toContain("Duplicate source problem");
  });

  it("fails records that drop licensing provenance", () => {
    const invalid = {
      ...starterProblems[0],
      id: "missing-license",
      sourceProblemId: "missing-license",
      licensingNote: "",
    };

    const result = ingestProblemRecords([invalid]);

    expect(result.accepted).toHaveLength(0);
    expect(result.rejected[0]?.reason).toContain("licensingNote");
  });

  it("queries by skill and difficulty", () => {
    const coreRational = queryProblemBank(starterProblems, {
      primarySkill: "rational-functions",
      difficulty: "core",
    });

    expect(coreRational).toHaveLength(1);
    expect(coreRational[0]?.id).toBe("rf-ha-001");
  });
});
