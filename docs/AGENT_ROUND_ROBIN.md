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

## Two layers
The automation is deliberately split into two layers:

- `scripts/agent-round-robin.mjs` owns bounded role execution, repair limits, repeated-failure termination, and repository checks.
- `scripts/nightly-agent-run.mjs` owns the safe Git lifecycle: clean-worktree check, base update, dedicated branch, commit, push, and draft PR creation.

This keeps the safety/termination logic vendor-neutral while still giving a real unattended environment one command to run.

## Dry run
Validate the entire lifecycle without changing branches or pushing anything:

```bash
npm run agent:nightly:dry-run -- --issue=5
```

CI should use this path because it exercises configuration and the inner round-robin without mutating Git state.

## Real run
Supply commands for the coding-agent roles available in the host environment:

```bash
RELEARN_AGENT_ISSUE=5 \
RELEARN_PLANNER_CMD='your-planner-command' \
RELEARN_BUILDER_CMD='your-builder-command' \
RELEARN_REVIEWER_CMD='your-reviewer-command' \
RELEARN_TESTER_CMD='your-tester-command' \
RELEARN_FIXER_CMD='your-fixer-command' \
npm run agent:nightly
```

Optional base override:

```bash
npm run agent:nightly -- --issue=5 --base=main
```

The repository does not hard-code Codex, Claude Code, or another model vendor. The host machine supplies those commands and credentials.

## What the lifecycle runner does
1. Requires a clean working tree.
2. Fetches origin and fast-forwards the configured base branch.
3. Creates `agent/issue-<n>-<timestamp>`.
4. Runs the bounded round-robin harness.
5. Requires `npm test`, `npm run typecheck`, and `npm run build` to pass through that harness.
6. Rejects protected unattended paths before commit/push.
7. Commits and pushes the bounded change.
8. If GitHub CLI is authenticated, opens a **draft** PR. It never merges it.

If `gh` is unavailable, the branch is still pushed and the runner exits with a clear message so a human can open the PR later.

## Protected unattended paths
The config currently blocks unattended changes to:
- `.env` / `.env.*`
- deployment workflows
- database migrations
- `infra/`

This is a path-level guard in addition to the behavioral rules below. It is intentionally conservative and can be extended later.

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
Every real overnight run should leave:
- dedicated branch
- focused commit(s)
- draft PR when `gh` is available
- summary of implemented behavior
- tests executed and results
- unresolved risks
- explicit questions requiring human decision

Machine-readable round reports are written to `automation/reports/` and ignored by Git.

## Review priorities
1. Does this improve the learning loop?
2. Is learning state deterministic and auditable?
3. Are problem sources preserved?
4. Does the implementation accidentally let the model invent state?
5. Is this simpler than the previous version?

## Remaining host requirement
A real unattended coding run still requires an installed/authenticated agent CLI (for example Codex or Claude Code), Git credentials, and optionally authenticated GitHub CLI for automatic draft-PR creation. Credentials stay on the host and are never stored in this repository.
