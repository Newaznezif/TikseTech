'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function publishAnnouncement(formData: FormData) {
    const session = await getSessionUser();
    if (!session || !hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) {
        throw new Error('Administrator access is required to publish announcements.');
    }

    const title = String(formData.get('title') || '').trim();
    const message = String(formData.get('message') || '').trim();
    if (title.length < 4 || title.length > 120) {
        throw new Error('Announcement title must be between 4 and 120 characters.');
    }
    if (message.length < 10 || message.length > 3000) {
        throw new Error('Announcement message must be between 10 and 3,000 characters.');
    }

    const admin = getSupabaseAdminClient();
    if (!admin) throw new Error('Announcement publishing is not configured on the server.');

    const { data, error } = await admin.from('announcements').insert({
        title,
        message,
        author_id: session.profileId
    }).select('id').single();

    if (error || !data) {
        throw new Error('Announcement could not be published. Please try again.');
    }

    await admin.from('audit_logs').insert({
        actor: session.profileId,
        action: 'ANNOUNCEMENT_PUBLISHED',
        entity: 'announcements',
        entity_id: data.id,
        metadata: { title }
    });

    revalidatePath('/admin/activity');
    revalidatePath('/dashboard');
    revalidatePath('/community');
    redirect('/admin/activity?published=1');
}
