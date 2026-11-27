import Link from 'next/link';
import { listPrograms } from '@/lib/store';

export const metadata = { title: 'Application received | TIKSE TECH' };

export default async function ApplicationSubmittedPage({ searchParams }: { searchParams: Promise<{ program?: string }> }) {
    const { program: slug } = await searchParams;
    const program = slug ? (await listPrograms()).find((item) => item.slug === slug) : null;

    return (
        <main className="container-shell py-20">
            <section className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-soft sm:p-12">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-700" aria-hidden="true">✓</div>
                <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Application received</p>
                <h1 className="mt-3 text-3xl font-black text-slate-950">Thank you for applying.</h1>
                <p className="mt-4 text-base leading-7 text-slate-600">
                    Your {program ? <strong>{program.title}</strong> : 'program'} application has been submitted successfully and is now available to the TIKSE TECH admissions team for review.
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">Please allow 1–2 days for the review. We will update you by email when a decision is made. You can also check your application status from your dashboard.</p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link href="/dashboard" className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800">View my dashboard</Link>
                    <Link href="/" className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">Return home</Link>
                </div>
            </section>
        </main>
    );
}
