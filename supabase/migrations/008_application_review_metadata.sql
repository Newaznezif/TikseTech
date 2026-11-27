begin;

alter table public.applications
    add column if not exists admin_feedback text,
    add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
    add column if not exists reviewed_at timestamptz;

create index if not exists idx_applications_reviewed_queue on public.applications(status, submitted_at desc);

commit;
