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

## Executable harness
The repository now includes `scripts/agent-round-robin.mjs` and `automation/round-robin.config.json`.

Run a safe harness check without executing role agents:

```bash
npm run agent:dry-run -- --issue=5
```

Run a real bounded cycle by supplying commands for the roles that exist in the local agent environment:

```bash
RELEARN_AGENT_ISSUE=5 \
RELEARN_PLANNER_CMD='your-planner-command' \
RELEARN_BUILDER_CMD='your-builder-command' \
RELEARN_REVIEWER_CMD='your-reviewer-command' \
RELEARN_TESTER_CMD='your-tester-command' \
RELEARN_FIXER_CMD='your-fixer-command' \
npm run agent:run
```

The harness deliberately does not hard-code a model vendor or CLI. Codex, Claude Code, or another coding agent can be plugged in later without changing the safety/termination logic.

Each cycle always runs these repository checks after the role commands:
- `npm test`
- `npm run typecheck`
- `npm run build`

Generated machine-readable reports are written to `automation/reports/` and ignored by Git.

## Hard stop conditions
Stop when any is true:
- acceptance criteria pass and no P0/P1 issue remains
- 3 repair rounds reached
- the same failure repeats twice without new evidence
- task requires a product decision not encoded in the issue
- any non-tester role command fails before a reviewable change is produced

## Forbidden unattended changes
- production deploy
- destructive database migration
- secrets / auth policy changes
- replacing the chosen stack
- broad visual redesign
- deleting problem/source data
- merging its own PR

## Required output
Every overnight run should leave:
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

## Automation boundary
Feature selection remains intentionally conservative. Only issues explicitly approved for unattended work should be passed to the harness. The harness owns iteration limits and test gates; the external agent runner owns branch creation, commits, and draft-PR creation.

The repository does not store agent API keys or credentials. Production deploys, destructive migrations, self-merge, and auth/secrets changes remain outside unattended automation.
