import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured() {
    return Boolean(supabaseUrl && supabaseAnonKey);
}

export function shouldUseLocalStore() {
    if (process.env.USE_LOCAL_STORE === 'true') {
        return true;
    }

    if (process.env.USE_LOCAL_STORE === 'false') {
        return false;
    }

    return process.env.NODE_ENV === 'test';
}

export const useLocalStore = shouldUseLocalStore();

export function getSupabaseClient() {
    if (!supabaseUrl || !supabaseAnonKey) {
        return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true
        }
    });
}

export function getSupabaseAdminClient() {
    if (!supabaseUrl || !serviceRoleKey) {
        return null;
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });
}

export const supabase = getSupabaseClient();
export const supabaseAdmin = getSupabaseAdminClient();
