# Relearn Architecture

## Product goal
Relearn is not a generic math practice app. It reconstructs missing prerequisites quickly, explains concepts from first principles, and reconnects them to current Calculus work.

## Core loop
1. Determine current target skill.
2. Inspect prerequisites and mastery evidence.
3. Select verified problems from the bank; do not generate routine practice by default.
4. Record attempt, timing, confidence, and mistake diagnosis.
5. Update mastery and decide whether to advance, reinforce, or descend to a prerequisite.
6. Surface the next action to ChatGPT and the learner UI.

## Modules
### Learning engine
- Skill graph
- Mastery state
- Prerequisite traversal
- Session planning
- Mistake diagnosis
- Spaced review queue

### Problem bank
Problems are sourced from verified external materials. Store source metadata and licensing notes. AI-generated problems are allowed only for low-stakes explanation/examples, not as the primary assessment bank.

Required metadata:
- source / source_problem_id / source_url
- prompt / answer_json
- primary and supporting skills
- difficulty (0..1)
- problem_type
- solution reference
- prerequisites when a problem requires hidden background knowledge

### Learning UI
Keep the interface task-oriented:
- Today session
- One problem at a time
- Explanation / misconception feedback
- Mastery map
- Mistake history
No dashboard bloat for v0.1.

### ChatGPT integration
ChatGPT remains the conversational orchestrator. Relearn exposes deterministic learning state and actions over MCP rather than recreating a separate assistant persona through the API.

### Persistence
Target: Postgres (Neon-compatible). `db/schema.sql` defines the first relational model. Authentication is intentionally deferred for the personal MVP.

## Initial curriculum spine
- Equation manipulation
- Factoring
- Polynomial division
- Rational functions
- Function transformations
- Exponents & radicals
- Unit circle
- Trig identities
- Limits bridge

Expand only after the first spine works end-to-end.

## Non-goals for v0.1
- payments
- social features
- multi-school LMS integrations
- AI-generated bulk question bank
- full Algebra 2 textbook coverage before the product is usable
- heavy gamification
