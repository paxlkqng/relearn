import type { Problem, ProblemDifficulty } from "./problems";

export type ProblemBankRecord = Problem;

export type ProblemQuery = {
  primarySkill?: string;
  difficulty?: ProblemDifficulty;
  limit?: number;
};

export type IngestionResult = {
  accepted: ProblemBankRecord[];
  rejected: { index: number; reason: string }[];
};

function assertNonEmpty(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid problem record: ${field} is required.`);
  }
}

export function validateProblemRecord(record: ProblemBankRecord): void {
  assertNonEmpty(record.id, "id");
  assertNonEmpty(record.source, "source");
  assertNonEmpty(record.sourceProblemId, "sourceProblemId");
  assertNonEmpty(record.licensingNote, "licensingNote");
  assertNonEmpty(record.primarySkill, "primarySkill");
  assertNonEmpty(record.prompt, "prompt");
  assertNonEmpty(record.correctChoiceId, "correctChoiceId");
  assertNonEmpty(record.explanation, "explanation");

  if (record.sourceUrl) {
    try {
      new URL(record.sourceUrl);
    } catch {
      throw new Error(`Invalid problem record: sourceUrl must be a valid URL for ${record.id}.`);
    }
  }

  if (!Array.isArray(record.prerequisiteSkills)) {
    throw new Error(`Invalid problem record: prerequisiteSkills must be an array for ${record.id}.`);
  }

  if (!Array.isArray(record.choices) || record.choices.length < 2) {
    throw new Error(`Invalid problem record: choices must contain at least two options for ${record.id}.`);
  }

  const choiceIds = record.choices.map((choice) => choice.id);
  if (new Set(choiceIds).size !== choiceIds.length) {
    throw new Error(`Invalid problem record: choice ids must be unique for ${record.id}.`);
  }

  if (!choiceIds.includes(record.correctChoiceId)) {
    throw new Error(`Invalid problem record: correctChoiceId is not present in choices for ${record.id}.`);
  }
}

export function provenanceKey(record: Pick<ProblemBankRecord, "source" | "sourceProblemId">) {
  return `${record.source.trim().toLowerCase()}::${record.sourceProblemId.trim().toLowerCase()}`;
}

export function ingestProblemRecords(
  records: ProblemBankRecord[],
  existing: ProblemBankRecord[] = [],
): IngestionResult {
  const seenIds = new Set(existing.map((problem) => problem.id));
  const seenProvenance = new Set(existing.map(provenanceKey));
  const accepted: ProblemBankRecord[] = [];
  const rejected: IngestionResult["rejected"] = [];

  records.forEach((record, index) => {
    try {
      validateProblemRecord(record);

      if (seenIds.has(record.id)) {
        throw new Error(`Duplicate problem id: ${record.id}.`);
      }

      const sourceKey = provenanceKey(record);
      if (seenProvenance.has(sourceKey)) {
        throw new Error(
          `Duplicate source problem: ${record.source} / ${record.sourceProblemId}.`,
        );
      }

      accepted.push(record);
      seenIds.add(record.id);
      seenProvenance.add(sourceKey);
    } catch (error) {
      rejected.push({
        index,
        reason: error instanceof Error ? error.message : "Unknown ingestion error.",
      });
    }
  });

  return { accepted, rejected };
}

export function queryProblemBank(
  problems: ProblemBankRecord[],
  query: ProblemQuery,
): ProblemBankRecord[] {
  const limit = Math.max(0, query.limit ?? problems.length);

  return problems
    .filter((problem) => !query.primarySkill || problem.primarySkill === query.primarySkill)
    .filter((problem) => !query.difficulty || problem.difficulty === query.difficulty)
    .slice(0, limit);
}
