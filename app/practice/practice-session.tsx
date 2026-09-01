"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import type { Problem } from "@/src/lib/problems";
import {
  createPracticeSession,
  persistSession,
  type PracticeSessionRecord,
} from "@/src/lib/session-store";

type Props = {
  problems: Problem[];
};

export function PracticeSession({ problems }: Props) {
  const [session, setSession] = useState<PracticeSessionRecord>(() =>
    createPracticeSession(problems),
  );
  const [index, setIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const questionStartedAt = useRef(Date.now());

  const problem = problems[index];
  const score = useMemo(
    () => session.attempts.filter((attempt) => attempt.correct).length,
    [session.attempts],
  );

  if (!problem || completed) {
    const total = session.attempts.length;
    const accuracy = total ? Math.round((score / total) * 100) : 0;

    return (
      <section className="practiceWrap">
        <div className="practiceTopline">
          <Link href="/" className="textLink">← Relearn</Link>
          <span>SESSION COMPLETE</span>
        </div>
        <article className="focusCard sessionSummary">
          <p className="eyebrow">RESULT</p>
          <h1>{accuracy}% accuracy</h1>
          <p>{score} / {total} problems correct. 이 결과는 현재 브라우저에 임시 저장돼 있어.</p>
          <div className="metricRow">
            <div><strong>{score}</strong><span>correct</span></div>
            <div><strong>{total - score}</strong><span>review</span></div>
            <div><strong>{total}</strong><span>attempted</span></div>
          </div>
          <button
            className="primary"
            onClick={() => {
              const next = createPracticeSession(problems);
              persistSession(next);
              setSession(next);
              setIndex(0);
              setSelectedChoiceId(null);
              setRevealed(false);
              setCompleted(false);
              questionStartedAt.current = Date.now();
            }}
          >
            다시 풀기
          </button>
        </article>
      </section>
    );
  }

  const correct = selectedChoiceId === problem.correctChoiceId;

  function submit() {
    if (!selectedChoiceId || revealed) return;

    const attempt = {
      problemId: problem.id,
      selectedChoiceId,
      correct,
      durationMs: Date.now() - questionStartedAt.current,
      answeredAt: new Date().toISOString(),
    };

    const nextSession = {
      ...session,
      attempts: [...session.attempts, attempt],
    };

    setSession(nextSession);
    persistSession(nextSession);
    setRevealed(true);
  }

  function next() {
    if (!revealed) return;

    if (index >= problems.length - 1) {
      const finished = { ...session, completedAt: new Date().toISOString() };
      setSession(finished);
      persistSession(finished);
      setCompleted(true);
      return;
    }

    setIndex((value) => value + 1);
    setSelectedChoiceId(null);
    setRevealed(false);
    questionStartedAt.current = Date.now();
  }

  return (
    <section className="practiceWrap">
      <div className="practiceTopline">
        <Link href="/" className="textLink">← Relearn</Link>
        <span>{index + 1} / {problems.length}</span>
      </div>

      <div className="progressTrack" aria-label="Session progress">
        <span style={{ width: `${((index + (revealed ? 1 : 0)) / problems.length) * 100}%` }} />
      </div>

      <article className="questionCard">
        <div className="questionMeta">
          <span>{problem.primarySkill}</span>
          <span>{problem.difficulty}</span>
        </div>
        <h1>{problem.prompt}</h1>

        <div className="choiceList">
          {problem.choices.map((choice) => {
            const isSelected = selectedChoiceId === choice.id;
            const isCorrect = revealed && choice.id === problem.correctChoiceId;
            const isWrongSelected = revealed && isSelected && !isCorrect;

            return (
              <button
                key={choice.id}
                className={`choice ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrongSelected ? "wrong" : ""}`}
                onClick={() => !revealed && setSelectedChoiceId(choice.id)}
                disabled={revealed}
              >
                {choice.label}
              </button>
            );
          })}
        </div>

        {revealed ? (
          <div className="explanationBox">
            <strong>{correct ? "맞았어." : "여기서 연결이 끊겼어."}</strong>
            <p>{problem.explanation}</p>
            <small>Source: {problem.source} · {problem.sourceProblemId}</small>
          </div>
        ) : null}

        <div className="practiceActions">
          {!revealed ? (
            <button className="primary" disabled={!selectedChoiceId} onClick={submit}>
              답 확인
            </button>
          ) : (
            <button className="primary" onClick={next}>
              {index === problems.length - 1 ? "세션 끝내기" : "다음 문제"}
            </button>
          )}
        </div>
      </article>
    </section>
  );
}
