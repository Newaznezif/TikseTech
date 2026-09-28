import Link from 'next/link';
import { ArrowRight, Globe2, Menu } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';

export function SiteHeader() {
    const navItems = [
        { href: '/about', label: 'About' },
        { href: '/programs', label: 'Programs' },
        { href: '/opportunities', label: 'Opportunities' },
        { href: '/community', label: 'Community' },
        { href: '/certificates/verify', label: 'Verify Certificate' }
    ];

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="container-shell flex items-center justify-between py-4">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">T</div>
                    <div>
                        <p className="text-lg font-black tracking-tight text-slate-900">TIKSE TECH</p>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Without borders</p>
                    </div>
                </Link>

                <nav className="hidden items-center gap-6 lg:flex">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href} className="link-underline text-sm font-medium">
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 sm:flex">
                        <Globe2 className="h-4 w-4 text-blue-600" />
                        Remote — Worldwide
                    </div>
                    <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                        Login
                    </Link>
                    <Link href="/register" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                        Join now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <button className="rounded-lg border border-slate-200 p-2 lg:hidden" aria-label="Toggle menu">
                        <Menu className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
