export function getRequiredEnv(name: string) {
    const value = process.env[name];
    if (!value) {
        return undefined;
    }
    return value;
}

export const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
