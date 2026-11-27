'use server';

import { redirect } from 'next/navigation';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { createCertificateForProgram, markParticipantCompleted, revokeCertificate } from '@/lib/store';
import { getSupabaseAdminClient, isSupabaseConfigured, shouldUseLocalStore } from '@/lib/supabase';

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
