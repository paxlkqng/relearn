# Relearn Agent Instructions

## Product
Relearn is a personal math reconstruction system. Optimize for fast recovery of missing Algebra 2 / Precalculus foundations and explicit connection to current Calculus work.

## Product principles
- Explain from first principles before compressing into rules.
- Prefer verified problem sources over generated bulk practice.
- Diagnose prerequisite failures instead of repeating the surface skill.
- Keep learning state deterministic and stored outside the model.
- Build the smallest end-to-end learning loop before expanding curriculum coverage.

## Engineering boundaries
- Next.js App Router + TypeScript.
- Postgres/Neon-compatible persistence.
- ChatGPT integration through MCP / ChatGPT App surfaces; do not rebuild a separate assistant persona unless explicitly requested.
- Avoid new dependencies unless they clearly reduce complexity.
- No production deployment, destructive migrations, or auth redesign without human approval.

## Before coding
1. Read `docs/ARCHITECTURE.md`.
2. Read the relevant issue and acceptance criteria.
3. Inspect existing domain types and skill graph.
4. Keep the change bounded.

## Before declaring done
- run typecheck
- run build
- run tests if present
- verify the changed user flow
- summarize tradeoffs and unresolved questions
