import sampleProblemBank from "../../data/problem-bank/sample.json";
import { applyEvidence, chooseNextSkill, diagnoseFailure, seedMasteryState, type MasteryState, type MistakeCategory } from "./mastery-engine";
import { queryProblemBank, type ProblemBankRecord } from "./problem-bank";
import { seedSkills } from "./skill-graph";

export type ServerAttempt = {
  problemId: string;
  selectedChoiceId: string;
  correct: boolean;
  durationMs: number;
  answeredAt: string;
  mistakeCategory: MistakeCategory;
};

export type ServerSession = {
  id: string;
  startedAt: string;
  completedAt?: string;
  problemIds: string[];
  attempts: ServerAttempt[];
};

type LearningState = {
  mastery: MasteryState;
  sessions: ServerSession[];
};

const state: LearningState = {
  mastery: seedMasteryState(),
  sessions: [],
};

const problemBank = sampleProblemBank as unknown as ProblemBankRecord[];

function requireSession(sessionId: string) {
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session) throw new Error(`Unknown session: ${sessionId}`);
  return session;
}

function requireProblem(problemId: string) {
  const problem = problemBank.find((item) => item.id === problemId);
  if (!problem) throw new Error(`Unknown problem: ${problemId}`);
  return problem;
}

export function getMastery() {
  return seedSkills.map((skill) => ({
    skillId: skill.id,
    name: skill.name,
    mastery: state.mastery[skill.id] ?? 0.5,
    prerequisites: skill.prerequisites,
  }));
}

export function getWeakSkills(limit = 5) {
  return getMastery()
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, Math.max(0, limit));
}

export function getTodayPlan() {
  const candidateIds = getWeakSkills(4).map((item) => item.skillId);
  const nextSkillId = chooseNextSkill(candidateIds, state.mastery);
  if (!nextSkillId) return { nextSkillId: null, reason: "No candidate skills available." };

  const diagnosis = diagnoseFailure(nextSkillId, state.mastery, "unknown");
  return {
    nextSkillId: diagnosis.suspectedRootSkillId,
    surfaceSkillId: diagnosis.surfaceSkillId,
    prerequisitePath: diagnosis.prerequisitePath,
    recommendation: diagnosis.recommendation,
  };
}

export function getProblems(input: {
  primarySkill?: string;
  difficulty?: ProblemBankRecord["difficulty"];
  limit?: number;
}) {
  return queryProblemBank(problemBank, input).map((problem) => ({
    id: problem.id,
    source: problem.source,
    sourceProblemId: problem.sourceProblemId,
    sourceUrl: problem.sourceUrl,
    licensingNote: problem.licensingNote,
    solutionReference: problem.solutionReference,
    primarySkill: problem.primarySkill,
    prerequisiteSkills: problem.prerequisiteSkills,
    difficulty: problem.difficulty,
    prompt: problem.prompt,
    choices: problem.choices,
  }));
}

export function getMistakeHistory(limit = 20) {
  return state.sessions
    .flatMap((session) => session.attempts.map((attempt) => ({ sessionId: session.id, ...attempt })))
    .filter((attempt) => !attempt.correct)
    .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))
    .slice(0, Math.max(0, limit));
}

export function startSession(problemIds: string[]) {
  if (!problemIds.length) throw new Error("A session requires at least one problem.");
  problemIds.forEach(requireProblem);

  const session: ServerSession = {
    id: `server-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt: new Date().toISOString(),
    problemIds: [...problemIds],
    attempts: [],
  };
  state.sessions.unshift(session);
  return session;
}

export function recordAttempt(input: {
  sessionId: string;
  problemId: string;
  selectedChoiceId: string;
  durationMs: number;
  mistakeCategory?: MistakeCategory;
}) {
  const session = requireSession(input.sessionId);
  if (session.completedAt) throw new Error(`Session is already complete: ${input.sessionId}`);
  if (!session.problemIds.includes(input.problemId)) {
    throw new Error(`Problem ${input.problemId} is not assigned to session ${input.sessionId}.`);
  }
  if (session.attempts.some((attempt) => attempt.problemId === input.problemId)) {
    throw new Error(`Problem already answered in this session: ${input.problemId}`);
  }

  const problem = requireProblem(input.problemId);
  const validChoice = problem.choices.some((choice) => choice.id === input.selectedChoiceId);
  if (!validChoice) throw new Error(`Unknown choice ${input.selectedChoiceId} for ${input.problemId}.`);

  const correct = input.selectedChoiceId === problem.correctChoiceId;
  const mistakeCategory = correct ? "unknown" : (input.mistakeCategory ?? "unknown");
  const attempt: ServerAttempt = {
    problemId: input.problemId,
    selectedChoiceId: input.selectedChoiceId,
    correct,
    durationMs: Math.max(0, input.durationMs),
    answeredAt: new Date().toISOString(),
    mistakeCategory,
  };

  session.attempts.push(attempt);
  state.mastery = applyEvidence(state.mastery, {
    skillId: problem.primarySkill,
    correct,
    category: mistakeCategory,
  });

  const diagnosis = correct ? null : diagnoseFailure(problem.primarySkill, state.mastery, mistakeCategory);
  return {
    attempt,
    correct,
    explanation: problem.explanation,
    solutionReference: problem.solutionReference,
    mastery: state.mastery[problem.primarySkill],
    diagnosis,
  };
}

export function completeSession(sessionId: string) {
  const session = requireSession(sessionId);
  if (!session.completedAt) session.completedAt = new Date().toISOString();
  const correctCount = session.attempts.filter((attempt) => attempt.correct).length;
  return {
    ...session,
    summary: {
      answered: session.attempts.length,
      correct: correctCount,
      accuracy: session.attempts.length ? correctCount / session.attempts.length : 0,
    },
  };
}

export function resetLearningStateForTests() {
  state.mastery = seedMasteryState();
  state.sessions = [];
}
