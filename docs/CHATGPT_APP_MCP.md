# ChatGPT App / MCP Contract

Relearn should expose learning state and deterministic actions. ChatGPT supplies conversation, explanation, planning judgment, and tutoring.

## Read tools
### get_mastery
Input: optional skill ids
Returns: mastery, confidence, evidence count, latest change.

### get_weak_skills
Input: limit, domain filter
Returns: weakest actionable skills plus prerequisite blockers.

### get_today_plan
Returns: focus skill, prerequisite repairs, selected problem ids, estimated session length.

### get_problems
Input: skill_id, difficulty range, count, exclude_problem_ids
Returns: verified problem records and source metadata.

### get_mistake_history
Input: skill_id?, limit
Returns: recent mistakes and stored diagnoses.

## Write tools
### start_session
Creates a session from an approved plan.

### record_attempt
Stores response, correctness, duration, confidence, and diagnosis.

### complete_session
Finalizes session and returns mastery deltas.

### update_mastery_evidence
Internal learning-engine action. Prefer server-side invocation after `record_attempt`; ChatGPT should not arbitrarily set mastery percentages.

## Design rule
The MCP server is the source of truth for learning state. The model can recommend and explain, but it must not invent mastery state, problem history, or completed attempts.

## ChatGPT UI candidates
- Today session card
- Mastery map
- Problem card
- Attempt feedback card
- Prerequisite chain

Start with read-only mastery + one problem card before implementing every widget.
