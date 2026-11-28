'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { sendStatusEmail } from '@/lib/email';

export async function reviewApplication(formData: FormData) {
    const session = await getSessionUser();
    if (!hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) {
        throw new Error('Administrator access is required.');
    }

    const id = String(formData.get('applicationId') || '').trim();
    const status = String(formData.get('status') || 'UNDER_REVIEW');
    const feedback = String(formData.get('feedback') || '').trim();
    const allowed = ['UNDER_REVIEW', 'SHORTLISTED', 'ACCEPTED', 'WAITLISTED', 'REJECTED'];

    if (!id || !allowed.includes(status)) throw new Error('Invalid application review.');
    if (feedback.length > 5000) throw new Error('Feedback must be 5,000 characters or fewer.');

    // The database function performs the status update, acceptance enrollment,
    // and audit insert in one transaction under the caller's authenticated role.
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('review_application', {
        p_application_id: id,
        p_status: status,
        p_feedback: feedback || null
    });

    if (error) {
        if (error.code === '42501') throw new Error('Administrator authorization could not be verified.');
        if (error.code === 'P0002') throw new Error('Application not found.');
        throw new Error('Application review could not be saved: ' + error.message);
    }

    const details = Array.isArray(data) ? data[0] : data;
    if (!details) throw new Error('The application review completed without returning applicant details.');

    // Email is intentionally sent after the database transaction commits.
    // A mail-provider failure must not roll back a completed admission decision.
    try {
        await sendStatusEmail({
            to: details.applicant_email,
            name: details.applicant_name,
            subject: 'TIKSE TECH application update',
            programTitle: details.program_title,
            status,
            feedback
        });
    } catch (emailError) {
        console.error('[application-review] Decision saved, but notification email failed:', emailError);
    }

    revalidatePath('/admin/applications');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/assignments');
    redirect('/admin/applications?saved=1');
}
