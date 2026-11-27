'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { sendStatusEmail } from '@/lib/email';

export async function reviewApplication(formData: FormData) {
    const session = await getSessionUser();
    if (!hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) throw new Error('Administrator access is required.');
    const id = String(formData.get('applicationId') || '');
    const status = String(formData.get('status') || 'UNDER_REVIEW');
    const feedback = String(formData.get('feedback') || '').trim();
    const allowed = ['UNDER_REVIEW', 'SHORTLISTED', 'ACCEPTED', 'WAITLISTED', 'REJECTED'];
    if (!id || !allowed.includes(status)) throw new Error('Invalid application review.');
    if (feedback.length > 5000) throw new Error('Feedback must be 5,000 characters or fewer.');

    const admin = getSupabaseAdminClient();
    if (!admin) throw new Error('Supabase server credentials are not configured.');
    const { data: application, error: readError } = await admin.from('applications')
        .select('id, program_id, applicant_id, full_name, email').eq('id', id).maybeSingle();
    if (readError || !application) throw new Error('Application not found.');
    const { data: program, error: programError } = await admin.from('programs').select('title').eq('id', application.program_id).single();
    if (programError) throw new Error('Program record could not be loaded.');

    const { error: updateError } = await admin.from('applications').update({
        status, admin_feedback: feedback || null, reviewed_by: session!.profileId,
        reviewed_at: new Date().toISOString()
    }).eq('id', id);
    if (updateError) throw new Error('Application review could not be saved: ' + updateError.message);

    if (status === 'ACCEPTED') {
        const { error: enrollmentError } = await admin.from('enrollments').upsert({
            program_id: application.program_id, participant_id: application.applicant_id, status: 'ENROLLED'
        }, { onConflict: 'program_id,participant_id', ignoreDuplicates: true });
        if (enrollmentError) throw new Error('Application was accepted, but enrollment could not be created: ' + enrollmentError.message);
    }

    await admin.from('audit_logs').insert({ actor: session!.profileId, action: 'APPLICATION_REVIEWED',
        entity: 'applications', entity_id: id, metadata: { status } });
    await sendStatusEmail({ to: application.email, name: application.full_name, subject: 'TIKSE TECH application update',
        programTitle: program.title, status, feedback });
    revalidatePath('/admin/applications');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/assignments');
    redirect('/admin/applications?saved=1');
}
