import { redirect } from 'next/navigation';
import { createChallengeDocument } from '@/actions/assignments';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const metadata = { title: 'Challenge library | TIKSE TECH' };

export default async function AdminChallengesPage() {
    const session = await getSessionUser();
    if (!session) redirect('/login');
    if (!hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) redirect('/dashboard');
    const admin = await createSupabaseServerClient();
    const [programsResult, result] = await Promise.all([
        admin.from('programs').select('id, title').order('created_at', { ascending: false }),
        admin.from('challenge_documents').select('*').order('created_at', { ascending: false })
    ]);
    if (programsResult.error) throw new Error('Programs could not be loaded: ' + programsResult.error.message);
    if (result.error) throw new Error(result.error.message);
    const programs = programsResult.data || [];
    const challenges = await Promise.all((result.data || []).map(async (item) => {
        const signed = await admin.storage.from('challenge-pdfs').createSignedUrl(item.file_path, 300);
        return { ...item, downloadUrl: signed.data?.signedUrl || '' };
    }));

    return <main className="container-shell py-12">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Learning operations</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Challenge library</h1>
                <p className="mt-2 max-w-2xl text-slate-600">Publish field-specific challenge briefs for accepted applicants and enrolled participants.</p></div>
            <a href="/admin/reviews" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">Open review queue →</a>
        </div>
        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">Upload a challenge PDF</h2>
                <p className="mt-1 text-sm text-slate-500">PDF only · 10 MB maximum · files remain private</p>
                <form action={createChallengeDocument} className="mt-6 space-y-4">
                    <div><label className="mb-1.5 block text-sm font-semibold">Program</label><select name="programId" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3"><option value="">Choose a program</option>{programs.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
                    <div><label className="mb-1.5 block text-sm font-semibold">Challenge title</label><input name="title" required minLength={3} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3" placeholder="SOC Analyst Practical Challenge" /></div>
                    <div><label className="mb-1.5 block text-sm font-semibold">Technical field</label><input name="field" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3" placeholder="Cybersecurity / SOC Analysis" /></div>
                    <div><label className="mb-1.5 block text-sm font-semibold">Instructions</label><textarea name="description" rows={3} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3" placeholder="Briefly describe the task and submission expectations." /></div>
                    <div><label className="mb-1.5 block text-sm font-semibold">Challenge PDF</label><input name="file" type="file" accept="application/pdf,.pdf" required className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm" /></div>
                    <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="isPublished" defaultChecked /> Publish immediately to eligible participants</label>
                    <button className="w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-blue-700">Save challenge</button>
                </form>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-950">Published and draft challenges</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{challenges.length} total</span></div>
                <div className="mt-5 space-y-3">{challenges.length ? challenges.map(c=><article key={c.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-900">{c.title}</h3><span className={'rounded-full px-2.5 py-1 text-xs font-semibold '+(c.is_published?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700')}>{c.is_published?'Published':'Draft'}</span></div>
                    <p className="mt-1 text-sm text-slate-500">{c.field} · {c.original_file_name}</p>
                    {c.downloadUrl ? <a className="mt-3 inline-flex text-sm font-semibold text-blue-700 underline" href={c.downloadUrl} target="_blank" rel="noreferrer">Preview PDF</a> : null}
                </article>):<p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No challenge PDFs have been uploaded yet.</p>}</div>
            </div>
        </section>
    </main>;
}
