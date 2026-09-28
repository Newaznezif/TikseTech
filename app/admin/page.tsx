import { redirect } from 'next/navigation';

import { createProgram } from '@/actions/programs';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { getAdminStats } from '@/lib/store';

export default async function AdminDashboardPage() {
    const session = await getSessionUser();

    if (!session) {
        redirect('/login');
    }

    if (!hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) {
        redirect('/dashboard');
    }

    const stats = await getAdminStats();

    return (
        <div className="container-shell py-20">
            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Admin dashboard</p>
                <h1 className="mt-3 text-4xl font-black text-slate-900">Overview</h1>
                <p className="mt-2 text-slate-600">Signed in as {session?.name || 'Administrator'} · {session?.role || 'ADMIN'}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {[
                    ['Total users', stats.totalUsers],
                    ['Total applicants', stats.totalApplicants],
                    ['Active programs', stats.activePrograms],
                    ['Open applications', stats.openApplications]
                ].map(([label, value]) => (
                    <div key={label} className="card-surface p-6">
                        <p className="text-sm text-slate-500">{label}</p>
                        <p className="mt-3 text-3xl font-black text-slate-900">{String(value)}</p>
                    </div>
                ))}
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
                <div className="card-surface p-6">
                    <h2 className="text-xl font-bold text-slate-900">Programs</h2>
                    <ul className="mt-5 space-y-3 text-slate-700">
                        <li>Cybersecurity Internship Program</li>
                        <li>Software Development Internship</li>
                        <li>Computer Networking Program</li>
                    </ul>
                </div>
                <div className="card-surface p-6">
                    <h2 className="text-xl font-bold text-slate-900">Applications</h2>
                    <ul className="mt-5 space-y-3 text-slate-700">
                        <li>Submitted: {stats.openApplications}</li>
                        <li>Accepted: {stats.acceptedParticipants}</li>
                        <li>Certificates: {stats.certificatesIssued}</li>
                    </ul>
                </div>
            </div>

            <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                <h2 className="text-2xl font-black text-slate-900">Create a program</h2>
                <form action={createProgram} className="mt-6 grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                        <input name="title" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="AI Fundamentals Program" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                        <input name="category" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="Artificial Intelligence" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Duration</label>
                        <input name="duration" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="8 Weeks" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Start date</label>
                        <input name="startDate" type="date" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">End date</label>
                        <input name="endDate" type="date" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Application deadline</label>
                        <input name="applicationDeadline" type="date" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Available seats</label>
                        <input name="availableSeats" type="number" defaultValue={20} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                        <select name="status" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5">
                            <option value="DRAFT">DRAFT</option>
                            <option value="OPEN">OPEN</option>
                            <option value="CLOSED">CLOSED</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Community URL</label>
                        <input name="communityUrl" type="url" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="https://community.tiksetech.com/cybersecurity" />
                        <p className="mt-2 text-xs text-slate-500">Optional. Only visible to accepted, enrolled, or active participants.</p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Short description</label>
                        <textarea name="shortDescription" className="min-h-20 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="Short overview" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                        <textarea name="description" className="min-h-32 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="Full program description" />
                    </div>
                    <div className="md:col-span-2">
                        <button type="submit" className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700">Create program</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
