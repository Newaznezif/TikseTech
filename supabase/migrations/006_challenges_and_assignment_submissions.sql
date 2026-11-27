-- TIKSE TECH internship challenge and assignment review workflow.
-- Challenge PDFs and participant submissions are stored in private buckets.

begin;

create table if not exists public.challenge_documents (
    id uuid primary key default gen_random_uuid(),
    program_id uuid not null references public.programs(id) on delete cascade,
    title text not null,
    field text not null,
    description text,
    file_path text not null unique,
    original_file_name text not null,
    mime_type text not null default 'application/pdf' check (mime_type = 'application/pdf'),
    file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
    is_published boolean not null default false,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.assignment_submissions (
    id uuid primary key default gen_random_uuid(),
    challenge_id uuid not null references public.challenge_documents(id) on delete cascade,
    program_id uuid not null references public.programs(id) on delete cascade,
    applicant_id uuid not null references public.profiles(id) on delete cascade,
    file_path text not null unique,
    original_file_name text not null,
    mime_type text not null,
    file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
    submission_note text,
    status text not null default 'SUBMITTED' check (status in ('SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION', 'ACCEPTED', 'REJECTED')),
    score numeric(5,2) check (score is null or score >= 0),
    max_score numeric(5,2) not null default 100 check (max_score > 0),
    feedback text,
    reviewer_id uuid references public.profiles(id) on delete set null,
    reviewed_at timestamptz,
    submitted_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint assignment_score_within_max check (score is null or score <= max_score)
);

create index if not exists idx_challenge_documents_program on public.challenge_documents(program_id, is_published);
create index if not exists idx_assignment_submissions_applicant on public.assignment_submissions(applicant_id, submitted_at desc);
create index if not exists idx_assignment_submissions_review_queue on public.assignment_submissions(status, submitted_at asc);
create index if not exists idx_assignment_submissions_challenge on public.assignment_submissions(challenge_id);

alter table public.challenge_documents enable row level security;
alter table public.assignment_submissions enable row level security;

drop policy if exists "challenge documents: admins manage" on public.challenge_documents;
create policy "challenge documents: admins manage"
on public.challenge_documents for all to authenticated
using (public.user_has_role(array['ADMIN', 'SUPER_ADMIN']))
with check (public.user_has_role(array['ADMIN', 'SUPER_ADMIN']));

drop policy if exists "challenge documents: eligible participants read published" on public.challenge_documents;
create policy "challenge documents: eligible participants read published"
on public.challenge_documents for select to authenticated
using (
    is_published = true
    and (
        exists (select 1 from public.enrollments e where e.program_id = challenge_documents.program_id
            and e.participant_id = public.current_profile_id() and e.status in ('ENROLLED', 'ACTIVE', 'COMPLETED'))
        or exists (select 1 from public.applications a where a.program_id = challenge_documents.program_id
            and a.applicant_id = public.current_profile_id() and a.status = 'ACCEPTED')
    )
);

drop policy if exists "assignment submissions: participants read own" on public.assignment_submissions;
create policy "assignment submissions: participants read own"
on public.assignment_submissions for select to authenticated
using (applicant_id = public.current_profile_id());

drop policy if exists "assignment submissions: admins manage" on public.assignment_submissions;
create policy "assignment submissions: admins manage"
on public.assignment_submissions for all to authenticated
using (public.user_has_role(array['ADMIN', 'SUPER_ADMIN']))
with check (public.user_has_role(array['ADMIN', 'SUPER_ADMIN']));

drop policy if exists "assignment submissions: eligible participants create" on public.assignment_submissions;
create policy "assignment submissions: eligible participants create"
on public.assignment_submissions for insert to authenticated
with check (
    applicant_id = public.current_profile_id()
    and status = 'SUBMITTED' and score is null and feedback is null
    and reviewer_id is null and reviewed_at is null
    and exists (select 1 from public.challenge_documents d where d.id = challenge_id
        and d.program_id = assignment_submissions.program_id and d.is_published = true)
    and (
        exists (select 1 from public.enrollments e where e.program_id = assignment_submissions.program_id
            and e.participant_id = public.current_profile_id() and e.status in ('ENROLLED', 'ACTIVE'))
        or exists (select 1 from public.applications a where a.program_id = assignment_submissions.program_id
            and a.applicant_id = public.current_profile_id() and a.status = 'ACCEPTED')
    )
);

grant select on public.challenge_documents to authenticated;
grant insert, select on public.assignment_submissions to authenticated;
grant select, insert, update, delete on public.challenge_documents to service_role;
grant select, insert, update, delete on public.assignment_submissions to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
    ('challenge-pdfs', 'challenge-pdfs', false, 10485760, array['application/pdf']),
    ('assignment-submissions', 'assignment-submissions', false, 10485760,
        array['application/pdf', 'application/zip', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = excluded.public,
    file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "challenge pdfs: eligible participants read" on storage.objects;
create policy "challenge pdfs: eligible participants read"
on storage.objects for select to authenticated
using (
    bucket_id = 'challenge-pdfs'
    and exists (select 1 from public.challenge_documents d where d.file_path = storage.objects.name and d.is_published = true
        and (
            exists (select 1 from public.enrollments e where e.program_id = d.program_id
                and e.participant_id = public.current_profile_id() and e.status in ('ENROLLED', 'ACTIVE', 'COMPLETED'))
            or exists (select 1 from public.applications a where a.program_id = d.program_id
                and a.applicant_id = public.current_profile_id() and a.status = 'ACCEPTED')
        ))
);

drop policy if exists "assignment files: participants read own" on storage.objects;
create policy "assignment files: participants read own"
on storage.objects for select to authenticated
using (bucket_id = 'assignment-submissions' and (storage.foldername(name))[1] = public.current_profile_id()::text);

drop policy if exists "challenge storage: admins manage" on storage.objects;
create policy "challenge storage: admins manage"
on storage.objects for all to authenticated
using (bucket_id in ('challenge-pdfs', 'assignment-submissions') and public.user_has_role(array['ADMIN', 'SUPER_ADMIN']))
with check (bucket_id in ('challenge-pdfs', 'assignment-submissions') and public.user_has_role(array['ADMIN', 'SUPER_ADMIN']));

commit;
