import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { isSupabaseConfigured, shouldUseLocalStore } from '@/lib/supabase';

export const metadata = { title: 'Participant dashboard | TIKSE TECH' };

export default async function DashboardPage() {
    const session = await getSessionUser();
    if (!session) redirect('/login');

    let applications: any[] = [];
    let enrollments: any[] = [];
    let certificates: any[] = [];
    let submissions: any[] = [];
    if (isSupabaseConfigured() && !shouldUseLocalStore()) {
        const supabase = await createSupabaseServerClient();
        const [a, e, c, s] = await Promise.all([
            supabase.from('applications').select('id,status,submitted_at,programs(title,slug)').eq('applicant_id', session.profileId).order('submitted_at', {ascending:false}),
            supabase.from('enrollments').select('id,status,joined_at,programs(title,slug)').eq('participant_id', session.profileId),
            supabase.from('certificates').select('id,certificate_title,verification_code,issued_at,status').eq('participant_id', session.profileId).eq('status','ACTIVE'),
            supabase.from('assignment_submissions').select('id,status,score,max_score,submitted_at').eq('applicant_id', session.profileId).order('submitted_at',{ascending:false})
        ]);
        if (a.error || e.error || c.error || s.error) throw new Error('Your dashboard data could not be loaded. Please refresh or contact support.');
        applications = a.data || []; enrollments = e.data || []; certificates = c.data || []; submissions = s.data || [];
    }

    const stats = [
        ['Applications', applications.length], ['Accepted programs', applications.filter(a=>a.status==='ACCEPTED').length],
        ['Active enrollments', enrollments.filter(e=>['ENROLLED','ACTIVE'].includes(e.status)).length], ['Certificates', certificates.length]
    ];
    return <main className="container-shell py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Participant workspace</p><h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Welcome, {session.name}</h1><p className="mt-2 text-slate-600">Your applications, assignments, progress and credentials in one place.</p></div><div className="flex flex-wrap gap-2"><Link href="/programs" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800">Browse programs</Link><Link href="/dashboard/assignments" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">My assignments</Link></div></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label,value])=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p></div>)}</div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2"><section className="rounded-3xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-950">My applications</h2><Link href="/programs" className="text-sm font-semibold text-blue-700">Explore programs</Link></div><div className="mt-4 space-y-3">{applications.length?applications.map(a=><div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"><div><p className="font-semibold text-slate-900">{a.programs?.title || 'Program application'}</p><p className="mt-1 text-xs text-slate-500">Submitted {new Date(a.submitted_at).toLocaleDateString()}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{a.status.replaceAll('_',' ')}</span></div>):<p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">You have not applied to a program yet.</p>}</div></section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-950">Assignment progress</h2><Link href="/dashboard/assignments" className="text-sm font-semibold text-blue-700">Open workspace</Link></div><div className="mt-4 space-y-3">{submissions.length?submissions.slice(0,4).map(s=><div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"><div><p className="font-semibold text-slate-900">Assignment submission</p><p className="mt-1 text-xs text-slate-500">{new Date(s.submitted_at).toLocaleDateString()}</p></div><div className="text-right"><p className="text-sm font-bold">{s.score===null?'Not scored':s.score+' / '+s.max_score}</p><span className="text-xs text-blue-700">{s.status.replaceAll('_',' ')}</span></div></div>):<p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No assignment submissions yet. Published challenges will appear in your assignment workspace.</p>}</div></section></div>
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold text-slate-950">My certificates</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{certificates.length?certificates.map(c=><div key={c.id} className="rounded-xl border border-slate-100 p-4"><p className="font-semibold">{c.certificate_title}</p><p className="mt-1 text-xs text-slate-500">Issued {new Date(c.issued_at).toLocaleDateString()}</p><Link href={'/certificates/verify/'+c.verification_code} className="mt-3 inline-flex text-sm font-semibold text-blue-700 underline">Verify certificate</Link></div>):<p className="text-sm text-slate-500">Certificates will appear here after you complete the required program work and an administrator issues them.</p>}</div></section>
    </main>;
}
