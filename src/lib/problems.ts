export type ProblemChoice = {
  id: string;
  label: string;
};

export type Problem = {
  id: string;
  source: string;
  sourceProblemId: string;
  primarySkill: string;
  prerequisiteSkills: string[];
  difficulty: "foundation" | "core" | "bridge";
  prompt: string;
  choices: ProblemChoice[];
  correctChoiceId: string;
  explanation: string;
};

// Temporary curated seed set for the v0.1 interaction loop.
// These are intentionally small and hand-authored placeholders; production
// ingestion must preserve provenance and licensing metadata from vetted sources.
export const starterProblems: Problem[] = [
  {
    id: "rf-hole-001",
    source: "Relearn seed",
    sourceProblemId: "rf-hole-001",
    primarySkill: "rational-functions",
    prerequisiteSkills: ["factoring"],
    difficulty: "foundation",
    prompt: "For f(x) = (x² - 4) / (x - 2), what happens at x = 2?",
    choices: [
      { id: "a", label: "A vertical asymptote" },
      { id: "b", label: "A hole" },
      { id: "c", label: "An x-intercept" },
      { id: "d", label: "Nothing special" },
    ],
    correctChoiceId: "b",
    explanation:
      "x² - 4 factors as (x - 2)(x + 2). The shared factor cancels for nearby x-values, but the original function is still undefined at x = 2. The graph therefore follows y = x + 2 with one missing point.",
  },
  {
    id: "rf-va-001",
    source: "Relearn seed",
    sourceProblemId: "rf-va-001",
    primarySkill: "rational-functions",
    prerequisiteSkills: ["factoring"],
    difficulty: "foundation",
    prompt: "For g(x) = (x + 1) / (x - 3), which statement about x = 3 is correct?",
    choices: [
      { id: "a", label: "It is a removable hole" },
      { id: "b", label: "It is a vertical asymptote" },
      { id: "c", label: "It is the horizontal asymptote" },
      { id: "d", label: "It is the y-intercept" },
    ],
    correctChoiceId: "b",
    explanation:
      "The denominator approaches 0 at x = 3 and no matching factor cancels. Nearby function values grow without bound in magnitude, which creates a vertical asymptote.",
  },
  {
    id: "rf-ha-001",
    source: "Relearn seed",
    sourceProblemId: "rf-ha-001",
    primarySkill: "rational-functions",
    prerequisiteSkills: ["polynomial-division"],
    difficulty: "core",
    prompt: "What is the horizontal asymptote of h(x) = (2x² + 1) / (x² - 4)?",
    choices: [
      { id: "a", label: "y = 0" },
      { id: "b", label: "y = 1" },
      { id: "c", label: "y = 2" },
      { id: "d", label: "There is no horizontal asymptote" },
    ],
    correctChoiceId: "c",
    explanation:
      "For very large |x|, lower-degree terms matter less. The function behaves like 2x²/x² = 2, so the graph approaches y = 2.",
  },
  {
    id: "rf-slant-001",
    source: "Relearn seed",
    sourceProblemId: "rf-slant-001",
    primarySkill: "rational-functions",
    prerequisiteSkills: ["polynomial-division"],
    difficulty: "bridge",
    prompt: "If polynomial division gives f(x) = x + 2 + 3/(x - 1), why is y = x + 2 a slant asymptote?",
    choices: [
      { id: "a", label: "Because x + 2 makes the denominator zero" },
      { id: "b", label: "Because 3/(x - 1) approaches 0 as |x| grows" },
      { id: "c", label: "Because every quotient is automatically an asymptote" },
      { id: "d", label: "Because the numerator degree is smaller" },
    ],
    correctChoiceId: "b",
    explanation:
      "Division separates the function into a quotient plus a remainder term. As |x| becomes large, 3/(x - 1) approaches 0, so the difference between f(x) and x + 2 disappears.",
  },
];
