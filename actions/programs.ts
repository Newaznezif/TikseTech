'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { createProgramRecord } from '@/lib/store';
import { isSupabaseConfigured, shouldUseLocalStore } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { programSchema } from '@/lib/validation';

export async function createProgram(formData: FormData) {
    const session = await getSessionUser();
    if (!session || !hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) {
        throw new Error('Admin access is required to create programs.');
    }

    const payload = {
        title: String(formData.get('title') || ''),
        category: String(formData.get('category') || ''),
        shortDescription: String(formData.get('shortDescription') || ''),
        description: String(formData.get('description') || ''),
        duration: String(formData.get('duration') || ''),
        difficulty: String(formData.get('difficulty') || 'Beginner'),
        startDate: String(formData.get('startDate') || ''),
        endDate: String(formData.get('endDate') || ''),
        applicationDeadline: String(formData.get('applicationDeadline') || ''),
        availableSeats: Number(formData.get('availableSeats') || 20),
        status: String(formData.get('status') || 'DRAFT'),
        communityUrl: String(formData.get('communityUrl') || '')
    };

    const parsed = programSchema.safeParse(payload);
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Invalid program data');
    }

    if (!shouldUseLocalStore()) {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase is not configured for program management.');
        }

        const supabase = await createSupabaseServerClient();
        const now = new Date().toISOString();
        const programPayload = {
            slug: parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            title: parsed.data.title,
            category: parsed.data.category,
            short_description: parsed.data.shortDescription,
            description: parsed.data.description,
            duration: parsed.data.duration,
            difficulty: parsed.data.difficulty,
            delivery_mode: 'REMOTE',
            eligibility: 'WORLDWIDE',
            start_date: parsed.data.startDate,
            end_date: parsed.data.endDate,
            application_deadline: parsed.data.applicationDeadline,
            available_seats: parsed.data.availableSeats,
            current_participants: 0,
            status: parsed.data.status,
            skills: ['Problem solving', 'Collaboration'],
            learning_outcomes: ['Build confidence', 'Complete guided learning'],
            requirements: ['Access to a stable internet connection'],
            application_questions: ['Why do you want to join this program?'],
            community_url: parsed.data.communityUrl || null,
            community_platform: parsed.data.communityUrl ? 'DISCORD' : null,
            created_at: now,
            updated_at: now
        };

        const { data, error } = await supabase.from('programs').insert([programPayload]).select('id').single();
        if (error || !data) throw new Error('Program could not be created: ' + (error?.message || 'No record returned.'));
        const audit = await supabase.from('audit_logs').insert({
            actor: session.profileId, action: 'PROGRAM_CREATED', entity: 'programs',
            entity_id: data.id, metadata: { title: parsed.data.title, status: parsed.data.status }
        });
        if (audit.error) console.error('[programs] Program created but audit entry failed:', audit.error.message);

        revalidatePath('/admin');
        revalidatePath('/admin/programs');
        revalidatePath('/programs');
        revalidatePath('/');
        redirect('/admin/programs?saved=created');
    }

    await createProgramRecord({
        title: parsed.data.title,
        slug: parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: parsed.data.category,
        shortDescription: parsed.data.shortDescription,
        description: parsed.data.description,
        duration: parsed.data.duration,
        difficulty: parsed.data.difficulty,
        deliveryMode: 'REMOTE',
        eligibility: 'WORLDWIDE',
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        applicationDeadline: parsed.data.applicationDeadline,
        availableSeats: parsed.data.availableSeats,
        status: parsed.data.status,
        skills: ['Problem solving', 'Collaboration'],
        learningOutcomes: ['Build confidence', 'Complete guided learning'],
        requirements: ['Access to a stable internet connection'],
        applicationQuestions: ['Why do you want to join this program?'],
        communityUrl: parsed.data.communityUrl || undefined,
        communityPlatform: parsed.data.communityUrl ? 'DISCORD' : undefined
    });

    redirect('/admin');
}

export async function updateProgram(formData: FormData) {
    const session = await getSessionUser();
    if (!session || !hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) {
        throw new Error('Admin access is required to update programs.');
    }

    const id = String(formData.get('programId') || '').trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        throw new Error('A valid program record is required.');
    }

    const payload = {
        title: String(formData.get('title') || '').trim(),
        category: String(formData.get('category') || '').trim(),
        shortDescription: String(formData.get('shortDescription') || '').trim(),
        description: String(formData.get('description') || '').trim(),
        duration: String(formData.get('duration') || '').trim(),
        difficulty: String(formData.get('difficulty') || 'Beginner'),
        startDate: String(formData.get('startDate') || ''),
        endDate: String(formData.get('endDate') || ''),
        applicationDeadline: String(formData.get('applicationDeadline') || ''),
        availableSeats: Number(formData.get('availableSeats') || 1),
        status: String(formData.get('status') || 'DRAFT'),
        communityUrl: String(formData.get('communityUrl') || '').trim()
    };

    const parsed = programSchema.safeParse(payload);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid program data.');
    if (parsed.data.startDate > parsed.data.endDate) throw new Error('Program end date must be after its start date.');

    if (shouldUseLocalStore()) {
        throw new Error('Program editing is available only when the Supabase database is configured.');
    }
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured for program management.');

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from('programs').update({
        title: parsed.data.title,
        category: parsed.data.category,
        short_description: parsed.data.shortDescription,
        description: parsed.data.description,
        duration: parsed.data.duration,
        difficulty: parsed.data.difficulty,
        start_date: parsed.data.startDate,
        end_date: parsed.data.endDate,
        application_deadline: parsed.data.applicationDeadline,
        available_seats: parsed.data.availableSeats,
        status: parsed.data.status,
        community_url: parsed.data.communityUrl || null,
        community_platform: parsed.data.communityUrl ? 'DISCORD' : null,
        updated_at: new Date().toISOString()
    }).eq('id', id).select('id').maybeSingle();

    if (error || !data) throw new Error('Program update failed: ' + (error?.message || 'Program not found.'));
    const audit = await supabase.from('audit_logs').insert({
        actor: session.profileId, action: 'PROGRAM_UPDATED', entity: 'programs',
        entity_id: id, metadata: { title: parsed.data.title, status: parsed.data.status }
    });
    if (audit.error) console.error('[programs] Program updated but audit entry failed:', audit.error.message);

    revalidatePath('/admin');
    revalidatePath('/admin/programs');
    revalidatePath('/programs');
    revalidatePath('/programs/' + String(formData.get('slug') || ''));
    revalidatePath('/');
    redirect('/admin/programs?saved=updated');
}
