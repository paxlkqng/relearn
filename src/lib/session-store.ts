import type { Problem } from "@/src/lib/problems";

export type AttemptRecord = {
  problemId: string;
  selectedChoiceId: string;
  correct: boolean;
  durationMs: number;
  answeredAt: string;
};

export type PracticeSessionRecord = {
  id: string;
  startedAt: string;
  completedAt?: string;
  problemIds: string[];
  attempts: AttemptRecord[];
};

const STORAGE_KEY = "relearn.practice.sessions.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readSessions(): PracticeSessionRecord[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PracticeSessionRecord[]) : [];
  } catch {
    return [];
  }
}

export function persistSession(session: PracticeSessionRecord) {
  if (!canUseStorage()) return;

  const sessions = readSessions();
  const index = sessions.findIndex((item) => item.id === session.id);

  if (index >= 0) sessions[index] = session;
  else sessions.unshift(session);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 25)));
}

export function createPracticeSession(problems: Problem[]): PracticeSessionRecord {
  return {
    id: `session-${Date.now()}`,
    startedAt: new Date().toISOString(),
    problemIds: problems.map((problem) => problem.id),
    attempts: [],
  };
}
