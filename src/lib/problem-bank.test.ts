import { describe, expect, it } from "vitest";
import {
  ingestProblemRecords,
  parseProblemCsv,
  parseProblemJson,
  queryProblemBank,
} from "./problem-bank";
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

  it("parses a curated JSON batch", () => {
    const parsed = parseProblemJson(JSON.stringify(starterProblems.slice(0, 2)));
    const result = ingestProblemRecords(parsed);

    expect(result.rejected).toHaveLength(0);
    expect(result.accepted).toHaveLength(2);
  });

  it("parses a curated CSV batch with JSON-encoded list fields", () => {
    const headers = [
      "id",
      "source",
      "sourceProblemId",
      "sourceUrl",
      "licensingNote",
      "solutionReference",
      "primarySkill",
      "prerequisiteSkills",
      "difficulty",
      "prompt",
      "choices",
      "correctChoiceId",
      "explanation",
    ].join(",");

    const csvEscape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const problem = starterProblems[0];
    const row = [
      problem.id,
      problem.source,
      problem.sourceProblemId,
      problem.sourceUrl ?? "",
      problem.licensingNote,
      problem.solutionReference ?? "",
      problem.primarySkill,
      JSON.stringify(problem.prerequisiteSkills),
      problem.difficulty,
      problem.prompt,
      JSON.stringify(problem.choices),
      problem.correctChoiceId,
      problem.explanation,
    ].map(csvEscape).join(",");

    const parsed = parseProblemCsv(`${headers}\n${row}`);
    const result = ingestProblemRecords(parsed);

    expect(result.rejected).toHaveLength(0);
    expect(result.accepted[0]?.sourceProblemId).toBe(problem.sourceProblemId);
  });
});
