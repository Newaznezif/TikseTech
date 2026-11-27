# TIKSE TECH

TIKSE TECH is a remote technology learning and internship platform. Applicants create an account, apply to a program, complete field-specific challenges, submit work for manual review, receive feedback and scores, and earn verifiable certificates after completion.

## Platform workflow

1. Applicant registers and verifies their email.
2. Applicant browses open programs and submits an application.
3. An administrator reviews the application and accepts eligible applicants.
4. The administrator publishes field-specific challenge PDFs.
5. Eligible participants download the challenge, complete it, and upload their work.
6. Administrators manually review submissions, assign a score, and leave feedback.
7. Approved participants can complete the program and receive a verifiable certificate.

## Stack

- Next.js 15 / React 19 / TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, and private Storage
- Vitest

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure Supabase values in `.env.local`. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Local JSON mode is intended for development/test only and is rejected by production authentication.

## Database

Apply migrations in order from `supabase/migrations`. Migration `006_challenges_and_assignment_submissions.sql` adds private challenge documents, assignment submissions, scoring/review fields, and storage access policies.

## Authentication and authorization

- Production sessions use Supabase Auth cookies through `@supabase/ssr`.
- Every server-side identity lookup verifies the user with `auth.getUser()`.
- Authorization roles are loaded from the trusted `profiles.role` column.
- User-editable `user_metadata` and client-supplied role values are never authorization sources.
- Private challenge and submission files use private Storage buckets and row-level policies.
- The service-role key must never be included in a `NEXT_PUBLIC_*` variable or committed to Git.

## Free-first deployment

The initial target is a free global deployment, not Ethiopia-only data residency. A Next.js-compatible edge host and Supabase Free can support a small pilot, subject to their quotas and inactivity limits. Validate the adapter against this app's server actions, PDF generation, and storage flows before production deployment.

## Email notifications

Supabase Auth handles verification emails. Optional application-status and assignment-review notifications can be enabled with a transactional email provider by setting `RESEND_API_KEY` and `EMAIL_FROM`. A verified sender domain is generally required. In-dashboard status must remain available if email delivery is unavailable.

## Scripts

```bash
npm run dev
npm run build
npm run test
```
