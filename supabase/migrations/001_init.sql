create extension if not exists pgcrypto;

create table if not exists program_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  short_description text not null,
  description text not null,
  duration text not null,
  difficulty text not null,
  delivery_mode text not null default 'REMOTE',
  eligibility text not null default 'WORLDWIDE',
  start_date date not null,
  end_date date not null,
  application_deadline date not null,
  available_seats integer not null default 0,
  current_participants integer not null default 0,
  status text not null default 'DRAFT',
  skills jsonb not null default '[]'::jsonb,
  learning_outcomes jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  application_questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  full_name text not null,
  username text,
  email text not null unique,
  role text not null default 'PARTICIPANT',
  country text,
  timezone text,
  profile_photo text,
  short_bio text,
  skills jsonb not null default '[]'::jsonb,
  education text,
  experience text,
  github text,
  linkedin text,
  portfolio text,
  website text,
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  applicant_id uuid not null references profiles(id) on delete cascade,
  full_name text not null,
  email text not null,
  country text not null,
  timezone text not null,
  education text not null,
  experience text not null,
  skills jsonb not null default '[]'::jsonb,
  motivation text not null,
  github text,
  linkedin text,
  portfolio text,
  availability text not null,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'SUBMITTED',
  submitted_at timestamptz not null default now(),
  unique (program_id, applicant_id)
);

create table if not exists cohorts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  capacity integer not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  participant_id uuid not null references profiles(id) on delete cascade,
  cohort_id uuid references cohorts(id),
  status text not null default 'ENROLLED',
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (program_id, participant_id)
);

create table if not exists completion_records (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  participant_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'COMPLETED',
  completed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_number text not null unique,
  verification_code text not null unique,
  participant_id uuid not null references profiles(id) on delete cascade,
  program_id uuid not null references programs(id) on delete cascade,
  cohort_id uuid references cohorts(id),
  certificate_title text not null,
  issued_at timestamptz not null default now(),
  completed_at timestamptz not null,
  status text not null default 'ACTIVE',
  pdf_path text,
  verification_url text,
  revoked_at timestamptz,
  revocation_reason text,
  revoked_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  created_at timestamptz not null default now(),
  author_id uuid references profiles(id)
);

create table if not exists admin_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text not null,
  entity text not null,
  entity_id text,
  timestamp timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_programs_status on programs(status);
create index if not exists idx_applications_program_status on applications(program_id, status);
create index if not exists idx_certificates_verification on certificates(verification_code);

alter table programs enable row level security;
alter table profiles enable row level security;
alter table applications enable row level security;
alter table enrollments enable row level security;
alter table certificates enable row level security;

create policy "Public read programs" on programs for select using (status in ('OPEN', 'IN_PROGRESS', 'COMPLETED'));
create policy "Public verify certificates" on certificates for select using (status = 'ACTIVE');
create policy "Users can read own profile" on profiles for select using (auth_user_id = auth.uid()::uuid or email = current_setting('request.jwt.claims', true)::json->>'email');
create policy "Users can update own profile" on profiles for update using (auth_user_id = auth.uid()::uuid or email = current_setting('request.jwt.claims', true)::json->>'email');
create policy "Users can read own applications" on applications for select using (applicant_id = auth.uid()::uuid);
create policy "Users can create own applications" on applications for insert with check (applicant_id = auth.uid()::uuid);
create policy "Users can read own enrollments" on enrollments for select using (participant_id = auth.uid()::uuid);
create policy "Users can read own certificates" on certificates for select using (participant_id = auth.uid()::uuid);
