'use server';

import { redirect } from 'next/navigation';
import { createUserProfile, getProfileByEmail } from '@/lib/store';
import { getSupabaseAdminClient, isSupabaseConfigured, shouldUseLocalStore } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { registerSchema } from '@/lib/validation';
import { clearSessionUser, setSessionUser } from '@/lib/session';
import { appUrl } from '@/lib/env';

export async function registerUser(formData: FormData) {
    const payload = {
        fullName: String(formData.get('fullName') || '').trim(),
        email: String(formData.get('email') || '').trim().toLowerCase(),
        password: String(formData.get('password') || '')
    };
    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) redirect('/register?error=invalid-details');

    if (isSupabaseConfigured() && !shouldUseLocalStore()) {
        if (!appUrl) redirect('/register?error=server-configuration');
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.auth.signUp({
            email: parsed.data.email,
            password: parsed.data.password,
            options: {
                data: { full_name: parsed.data.fullName },
                emailRedirectTo: appUrl + '/auth/callback'
            }
        });
        if (error) {
            if (error.message.toLowerCase().includes('rate limit') || error.code === 'over_email_send_rate_limit') {
                redirect('/register?error=email-rate-limit');
            }
            redirect('/register?error=registration-failed');
        }
        const userId = data.user?.id;
        const adminClient = getSupabaseAdminClient();
        if (userId && adminClient) {
            const { error: profileError } = await adminClient.from('profiles').upsert({
                id: userId, auth_user_id: userId, full_name: parsed.data.fullName,
                email: parsed.data.email, role: 'PARTICIPANT', country: 'Ethiopia',
                timezone: 'Africa/Addis_Ababa', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
            }, { onConflict: 'auth_user_id' });
            if (profileError) redirect('/register?error=profile-setup');
        } else if (userId) {
            redirect('/register?error=server-configuration');
        }
        if (data.session) redirect('/dashboard');
        redirect('/login?registered=1');
    }

    if (process.env.NODE_ENV === 'production') redirect('/register?error=server-configuration');
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
    const adminPortal = String(formData.get('portal') || '') === 'admin';
    const loginPath = adminPortal ? '/admin/login' : '/login';
    if (!email || !password) redirect(loginPath + '?error=invalid-credentials');

    if (isSupabaseConfigured() && !shouldUseLocalStore()) {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
            const message = (error?.message || '').toLowerCase();
            if (error?.code === 'email_not_confirmed' || message.includes('email not confirmed')) {
                redirect(loginPath + '?error=verify-email');
            }
            redirect(loginPath + '?error=invalid-credentials');
        }
        const { data: profile, error: profileError } = await supabase.from('profiles')
            .select('id, email, full_name, role, account_status').eq('auth_user_id', data.user.id).maybeSingle();
        if (profileError || !profile) {
            await supabase.auth.signOut();
            redirect(loginPath + '?error=profile-not-ready');
        }
        const isAdministrator = ['ADMIN', 'SUPER_ADMIN'].includes(String(profile.role || '').toUpperCase());
        if (!isAdministrator && String(profile.account_status || 'ACTIVE') === 'SUSPENDED') {
            await supabase.auth.signOut();
            redirect(loginPath + '?error=account-suspended');
        }
        if (adminPortal && !isAdministrator) {
            await supabase.auth.signOut();
            redirect('/admin/login?error=not-admin');
        }
        if (isAdministrator) redirect('/admin');
        redirect('/dashboard');
    }
    if (process.env.NODE_ENV === 'production') redirect(loginPath + '?error=server-configuration');
    const profile = await getProfileByEmail(email);
    if (!profile) redirect(loginPath + '?error=invalid-credentials');
    const isAdministrator = ['ADMIN', 'SUPER_ADMIN'].includes(String(profile.role || '').toUpperCase());
    if (adminPortal && !isAdministrator) redirect('/admin/login?error=not-admin');
    await setSessionUser({ email: profile.email, role: profile.role, profileId: profile.id, name: profile.fullName });
    if (isAdministrator) redirect('/admin');
    redirect('/dashboard');
}

export async function logoutUser() {
    if (isSupabaseConfigured()) {
        try { await (await createSupabaseServerClient()).auth.signOut(); } catch { /* still clear local cookie */ }
    }
    await clearSessionUser();
    redirect('/login');
}
