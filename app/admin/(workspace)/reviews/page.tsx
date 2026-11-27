import { redirect } from 'next/navigation';
import { reviewAssignment } from '@/actions/assignments';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const metadata = { title: 'Assignment reviews | TIKSE TECH' };

export default async function AdminReviewsPage() {
    const session = await getSessionUser();
    if (!session) redirect('/login');
    if (!hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) redirect('/dashboard');
    const admin = await createSupabaseServerClient();
    const { data: submissions, error } = await admin.from('assignment_submissions').select('*').order('submitted_at', { ascending: true });
    if (error) throw new Error(error.message);
    const applicantIds = [...new Set((submissions || []).map(s=>s.applicant_id))];
    const challengeIds = [...new Set((submissions || []).map(s=>s.challenge_id))];
    const [profilesResult, challengesResult] = await Promise.all([
        applicantIds.length ? admin.from('profiles').select('id,full_name,email').in('id', applicantIds) : Promise.resolve({data:[],error:null}),
        challengeIds.length ? admin.from('challenge_documents').select('id,title,field').in('id', challengeIds) : Promise.resolve({data:[],error:null})
    ]);
    const profiles = new Map((profilesResult.data || []).map(p=>[p.id,p]));
    const challenges = new Map((challengesResult.data || []).map(c=>[c.id,c]));
    const cards = await Promise.all((submissions || []).map(async s=>{
        const signed = await admin.storage.from('assignment-submissions').createSignedUrl(s.file_path, 300);
        return {...s, applicant:profiles.get(s.applicant_id), challenge:challenges.get(s.challenge_id), fileUrl:signed.data?.signedUrl || ''};
    }));
    return <main className="container-shell py-12">
        <div className="mb-9"><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Administrator workspace</p><h1 className="mt-2 text-4xl font-black text-slate-950">Assignment review queue</h1><p className="mt-2 text-slate-600">Open each submission, score it out of 100, and provide actionable feedback.</p></div>
        <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total submissions</p><p className="mt-2 text-3xl font-black">{cards.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Awaiting review</p><p className="mt-2 text-3xl font-black">{cards.filter(c=>['SUBMITTED','UNDER_REVIEW'].includes(c.status)).length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Accepted</p><p className="mt-2 text-3xl font-black">{cards.filter(c=>c.status==='ACCEPTED').length}</p></div></div>
        <div className="space-y-5">{cards.length ? cards.map(s=><article key={s.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-950">{s.challenge?.title || 'Challenge submission'}</h2><p className="mt-1 text-sm text-slate-500">{s.applicant?.full_name || 'Participant'} · {s.applicant?.email || ''} · {s.challenge?.field || ''}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{s.status.replaceAll('_',' ')}</span></div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm"><span className="text-slate-500">{s.original_file_name}</span>{s.fileUrl?<a href={s.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline">Open submitted file</a>:<span className="text-rose-600">File unavailable</span>}</div>
            {s.submission_note?<p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{s.submission_note}</p>:null}
            <form action={reviewAssignment} className="mt-5 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-[150px_190px_1fr_auto] md:items-end">
                <input type="hidden" name="submissionId" value={s.id}/>
                <div><label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Score / 100</label><input name="score" type="number" min="0" max="100" step="0.5" defaultValue={s.score ?? ''} className="w-full rounded-xl border border-slate-300 px-3 py-2.5"/></div>
                <div><label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Decision</label><select name="status" defaultValue={s.status==='SUBMITTED'?'UNDER_REVIEW':s.status} className="w-full rounded-xl border border-slate-300 px-3 py-2.5"><option value="UNDER_REVIEW">Under review</option><option value="NEEDS_REVISION">Needs revision</option><option value="ACCEPTED">Accepted</option><option value="REJECTED">Rejected</option></select></div>
                <div><label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Feedback</label><textarea name="feedback" rows={2} defaultValue={s.feedback || ''} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="What was done well? What needs improvement?"/></div>
                <button className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Save review</button>
            </form>
        </article>):<div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">No assignments have been submitted yet.</div>}</div>
    </main>;
}
