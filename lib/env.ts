export function getRequiredEnv(name: string) {
    const value = process.env[name];
    if (!value) {
        return undefined;
    }
    return value;
}

// Production redirects must use the explicitly configured deployment domain.
// Do not infer a hostname from Vercel or another hosting provider.
export const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ||
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
