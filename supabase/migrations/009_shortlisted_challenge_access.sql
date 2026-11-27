begin;

-- Keep eligibility consistent with the application/community access workflow.
-- Shortlisted candidates may view and submit a challenge; other applicants may not.
drop policy if exists "challenge documents: eligible participants read published" on public.challenge_documents;
create policy "challenge documents: eligible participants read published"
on public.challenge_documents for select to authenticated
using (
    is_published = true
    and (
        exists (select 1 from public.enrollments e where e.program_id = challenge_documents.program_id
            and e.participant_id = public.current_profile_id() and e.status in ('ENROLLED', 'ACTIVE', 'COMPLETED'))
        or exists (select 1 from public.applications a where a.program_id = challenge_documents.program_id
            and a.applicant_id = public.current_profile_id() and a.status in ('ACCEPTED', 'SHORTLISTED'))
    )
);

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
            and a.applicant_id = public.current_profile_id() and a.status in ('ACCEPTED', 'SHORTLISTED'))
    )
);

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
                and a.applicant_id = public.current_profile_id() and a.status in ('ACCEPTED', 'SHORTLISTED'))
        ))
);

commit;
