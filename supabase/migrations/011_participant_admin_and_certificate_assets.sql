BEGIN;

ALTER TABLE public.certificate_templates
  ADD COLUMN IF NOT EXISTS signature_image_path text,
  ADD COLUMN IF NOT EXISTS stamp_image_path text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('ACTIVE', 'SUSPENDED'));

ALTER TABLE public.applications
  ALTER COLUMN availability DROP NOT NULL,
  ALTER COLUMN availability SET DEFAULT 'SELF_PACED';

UPDATE public.applications
SET availability = 'SELF_PACED'
WHERE availability IS NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificate-assets',
  'certificate-assets',
  false,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

COMMIT;
