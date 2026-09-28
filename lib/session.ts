import { cookies } from 'next/headers';

export type SessionUser = {
    email: string;
    role: string;
    profileId: string;
    name: string;
};

export function hasRequiredRole(session: SessionUser | null, requiredRoles: string[]) {
    if (!session) {
        return false;
    }

    const allowedRoles = requiredRoles.map((role) => role.toUpperCase());
    const sessionRole = String(session.role || '').toUpperCase();
    return allowedRoles.includes(sessionRole);
}

export async function getSessionUser() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('tikse_session')?.value;
        if (!session) return null;

        try {
            return JSON.parse(session) as SessionUser;
        } catch {
            return null;
        }
    } catch {
        return null;
    }
}

export async function setSessionUser(user: SessionUser) {
    try {
        const cookieStore = await cookies();
        cookieStore.set('tikse_session', JSON.stringify(user), {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7
        });
    } catch {
        // Ignore cookie writes outside a request context (e.g. tests).
    }
}

export async function clearSessionUser() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('tikse_session');
    } catch {
        // Ignore cookie writes outside a request context (e.g. tests).
    }
}
