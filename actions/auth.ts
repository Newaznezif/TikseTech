'use server';

import { redirect } from 'next/navigation';

import { createUserProfile, getProfileByEmail } from '@/lib/store';
import { getSupabaseAdminClient, getSupabaseClient, isSupabaseConfigured, shouldUseLocalStore } from '@/lib/supabase';
import { registerSchema } from '@/lib/validation';
import { clearSessionUser, setSessionUser } from '@/lib/session';

export async function registerUser(formData: FormData) {
    const payload = {
        fullName: String(formData.get('fullName') || ''),
        email: String(formData.get('email') || ''),
        password: String(formData.get('password') || '')
    };

    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Invalid registration data');
    }

    if (!shouldUseLocalStore() && isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase is not configured for authentication.');
        }

        const { data, error } = await supabase.auth.signUp({
            email: parsed.data.email,
            password: parsed.data.password,
            options: {
                data: {
                    full_name: parsed.data.fullName,
                    role: 'PARTICIPANT'
                }
            }
        });

        if (error) {
            throw new Error(error.message);
        }

        const userId = data.user?.id;
        const adminClient = getSupabaseAdminClient();
        if (userId && adminClient) {
            const { error: profileError } = await adminClient.from('profiles').upsert({
                id: userId,
                auth_user_id: userId,
                full_name: parsed.data.fullName,
                email: parsed.data.email,
                role: 'PARTICIPANT',
                country: 'Global',
                timezone: 'UTC',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

            if (profileError) {
                throw new Error(profileError.message);
            }
        }

        await setSessionUser({
            email: parsed.data.email,
            role: 'PARTICIPANT',
            profileId: userId || '',
            name: parsed.data.fullName
        });

        redirect('/dashboard');
    }

    const profile = await createUserProfile({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        role: 'PARTICIPANT',
        country: 'Global',
        timezone: 'UTC',
        skills: []
    });

    await setSessionUser({
        email: profile.email,
        role: profile.role,
        profileId: profile.id,
        name: profile.fullName
    });

    redirect('/dashboard');
}

export async function loginUser(formData: FormData) {
    const email = String(formData.get('email') || '');
    const password = String(formData.get('password') || '');

    if (!shouldUseLocalStore() && isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase is not configured for authentication.');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw new Error(error.message);
        }

        const userId = data.user?.id || '';
        const profile = await getProfileByEmail(data.user?.email || email);
        const sessionRole = profile?.role || (data.user?.user_metadata?.role as string) || 'PARTICIPANT';

        await setSessionUser({
            email: data.user?.email || email,
            role: sessionRole,
            profileId: userId,
            name: profile?.fullName || data.user?.user_metadata?.full_name || email
        });

        redirect('/dashboard');
    }

    const profile = await getProfileByEmail(email);

    if (!profile) {
        throw new Error('No profile found for that email. Create an account first.');
    }

    await setSessionUser({
        email: profile.email,
        role: profile.role,
        profileId: profile.id,
        name: profile.fullName
    });

    redirect('/dashboard');
}

export async function logoutUser() {
    if (!shouldUseLocalStore() && isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.auth.signOut();
        }
    }

    await clearSessionUser();
    redirect('/login');
}
