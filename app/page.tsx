import Link from "next/link";

import { seedSkills } from "@/src/lib/skill-graph";

const statusLabel = {
  mastered: "stable",
  learning: "rebuilding",
  blocked: "prerequisite",
  unknown: "unchecked",
} as const;

export default function HomePage() {
  const weak = seedSkills.filter((skill) => skill.mastery < 0.6 && skill.status !== "blocked");

  return (
    <main className="workbench">
      <aside className="indexRail" aria-label="Relearn index">
        <Link href="/" className="wordmark">R.</Link>
        <div className="railIndex">
          <span>01</span>
          <span>FOUNDATION</span>
        </div>
        <div className="railFooter">MATH / 26</div>
      </aside>

      <div className="workSurface">
        <header className="workHeader">
          <div className="headerMeta">
            <span>RELEARN</span>
            <span>PERSONAL MATH RECONSTRUCTION</span>
          </div>
          <p className="headerNote">Rebuild the reason first. Keep the formula second.</p>
        </header>

        <section className="studyBrief">
          <div className="briefNumber">01</div>
          <div className="briefCopy">
            <p className="kicker">CURRENT RECONSTRUCTION</p>
            <h1>Rational<br />Functions</h1>
            <p className="briefPath">
              Factoring <i>→</i> domain restriction <i>→</i> holes <i>→</i> asymptotes
            </p>
          </div>
          <div className="briefAction">
            <dl>
              <div><dt>Mastery</dt><dd>64%</dd></div>
              <div><dt>Estimate</dt><dd>42 min</dd></div>
              <div><dt>Weak links</dt><dd>{weak.length}</dd></div>
            </dl>
            <Link href="/practice" className="startLink">
              <span>Start reconstruction</span>
              <b>↗</b>
            </Link>
          </div>
        </section>

        <section className="ledger" aria-labelledby="ledger-title">
          <div className="ledgerHead">
            <div>
              <span className="sectionNo">02</span>
              <h2 id="ledger-title">Concept ledger</h2>
            </div>
            <p>Not a scorecard. A map of where the chain still breaks.</p>
          </div>

          <div className="ledgerTable">
            <div className="ledgerRow ledgerLabels" aria-hidden="true">
              <span>CONCEPT</span><span>WHY IT MATTERS</span><span>STATE</span><span>DEPTH</span>
            </div>
            {seedSkills.map((skill, index) => (
              <div className="ledgerRow" key={skill.id}>
                <div className="skillTitle"><em>{String(index + 1).padStart(2, "0")}</em><strong>{skill.name}</strong></div>
                <p>{skill.reason}</p>
                <span className={`stateText ${skill.status}`}>{statusLabel[skill.status]}</span>
                <div className="depthCell">
                  <span>{Math.round(skill.mastery * 100)}</span>
                  <div className="depthLine"><i style={{ width: `${Math.round(skill.mastery * 100)}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="methodStrip">
          <span className="sectionNo">03</span>
          <p className="methodStatement">Understand <i>→</i> connect <i>→</i> compress <i>→</i> retrieve.</p>
          <p className="methodNote">공식을 외우기 전에 왜 성립하는지, 어디서 왔는지, 언제 깨지는지 먼저 확인한다.</p>
        </section>

        <footer className="workFooter">
          <span>RELEARN / FOUNDATION PASS</span>
          <span>BUILD 0.1</span>
        </footer>
      </div>
    </main>
  );
}
