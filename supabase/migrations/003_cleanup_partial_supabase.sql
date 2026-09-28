BEGIN;

DROP FUNCTION IF EXISTS public.user_has_role(text[]);
DROP FUNCTION IF EXISTS public.get_public_certificate_by_code(text);

COMMIT;
