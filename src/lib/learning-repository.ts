import { seedMasteryState, type MasteryState, type MistakeCategory } from "./mastery-engine";

export type StoredAttempt = {
  problemId: string;
  selectedChoiceId: string;
  correct: boolean;
  durationMs: number;
  answeredAt: string;
  mistakeCategory: MistakeCategory;
};

export type StoredSession = {
  id: string;
  startedAt: string;
  completedAt?: string;
  problemIds: string[];
  attempts: StoredAttempt[];
};

export type LearnerLearningState = {
  mastery: MasteryState;
  sessions: StoredSession[];
};

export interface LearningRepository {
  read(learnerId: string): LearnerLearningState;
  write(learnerId: string, state: LearnerLearningState): void;
  reset?(learnerId?: string): void;
}

function freshState(): LearnerLearningState {
  return {
    mastery: seedMasteryState(),
    sessions: [],
  };
}

function cloneState(state: LearnerLearningState): LearnerLearningState {
  return {
    mastery: { ...state.mastery },
    sessions: state.sessions.map((session) => ({
      ...session,
      problemIds: [...session.problemIds],
      attempts: session.attempts.map((attempt) => ({ ...attempt })),
    })),
  };
}

/**
 * Local/test adapter. State is isolated by learner id but intentionally not restart-safe.
 * A Postgres/Neon adapter can implement the same contract once trusted request identity
 * and curated-problem -> DB id mapping are explicitly resolved.
 */
export class InMemoryLearningRepository implements LearningRepository {
  private readonly byLearner = new Map<string, LearnerLearningState>();

  read(learnerId: string) {
    const existing = this.byLearner.get(learnerId);
    if (!existing) {
      const initial = freshState();
      this.byLearner.set(learnerId, initial);
      return cloneState(initial);
    }
    return cloneState(existing);
  }

  write(learnerId: string, state: LearnerLearningState) {
    this.byLearner.set(learnerId, cloneState(state));
  }

  reset(learnerId?: string) {
    if (learnerId) this.byLearner.delete(learnerId);
    else this.byLearner.clear();
  }
}
