import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { isSupabaseConfigured, shouldUseLocalStore } from '@/lib/supabase';

export type SessionUser = { email: string; role: string; profileId: string; name: string };
const DEV_COOKIE = 'tikse_dev_session';
const DEV_SESSION_TTL = 60 * 60 * 8;
function getDevSecret() { return process.env.SESSION_SECRET || (process.env.NODE_ENV === 'test' ? 'tikse-test-only-secret' : ''); }
function sign(value: string, secret: string) { return createHmac('sha256', secret).update(value).digest('hex'); }
function safeEqual(left: string, right: string) {
    const a = Buffer.from(left); const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
}

export function hasRequiredRole(session: SessionUser | null, requiredRoles: string[]) {
    if (!session) return false;
    return requiredRoles.map((role) => role.toUpperCase()).includes(String(session.role || '').toUpperCase());
}

/** Production identity and roles are resolved from verified Supabase Auth + profiles. */
export async function getSessionUser(): Promise<SessionUser | null> {
    if (isSupabaseConfigured() && !shouldUseLocalStore()) {
        try {
            const supabase = await createSupabaseServerClient();
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) return null;
            const { data: profile, error: profileError } = await supabase.from('profiles')
                .select('id, email, full_name, role').eq('auth_user_id', user.id).maybeSingle();
            if (profileError || !profile) return null;
            return { email: profile.email || user.email || '', role: profile.role || 'PARTICIPANT',
                profileId: profile.id, name: profile.full_name || user.email || 'Participant' };
        } catch { return null; }
    }

    if (process.env.NODE_ENV === 'production') return null;
    const secret = getDevSecret();
    if (!secret) return null;
    try {
        const raw = (await cookies()).get(DEV_COOKIE)?.value;
        if (!raw) return null;
        const [encoded, signature] = raw.split('.');
        if (!encoded || !signature || !safeEqual(sign(encoded, secret), signature)) return null;
        const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { user: SessionUser; expiresAt: number };
        if (!parsed.expiresAt || parsed.expiresAt < Date.now()) return null;
        return parsed.user;
    } catch { return null; }
}

export async function setSessionUser(user: SessionUser) {
    if ((isSupabaseConfigured() && !shouldUseLocalStore()) || process.env.NODE_ENV === 'production') return;
    const secret = getDevSecret();
    if (!secret) throw new Error('Set SESSION_SECRET to enable local development sessions.');
    const encoded = Buffer.from(JSON.stringify({ user, expiresAt: Date.now() + DEV_SESSION_TTL * 1000 })).toString('base64url');
    (await cookies()).set(DEV_COOKIE, encoded + '.' + sign(encoded, secret), {
        httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: DEV_SESSION_TTL
    });
}

export async function clearSessionUser() {
    try { (await cookies()).delete(DEV_COOKIE); } catch { /* no request cookie context */ }
}
