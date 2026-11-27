'use client';

import Link from 'next/link';

export default function Error({ reset }: { reset: () => void }) {
    return (
        <main className="min-h-[65vh] bg-slate-50 px-6 py-20 text-slate-900">
            <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-black text-blue-700" aria-hidden="true">
                    T
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">TIKSE TECH</p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">This section is temporarily unavailable</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                    The page did not finish loading. Your account and saved information have not been changed by this display issue.
                    Please try loading this section again.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => reset()}
                        className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Reload this section
                    </button>
                    <Link
                        href="/"
                        className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Go to homepage
                    </Link>
                </div>
            </section>
        </main>
    );
}
