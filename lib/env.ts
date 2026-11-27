export function getRequiredEnv(name: string) {
    const value = process.env[name];
    if (!value) {
        return undefined;
    }
    return value;
}

// The production origin is fixed to the active AletCloud deployment.
// A stale Vercel environment variable can never override participant links.
const productionAppUrl = 'https://tikse-tech.app.aletcloud.com';

export const appUrl = process.env.NODE_ENV === 'production'
    ? productionAppUrl
    : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || 'http://localhost:3000');
