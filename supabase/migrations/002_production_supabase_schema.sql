BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS program_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS programs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    category text NOT NULL,
    short_description text NOT NULL,
    description text NOT NULL,
    duration text NOT NULL,
    difficulty text NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    delivery_mode text NOT NULL DEFAULT 'REMOTE' CHECK (delivery_mode = 'REMOTE'),
    eligibility text NOT NULL DEFAULT 'WORLDWIDE' CHECK (eligibility = 'WORLDWIDE'),
    start_date date NOT NULL,
    end_date date NOT NULL,
    application_deadline date NOT NULL,
    available_seats integer NOT NULL DEFAULT 0 CHECK (available_seats >= 0),
    current_participants integer NOT NULL DEFAULT 0 CHECK (current_participants >= 0),
    status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED')),
    skills jsonb NOT NULL DEFAULT '[]'::jsonb,
    learning_outcomes jsonb NOT NULL DEFAULT '[]'::jsonb,
    requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
    application_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
    community_url text,
    community_platform text CHECK (community_platform IN ('DISCORD', 'WHATSAPP', 'TELEGRAM', 'OTHER')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name text NOT NULL,
    username text,
    email text NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'PARTICIPANT' CHECK (role IN ('PARTICIPANT', 'MENTOR', 'ADMIN', 'SUPER_ADMIN')),
    country text,
    timezone text,
    profile_photo text,
    short_bio text,
    skills jsonb NOT NULL DEFAULT '[]'::jsonb,
    education text,
    experience text,
    github text,
    linkedin text,
    portfolio text,
    website text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    applicant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text NOT NULL,
    country text NOT NULL,
    timezone text NOT NULL,
    education text NOT NULL,
    experience text NOT NULL,
    skills jsonb NOT NULL DEFAULT '[]'::jsonb,
    motivation text NOT NULL,
    github text,
    linkedin text,
    portfolio text,
    availability text NOT NULL,
    answers jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'ACCEPTED', 'WAITLISTED', 'REJECTED', 'WITHDRAWN')),
    submitted_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (program_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS cohorts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    capacity integer NOT NULL CHECK (capacity > 0),
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'ARCHIVED')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    participant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cohort_id uuid REFERENCES cohorts(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'ENROLLED' CHECK (status IN ('ENROLLED', 'ACTIVE', 'COMPLETED', 'DID_NOT_COMPLETE')),
    joined_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    UNIQUE (program_id, participant_id)
);

CREATE TABLE IF NOT EXISTS completion_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    participant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'DID_NOT_COMPLETE', 'PENDING')),
    completed_at timestamptz NOT NULL DEFAULT now(),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number text NOT NULL UNIQUE,
    verification_code text NOT NULL UNIQUE,
    participant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    cohort_id uuid REFERENCES cohorts(id) ON DELETE SET NULL,
    certificate_title text NOT NULL,
    issued_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
    pdf_path text,
    verification_url text,
    revoked_at timestamptz,
    revocation_reason text,
    revoked_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    message text NOT NULL,
    author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    note text NOT NULL,
    created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor uuid REFERENCES profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id text,
    timestamp timestamptz NOT NULL DEFAULT now(),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION public.user_has_role(_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.auth_user_id = auth.uid()
          AND p.role = ANY(_roles)
    );
$$;

CREATE OR REPLACE FUNCTION public.get_public_certificate_by_code(_verification_code text)
RETURNS TABLE (
    certificate_number text,
    verification_code text,
    certificate_title text,
    participant_name text,
    program_title text,
    program_category text,
    issue_date timestamptz,
    completion_date timestamptz,
    verification_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT
        c.certificate_number,
        c.verification_code,
        c.certificate_title,
        p.full_name AS participant_name,
        pr.title AS program_title,
        pr.category AS program_category,
        c.issued_at AS issue_date,
        c.completed_at AS completion_date,
        c.status AS verification_status
    FROM public.certificates AS c
    INNER JOIN public.profiles AS p ON p.id = c.participant_id
    INNER JOIN public.programs AS pr ON pr.id = c.program_id
    WHERE c.verification_code = _verification_code
      AND c.status = 'ACTIVE';
$$;

ALTER TABLE program_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE completion_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Program categories: public read"
ON program_categories
FOR SELECT
USING (true);

CREATE POLICY "Program categories: admins manage"
ON program_categories
FOR ALL
USING (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']))
WITH CHECK (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']));

CREATE POLICY "Programs: public read published"
ON programs
FOR SELECT
USING (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED'));

CREATE POLICY "Programs: admin manage"
ON programs
FOR ALL
USING (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']))
WITH CHECK (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']));

CREATE POLICY "Profiles: read own profile"
ON profiles
FOR SELECT
USING (auth_user_id = auth.uid());

CREATE POLICY "Profiles: insert own participant profile"
ON profiles
FOR INSERT
WITH CHECK (
    auth_user_id = auth.uid()
    AND role = 'PARTICIPANT'
);

CREATE POLICY "Profiles: update own profile without changing role"
ON profiles
FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (
    auth_user_id = auth.uid()
    AND role = OLD.role
);

CREATE POLICY "Profiles: admin manage all"
ON profiles
FOR ALL
USING (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']))
WITH CHECK (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']));

CREATE POLICY "Applications: participants read own"
ON applications
FOR SELECT
USING (applicant_id = (
    SELECT id
    FROM public.profiles
    WHERE auth_user_id = auth.uid()
    LIMIT 1
));

CREATE POLICY "Applications: participants create own"
ON applications
FOR INSERT
WITH CHECK (
    applicant_id = (
        SELECT id
        FROM public.profiles
        WHERE auth_user_id = auth.uid()
        LIMIT 1
    )
    AND status = 'SUBMITTED'
);

CREATE POLICY "Applications: admins manage"
ON applications
FOR ALL
USING (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']))
WITH CHECK (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']));

CREATE POLICY "Cohorts: admins manage"
ON cohorts
FOR ALL
USING (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']))
WITH CHECK (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']));

CREATE POLICY "Enrollments: participants read own"
ON enrollments
FOR SELECT
USING (participant_id = (
    SELECT id
    FROM public.profiles
    WHERE auth_user_id = auth.uid()
    LIMIT 1
));

CREATE POLICY "Enrollments: admins manage"
ON enrollments
FOR ALL
USING (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']))
WITH CHECK (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']));

CREATE POLICY "Completion records: participants read own"
ON completion_records
FOR SELECT
USING (participant_id = (
    SELECT id
    FROM public.profiles
    WHERE auth_user_id = auth.uid()
    LIMIT 1
));

CREATE POLICY "Completion records: admins manage"
ON completion_records
FOR ALL
USING (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']))
WITH CHECK (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']));

CREATE POLICY "Certificates: participants read own"
ON certificates
FOR SELECT
USING (participant_id = (
    SELECT id
    FROM public.profiles
    WHERE auth_user_id = auth.uid()
    LIMIT 1
));

CREATE POLICY "Certificates: admins manage"
ON certificates
FOR ALL
USING (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']))
WITH CHECK (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']));

CREATE POLICY "Announcements: authenticated users read"
ON announcements
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Announcements: admins manage"
ON announcements
FOR ALL
USING (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']))
WITH CHECK (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']));

CREATE POLICY "Admin notes: admins read and manage"
ON admin_notes
FOR ALL
USING (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']))
WITH CHECK (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']));

CREATE POLICY "Audit logs: admins read and manage"
ON audit_logs
FOR ALL
USING (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']))
WITH CHECK (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']));

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_program_status ON applications(program_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_program ON enrollments(participant_id, program_id);
CREATE INDEX IF NOT EXISTS idx_completion_records_participant_program ON completion_records(participant_id, program_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_application ON admin_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_certificates_participant ON certificates(participant_id);
CREATE INDEX IF NOT EXISTS idx_certificates_program ON certificates(program_id);

COMMIT;
