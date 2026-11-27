import { redirect } from 'next/navigation';
import { reviewApplication } from '@/actions/application-review';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const metadata = { title: 'Application review | TIKSE TECH' };

export default async function AdminApplicationsPage() {
    const session = await getSessionUser();
    if (!session) redirect('/admin/login');
    if (!hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) redirect('/dashboard');

    // Read with the authenticated admin session so database RLS enforces
    // the ADMIN/SUPER_ADMIN role without requiring a service-role secret.
    const supabase = await createSupabaseServerClient();
    const { data: applications, error } = await supabase.from('applications').select('*').order('submitted_at', { ascending: false });
    if (error) {
        return <main className="container-shell py-12"><div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900"><h1 className="text-2xl font-bold">Applications could not be loaded</h1><p className="mt-2 text-sm">{error.message}</p><p className="mt-2 text-sm">Confirm that this signed-in account has the ADMIN role and that the applications admin-read policy is enabled.</p></div></main>;
    }

    const programIds = [...new Set((applications || []).map((application) => application.program_id))];
    const { data: programs, error: programsError } = programIds.length
        ? await supabase.from('programs').select('id,title,category').in('id', programIds)
        : { data: [], error: null };
    const programMap = new Map((programs || []).map((program) => [program.id, program]));

    return <main className="container-shell py-12">
        <div className="mb-9"><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Admissions</p><h1 className="mt-2 text-4xl font-black text-slate-950">Applicant review</h1><p className="mt-2 text-slate-600">Review candidate details, make an admission decision, and provide feedback.</p></div>
        {programsError ? <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Program details could not be loaded: {programsError.message}</p> : null}
        <div className="space-y-5">{applications?.length ? applications.map((application) => {
            const program = programMap.get(application.program_id);
            return <article key={application.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{program?.category || 'Program'}</p><h2 className="mt-1 text-xl font-bold text-slate-950">{application.full_name}</h2><p className="mt-1 text-sm text-slate-500">{application.email} · {application.country} · {program?.title || 'Unknown program'}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{String(application.status).replaceAll('_', ' ')}</span></div>
                <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2"><p><strong>Education:</strong> {application.education}</p><p><strong>Experience:</strong> {application.experience}</p><p><strong>Skills:</strong> {Array.isArray(application.skills) ? application.skills.join(', ') : String(application.skills || '')}</p><p><strong>Availability:</strong> {application.availability || 'Self-paced'}</p></div>
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700"><strong>Motivation</strong><p className="mt-1 whitespace-pre-wrap">{application.motivation}</p></div>
                <form action={reviewApplication} className="mt-5 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-[210px_1fr_auto] md:items-end"><input type="hidden" name="applicationId" value={application.id}/><div><label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Decision</label><select name="status" defaultValue={application.status} className="w-full rounded-xl border border-slate-300 px-3 py-2.5"><option value="UNDER_REVIEW">Under review</option><option value="SHORTLISTED">Shortlisted</option><option value="ACCEPTED">Accept and enroll</option><option value="WAITLISTED">Waitlisted</option><option value="REJECTED">Rejected</option></select></div><div><label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Applicant feedback</label><textarea name="feedback" rows={2} defaultValue={application.admin_feedback || ''} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Share the decision and next steps."/></div><button className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Save decision</button></form>
            </article>;
        }) : <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No applications have been submitted yet.</p>}</div>
    </main>;
}
