import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/** Completes Supabase email confirmation on the configured TIKSE TECH domain. */
export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=verification-failed', requestUrl.origin));
    }

    try {
        const supabase = await createSupabaseServerClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
            return NextResponse.redirect(new URL('/login?error=verification-failed', requestUrl.origin));
        }
        return NextResponse.redirect(new URL('/dashboard?verified=1', requestUrl.origin));
    } catch {
        return NextResponse.redirect(new URL('/login?error=verification-failed', requestUrl.origin));
    }
}
