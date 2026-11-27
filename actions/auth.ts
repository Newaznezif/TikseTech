'use server';

import { redirect } from 'next/navigation';
import { createUserProfile, getProfileByEmail } from '@/lib/store';
import { getSupabaseAdminClient, isSupabaseConfigured, shouldUseLocalStore } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { registerSchema } from '@/lib/validation';
import { clearSessionUser, setSessionUser } from '@/lib/session';

export async function registerUser(formData: FormData) {
    const payload = {
        fullName: String(formData.get('fullName') || '').trim(),
        email: String(formData.get('email') || '').trim().toLowerCase(),
        password: String(formData.get('password') || '')
    };
    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid registration data');

    if (isSupabaseConfigured() && !shouldUseLocalStore()) {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.auth.signUp({
            email: parsed.data.email,
            password: parsed.data.password,
            options: { data: { full_name: parsed.data.fullName } }
        });
        if (error) throw new Error(error.message);
        const userId = data.user?.id;
        const adminClient = getSupabaseAdminClient();
        if (userId && adminClient) {
            const { error: profileError } = await adminClient.from('profiles').upsert({
                id: userId, auth_user_id: userId, full_name: parsed.data.fullName,
                email: parsed.data.email, role: 'PARTICIPANT', country: 'Ethiopia',
                timezone: 'Africa/Addis_Ababa', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
            }, { onConflict: 'auth_user_id' });
            if (profileError) throw new Error('Your account was created, but the profile could not be initialized. Contact support.');
        } else if (userId) {
            throw new Error('The server is missing its Supabase service key. Ask the administrator to configure it before registration.');
        }
        if (data.session) redirect('/dashboard');
        redirect('/login?registered=1');
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('Production authentication is unavailable. Configure Supabase before accepting registrations.');
    }
    const profile = await createUserProfile({
        fullName: parsed.data.fullName, email: parsed.data.email, role: 'PARTICIPANT',
        country: 'Ethiopia', timezone: 'Africa/Addis_Ababa', skills: []
    });
    await setSessionUser({ email: profile.email, role: profile.role, profileId: profile.id, name: profile.fullName });
    redirect('/dashboard');
}

export async function loginUser(formData: FormData) {
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    if (isSupabaseConfigured() && !shouldUseLocalStore()) {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) throw new Error('Email or password is incorrect.');
        const { data: profile, error: profileError } = await supabase.from('profiles')
            .select('id, email, full_name, role').eq('auth_user_id', data.user.id).maybeSingle();
        if (profileError || !profile) {
            await supabase.auth.signOut();
            throw new Error('Your account profile is not ready. Contact the platform administrator.');
        }
        // The trusted profile role is loaded by getSessionUser() on the next request.
        redirect('/dashboard');
    }
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Production authentication is unavailable. Configure Supabase before accepting logins.');
    }
    const profile = await getProfileByEmail(email);
    if (!profile) throw new Error('No profile found for that email. Create an account first.');
    // Local JSON mode is for development only; deployed authentication uses Supabase.
    await setSessionUser({ email: profile.email, role: profile.role, profileId: profile.id, name: profile.fullName });
    redirect('/dashboard');
}

export async function logoutUser() {
    if (isSupabaseConfigured()) {
        try { await (await createSupabaseServerClient()).auth.signOut(); } catch { /* still clear local cookie */ }
    }
    await clearSessionUser();
    redirect('/login');
}
