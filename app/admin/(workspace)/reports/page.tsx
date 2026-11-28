import { redirect } from 'next/navigation';
import { Download, FileBarChart2 } from 'lucide-react';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { getAdminReportMetrics } from '@/lib/admin-reports';

export const metadata = { title: 'Reports & analytics | TIKSE TECH' };

const sections = ['Participants', 'Programs', 'Applications', 'Enrollments', 'Assignments', 'Certificates'];

export default async function AdminReportsPage() {
    const session = await getSessionUser();
    if (!session) redirect('/admin/login');
    if (!hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) redirect('/dashboard');

    let metrics: Awaited<ReturnType<typeof getAdminReportMetrics>> = [];
    let errorMessage = '';
    try {
        metrics = await getAdminReportMetrics();
    } catch (error) {
        errorMessage = error instanceof Error ? error.message : 'Report data could not be loaded.';
    }

    return (
        <main className="container-shell py-10 sm:py-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Platform intelligence</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Reports & analytics</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Operational reporting generated from current Supabase records. No sample or estimated figures are included.</p>
                </div>
                <a href="/admin/reports/export" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
                    <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
                </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                <FileBarChart2 className="h-4 w-4 text-blue-700" aria-hidden="true" />
                <span>Live database snapshot</span>
                <span className="text-slate-300">·</span>
                <span>Generated {new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}</span>
            </div>

            {errorMessage ? (
                <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
                    <h2 className="font-bold">Reports are temporarily unavailable</h2>
                    <p className="mt-1">{errorMessage}</p>
                </div>
            ) : (
                <div className="mt-7 grid gap-5 xl:grid-cols-2">
                    {sections.map((section) => {
                        const rows = metrics.filter((metric) => metric.section === section);
                        return (
                            <section key={section} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="text-base font-black text-slate-950">{section}</h2>
                                </div>
                                <dl className="divide-y divide-slate-100">
                                    {rows.map((metric) => (
                                        <div key={metric.label} className="flex items-center justify-between gap-4 px-5 py-4">
                                            <dt className="text-sm text-slate-600">{metric.label}</dt>
                                            <dd className="text-xl font-black tabular-nums text-slate-950">{metric.value.toLocaleString('en')}</dd>
                                        </div>
                                    ))}
                                </dl>
                                {!rows.length ? <p className="px-5 py-4 text-sm text-slate-500">No metrics available.</p> : null}
                            </section>
                        );
                    })}
                </div>
            )}

            <p className="mt-6 text-xs leading-5 text-slate-500">Counts reflect records visible to the authenticated administrator through the existing row-level security policies. This report excludes personally identifiable participant details.</p>
        </main>
    );
}
