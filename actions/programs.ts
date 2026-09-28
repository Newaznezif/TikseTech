'use server';

import { redirect } from 'next/navigation';

import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { createProgramRecord } from '@/lib/store';
import { getSupabaseAdminClient, isSupabaseConfigured, shouldUseLocalStore } from '@/lib/supabase';
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

    if (!shouldUseLocalStore() && isSupabaseConfigured()) {
        const adminClient = getSupabaseAdminClient();
        if (!adminClient) {
            throw new Error('Supabase service role credentials are required for production program creation.');
        }

        const programPayload = {
            slug: parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { error } = await adminClient.from('programs').insert([programPayload]);
        if (error) {
            throw new Error(error.message);
        }

        redirect('/admin');
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
