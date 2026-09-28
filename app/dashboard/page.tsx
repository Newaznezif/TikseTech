import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSessionUser } from '@/lib/session';

export default async function DashboardPage() {
    const session = await getSessionUser();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="container-shell py-20">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Dashboard</p>
                    <h1 className="mt-3 text-4xl font-black text-slate-900">Welcome{session ? `, ${session.name}` : ''}</h1>
                </div>
                <Link href="/programs" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Browse programs</Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {[
                    ['Applications', '2'],
                    ['Accepted programs', '1'],
                    ['Active programs', '1'],
                    ['Certificates', '1']
                ].map(([label, value]) => (
                    <div key={label} className="card-surface p-6">
                        <p className="text-sm text-slate-500">{label}</p>
                        <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
                <div className="card-surface p-6">
                    <h2 className="text-xl font-bold text-slate-900">My Programs</h2>
                    <ul className="mt-5 space-y-4 text-sm text-slate-700">
                        <li className="rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between"><strong>Cybersecurity Internship</strong><span className="text-blue-700">In Progress</span></div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-[65%] rounded-full bg-blue-600" /></div>
                        </li>
                        <li className="rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between"><strong>Software Development Program</strong><span className="text-green-700">Completed</span></div>
                            <p className="mt-2">Certificate: Available</p>
                        </li>
                    </ul>
                </div>

                <div className="card-surface p-6">
                    <h2 className="text-xl font-bold text-slate-900">My Certificates</h2>
                    <div className="mt-5 space-y-4 text-sm text-slate-700">
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="font-semibold">Cybersecurity Internship</p>
                            <p className="mt-2">Completed: October 2026</p>
                            <div className="mt-3 flex gap-2">
                                <button className="rounded-lg bg-slate-900 px-3 py-2 text-white">View</button>
                                <button className="rounded-lg border border-slate-300 px-3 py-2">Download PDF</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
