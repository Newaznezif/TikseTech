import { redirect } from 'next/navigation';
import { reviewApplication } from '@/actions/application-review';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase';

export const metadata = { title: 'Application review | TIKSE TECH' };

export default async function AdminApplicationsPage() {
    const session = await getSessionUser();
    if (!session) redirect('/login');
    if (!hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) redirect('/dashboard');
    const admin = getSupabaseAdminClient();
    if (!admin) throw new Error('Supabase server credentials are not configured.');
    const { data: applications, error } = await admin.from('applications').select('*').order('submitted_at', { ascending: false });
    if (error) throw new Error(error.message);
    const programIds = [...new Set((applications || []).map(a=>a.program_id))];
    const { data: programs } = programIds.length ? await admin.from('programs').select('id,title,category').in('id', programIds) : {data:[]};
    const programMap = new Map((programs || []).map(p=>[p.id,p]));
    return <main className="container-shell py-12">
        <div className="mb-9"><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Admissions</p><h1 className="mt-2 text-4xl font-black text-slate-950">Applicant review</h1><p className="mt-2 text-slate-600">Review candidate details, make an admission decision, and provide feedback.</p></div>
        <div className="space-y-5">{applications?.length?applications.map(a=>{const program=programMap.get(a.program_id);return <article key={a.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{program?.category || 'Program'}</p><h2 className="mt-1 text-xl font-bold text-slate-950">{a.full_name}</h2><p className="mt-1 text-sm text-slate-500">{a.email} · {a.country} · {program?.title || 'Unknown program'}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{a.status.replaceAll('_',' ')}</span></div>
            <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2"><p><strong>Education:</strong> {a.education}</p><p><strong>Experience:</strong> {a.experience}</p><p><strong>Skills:</strong> {Array.isArray(a.skills)?a.skills.join(', '):String(a.skills || '')}</p><p><strong>Availability:</strong> {a.availability}</p></div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700"><strong>Motivation</strong><p className="mt-1 whitespace-pre-wrap">{a.motivation}</p></div>
            <form action={reviewApplication} className="mt-5 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-[210px_1fr_auto] md:items-end"><input type="hidden" name="applicationId" value={a.id}/><div><label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Decision</label><select name="status" defaultValue={a.status} className="w-full rounded-xl border border-slate-300 px-3 py-2.5"><option value="UNDER_REVIEW">Under review</option><option value="SHORTLISTED">Shortlisted</option><option value="ACCEPTED">Accept and enroll</option><option value="WAITLISTED">Waitlisted</option><option value="REJECTED">Rejected</option></select></div><div><label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Applicant feedback</label><textarea name="feedback" rows={2} defaultValue={a.admin_feedback || ''} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Share the decision and next steps."/></div><button className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Save decision</button></form>
        </article>}):<p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No applications have been submitted.</p>}</div>
    </main>;
}
