-- Make application decisions, acceptance enrollment, and audit recording atomic.
-- The function runs with caller privileges and verifies the authenticated
-- administrator role before touching any records.
CREATE OR REPLACE FUNCTION public.review_application(
    p_application_id uuid,
    p_status text,
    p_feedback text DEFAULT NULL
)
RETURNS TABLE(applicant_name text, applicant_email text, program_title text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, auth, pg_temp
AS $function$
DECLARE
    v_application public.applications%ROWTYPE;
    v_program_title text;
    v_actor uuid;
BEGIN
    IF auth.uid() IS NULL OR NOT public.user_has_role(ARRAY['ADMIN'::text, 'SUPER_ADMIN'::text]) THEN
        RAISE EXCEPTION 'Administrator access is required.'
            USING ERRCODE = '42501';
    END IF;

    IF p_status NOT IN ('UNDER_REVIEW', 'SHORTLISTED', 'ACCEPTED', 'WAITLISTED', 'REJECTED') THEN
        RAISE EXCEPTION 'Invalid application status.'
            USING ERRCODE = '22023';
    END IF;

    IF length(coalesce(p_feedback, '')) > 5000 THEN
        RAISE EXCEPTION 'Feedback must be 5,000 characters or fewer.'
            USING ERRCODE = '22023';
    END IF;

    SELECT a.*
      INTO v_application
      FROM public.applications AS a
     WHERE a.id = p_application_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found.'
            USING ERRCODE = 'P0002';
    END IF;

    SELECT p.title INTO v_program_title
      FROM public.programs AS p
     WHERE p.id = v_application.program_id;

    v_actor := public.current_profile_id();

    UPDATE public.applications
       SET status = p_status,
           admin_feedback = nullif(btrim(coalesce(p_feedback, '')), ''),
           reviewed_by = v_actor,
           reviewed_at = now()
     WHERE id = p_application_id;

    IF p_status = 'ACCEPTED' THEN
        INSERT INTO public.enrollments (program_id, participant_id, status)
        VALUES (v_application.program_id, v_application.applicant_id, 'ENROLLED')
        ON CONFLICT (program_id, participant_id) DO NOTHING;
    END IF;

    INSERT INTO public.audit_logs (actor, action, entity, entity_id, metadata)
    VALUES (
        v_actor,
        'APPLICATION_REVIEWED',
        'applications',
        p_application_id::text,
        jsonb_build_object('status', p_status)
    );

    RETURN QUERY
    SELECT v_application.full_name, v_application.email, v_program_title;
END;
$function$;

REVOKE ALL ON FUNCTION public.review_application(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_application(uuid, text, text) TO authenticated;
