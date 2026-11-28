import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const tokenHash = requestUrl.searchParams.get('token_hash');
    const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
    const next = requestUrl.searchParams.get('next') === '/update-password' ? '/update-password' : '/dashboard';
    const origin = requestUrl.origin;

    if (requestUrl.searchParams.has('error') || requestUrl.searchParams.has('error_code')) {
        return NextResponse.redirect(new URL('/forgot-password?error=link-invalid', origin));
    }

    try {
        const supabase = await createSupabaseServerClient();
        let error = null;
        if (code) {
            const result = await supabase.auth.exchangeCodeForSession(code);
            error = result.error;
        } else if (tokenHash && type && ['recovery', 'email', 'signup', 'invite', 'magiclink', 'email_change'].includes(type)) {
            const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
            error = result.error;
        } else {
            return NextResponse.redirect(new URL('/forgot-password?error=link-invalid', origin));
        }

        if (error) {
            const target = next === '/update-password' ? '/forgot-password?error=link-invalid' : '/login?error=verification-failed';
            return NextResponse.redirect(new URL(target, origin));
        }
        return NextResponse.redirect(new URL(next, origin));
    } catch {
        return NextResponse.redirect(new URL('/forgot-password?error=link-invalid', origin));
    }
}
