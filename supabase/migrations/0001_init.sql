-- ============================================================================
-- CuriosityQuest / Science Arena — initial schema
--
-- Written for Postgres 15+ (Supabase). Two principles run through the whole
-- thing:
--
--  1. PROGRESS IS INDEPENDENT OF ASSIGNMENTS. A student who plays a lesson
--     three weeks before a teacher assigns it keeps that evidence, and the
--     assignment picks it up. Nothing about access is stored as a permission.
--
--  2. AUTHORISATION IS ENFORCED HERE, NOT IN THE UI. Every table has row-level
--     security. A student who edits a fetch request still cannot read another
--     student's rows, and a teacher cannot read another teacher's class.
--
-- Child-privacy notes are inline. The short version: we store a display name,
-- a role and a username. No email is required for a student, no birthdate, no
-- address, no photo, no free-text profile.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------- enums -----
create type cq_role         as enum ('student', 'teacher', 'admin');
create type cq_mastery      as enum ('not_started', 'beginning', 'developing', 'proficient', 'mastered');
create type cq_lesson_state as enum ('not_started', 'in_progress', 'completed', 'mastered');
create type cq_pub_status   as enum ('draft', 'published', 'archived');
create type cq_activity_kind as enum (
  'intro', 'explain', 'battle', 'quiz', 'sort', 'match', 'label', 'sequence',
  'predict', 'simulation', 'lab', 'data', 'build', 'reflect', 'free_response'
);

-- -------------------------------------------------------------- profiles ----
-- One row per account, keyed to Supabase auth.users.
--
-- `username` is how a student signs in. Supabase auth needs an email, so the
-- app synthesises one (`<username>@students.curiosity-quest.org`) that is never
-- displayed, never mailed, and never treated as a contact address. Teachers use
-- a real email because they need password recovery.
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          cq_role not null default 'student',
  username      citext unique not null check (char_length(username) between 3 and 24),
  display_name  text   not null check (char_length(display_name) between 1 and 40),
  avatar_key    text   not null default 'beaker',
  title         text,                       -- optional self-chosen "Junior Scientist" etc.
  grade_band    text,                       -- '3-5' | '6-8' — coarse on purpose
  school_name   text,                       -- teachers only
  xp_total      integer not null default 0 check (xp_total >= 0),
  settings      jsonb   not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz,
  deleted_at    timestamptz                 -- soft delete so a class roster stays coherent
);
create index profiles_role_idx on profiles(role) where deleted_at is null;

-- --------------------------------------------------------------- classes ----
create table classes (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references profiles(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  grade_band  text,
  subject     text,
  -- Join codes are short enough for a 9-year-old to type off a whiteboard and
  -- random enough not to be guessable in bulk. Regenerable if it leaks.
  join_code   text unique not null check (join_code ~ '^CQ-[0-9]{5}$'),
  code_active boolean not null default true,
  code_expires_at timestamptz,
  settings    jsonb not null default jsonb_build_object(
                'mastery_threshold', 80,
                'allow_retry', true,
                'show_answers', true,
                'xp_enabled', true,
                'achievements_enabled', true,
                'class_goals_enabled', true,
                'leaderboard_enabled', false      -- opt-in, never the default
              ),
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);
create index classes_teacher_idx on classes(teacher_id) where archived_at is null;
create index classes_code_idx on classes(join_code) where code_active;

create table class_members (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references classes(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  removed_at timestamptz,
  unique (class_id, student_id)
);
create index class_members_student_idx on class_members(student_id) where removed_at is null;
create index class_members_class_idx on class_members(class_id) where removed_at is null;

-- ---------------------------------------------------------------- skills ----
-- Skills are the spine of the learning record. Lessons come and go; a skill
-- accumulates evidence from every lesson that touches it, forever.
create table strands (
  id    text primary key,          -- 'forces' | 'matter' | 'life' | 'earth' | 'build' | 'method'
  name  text not null,
  blurb text,
  sort  integer not null default 0
);

create table skills (
  id         text primary key,     -- stable slug, e.g. 'forces.newtons-second-law'
  strand_id  text not null references strands(id),
  name       text not null,
  blurb      text,
  grade_min  integer,
  grade_max  integer,
  sort       integer not null default 0,
  archived_at timestamptz
);
create index skills_strand_idx on skills(strand_id);

-- --------------------------------------------------------------- lessons ----
create table lessons (
  id            text primary key,   -- stable slug so historic attempts never orphan
  title         text not null,
  summary       text,
  strand_id     text references strands(id),
  subject       text,
  grade_min     integer not null default 3,
  grade_max     integer not null default 8,
  difficulty    integer not null default 1 check (difficulty between 1 and 3),
  est_minutes   integer not null default 10,
  objectives    jsonb not null default '[]'::jsonb,
  standards     jsonb not null default '[]'::jsonb,
  tags          jsonb not null default '[]'::jsonb,
  activity_kinds jsonb not null default '[]'::jsonb,
  thumbnail_key text,
  xp_award      integer not null default 50,
  format        text not null default 'mission',   -- mission | battle | experiment | course | brief
  status        cq_pub_status not null default 'published',
  -- Content edits bump the version. Attempts record the version they ran
  -- against, so re-writing a lesson never rewrites history.
  version       integer not null default 1,
  source        jsonb not null default '{}'::jsonb,  -- provenance for migrated content
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  published_at  timestamptz
);
create index lessons_status_idx on lessons(status);
create index lessons_strand_idx on lessons(strand_id);
create index lessons_grade_idx on lessons(grade_min, grade_max);

create table lesson_skills (
  lesson_id text not null references lessons(id) on delete cascade,
  skill_id  text not null references skills(id) on delete cascade,
  weight    numeric not null default 1 check (weight > 0),
  primary key (lesson_id, skill_id)
);

-- Activities are the modular pieces inside a lesson. A lesson may be a single
-- quiz, or an intro + simulation + battle + reflection. New kinds are added to
-- the enum and rendered by a new component — no schema migration for content.
create table activities (
  id        uuid primary key default gen_random_uuid(),
  lesson_id text not null references lessons(id) on delete cascade,
  kind      cq_activity_kind not null,
  title     text,
  position  integer not null default 0,
  required  boolean not null default true,
  config    jsonb not null default '{}'::jsonb,
  unique (lesson_id, position)
);

create table questions (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid references activities(id) on delete cascade,
  lesson_id   text references lessons(id) on delete cascade,
  skill_id    text references skills(id),
  kind        text not null default 'multiple_choice',
  prompt      text not null,
  choices     jsonb not null default '[]'::jsonb,
  answer      jsonb,
  explanation text,
  difficulty  integer not null default 1 check (difficulty between 1 and 3),
  position    integer not null default 0,
  archived_at timestamptz
);
create index questions_activity_idx on questions(activity_id);
create index questions_skill_idx on questions(skill_id);

-- ------------------------------------------------------------- attempts -----
create table attempts (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references profiles(id) on delete cascade,
  lesson_id         text not null references lessons(id) on delete cascade,
  lesson_version    integer not null default 1,
  -- Nullable on purpose: free play produces attempts with no assignment, and
  -- those attempts still count toward mastery.
  assignment_id     uuid,
  started_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  completed_at      timestamptz,
  abandoned_at      timestamptz,
  score             numeric not null default 0,
  max_score         numeric not null default 0,
  questions_answered integer not null default 0,
  questions_correct  integer not null default 0,
  seconds_spent     integer not null default 0,
  -- Checkpoint for "Continue playing". Written on every answer so a closed
  -- laptop or a dropped Wi-Fi connection costs at most one question.
  state             jsonb not null default '{}'::jsonb
);
create index attempts_student_lesson_idx on attempts(student_id, lesson_id);
create index attempts_open_idx on attempts(student_id) where completed_at is null and abandoned_at is null;
create index attempts_assignment_idx on attempts(assignment_id) where assignment_id is not null;

create table responses (
  id            uuid primary key default gen_random_uuid(),
  attempt_id    uuid not null references attempts(id) on delete cascade,
  student_id    uuid not null references profiles(id) on delete cascade,
  question_id   uuid references questions(id) on delete set null,
  lesson_id     text references lessons(id) on delete set null,
  skill_id      text references skills(id) on delete set null,
  is_correct    boolean not null,
  difficulty    integer not null default 1,
  response      jsonb,
  ms_elapsed    integer,
  attempt_no    integer not null default 1,
  answered_at   timestamptz not null default now()
);
create index responses_student_skill_idx on responses(student_id, skill_id);
create index responses_attempt_idx on responses(attempt_id);

-- ----------------------------------------------- derived progress tables ----
-- These are caches. Every value in them is recomputable from `responses` and
-- `attempts` by the pure functions in src/platform/mastery.js, which is what
-- makes it safe to change the mastery rules later and backfill.
create table lesson_progress (
  student_id        uuid not null references profiles(id) on delete cascade,
  lesson_id         text not null references lessons(id) on delete cascade,
  status            cq_lesson_state not null default 'not_started',
  attempts_count    integer not null default 0,
  completions       integer not null default 0,
  best_score        numeric,
  latest_score      numeric,
  avg_score         numeric,
  first_score       numeric,
  seconds_spent     integer not null default 0,
  questions_answered integer not null default 0,
  questions_correct  integer not null default 0,
  last_played_at    timestamptz,
  primary key (student_id, lesson_id)
);

create table skill_mastery (
  student_id  uuid not null references profiles(id) on delete cascade,
  skill_id    text not null references skills(id) on delete cascade,
  level       cq_mastery not null default 'not_started',
  pct         numeric not null default 0,
  evidence    integer not null default 0,
  sessions    integer not null default 0,
  first_pct   numeric,
  latest_pct  numeric,
  growth      numeric,
  updated_at  timestamptz not null default now(),
  primary key (student_id, skill_id)
);
create index skill_mastery_skill_idx on skill_mastery(skill_id);

-- ----------------------------------------------------------- assignments ----
-- An assignment is teacher guidance with a due date and a target. It grants
-- nothing and restricts nothing.
create table assignments (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references classes(id) on delete cascade,
  lesson_id   text not null references lessons(id) on delete cascade,
  teacher_id  uuid not null references profiles(id) on delete cascade,
  title       text,
  note        text,
  due_at      timestamptz,
  min_mastery integer not null default 80 check (min_mastery between 0 and 100),
  required    boolean not null default true,
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);
create index assignments_class_idx on assignments(class_id) where archived_at is null;

alter table attempts
  add constraint attempts_assignment_fk
  foreign key (assignment_id) references assignments(id) on delete set null;

-- ------------------------------------------------------------- events -------
-- Append-only activity stream. Dashboards read the aggregates above; this is
-- what makes new analytics possible later without re-instrumenting the app.
create table learning_events (
  id          bigserial primary key,
  student_id  uuid references profiles(id) on delete cascade,
  class_id    uuid references classes(id) on delete set null,
  type        text not null,
  lesson_id   text,
  activity_id uuid,
  question_id uuid,
  skill_id    text,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index events_student_time_idx on learning_events(student_id, created_at desc);
create index events_class_time_idx on learning_events(class_id, created_at desc);
create index events_type_idx on learning_events(type);

-- --------------------------------------------------------- gamification -----
create table achievements (
  id          text primary key,
  name        text not null,
  description text not null,
  icon        text not null default 'award',
  category    text,
  criteria    jsonb not null,
  xp          integer not null default 0,
  sort        integer not null default 0
);

create table student_achievements (
  student_id     uuid not null references profiles(id) on delete cascade,
  achievement_id text not null references achievements(id) on delete cascade,
  earned_at      timestamptz not null default now(),
  primary key (student_id, achievement_id)
);

create table xp_transactions (
  id         bigserial primary key,
  student_id uuid not null references profiles(id) on delete cascade,
  amount     integer not null,
  reason     text not null,
  ref_type   text,
  ref_id     text,
  created_at timestamptz not null default now()
);
create index xp_student_idx on xp_transactions(student_id, created_at desc);

-- Cooperative goals, preferred over ranking children against each other.
create table class_goals (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid not null references classes(id) on delete cascade,
  title        text not null,
  metric       text not null,           -- 'lessons_completed' | 'skills_mastered' | 'questions_correct'
  target       integer not null check (target > 0),
  starts_at    timestamptz not null default now(),
  ends_at      timestamptz,
  completed_at timestamptz
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Helper functions are SECURITY DEFINER so a policy can look up membership
-- without recursing into the policy it is currently evaluating.
create or replace function cq_role_of(uid uuid)
returns cq_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = uid and deleted_at is null
$$;

create or replace function cq_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(cq_role_of(auth.uid()) = 'admin', false)
$$;

-- Does the current user teach a class that this student belongs to?
create or replace function cq_teaches_student(student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from class_members cm
    join classes c on c.id = cm.class_id
    where cm.student_id = student
      and cm.removed_at is null
      and c.teacher_id = auth.uid()
      and c.archived_at is null
  )
$$;

create or replace function cq_in_class(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from class_members
    where class_id = cid and student_id = auth.uid() and removed_at is null
  )
$$;

create or replace function cq_owns_class(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from classes where id = cid and teacher_id = auth.uid())
$$;

alter table profiles             enable row level security;
alter table classes              enable row level security;
alter table class_members        enable row level security;
alter table strands              enable row level security;
alter table skills               enable row level security;
alter table lessons              enable row level security;
alter table lesson_skills        enable row level security;
alter table activities           enable row level security;
alter table questions            enable row level security;
alter table attempts             enable row level security;
alter table responses            enable row level security;
alter table lesson_progress      enable row level security;
alter table skill_mastery        enable row level security;
alter table assignments          enable row level security;
alter table learning_events      enable row level security;
alter table achievements         enable row level security;
alter table student_achievements enable row level security;
alter table xp_transactions      enable row level security;
alter table class_goals          enable row level security;

-- profiles ------------------------------------------------------------------
create policy profiles_self_read on profiles for select
  using (id = auth.uid() or cq_teaches_student(id) or cq_is_admin());
create policy profiles_self_write on profiles for update
  using (id = auth.uid() or cq_is_admin())
  with check (id = auth.uid() or cq_is_admin());
create policy profiles_self_insert on profiles for insert
  with check (id = auth.uid());
-- Note: role is protected by a trigger below — a student cannot promote itself.

-- classes -------------------------------------------------------------------
create policy classes_teacher_all on classes for all
  using (teacher_id = auth.uid() or cq_is_admin())
  with check (teacher_id = auth.uid() or cq_is_admin());
create policy classes_member_read on classes for select
  using (cq_in_class(id));

-- class_members -------------------------------------------------------------
create policy members_read on class_members for select
  using (student_id = auth.uid() or cq_owns_class(class_id) or cq_is_admin());
-- A student may add only themselves, and only to an active, unexpired code.
create policy members_self_join on class_members for insert
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from classes c
      where c.id = class_id
        and c.code_active
        and c.archived_at is null
        and (c.code_expires_at is null or c.code_expires_at > now())
    )
  );
create policy members_teacher_manage on class_members for update
  using (cq_owns_class(class_id) or student_id = auth.uid() or cq_is_admin())
  with check (cq_owns_class(class_id) or student_id = auth.uid() or cq_is_admin());
create policy members_teacher_delete on class_members for delete
  using (cq_owns_class(class_id) or cq_is_admin());

-- content: readable by everyone when published, writable by admins only -----
create policy strands_read on strands for select using (true);
create policy skills_read  on skills  for select using (archived_at is null or cq_is_admin());
create policy lessons_read on lessons for select
  using (status = 'published' or created_by = auth.uid() or cq_is_admin());
create policy lesson_skills_read on lesson_skills for select using (true);
create policy activities_read on activities for select using (true);
-- The correct answer is never exposed by a plain select in the client;
-- see cq_check_answer() below for how grading happens server-side.
create policy questions_read on questions for select using (archived_at is null);

create policy strands_admin    on strands    for all using (cq_is_admin()) with check (cq_is_admin());
create policy skills_admin     on skills     for all using (cq_is_admin()) with check (cq_is_admin());
create policy lessons_admin    on lessons    for all using (cq_is_admin()) with check (cq_is_admin());
create policy lskills_admin    on lesson_skills for all using (cq_is_admin()) with check (cq_is_admin());
create policy activities_admin on activities for all using (cq_is_admin()) with check (cq_is_admin());
create policy questions_admin  on questions  for all using (cq_is_admin()) with check (cq_is_admin());

-- attempts / responses ------------------------------------------------------
create policy attempts_owner on attempts for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid());
create policy attempts_teacher_read on attempts for select
  using (cq_teaches_student(student_id) or cq_is_admin());

create policy responses_owner on responses for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid());
create policy responses_teacher_read on responses for select
  using (cq_teaches_student(student_id) or cq_is_admin());

-- progress caches -----------------------------------------------------------
create policy progress_owner on lesson_progress for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy progress_teacher_read on lesson_progress for select
  using (cq_teaches_student(student_id) or cq_is_admin());

create policy mastery_owner on skill_mastery for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy mastery_teacher_read on skill_mastery for select
  using (cq_teaches_student(student_id) or cq_is_admin());

-- assignments ---------------------------------------------------------------
create policy assignments_teacher on assignments for all
  using (cq_owns_class(class_id) or cq_is_admin())
  with check (cq_owns_class(class_id) or cq_is_admin());
create policy assignments_student_read on assignments for select
  using (cq_in_class(class_id));

-- events / gamification ----------------------------------------------------
create policy events_owner on learning_events for insert with check (student_id = auth.uid());
create policy events_read on learning_events for select
  using (student_id = auth.uid() or cq_teaches_student(student_id) or cq_is_admin());

create policy achievements_read on achievements for select using (true);
create policy achievements_admin on achievements for all using (cq_is_admin()) with check (cq_is_admin());

create policy sach_owner on student_achievements for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy sach_teacher_read on student_achievements for select
  using (cq_teaches_student(student_id) or cq_is_admin());

create policy xp_owner on xp_transactions for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy xp_teacher_read on xp_transactions for select
  using (cq_teaches_student(student_id) or cq_is_admin());

create policy goals_read on class_goals for select
  using (cq_in_class(class_id) or cq_owns_class(class_id) or cq_is_admin());
create policy goals_teacher on class_goals for all
  using (cq_owns_class(class_id) or cq_is_admin())
  with check (cq_owns_class(class_id) or cq_is_admin());

-- ============================================================================
-- Guards and helpers
-- ============================================================================

-- Nobody escalates their own role through the profiles update policy.
create or replace function cq_guard_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role <> old.role and not cq_is_admin() then
    raise exception 'role changes require an administrator';
  end if;
  return new;
end $$;
create trigger profiles_guard_role before update on profiles
  for each row execute function cq_guard_role();

-- Join-code lookup. Deliberately a function rather than a select policy so a
-- student can validate ONE code they typed without being able to enumerate
-- every class in the database.
create or replace function cq_lookup_class(code text)
returns table (class_id uuid, class_name text, teacher_name text)
language sql stable security definer set search_path = public as $$
  select c.id, c.name, p.display_name
  from classes c
  join profiles p on p.id = c.teacher_id
  where c.join_code = upper(trim(code))
    and c.code_active
    and c.archived_at is null
    and (c.code_expires_at is null or c.code_expires_at > now())
  limit 1
$$;
revoke all on function cq_lookup_class(text) from public;
grant execute on function cq_lookup_class(text) to authenticated;

-- Unique 5-digit code generator with retry.
create or replace function cq_new_join_code() returns text
language plpgsql security definer set search_path = public as $$
declare candidate text;
begin
  for i in 1..50 loop
    candidate := 'CQ-' || lpad((floor(random() * 100000))::int::text, 5, '0');
    if not exists (select 1 from classes where join_code = candidate) then
      return candidate;
    end if;
  end loop;
  raise exception 'could not allocate a unique join code';
end $$;

-- Grading happens here, so the client never needs the answer key in order to
-- score an attempt. The client posts a choice; this returns correct/explanation
-- and writes the response row.
create or replace function cq_submit_response(
  p_attempt uuid, p_question uuid, p_response jsonb, p_ms integer default null
) returns table (is_correct boolean, explanation text, answer jsonb)
language plpgsql security definer set search_path = public as $$
declare q record; a record; ok boolean;
begin
  select * into a from attempts where id = p_attempt and student_id = auth.uid();
  if a is null then raise exception 'attempt not found'; end if;
  if a.completed_at is not null then raise exception 'attempt already complete'; end if;

  select * into q from questions where id = p_question;
  if q is null then raise exception 'question not found'; end if;

  ok := (q.answer = p_response);

  insert into responses (attempt_id, student_id, question_id, lesson_id, skill_id,
                         is_correct, difficulty, response, ms_elapsed, attempt_no)
  values (p_attempt, auth.uid(), p_question, a.lesson_id, q.skill_id,
          ok, q.difficulty, p_response, p_ms, a.questions_answered + 1);

  update attempts
     set questions_answered = questions_answered + 1,
         questions_correct  = questions_correct + (case when ok then 1 else 0 end),
         updated_at = now()
   where id = p_attempt;

  return query select ok, q.explanation, (case when ok then q.answer else null end);
end $$;
revoke all on function cq_submit_response(uuid, uuid, jsonb, integer) from public;
grant execute on function cq_submit_response(uuid, uuid, jsonb, integer) to authenticated;

-- Full account deletion, exposed to the account holder. Soft-deletes the
-- profile and hard-deletes the learning record.
create or replace function cq_delete_own_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from responses where student_id = auth.uid();
  delete from attempts where student_id = auth.uid();
  delete from lesson_progress where student_id = auth.uid();
  delete from skill_mastery where student_id = auth.uid();
  delete from learning_events where student_id = auth.uid();
  delete from student_achievements where student_id = auth.uid();
  delete from xp_transactions where student_id = auth.uid();
  update class_members set removed_at = now() where student_id = auth.uid();
  update profiles
     set deleted_at = now(), display_name = 'Removed account',
         username = 'deleted-' || substr(id::text, 1, 8), avatar_key = 'beaker'
   where id = auth.uid();
end $$;
grant execute on function cq_delete_own_account() to authenticated;
