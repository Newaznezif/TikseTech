"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Globe2, Menu, X } from "lucide-react";
import { AccountMenu } from "@/components/account-menu";
import { buttonVariants } from "@/components/ui/button";

type NavItem = { href: string; label: string };
type Session = { name: string; email: string; role: string } | null;

export function SiteHeaderClient({
    navItems,
    session,
    dashboardHref
}: {
    navItems: NavItem[];
    session: Session;
    dashboardHref: string;
}) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
            <div className="container-shell flex min-h-[76px] items-center justify-between gap-4">
                <Link href="/" className="flex shrink-0 items-center gap-3" onClick={() => setMenuOpen(false)}>
                    <Image src="/logo.png" alt="TIKSE TECH logo" width={44} height={44} priority className="h-11 w-11 rounded-xl object-contain" />
                    <span className="min-w-0">
                        <span className="block text-lg font-black tracking-tight text-slate-950">TIKSE TECH</span>
                        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Without borders</span>
                    </span>
                </Link>

                <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href} className="link-underline text-sm font-semibold">
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 xl:flex">
                        <Globe2 className="h-4 w-4 text-blue-600" aria-hidden="true" />
                        Remote · Worldwide
                    </div>
                    {session ? (
                        <AccountMenu name={session.name} email={session.email} role={session.role} dashboardHref={dashboardHref} />
                    ) : (
                        <>
                            <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>Sign in</Link>
                            <Link href="/register" className={buttonVariants({ variant: "primary", size: "sm" })}>
                                Join now <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                            </Link>
                        </>
                    )}
                    <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 transition hover:bg-slate-50 focus-visible:outline-offset-2 lg:hidden"
                        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={menuOpen}
                        aria-controls="mobile-site-navigation"
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {menuOpen ? (
                <nav id="mobile-site-navigation" aria-label="Mobile navigation" className="border-t border-slate-200 bg-white px-4 py-3 shadow-lg lg:hidden">
                    <div className="mx-auto grid max-w-7xl gap-1 sm:grid-cols-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-offset-[-2px]"
                            >
                                {item.label}
                            </Link>
                        ))}
                        {!session ? (
                            <Link href="/register" onClick={() => setMenuOpen(false)} className="mt-1 rounded-xl bg-blue-700 px-4 py-3 text-center text-sm font-bold text-white sm:col-span-2">
                                Create your account
                            </Link>
                        ) : null}
                    </div>
                </nav>
            ) : null}
        </header>
    );
}
