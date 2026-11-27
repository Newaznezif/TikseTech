import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createProgram } from '@/actions/programs';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function AdminDashboardPage() {
    const session = await getSessionUser();
    if (!session) redirect('/admin/login');
    if (!hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) redirect('/dashboard');

    // Use the signed-in administrator's Supabase session and RLS policies.
    // This avoids making the admin dashboard depend on a separately configured
    // service-role key in the hosting environment.
    const supabase = await createSupabaseServerClient();
    const [profiles, applications, programsCount, openApplications, accepted, enrollments, certificates, programs] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('applications').select('id', { count: 'exact', head: true }),
        supabase.from('programs').select('id', { count: 'exact', head: true }).in('status', ['OPEN', 'IN_PROGRESS']),
        supabase.from('applications').select('id', { count: 'exact', head: true }).in('status', ['SUBMITTED', 'UNDER_REVIEW']),
        supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'ACCEPTED'),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }).in('status', ['ENROLLED', 'ACTIVE']),
        supabase.from('certificates').select('id', { count: 'exact', head: true }).in('status', ['ACTIVE', 'REVOKED']),
        supabase.from('programs').select('id,title,status').order('created_at', { ascending: false })
    ]);

    const queryError = [profiles, applications, programsCount, openApplications, accepted, enrollments, certificates, programs].find((result) => result.error)?.error;
    const stats = {
        totalUsers: profiles.count ?? 0,
        totalApplicants: applications.count ?? 0,
        activePrograms: programsCount.count ?? 0,
        openApplications: openApplications.count ?? 0,
        acceptedParticipants: accepted.count ?? 0,
        activeParticipants: enrollments.count ?? 0,
        certificatesIssued: certificates.count ?? 0
    };

    return (
        <div className="container-shell py-12">
            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Admin dashboard</p>
                <h1 className="mt-3 text-4xl font-black text-slate-900">Overview</h1>
                <p className="mt-2 text-slate-600">Signed in as {session.name || 'Administrator'} · {session.role}</p>
            </div>

            <div className="mb-8 flex flex-wrap gap-3">
                <Link href="/admin/participants" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Participant monitoring</Link>
                <Link href="/admin/applications" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Review applications</Link>
                <Link href="/admin/challenges" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800">Manage challenge PDFs</Link>
                <Link href="/admin/reviews" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800">Review assignments</Link>
                <Link href="/admin/certificates" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800">Issue certificates</Link>
            </div>

            {queryError ? <div role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Some dashboard data could not be loaded: {queryError.message}. Check the administrator database permissions.</div> : null}

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

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
                <div className="card-surface p-6">
                    <h2 className="text-xl font-bold text-slate-900">Programs</h2>
                    <ul className="mt-5 space-y-3 text-slate-700">
                        {(programs.data || []).map((program) => <li key={program.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"><span>{program.title}</span><span className="text-xs font-semibold text-slate-500">{program.status}</span></li>)}
                        {!programs.data?.length ? <li className="text-sm text-slate-500">No programs created yet.</li> : null}
                    </ul>
                </div>
                <div className="card-surface p-6">
                    <h2 className="text-xl font-bold text-slate-900">Platform activity</h2>
                    <ul className="mt-5 space-y-3 text-slate-700">
                        <li>Applications awaiting review: {stats.openApplications}</li>
                        <li>Accepted applicants: {stats.acceptedParticipants}</li>
                        <li>Active enrollments: {stats.activeParticipants}</li>
                        <li>Certificates issued: {stats.certificatesIssued}</li>
                    </ul>
                    <Link href="/admin/applications" className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Open applicant review</Link>
                </div>
            </div>

            <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                <h2 className="text-2xl font-black text-slate-900">Create a program</h2>
                <form action={createProgram} className="mt-6 grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Title</label><input name="title" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="AI Fundamentals Program" /></div>
                    <div><label className="mb-2 block text-sm font-medium text-slate-700">Category</label><input name="category" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="Artificial Intelligence" /></div>
                    <div><label className="mb-2 block text-sm font-medium text-slate-700">Duration</label><input name="duration" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="8 Weeks" /></div>
                    <div><label className="mb-2 block text-sm font-medium text-slate-700">Start date</label><input name="startDate" type="date" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" /></div>
                    <div><label className="mb-2 block text-sm font-medium text-slate-700">End date</label><input name="endDate" type="date" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" /></div>
                    <div><label className="mb-2 block text-sm font-medium text-slate-700">Application deadline</label><input name="applicationDeadline" type="date" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" /></div>
                    <div><label className="mb-2 block text-sm font-medium text-slate-700">Available seats</label><input name="availableSeats" type="number" min="1" defaultValue={20} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" /></div>
                    <div><label className="mb-2 block text-sm font-medium text-slate-700">Status</label><select name="status" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"><option value="DRAFT">DRAFT</option><option value="OPEN">OPEN</option><option value="CLOSED">CLOSED</option></select></div>
                    <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Community URL</label><input name="communityUrl" type="url" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="https://community.example.com/program" /><p className="mt-2 text-xs text-slate-500">Optional. Only visible to accepted, enrolled, or active participants.</p></div>
                    <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Short description</label><textarea name="shortDescription" required className="min-h-20 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="Short overview" /></div>
                    <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Description</label><textarea name="description" required className="min-h-32 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="Full program description" /></div>
                    <div className="md:col-span-2"><button type="submit" className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700">Create program</button></div>
                </form>
            </div>
        </div>
    );
}
