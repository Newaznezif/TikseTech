'use client';

import Link from 'next/link';

export default function Error({ reset }: { reset: () => void }) {
    return (
        <div className="container-shell py-20">
            <div className="mx-auto max-w-lg rounded-3xl border border-red-200 bg-red-50 p-10 text-center shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">Something went wrong</p>
                <h2 className="mt-4 text-3xl font-black text-slate-900">We could not load this page.</h2>
                <div className="mt-6 flex justify-center gap-3">
                    <button onClick={() => reset()} className="rounded-xl bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700">Try again</button>
                    <Link href="/" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900 hover:bg-slate-50">Return home</Link>
                </div>
            </div>
        </div>
    );
}
