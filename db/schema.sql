-- Relearn v0.1 relational model (Postgres / Neon friendly)

create table skills (
  id text primary key,
  name text not null,
  description text,
  domain text not null,
  order_index integer not null default 0
);

create table skill_prerequisites (
  skill_id text not null references skills(id) on delete cascade,
  prerequisite_skill_id text not null references skills(id) on delete cascade,
  weight numeric not null default 1,
  primary key (skill_id, prerequisite_skill_id)
);

create table problems (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_problem_id text,
  source_url text,
  license_note text,
  prompt text not null,
  answer_json jsonb not null,
  solution_reference text,
  difficulty numeric not null check (difficulty >= 0 and difficulty <= 1),
  problem_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table problem_skills (
  problem_id uuid not null references problems(id) on delete cascade,
  skill_id text not null references skills(id) on delete cascade,
  role text not null default 'primary' check (role in ('primary','supporting','prerequisite')),
  weight numeric not null default 1,
  primary key (problem_id, skill_id)
);

create table learner_mastery (
  learner_id text not null,
  skill_id text not null references skills(id) on delete cascade,
  mastery numeric not null default 0 check (mastery >= 0 and mastery <= 1),
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1),
  evidence_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (learner_id, skill_id)
);

create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  learner_id text not null,
  focus_skill_id text references skills(id),
  status text not null default 'active' check (status in ('planned','active','completed','abandoned')),
  plan_json jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references study_sessions(id) on delete set null,
  learner_id text not null,
  problem_id uuid not null references problems(id),
  response_json jsonb not null,
  is_correct boolean,
  duration_ms integer,
  confidence_before numeric,
  mistake_type text,
  diagnosis_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index attempts_learner_created_idx on attempts (learner_id, created_at desc);
create index attempts_problem_idx on attempts (problem_id);
create index mastery_learner_idx on learner_mastery (learner_id, mastery asc);
