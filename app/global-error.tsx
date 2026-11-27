'use client';

import Link from 'next/link';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
                <main className="flex min-h-screen items-center justify-center px-6 py-16">
                    <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-black text-blue-700" aria-hidden="true">
                            T
                        </div>
                        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">TIKSE TECH</p>
                        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">We’re restoring this page</h1>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            This page could not be displayed. Please reload it. If the issue continues, return to the homepage and try again later.
                        </p>
                        <div className="mt-7 flex flex-wrap justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => reset()}
                                className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Reload page
                            </button>
                            <Link
                                href="/"
                                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Homepage
                            </Link>
                        </div>
                    </section>
                </main>
            </body>
        </html>
    );
}
