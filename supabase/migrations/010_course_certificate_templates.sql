-- Course-specific certificate templates and public showcase configuration.
BEGIN;

CREATE TABLE IF NOT EXISTS public.certificate_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL UNIQUE REFERENCES public.programs(id) ON DELETE CASCADE,
    template_name text NOT NULL DEFAULT 'TIKSE TECH Classic',
    certificate_title text NOT NULL DEFAULT 'Certificate of Completion',
    subtitle text NOT NULL DEFAULT 'This certificate is proudly presented to',
    issuer_name text NOT NULL DEFAULT 'TIKSE TECH',
    signer_name text NOT NULL,
    signer_title text NOT NULL DEFAULT 'Authorized Signatory',
    signature_text text NOT NULL,
    primary_color text NOT NULL DEFAULT '#123b68',
    accent_color text NOT NULL DEFAULT '#c49a45',
    show_on_homepage boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT certificate_templates_primary_color_hex CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT certificate_templates_accent_color_hex CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$')
);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificate_templates: public read showcased"
ON public.certificate_templates
FOR SELECT
TO anon, authenticated
USING (show_on_homepage = true);

CREATE POLICY "certificate_templates: admin manage"
ON public.certificate_templates
FOR ALL
TO authenticated
USING (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']))
WITH CHECK (public.user_has_role(ARRAY['ADMIN', 'SUPER_ADMIN']));

GRANT SELECT ON public.certificate_templates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.certificate_templates TO authenticated;

CREATE INDEX IF NOT EXISTS idx_certificate_templates_program ON public.certificate_templates(program_id);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_showcase ON public.certificate_templates(show_on_homepage);

COMMIT;
