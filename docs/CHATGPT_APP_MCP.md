# ChatGPT App / MCP Contract

Relearn exposes deterministic learning state and study actions. ChatGPT supplies conversation, explanation, tutoring, and high-level planning while Relearn remains the source of truth for attempts and mastery.

## Implemented tools

### Read tools
- `get_mastery` — current mastery for every skill
- `get_weak_skills` — weakest skills by deterministic mastery evidence
- `get_today_plan` — next repair target derived from mastery + prerequisite graph
- `get_problems` — verified/curated problems with source provenance; correct answers are intentionally withheld
- `get_mistake_history` — recent incorrect attempts

### Write tools
- `start_session` — creates a session from known problem ids
- `record_attempt` — validates the selected choice, computes correctness, updates mastery, and returns diagnosis/explanation
- `complete_session` — finalizes the session and returns accuracy summary

There is intentionally **no tool that directly sets mastery**. Mastery changes only as a server-side consequence of recorded evidence.

## Transports

### Local / development

```bash
npm run mcp:stdio
```

This starts the MCP v2 server over stdio using `@modelcontextprotocol/server`.

### Streamable HTTP

The Next.js route at `/api/mcp` exposes the same tool registry using MCP Streamable HTTP. The handler is stateless at the transport layer and creates a server/transport pair per request.

For a local Next.js run, the MCP URL is:

```text
http://localhost:3000/api/mcp
```

A deployed ChatGPT App should point at the corresponding HTTPS endpoint after auth and durable persistence are added.

## Current persistence boundary

The MCP learning service currently uses an in-process prototype state seeded from `data/problem-bank/sample.json` and the skill graph. This is enough for tool-contract testing but is **not durable storage**: server restarts/cold starts can reset mastery and sessions.

Before production ChatGPT use, replace this state with the Postgres/Neon repository layer already anticipated by `db/schema.sql`.

## Safety / integrity rules

- `get_problems` never returns `correctChoiceId` or the embedded explanation before the learner answers.
- `record_attempt` computes correctness server-side from the canonical problem record.
- source, source problem id, source URL (when available), licensing note, and solution reference remain attached to problem results.
- ChatGPT cannot invent completed attempts or write mastery percentages directly.
- invalid sessions, problem ids, choices, duplicate answers, and post-completion writes fail explicitly.

## Next integration work

1. Replace in-memory state with durable Postgres repositories.
2. Add user identity/auth before exposing write tools on a public endpoint.
3. Add an MCP client integration test that lists and calls the real tools over transport.
4. Add ChatGPT App UI components only after the data/tool loop is stable.

## ChatGPT UI candidates
- Today session card
- Mastery map
- Problem card
- Attempt feedback card
- Prerequisite chain
