import { getPrerequisiteChain, seedSkills } from "./skill-graph";

export type MistakeCategory =
  | "concept"
  | "algebra-manipulation"
  | "prerequisite"
  | "careless"
  | "unknown";

export type SkillEvidence = {
  skillId: string;
  correct: boolean;
  category: MistakeCategory;
  confidence?: number;
};

export type MasteryState = Record<string, number>;

export type Diagnosis = {
  surfaceSkillId: string;
  suspectedRootSkillId: string;
  prerequisitePath: string[];
  category: MistakeCategory;
  recommendation: string;
};

const MIN_MASTERY = 0;
const MAX_MASTERY = 1;
const CORRECT_DELTA = 0.045;
const WRONG_DELTA = 0.07;
const CARELESS_WRONG_DELTA = 0.02;
export const PREREQUISITE_THRESHOLD = 0.62;

export function seedMasteryState(): MasteryState {
  return Object.fromEntries(seedSkills.map((skill) => [skill.id, skill.mastery]));
}

function clamp(value: number) {
  return Math.max(MIN_MASTERY, Math.min(MAX_MASTERY, value));
}

export function applyEvidence(
  state: MasteryState,
  evidence: SkillEvidence,
): MasteryState {
  const confidence = clamp(evidence.confidence ?? 1);
  const current = state[evidence.skillId] ?? 0.5;

  const delta = evidence.correct
    ? CORRECT_DELTA * confidence
    : (evidence.category === "careless" ? CARELESS_WRONG_DELTA : WRONG_DELTA) * confidence;

  return {
    ...state,
    [evidence.skillId]: clamp(current + (evidence.correct ? delta : -delta)),
  };
}

function findWeakestPrerequisite(surfaceSkillId: string, state: MasteryState) {
  const chain = getPrerequisiteChain(surfaceSkillId);

  return chain
    .filter((id) => id !== surfaceSkillId)
    .map((id) => ({ id, mastery: state[id] ?? 0.5 }))
    .filter((item) => item.mastery < PREREQUISITE_THRESHOLD)
    .sort((a, b) => a.mastery - b.mastery)[0] ?? null;
}

function findAlgebraFoundation(surfaceSkillId: string, state: MasteryState) {
  const chain = getPrerequisiteChain(surfaceSkillId);
  if (!chain.includes("equation-manipulation")) return null;

  const mastery = state["equation-manipulation"] ?? 0.5;
  return mastery < PREREQUISITE_THRESHOLD
    ? { id: "equation-manipulation", mastery }
    : null;
}

export function diagnoseFailure(
  surfaceSkillId: string,
  state: MasteryState,
  category: MistakeCategory = "unknown",
): Diagnosis {
  const chain = getPrerequisiteChain(surfaceSkillId);
  const weakestPrerequisite = findWeakestPrerequisite(surfaceSkillId, state);
  const algebraFoundation = findAlgebraFoundation(surfaceSkillId, state);

  let suspectedRootSkillId = surfaceSkillId;

  if (category === "algebra-manipulation" && algebraFoundation) {
    suspectedRootSkillId = algebraFoundation.id;
  } else if (
    (category === "prerequisite" || category === "unknown") &&
    weakestPrerequisite
  ) {
    suspectedRootSkillId = weakestPrerequisite.id;
  }

  const recommendation = suspectedRootSkillId === surfaceSkillId
    ? category === "careless"
      ? `Stay on ${surfaceSkillId}: repeat a nearby variant without changing the curriculum path.`
      : `Stay on ${surfaceSkillId}: repair the concept directly, then retest with a nearby variant.`
    : `Step down to ${suspectedRootSkillId} before retrying ${surfaceSkillId}; prerequisite evidence is below the repair threshold.`;

  return {
    surfaceSkillId,
    suspectedRootSkillId,
    prerequisitePath: chain,
    category,
    recommendation,
  };
}

export function chooseNextSkill(
  candidateSkillIds: string[],
  state: MasteryState,
): string | null {
  const candidates = candidateSkillIds
    .map((id) => ({ id, mastery: state[id] ?? 0.5 }))
    .sort((a, b) => a.mastery - b.mastery);

  if (!candidates.length) return null;

  const weakest = candidates[0];
  return diagnoseFailure(weakest.id, state, "unknown").suspectedRootSkillId;
}
