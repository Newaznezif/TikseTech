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
                auth_user_id: userId,
                full_name: parsed.data.fullName,
                email: parsed.data.email,
                role: 'PARTICIPANT',
                country: 'Ethiopia',
                timezone: 'Africa/Addis_Ababa',
                updated_at: new Date().toISOString()
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

        let profile: {
            id: string;
            email: string;
            full_name: string;
            role: string;
            account_status?: string | null;
        } | null = null;

        const { data: visibleProfile, error: profileError } = await supabase.from('profiles')
            .select('id, email, full_name, role, account_status')
            .eq('auth_user_id', data.user.id)
            .maybeSingle();

        if (!profileError && visibleProfile) {
            profile = visibleProfile;
        } else if (!adminPortal) {
            // Repair legacy accounts created before auth_user_id was consistently linked.
            // The service-role client is required because this repair must bypass participant RLS.
            const admin = getSupabaseAdminClient();
            if (admin) {
                const { data: linkedProfile } = await admin.from('profiles')
                    .select('id, email, full_name, role, account_status, auth_user_id')
                    .eq('auth_user_id', data.user.id)
                    .maybeSingle();

                if (linkedProfile) {
                    profile = linkedProfile;
                } else {
                    const { data: legacyProfile } = await admin.from('profiles')
                        .select('id, email, full_name, role, account_status, auth_user_id')
                        .eq('email', data.user.email || email)
                        .maybeSingle();

                    if (legacyProfile?.role === 'PARTICIPANT' && !legacyProfile.auth_user_id) {
                        const { data: repairedProfile, error: repairError } = await admin.from('profiles')
                            .update({
                                auth_user_id: data.user.id,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', legacyProfile.id)
                            .is('auth_user_id', null)
                            .select('id, email, full_name, role, account_status')
                            .maybeSingle();
                        if (!repairError && repairedProfile) profile = repairedProfile;
                    } else if (!legacyProfile) {
                        const metadataName = typeof data.user.user_metadata?.full_name === 'string'
                            ? data.user.user_metadata.full_name.trim()
                            : '';
                        const { data: createdProfile, error: createError } = await admin.from('profiles')
                            .insert({
                                auth_user_id: data.user.id,
                                full_name: metadataName || (data.user.email || email).split('@')[0],
                                email: data.user.email || email,
                                role: 'PARTICIPANT',
                                country: 'Ethiopia',
                                timezone: 'Africa/Addis_Ababa'
                            })
                            .select('id, email, full_name, role, account_status')
                            .single();
                        if (!createError && createdProfile) profile = createdProfile;
                    }
                }
            }
        }

        if (!profile) {
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


/** Send a single-use recovery link without revealing whether an account exists. */
export async function requestPasswordReset(formData: FormData) {
    const email = String(formData.get('email') || '').trim().toLowerCase();
    if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) redirect('/forgot-password?error=invalid-email');
    if (!isSupabaseConfigured() || shouldUseLocalStore()) redirect('/forgot-password?error=unavailable');
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${appUrl}/auth/callback?next=/update-password` });
    if (error) {
        const message = error.message.toLowerCase();
        if (message.includes('rate limit') || error.code === 'over_email_send_rate_limit') redirect('/forgot-password?error=rate-limit');
        redirect('/forgot-password?error=send-failed');
    }
    redirect('/forgot-password?sent=1');
}

/** Change password only after the recovery callback has established a valid session. */
export async function updateRecoveredPassword(formData: FormData) {
    const password = String(formData.get('password') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');
    if (password.length < 8) redirect('/update-password?error=weak-password');
    if (password !== confirmPassword) redirect('/update-password?error=password-mismatch');
    if (!isSupabaseConfigured() || shouldUseLocalStore()) redirect('/update-password?error=unavailable');
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) redirect('/forgot-password?error=session-expired');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) redirect('/update-password?error=update-failed');
    await supabase.auth.signOut();
    redirect('/login?password-updated=1');
}
