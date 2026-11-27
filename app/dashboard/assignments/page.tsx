import { redirect } from 'next/navigation';
import { submitAssignment } from '@/actions/assignments';
import { getSessionUser } from '@/lib/session';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const metadata = { title: 'My assignments | TIKSE TECH' };

export default async function MyAssignmentsPage() {
    const session = await getSessionUser();
    if (!session) redirect('/login');
    const supabase = await createSupabaseServerClient();
    const [challengeResult, submissionResult] = await Promise.all([
        supabase.from('challenge_documents').select('*').eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('assignment_submissions').select('*').eq('applicant_id', session.profileId).order('submitted_at', { ascending: false })
    ]);
    if (challengeResult.error) throw new Error(challengeResult.error.message);
    if (submissionResult.error) throw new Error(submissionResult.error.message);
    const challenges = await Promise.all((challengeResult.data || []).map(async c=>{
        const signed = await supabase.storage.from('challenge-pdfs').createSignedUrl(c.file_path, 300);
        return {...c, downloadUrl:signed.data?.signedUrl || ''};
    }));
    const submissions = await Promise.all((submissionResult.data || []).map(async s=>{
        const signed = await supabase.storage.from('assignment-submissions').createSignedUrl(s.file_path, 300);
        return {...s, downloadUrl:signed.data?.signedUrl || ''};
    }));
    return <main className="container-shell py-12">
        <div className="mb-9"><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Participant workspace</p><h1 className="mt-2 text-4xl font-black text-slate-950">Challenges & submissions</h1><p className="mt-2 max-w-2xl text-slate-600">Download your assigned challenge, submit your work, and follow the review status and feedback.</p></div>
        <section><h2 className="mb-4 text-xl font-bold text-slate-950">Available challenges</h2><div className="grid gap-5 lg:grid-cols-2">{challenges.length?challenges.map(c=><article key={c.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{c.field}</p><h3 className="mt-2 text-xl font-bold text-slate-950">{c.title}</h3><p className="mt-2 text-sm text-slate-600">{c.description || 'Complete the attached challenge and submit your work for review.'}</p>
            {c.downloadUrl?<a href={c.downloadUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">Download challenge PDF</a>:<p className="mt-3 text-sm text-rose-600">Challenge file is unavailable.</p>}
            <form action={submitAssignment} className="mt-5 space-y-3 border-t border-slate-100 pt-5"><input type="hidden" name="challengeId" value={c.id}/><div><label className="mb-1 block text-sm font-semibold">Your completed assignment</label><input name="file" type="file" required accept=".pdf,.docx,.zip,.txt,application/pdf,application/zip,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm"/><p className="mt-1 text-xs text-slate-500">PDF, DOCX, ZIP or TXT · 10 MB maximum</p></div><textarea name="submissionNote" rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" placeholder="Optional note for the reviewer"/><button className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Submit assignment</button></form>
        </article>):<p className="rounded-2xl border border-dashed border-slate-300 p-8 text-slate-500">No challenge is currently assigned to your account. Challenges appear here after an administrator accepts your application or enrolls you.</p>}</div></section>
        <section className="mt-12"><h2 className="mb-4 text-xl font-bold text-slate-950">My submission history</h2><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{submissions.length?submissions.map(s=><div key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-0"><div><p className="font-semibold text-slate-900">{s.original_file_name}</p><p className="mt-1 text-xs text-slate-500">Submitted {new Date(s.submitted_at).toLocaleString()}</p>{s.feedback?<p className="mt-2 max-w-2xl text-sm text-slate-600">Feedback: {s.feedback}</p>:null}</div><div className="text-right"><p className="text-sm font-bold text-slate-900">{s.score===null?'Not scored':String(s.score)+' / '+String(s.max_score)}</p><span className="text-xs font-semibold text-blue-700">{s.status.replaceAll('_',' ')}</span>{s.downloadUrl?<div><a className="text-xs text-slate-500 underline" href={s.downloadUrl} target="_blank" rel="noreferrer">View my file</a></div>:null}</div></div>):<p className="p-6 text-sm text-slate-500">You have not submitted an assignment yet.</p>}</div></section>
    </main>;
}
