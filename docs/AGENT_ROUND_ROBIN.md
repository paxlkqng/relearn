# Nightly Agent Round-Robin

Goal: produce one reviewable improvement, not maximize changed lines.

## Roles
1. Planner — choose one bounded task from the backlog and write acceptance criteria.
2. Builder — implement only that task.
3. Reviewer — inspect correctness, architecture, UX, regressions, and unnecessary complexity.
4. Tester — run typecheck/build/tests and browser checks where relevant.
5. Fixer — address only concrete reviewer/tester findings.

## Loop
Planner → Builder → Reviewer → Tester → Fixer → Reviewer → Tester → stop

Maximum: 3 repair rounds.

## Hard stop conditions
Stop when any is true:
- acceptance criteria pass and no P0/P1 issue remains
- 3 repair rounds reached
- the same failure repeats twice without new evidence
- task requires a product decision not encoded in the issue

## Forbidden unattended changes
- production deploy
- destructive database migration
- secrets / auth policy changes
- replacing the chosen stack
- broad visual redesign
- deleting problem/source data
- merging its own PR

## Required output
Every overnight run leaves:
- dedicated branch
- focused commits
- draft PR
- summary of implemented behavior
- tests executed and results
- unresolved risks
- explicit questions requiring human decision

## Review priorities
1. Does this improve the learning loop?
2. Is learning state deterministic and auditable?
3. Are problem sources preserved?
4. Does the implementation accidentally let the model invent state?
5. Is this simpler than the previous version?

## First automation target
Do not automate feature selection broadly yet. Start with issues explicitly labeled/marked safe for unattended implementation, then add prioritization after several successful runs.
