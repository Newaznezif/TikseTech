import './globals.css';
import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
    title: 'TIKSE TECH | Global Remote Technology Programs',
    description: 'TIKSE TECH connects young tech talent with remote programs, practical projects, mentorship, and global opportunities.',
    icons: { icon: '/logo.png', apple: '/logo.png' },
    openGraph: {
        title: 'TIKSE TECH',
        description: 'Build Skills. Gain Experience. Connect Globally.',
        type: 'website',
        images: ['/logo.png']
    }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const pathname = (await headers()).get('x-pathname') || '';
    const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
    const isAdminLogin = pathname === '/admin/login';

    return (
        <html lang="en">
            <body className={isAdminLogin ? 'bg-[#07111f] text-white antialiased' : 'bg-slate-50 text-slate-900 antialiased'}>
                <div className="min-h-screen">
                    {/* Admin pages use their own manager-workspace navigation. */}
                    {!isAdminRoute ? <SiteHeader /> : null}
                    <div>{children}</div>
                    {!isAdminRoute ? <SiteFooter /> : null}
                </div>
            </body>
        </html>
    );
}
