import Link from "next/link";

import { seedSkills } from "@/src/lib/skill-graph";

const statusLabel = {
  mastered: "Mastered",
  learning: "Learning",
  blocked: "Blocked",
  unknown: "Not checked",
} as const;

export default function HomePage() {
  const learning = seedSkills.filter((skill) => skill.status === "learning");
  const weak = seedSkills.filter((skill) => skill.mastery < 0.6 && skill.status !== "blocked");

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">RELEARN · MATH RECONSTRUCTION</p>
          <h1>기초를 다시 연결하는 학습 공간</h1>
          <p className="lede">
            문제를 많이 푸는 것보다, 왜 틀렸는지와 어떤 선행 개념이 비었는지를 추적한다.
          </p>
        </div>
        <Link href="/practice" className="primary primaryLink">오늘 세션 시작</Link>
      </header>

      <section className="heroGrid">
        <article className="focusCard">
          <span className="cardLabel">TODAY</span>
          <h2>Rational Functions 재건</h2>
          <p>Factoring → domain restriction → hole → vertical asymptote 순서로 연결한다.</p>
          <div className="metricRow">
            <div><strong>64%</strong><span>현재 mastery</span></div>
            <div><strong>42m</strong><span>예상 시간</span></div>
            <div><strong>4</strong><span>v0.1 선별 문제</span></div>
          </div>
        </article>

        <article className="plainCard">
          <span className="cardLabel">NEXT REPAIR</span>
          <h3>Trig identities</h3>
          <p>공식 암기 전에 unit circle과 Pythagorean identity부터 다시 연결.</p>
        </article>
      </section>

      <section className="section">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">MASTERY MAP</p>
            <h2>현재 개념 상태</h2>
          </div>
          <span>{weak.length}개 영역 점검 필요</span>
        </div>

        <div className="skillList">
          {seedSkills.map((skill) => (
            <article className="skillRow" key={skill.id}>
              <div className="skillMain">
                <span className={`dot ${skill.status}`} />
                <div>
                  <strong>{skill.name}</strong>
                  <p>{skill.reason}</p>
                </div>
              </div>
              <div className="skillMeta">
                <span>{statusLabel[skill.status]}</span>
                <strong>{Math.round(skill.mastery * 100)}%</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section twoColumn">
        <article className="plainCard">
          <p className="eyebrow">LEARNING RULE</p>
          <h3>이해 → 연결 → 압축 → 반복</h3>
          <p>공식 자체보다 의미, 성립 이유, 사용 목적을 먼저 확인하고 문제로 넘어간다.</p>
        </article>
        <article className="plainCard">
          <p className="eyebrow">ACTIVE QUEUE</p>
          <h3>{learning.length}개 skill 학습 중</h3>
          <p>학습 결과와 오답 원인에 따라 다음 세션의 순서를 다시 계산한다.</p>
        </article>
      </section>
    </main>
  );
}
