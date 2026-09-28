'use server';

import { redirect } from 'next/navigation';

import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { createCertificateForProgram, markParticipantCompleted, revokeCertificate } from '@/lib/store';

export async function markCompletedAction(formData: FormData) {
    const session = await getSessionUser();
    if (!session || !hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) {
        throw new Error('Admin access is required to mark completion.');
    }

    const programId = String(formData.get('programId') || '');
    const participantId = String(formData.get('participantId') || '');

    const enrollment = await markParticipantCompleted(programId, participantId);
    if (!enrollment) {
        throw new Error('Participant is not enrolled in this program');
    }

    const certificate = await createCertificateForProgram(programId, participantId);
    if (!certificate) {
        throw new Error('Certificate could not be issued');
    }

    redirect('/admin');
}

export async function revokeCertificateAction(formData: FormData) {
    const session = await getSessionUser();
    if (!session || !hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) {
        throw new Error('Admin access is required to revoke certificates.');
    }

    const certificateId = String(formData.get('certificateId') || '');
    const reason = String(formData.get('reason') || 'Administrative review');
    const revokedBy = String(formData.get('revokedBy') || session.name || 'admin');

    await revokeCertificate(certificateId, reason, revokedBy);
    redirect('/admin');
}
