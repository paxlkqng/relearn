export type SkillStatus = "mastered" | "learning" | "blocked" | "unknown";

export type Skill = {
  id: string;
  name: string;
  mastery: number;
  status: SkillStatus;
  prerequisites: string[];
  reason: string;
};

export const seedSkills: Skill[] = [
  {
    id: "equation-manipulation",
    name: "Equation Manipulation",
    mastery: 0.72,
    status: "learning",
    prerequisites: [],
    reason: "양변 연산과 분수식 정리를 자동화하는 기초 엔진",
  },
  {
    id: "factoring",
    name: "Factoring",
    mastery: 0.58,
    status: "learning",
    prerequisites: ["equation-manipulation"],
    reason: "zeros, rational expressions, limits로 이어지는 핵심 도구",
  },
  {
    id: "polynomial-division",
    name: "Polynomial Division",
    mastery: 0.31,
    status: "learning",
    prerequisites: ["factoring"],
    reason: "quotient + remainder 구조와 end behavior를 연결해야 함",
  },
  {
    id: "rational-functions",
    name: "Rational Functions",
    mastery: 0.42,
    status: "learning",
    prerequisites: ["factoring", "polynomial-division"],
    reason: "hole, VA, HA, slant asymptote의 원리 연결이 목표",
  },
  {
    id: "function-transformations",
    name: "Function Transformations",
    mastery: 0.55,
    status: "learning",
    prerequisites: ["equation-manipulation"],
    reason: "f(x+h), af(x), f(ax)의 의미를 그래프와 연결",
  },
  {
    id: "exponents-radicals",
    name: "Exponents & Radicals",
    mastery: 0.61,
    status: "learning",
    prerequisites: ["equation-manipulation"],
    reason: "Calc 식 정리에서 인지 부하를 줄이기 위한 자동화 영역",
  },
  {
    id: "unit-circle",
    name: "Unit Circle",
    mastery: 0.34,
    status: "learning",
    prerequisites: [],
    reason: "삼각함수 값을 암기표가 아니라 좌표 구조로 이해",
  },
  {
    id: "trig-identities",
    name: "Trig Identities",
    mastery: 0.26,
    status: "blocked",
    prerequisites: ["unit-circle", "exponents-radicals"],
    reason: "Pythagorean / double-angle / half-angle를 유도 가능한 상태로 만들기",
  },
  {
    id: "limits-bridge",
    name: "Limits Bridge",
    mastery: 0.68,
    status: "blocked",
    prerequisites: ["rational-functions", "trig-identities"],
    reason: "Algebra와 trig 기반을 Calculus limit 문제에 다시 연결",
  },
];

export function getPrerequisiteChain(skillId: string): string[] {
  const byId = new Map(seedSkills.map((skill) => [skill.id, skill]));
  const visited = new Set<string>();
  const ordered: string[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const skill = byId.get(id);
    if (!skill) return;
    skill.prerequisites.forEach(visit);
    ordered.push(id);
  }

  visit(skillId);
  return ordered;
}
