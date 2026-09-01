import { describe, expect, it } from "vitest";
import { problemDbIdFromProvenance } from "./problem-identity";

describe("persistent problem identity", () => {
  it("is deterministic for the same provenance", () => {
    const first = problemDbIdFromProvenance("Relearn seed", "sample-factoring-001");
    const second = problemDbIdFromProvenance("Relearn seed", "sample-factoring-001");

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("changes when either provenance component changes", () => {
    const base = problemDbIdFromProvenance("source-a", "problem-1");

    expect(problemDbIdFromProvenance("source-b", "problem-1")).not.toBe(base);
    expect(problemDbIdFromProvenance("source-a", "problem-2")).not.toBe(base);
  });

  it("normalizes surrounding whitespace but rejects missing provenance", () => {
    expect(problemDbIdFromProvenance(" source-a ", " problem-1 ")).toBe(
      problemDbIdFromProvenance("source-a", "problem-1"),
    );

    expect(() => problemDbIdFromProvenance("", "problem-1")).toThrow(/source is required/i);
    expect(() => problemDbIdFromProvenance("source-a", "   ")).toThrow(/sourceProblemId is required/i);
  });
});
