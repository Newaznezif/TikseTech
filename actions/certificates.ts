'use server';

import { redirect } from 'next/navigation';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { createCertificateForProgram, markParticipantCompleted, revokeCertificate } from '@/lib/store';
import { getSupabaseAdminClient, isSupabaseConfigured, shouldUseLocalStore } from '@/lib/supabase';

export async function saveCertificateTemplateAction(formData: FormData) {
    const session = await getSessionUser();
    if (!session || !hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) {
        throw new Error('Admin access is required to manage certificate designs.');
    }

    const admin = getSupabaseAdminClient();
    if (!admin) throw new Error('Certificate template storage is not configured.');

    const programId = String(formData.get('programId') || '').trim();
    const templateName = String(formData.get('templateName') || 'TIKSE TECH Classic').trim().slice(0, 100);
    const certificateTitle = String(formData.get('certificateTitle') || 'Certificate of Completion').trim().slice(0, 120);
    const subtitle = String(formData.get('subtitle') || 'This certificate is proudly presented to').trim().slice(0, 160);
    const issuerName = String(formData.get('issuerName') || 'TIKSE TECH').trim().slice(0, 100);
    const signerName = String(formData.get('signerName') || '').trim().slice(0, 100);
    const signerTitle = String(formData.get('signerTitle') || 'Authorized Signatory').trim().slice(0, 100);
    const signatureText = String(formData.get('signatureText') || signerName).trim().slice(0, 100);
    const primaryColor = String(formData.get('primaryColor') || '#123b68');
    const accentColor = String(formData.get('accentColor') || '#c49a45');
    const showOnHomepage = formData.get('showOnHomepage') === 'on';

    if (!programId || !signerName || !signatureText) throw new Error('Select a course and provide the authorized signatory and signature.');
    if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor) || !/^#[0-9a-fA-F]{6}$/.test(accentColor)) {
        throw new Error('Certificate colors must be valid six-digit hex colors.');
    }

    const { error } = await admin.from('certificate_templates').upsert({
        program_id: programId,
        template_name: templateName,
        certificate_title: certificateTitle,
        subtitle,
        issuer_name: issuerName,
        signer_name: signerName,
        signer_title: signerTitle,
        signature_text: signatureText,
        primary_color: primaryColor,
        accent_color: accentColor,
        show_on_homepage: showOnHomepage,
        created_by: session.profileId,
        updated_at: new Date().toISOString()
    }, { onConflict: 'program_id' });

    if (error) throw new Error('Certificate design could not be saved: ' + error.message);
    redirect('/admin/certificates?template=saved');
}


export async function markCompletedAction(formData: FormData) {
    const session = await getSessionUser();
    if (!session || !hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) throw new Error('Admin access is required to mark completion.');
    const programId = String(formData.get('programId') || '');
    const participantId = String(formData.get('participantId') || '');

    // A certificate cannot be issued until at least one challenge for the
    // program has been manually accepted by an administrator with a passing score.
    if (isSupabaseConfigured() && !shouldUseLocalStore()) {
        const admin = getSupabaseAdminClient();
        if (!admin) throw new Error('Supabase server credentials are not configured.');
        const { data: accepted, error } = await admin.from('assignment_submissions').select('id, score')
            .eq('program_id', programId).eq('applicant_id', participantId).eq('status', 'ACCEPTED');
        if (error) throw new Error('Assignment completion could not be verified.');
        if (!accepted?.some(item => item.score !== null && Number(item.score) >= 70)) {
            throw new Error('At least one assignment must be accepted with a score of 70/100 or higher before issuing a certificate.');
        }
    }

    const enrollment = await markParticipantCompleted(programId, participantId);
    if (!enrollment) throw new Error('Participant is not enrolled in this program.');
    const certificate = await createCertificateForProgram(programId, participantId);
    if (!certificate) throw new Error('Certificate could not be issued.');
    redirect('/admin');
}

export async function revokeCertificateAction(formData: FormData) {
    const session = await getSessionUser();
    if (!session || !hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) throw new Error('Admin access is required to revoke certificates.');
    const certificateId = String(formData.get('certificateId') || '');
    const reason = String(formData.get('reason') || 'Administrative review');
    const revokedBy = String(formData.get('revokedBy') || session.name || 'admin');
    await revokeCertificate(certificateId, reason, revokedBy);
    redirect('/admin');
}
