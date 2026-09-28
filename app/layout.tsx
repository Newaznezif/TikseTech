import './globals.css';
import type { Metadata } from 'next';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
    title: 'TIKSE TECH | Global Remote Technology Programs',
    description: 'TIKSE TECH connects young tech talent with remote programs, practical projects, mentorship, and global opportunities.',
    openGraph: {
        title: 'TIKSE TECH',
        description: 'Build Skills. Gain Experience. Connect Globally.',
        type: 'website'
    }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="bg-slate-50 text-slate-900 antialiased">
                <div className="min-h-screen">
                    <SiteHeader />
                    <main>{children}</main>
                    <SiteFooter />
                </div>
            </body>
        </html>
    );
}
